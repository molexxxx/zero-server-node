/**
 * @module grpc/client
 * @description Zero-dependency gRPC client using Node.js `http2.connect()`.
 *              Supports all four call types (unary, server-streaming,
 *              client-streaming, bidirectional), metadata, deadlines,
 *              automatic reconnection, and keep-alive.
 *
 * @example | Unary call
 *   const { GrpcClient, parseProto } = require('@zero-server/sdk');
 *   const schema = parseProto(fs.readFileSync('hello.proto', 'utf8'));
 *
 *   const client = new GrpcClient('http://localhost:50051', schema, 'Greeter');
 *   const reply = await client.call('SayHello', { name: 'World' });
 *   console.log(reply.message); // => 'Hello World'
 *   client.close();
 *
 * @example | Server streaming
 *   const stream = client.serverStream('ListUsers', { pageSize: 10 });
 *   for await (const user of stream) {
 *       console.log(user.name);
 *   }
 *
 * @example | Bidirectional streaming
 *   const bidi = client.bidiStream('Chat');
 *   bidi.write({ text: 'hello' });
 *   for await (const reply of bidi) {
 *       console.log(reply.text);
 *   }
 *   bidi.end();
 *
 * @example | With TLS and metadata
 *   const client = new GrpcClient('https://api.example.com:443', schema, 'MyService', {
 *       ca: fs.readFileSync('ca.pem'),
 *       metadata: { authorization: 'Bearer <token>' },
 *   });
 */

const http2 = require('http2');
const { EventEmitter } = require('events');
const log = require('../debug')('zero:grpc');
const { GrpcStatus, statusName } = require('./status');
const { Metadata } = require('./metadata');
const { frameEncode, FrameParser } = require('./frame');
const { encode, decode } = require('./codec');

// -- Status helpers ----------------------------------------

/**
 * Decode a percent-encoded `grpc-message` value, falling back to the raw
 * string when the encoding is malformed.
 *
 * @private
 * @param {string} [value] - Raw header value.
 * @returns {string|null} Decoded message, or `null` when absent.
 */
function _decodeMessage(value)
{
    if (!value) return null;
    try { return decodeURIComponent(value); }
    catch { return String(value); }
}

/**
 * Build an Error carrying a gRPC status code.
 *
 * @private
 * @param {number} code - gRPC status code.
 * @param {string|null} [message] - Status message; defaults to the status name.
 * @returns {Error}
 */
function _statusError(code, message)
{
    const err = new Error(message || statusName(code));
    err.code = code;
    err.grpcCode = code;
    return err;
}

/**
 * Read the gRPC status carried by a headers or trailers block.
 *
 * @private
 * @param {object} headers - HTTP/2 headers or trailers.
 * @returns {Error|null|undefined} An Error for a non-OK status, `null` for OK,
 *          or `undefined` when the block carries no `grpc-status`.
 */
function _readStatus(headers)
{
    if (!headers || headers['grpc-status'] === undefined) return undefined;
    const code = parseInt(headers['grpc-status'], 10);
    if (code === GrpcStatus.OK) return null;
    return _statusError(Number.isNaN(code) ? GrpcStatus.UNKNOWN : code, _decodeMessage(headers['grpc-message']));
}

/**
 * Build the error for a stream that finished without a `grpc-status`,
 * mapping any RST_STREAM code as described by the gRPC HTTP/2 protocol spec.
 *
 * @private
 * @param {import('http2').ClientHttp2Stream} stream - The finished stream.
 * @returns {Error}
 */
function _missingStatusError(stream)
{
    const rst = stream.rstCode;
    if (!rst) return _statusError(GrpcStatus.INTERNAL, 'Stream ended without a grpc-status');

    const c = http2.constants;
    let code = GrpcStatus.INTERNAL;
    if (rst === c.NGHTTP2_REFUSED_STREAM) code = GrpcStatus.UNAVAILABLE;
    else if (rst === c.NGHTTP2_CANCEL) code = GrpcStatus.CANCELLED;
    else if (rst === c.NGHTTP2_ENHANCE_YOUR_CALM) code = GrpcStatus.RESOURCE_EXHAUSTED;
    else if (rst === c.NGHTTP2_INADEQUATE_SECURITY) code = GrpcStatus.PERMISSION_DENIED;
    return _statusError(code, `Stream reset by peer with HTTP/2 code ${rst}`);
}

/**
 * Attach a pull-based reader to a response stream. Messages are delivered in
 * order before any terminal error, and the call status is taken from the
 * trailers (or Trailers-Only headers), so an error sent after data is not lost.
 *
 * @private
 * @param {import('http2').ClientHttp2Stream} stream - Request stream.
 * @param {object} outputDesc - Response message descriptor.
 * @param {object} messages - Schema message map.
 * @param {number} maxMessageSize - Max incoming message size.
 * @returns {{ next: Function, fail: Function, cancel: Function }}
 */
function _streamReader(stream, outputDesc, messages, maxMessageSize)
{
    const parser = new FrameParser({ maxMessageSize });
    const queue = [];
    let waiter = null;
    let ended = false;
    let cancelled = false;
    let error = null;
    let status;

    const settle = () =>
    {
        if (!waiter) return;
        const r = waiter;
        if (queue.length > 0) { waiter = null; r({ value: queue.shift(), done: false }); }
        else if (error) { waiter = null; r(Promise.reject(error)); }
        else if (ended) { waiter = null; r({ value: undefined, done: true }); }
    };

    const fail = (err) =>
    {
        if (!error) error = err;
        settle();
    };

    const finish = () =>
    {
        if (ended) return;
        ended = true;
        parser.destroy();
        if (!error && !cancelled)
        {
            if (status === undefined) error = _missingStatusError(stream);
            else if (status) error = status;
        }
        settle();
    };

    parser.onMessage = (buf) =>
    {
        try { queue.push(decode(buf, outputDesc, messages)); settle(); }
        catch (err) { fail(err); }
    };
    parser.onError = fail;

    stream.on('data', (chunk) => parser.push(chunk));
    stream.on('response', (hdrs) =>
    {
        const s = _readStatus(hdrs);
        if (s !== undefined) status = s;
    });
    stream.on('trailers', (trailers) =>
    {
        const s = _readStatus(trailers);
        if (s !== undefined) status = s;
    });
    stream.on('end', finish);
    stream.on('close', finish);
    stream.on('error', (err) =>
    {
        if (!cancelled && !error) error = err;
        finish();
    });

    return {
        next()
        {
            if (queue.length > 0) return Promise.resolve({ value: queue.shift(), done: false });
            if (error) return Promise.reject(error);
            if (ended) return Promise.resolve({ value: undefined, done: true });
            return new Promise((r) => { waiter = r; });
        },
        fail,
        cancel()
        {
            cancelled = true;
            stream.close();
        },
    };
}

// -- Client ------------------------------------------------

/**
 * gRPC client for making RPC calls to a gRPC server.
 * Supports single-address and multi-address (load-balanced) modes.
 *
 * @class
 * @extends EventEmitter
 *
 * @param {string|object} address - Server address (e.g. `http://localhost:50051`) or options object.
 * @param {string[]} [address.addresses] - Multiple backend addresses for load balancing.
 * @param {string} [address.address] - Single backend address (alternative to string form).
 * @param {string} [address.loadBalancing='pick-first'] - Load balancing policy ('pick-first' or 'round-robin').
 * @param {boolean} [address.healthCheck=false] - Enable health-aware balancing.
 * @param {object} schema - Parsed proto schema from `parseProto()`.
 * @param {string} serviceName - Name of the service to call.
 * @param {object} [opts] - Client options.
 * @param {Buffer|string} [opts.ca] - CA certificate for TLS.
 * @param {Buffer|string} [opts.key] - Client key for mTLS.
 * @param {Buffer|string} [opts.cert] - Client certificate for mTLS.
 * @param {object} [opts.metadata] - Default metadata sent with every call.
 * @param {number} [opts.maxMessageSize=16777216] - Max incoming message size (16 MB default).
 * @param {boolean} [opts.compress=false] - Compress outgoing messages.
 * @param {number} [opts.deadline] - Default deadline in ms for all calls.
 * @param {boolean} [opts.keepAlive=true] - Send HTTP/2 pings to keep connection alive.
 * @param {number} [opts.keepAliveInterval=15000] - Ping interval in ms.
 */
class GrpcClient extends EventEmitter
{
    constructor(address, schema, serviceName, opts = {})
    {
        super();

        const service = schema.services[serviceName];
        if (!service)
        {
            throw new Error(`Service "${serviceName}" not found in schema. ` +
                `Available: ${Object.keys(schema.services).join(', ') || 'none'}`);
        }

        // Support new multi-address API: new GrpcClient({ addresses: [...] }, schema, service, opts)
        if (typeof address === 'object' && address !== null && !Buffer.isBuffer(address))
        {
            /** @private */
            this._address = address.address || (address.addresses && address.addresses[0]) || '';
            /** @private */
            this._multiAddress = true;

            // Merge address-level options into opts
            if (address.ca) opts.ca = address.ca;
            if (address.key) opts.key = address.key;
            if (address.cert) opts.cert = address.cert;
            if (address.metadata) opts.metadata = address.metadata;
            if (address.rejectUnauthorized === false) opts.rejectUnauthorized = false;

            // Create load balancer
            if (address.addresses && address.addresses.length > 1)
            {
                const { LoadBalancer } = require('./balancer');
                const connectOpts = {};
                if (opts.ca) connectOpts.ca = opts.ca;
                if (opts.key) connectOpts.key = opts.key;
                if (opts.cert) connectOpts.cert = opts.cert;
                if (opts.rejectUnauthorized === false) connectOpts.rejectUnauthorized = false;

                /** @private */
                this._balancer = new LoadBalancer(address.addresses, {
                    policy: address.loadBalancing || 'pick-first',
                    connectOpts,
                });
            }
            else
            {
                this._balancer = null;
            }
        }
        else
        {
            /** @private */
            this._address = address;
            /** @private */
            this._multiAddress = false;
            /** @private */
            this._balancer = null;
        }

        /** @private */
        this._schema = schema;
        /** @private */
        this._service = service;
        /** @private */
        this._serviceName = serviceName;
        /** @private */
        this._opts = opts;
        /** @private */
        this._session = null;
        /** @private */
        this._closed = false;
        /** @private */
        this._keepAliveTimer = null;

        // Build the path prefix (e.g. /mypackage.MyService)
        const pkg = schema.package ? schema.package + '.' : '';
        /** @private */
        this._pathPrefix = '/' + pkg + serviceName;

        /** Default metadata for all calls. */
        this.defaultMetadata = new Metadata();
        if (opts.metadata)
        {
            for (const [k, v] of Object.entries(opts.metadata))
                this.defaultMetadata.set(k, v);
        }
    }

    /**
     * Lazily connect to the server. Reuses the HTTP/2 session if already connected.
     * Uses the load balancer if configured for multi-address mode.
     * @private
     * @returns {import('http2').ClientHttp2Session}
     */
    _connect()
    {
        // Load-balanced mode
        if (this._balancer)
        {
            const session = this._balancer.getSession();
            if (session) return session;
            // Fallback to direct connect if balancer returns null
        }

        if (this._session && !this._session.closed && !this._session.destroyed)
            return this._session;

        const connectOpts = {};
        if (this._opts.ca) connectOpts.ca = this._opts.ca;
        if (this._opts.key) connectOpts.key = this._opts.key;
        if (this._opts.cert) connectOpts.cert = this._opts.cert;
        // Allow self-signed certs in development
        if (this._opts.rejectUnauthorized === false)
            connectOpts.rejectUnauthorized = false;

        this._session = http2.connect(this._address, connectOpts);

        // Pending calls already reject through their stream errors; only re-emit
        // when someone listens, otherwise EventEmitter would throw and take the
        // process down on a transport error.
        this._session.on('error', (err) =>
        {
            log.error('gRPC client session error: %s', err.message);
            if (this.listenerCount('error') > 0) this.emit('error', err);
        });

        this._session.on('close', () =>
        {
            log.debug('gRPC client session closed');
            this._session = null;
            this.emit('disconnect');
        });

        // Keep-alive pings
        if (this._opts.keepAlive !== false)
        {
            const interval = this._opts.keepAliveInterval || 15000;
            this._keepAliveTimer = setInterval(() =>
            {
                if (this._session && !this._session.closed)
                {
                    this._session.ping((err) =>
                    {
                        if (err) log.debug('keep-alive ping failed: %s', err.message);
                    });
                }
            }, interval);
            if (this._keepAliveTimer.unref) this._keepAliveTimer.unref();
        }

        log.info('gRPC client connected to %s', this._address);
        return this._session;
    }

    /**
     * Build the HTTP/2 headers for a gRPC request.
     * @private
     * @param {string} methodName
     * @param {Metadata|object} [extraMeta]
     * @param {number} [deadline] - Deadline in ms.
     * @returns {object}
     */
    _buildHeaders(methodName, extraMeta, deadline)
    {
        const headers = {
            ':method': 'POST',
            ':path': this._pathPrefix + '/' + methodName,
            'content-type': 'application/grpc+proto',
            'te': 'trailers',
        };

        if (this._opts.compress) headers['grpc-encoding'] = 'gzip';

        // Merge metadata
        const md = this.defaultMetadata.clone();
        if (extraMeta)
        {
            const extra = extraMeta instanceof Metadata ? extraMeta : Metadata.fromHeaders(extraMeta);
            md.merge(extra);
        }
        Object.assign(headers, md.toHeaders());

        // Deadline -> grpc-timeout
        const dl = deadline || this._opts.deadline;
        if (dl)
        {
            // Convert ms to grpc-timeout format
            if (dl >= 3600000) headers['grpc-timeout'] = Math.floor(dl / 3600000) + 'H';
            else if (dl >= 60000) headers['grpc-timeout'] = Math.floor(dl / 60000) + 'M';
            else if (dl >= 1000) headers['grpc-timeout'] = Math.floor(dl / 1000) + 'S';
            else headers['grpc-timeout'] = dl + 'm';
        }

        return headers;
    }

    // -- Unary Call -----------------------------------------

    /**
     * Make a unary gRPC call - send one message, receive one response.
     *
     * @param {string} methodName - RPC method name as defined in the proto service.
     * @param {object} request - Request message object.
     * @param {object} [opts] - Call options.
     * @param {Metadata|object} [opts.metadata] - Per-call metadata.
     * @param {number} [opts.deadline] - Deadline in ms.
     * @returns {Promise<object>} The decoded response message.
     *
     * @example
     *   const reply = await client.call('SayHello', { name: 'World' });
     */
    call(methodName, request, opts = {})
    {
        const methodDef = this._service.methods[methodName];
        if (!methodDef)
            return Promise.reject(new Error(`Method "${methodName}" not found in service "${this._serviceName}"`));

        const inputDesc = this._schema.messages[methodDef.inputType];
        const outputDesc = this._schema.messages[methodDef.outputType];
        if (!inputDesc) return Promise.reject(new Error(`Unknown input type: ${methodDef.inputType}`));
        if (!outputDesc) return Promise.reject(new Error(`Unknown output type: ${methodDef.outputType}`));

        return new Promise((resolve, reject) =>
        {
            const session = this._connect();
            const headers = this._buildHeaders(methodName, opts.metadata, opts.deadline);
            const stream = session.request(headers);

            const parser = new FrameParser({ maxMessageSize: this._opts.maxMessageSize });
            let response = null;
            let status;

            parser.onMessage = (buf) =>
            {
                try { response = decode(buf, outputDesc, this._schema.messages); }
                catch (err) { reject(err); }
            };
            parser.onError = reject;

            stream.on('data', (chunk) => parser.push(chunk));

            // Trailers-Only responses carry grpc-status in the initial headers
            stream.on('response', (headers) =>
            {
                const s = _readStatus(headers);
                if (s !== undefined) status = s;
            });

            stream.on('trailers', (trailers) =>
            {
                const s = _readStatus(trailers);
                if (s !== undefined) status = s;
            });

            const finish = () =>
            {
                parser.destroy();
                if (status === undefined) reject(_missingStatusError(stream));
                else if (status) reject(status);
                else resolve(response || {});
            };
            stream.on('end', finish);
            stream.on('close', finish);

            stream.on('error', (err) =>
            {
                parser.destroy();
                reject(err);
            });

            // Deadline timeout
            const dl = opts.deadline || this._opts.deadline;
            if (dl)
            {
                const timer = setTimeout(() =>
                {
                    reject(_statusError(GrpcStatus.DEADLINE_EXCEEDED, 'Deadline exceeded'));
                    stream.close();
                }, dl);
                if (timer.unref) timer.unref();
                stream.on('close', () => clearTimeout(timer));
            }

            // Send the request
            try
            {
                const buf = encode(request || {}, inputDesc, this._schema.messages);
                const frame = frameEncode(buf, { compress: this._opts.compress });

                if (frame instanceof Promise)
                {
                    frame.then((f) =>
                    {
                        stream.write(f);
                        stream.end();
                    }).catch(reject);
                }
                else
                {
                    stream.write(frame);
                    stream.end();
                }
            }
            catch (err) { reject(err); }
        });
    }

    // -- Server Streaming ----------------------------------

    /**
     * Make a server-streaming gRPC call - send one request, receive a stream of responses.
     * Returns an async-iterable that yields decoded response messages.
     *
     * @param {string} methodName - RPC method name.
     * @param {object} request - Request message object.
     * @param {object} [opts] - Call options.
     * @param {Metadata|object} [opts.metadata] - Per-call metadata.
     * @param {number} [opts.deadline] - Deadline in ms.
     * @returns {AsyncIterable<object> & { cancel: Function }} Async iterable of response messages.
     *
     * @example
     *   const stream = client.serverStream('ListUsers', { filter: 'active' });
     *   for await (const user of stream) {
     *       console.log(user);
     *   }
     */
    serverStream(methodName, request, opts = {})
    {
        const methodDef = this._service.methods[methodName];
        if (!methodDef) throw new Error(`Method "${methodName}" not found`);

        const inputDesc = this._schema.messages[methodDef.inputType];
        const outputDesc = this._schema.messages[methodDef.outputType];

        const session = this._connect();
        const headers = this._buildHeaders(methodName, opts.metadata, opts.deadline);
        const stream = session.request(headers);

        const reader = _streamReader(stream, outputDesc, this._schema.messages, this._opts.maxMessageSize);

        // Send request
        const buf = encode(request || {}, inputDesc, this._schema.messages);
        const frame = frameEncode(buf, { compress: this._opts.compress });
        if (frame instanceof Promise) frame.then((f) => { stream.write(f); stream.end(); }).catch((err) => { reader.fail(err); stream.close(); });
        else { stream.write(frame); stream.end(); }

        return {
            [Symbol.asyncIterator]() { return { next: reader.next }; },
            cancel() { reader.cancel(); },
        };
    }

    // -- Client Streaming ----------------------------------

    /**
     * Make a client-streaming gRPC call - send a stream of requests, receive one response.
     * Returns a writable object with `write()`, `end()`, and a `response` Promise.
     *
     * @param {string} methodName - RPC method name.
     * @param {object} [opts] - Call options.
     * @param {Metadata|object} [opts.metadata] - Per-call metadata.
     * @param {number} [opts.deadline] - Deadline in ms.
     * @returns {{ write: Function, end: Function, response: Promise<object> }}
     *
     * @example
     *   const cs = client.clientStream('UploadChunks');
     *   cs.write({ data: chunk1 });
     *   cs.write({ data: chunk2 });
     *   cs.end();
     *   const result = await cs.response;
     */
    clientStream(methodName, opts = {})
    {
        const methodDef = this._service.methods[methodName];
        if (!methodDef) throw new Error(`Method "${methodName}" not found`);

        const inputDesc = this._schema.messages[methodDef.inputType];
        const outputDesc = this._schema.messages[methodDef.outputType];

        const session = this._connect();
        const headers = this._buildHeaders(methodName, opts.metadata, opts.deadline);
        const stream = session.request(headers);

        const parser = new FrameParser({ maxMessageSize: this._opts.maxMessageSize });
        let responseMsg = null;
        let status;
        let cancelled = false;
        let rejectResponse;

        const response = new Promise((resolve, reject) =>
        {
            rejectResponse = reject;
            parser.onMessage = (buf) =>
            {
                try { responseMsg = decode(buf, outputDesc, this._schema.messages); }
                catch (err) { reject(err); }
            };
            parser.onError = reject;

            stream.on('data', (chunk) => parser.push(chunk));

            // Trailers-Only responses carry grpc-status in the initial headers
            stream.on('response', (hdrs) =>
            {
                const s = _readStatus(hdrs);
                if (s !== undefined) status = s;
                if (s) reject(s);
            });

            stream.on('trailers', (trailers) =>
            {
                const s = _readStatus(trailers);
                if (s !== undefined) status = s;
                if (s) reject(s);
            });

            const finish = () =>
            {
                parser.destroy();
                if (cancelled) reject(_statusError(GrpcStatus.CANCELLED, 'Call cancelled'));
                else if (status === undefined) reject(_missingStatusError(stream));
                else if (status) reject(status);
                else resolve(responseMsg || {});
            };
            stream.on('end', finish);
            stream.on('close', finish);
            stream.on('error', (err) => { parser.destroy(); reject(err); });
        });

        const compress = this._opts.compress;
        const messages = this._schema.messages;

        return {
            write(msg)
            {
                const buf = encode(msg, inputDesc, messages);
                const frame = frameEncode(buf, { compress });
                if (frame instanceof Promise) frame.then((f) => stream.write(f)).catch((err) => { rejectResponse(err); stream.close(); });
                else stream.write(frame);
            },
            end() { stream.end(); },
            cancel()
            {
                cancelled = true;
                response.catch(() => {});
                stream.close();
            },
            response,
        };
    }

    // -- Bidirectional Streaming ----------------------------

    /**
     * Make a bidirectional streaming gRPC call - send and receive streams simultaneously.
     * Returns an object that is both writable (`write`/`end`) and async-iterable.
     *
     * @param {string} methodName - RPC method name.
     * @param {object} [opts] - Call options.
     * @param {Metadata|object} [opts.metadata] - Per-call metadata.
     * @param {number} [opts.deadline] - Deadline in ms.
     * @returns {AsyncIterable<object> & { write: Function, end: Function, cancel: Function }}
     *
     * @example
     *   const bidi = client.bidiStream('Chat');
     *   bidi.write({ text: 'Hello' });
     *   for await (const reply of bidi) {
     *       console.log(reply.text);
     *       bidi.write({ text: 'got it' });
     *   }
     *   bidi.end();
     */
    bidiStream(methodName, opts = {})
    {
        const methodDef = this._service.methods[methodName];
        if (!methodDef) throw new Error(`Method "${methodName}" not found`);

        const inputDesc = this._schema.messages[methodDef.inputType];
        const outputDesc = this._schema.messages[methodDef.outputType];

        const session = this._connect();
        const headers = this._buildHeaders(methodName, opts.metadata, opts.deadline);
        const stream = session.request(headers);

        const reader = _streamReader(stream, outputDesc, this._schema.messages, this._opts.maxMessageSize);
        const compress = this._opts.compress;
        const messages = this._schema.messages;

        return {
            write(msg)
            {
                const buf = encode(msg, inputDesc, messages);
                const frame = frameEncode(buf, { compress });
                if (frame instanceof Promise) frame.then((f) => stream.write(f)).catch((err) => { reader.fail(err); stream.close(); });
                else stream.write(frame);
            },
            end() { stream.end(); },
            cancel() { reader.cancel(); },
            [Symbol.asyncIterator]() { return { next: reader.next }; },
        };
    }

    // -- Lifecycle ------------------------------------------

    /**
     * Close the client connection.
     */
    close()
    {
        this._closed = true;
        if (this._keepAliveTimer)
        {
            clearInterval(this._keepAliveTimer);
            this._keepAliveTimer = null;
        }
        if (this._balancer)
        {
            this._balancer.shutdown();
            this._balancer = null;
        }
        if (this._session)
        {
            this._session.close();
            this._session = null;
        }
        log.info('gRPC client closed');
    }

    /**
     * Check if the client is connected.
     * @returns {boolean}
     */
    get connected()
    {
        return this._session && !this._session.closed && !this._session.destroyed;
    }
}

module.exports = { GrpcClient };
