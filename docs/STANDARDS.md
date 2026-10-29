# zero-server authoritative sources registry

Registry of the normative documents every zero-server (@zero-server/sdk) feature must be implemented and reviewed against. Every URL in this file was fetched live on 2026-09-28 and its title checked against the document it is cited for; the Sources index at the end records the confirmed title of each one. Section numbers in the checklists refer to the document named in the same line.

Conventions:

- Primary standard is the document the feature conforms to. Secondary sources are best current practice, security guidance, or runtime references that constrain the implementation.
- Obsoleted documents are never cited as primary. Where a feature was historically built from an older RFC, the row names the current document and what it obsoletes.
- Checklist statements are written to become test names. Each one cites the section that makes it testable.
- Scope: 45 feature rows and 417 checklist statements under Feature areas, plus 11 driver rows and 98 statements under Database drivers, backed by 148 verified URLs.

## Obsolescence and document status notes

- RFC 2616 was obsoleted by RFC 7230-7235, which were in turn obsoleted by RFC 9110 (semantics), RFC 9111 (caching, replaces RFC 7234), and RFC 9112 (HTTP/1.1 messaging, replaces the RFC 7230 messaging parts). Cite only RFC 9110-9112.
- RFC 7540 and RFC 8740 are obsoleted by RFC 9113 (HTTP/2). RFC 7541 (HPACK) remains current.
- RFC 6265 is still the published cookie RFC. draft-ietf-httpbis-rfc6265bis-22 is in the RFC Editor queue and states that it obsoletes RFC 6265; SameSite, cookie prefixes, and the 400-day cap come only from the draft.
- RFC 5389 is obsoleted by RFC 8489 (STUN). RFC 5766 and RFC 6156 are obsoleted by RFC 8656 (TURN). RFC 5245 is obsoleted by RFC 8445 (ICE) and RFC 8839 (ICE SDP). RFC 4566 is obsoleted by RFC 8866 (SDP). RFC 8829 is obsoleted by RFC 9429 (JSEP). RFC 5117 is obsoleted by RFC 7667.
- RFC 7807 is obsoleted by RFC 9457. RFC 7159 by RFC 8259. RFC 2388 by RFC 7578. RFC 5987 by RFC 8187. RFC 4122 by RFC 9562. RFC 6125 by RFC 9525. RFC 3548 by RFC 4648. RFC 7049 by RFC 8949. RFC 8152 by RFC 9052 and RFC 9053. RFC 3164 by RFC 5424. RFC 5849 by RFC 6749.
- Drafts cited as secondary only: OAuth 2.1 (draft-ietf-oauth-v2-1-16, active, will replace RFC 6749 and RFC 6750), RateLimit header fields (draft-ietf-httpapi-ratelimit-headers-11, active), Health Check Response Format (draft-inadarei-api-health-check-06, expired individual draft), and the TURN REST API (draft-uberti-behave-turn-rest-00, expired individual draft that remains the de facto credential convention). Pin the revision in tests and recheck status before each release.
- Vendor documents are versioned pages: Node.js v26.10.0, PostgreSQL 18 (protocol 3.2, with 3.0 still the libpq default), MySQL 8.4 reference manual and MySQL source documentation labeled 26.7.0, MongoDB 8.3, and the Redis docs as of 2026-09-28.

## Feature areas

### HTTP semantics, routing, and responses

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Routing: method dispatch, path matching, parameter decoding, 404/405/501, HEAD and OPTIONS | lib/router/index.js, lib/app.js | RFC 9110 HTTP Semantics, https://www.rfc-editor.org/rfc/rfc9110.html (obsoletes RFC 7230, 7231, 7232, 7233, 7235, 7538, 7615, 7694, 2818; the RFC 7230-7235 set itself obsoleted RFC 2616) | RFC 3986 URI Generic Syntax (STD 66, obsoletes RFC 2396, 2732, 1808), https://www.rfc-editor.org/rfc/rfc3986.html | RFC 9110: 4, 9.1, 9.2.1, 9.2.2, 9.3.2, 9.3.7, 15.5.5, 15.5.6, 15.6.2; RFC 3986: 2.1, 2.2, 2.3, 3.3, 3.4, 5.2.4, 6.2.2.1, 6.2.2.3, 7 |
| Request and response objects (headers, status, redirects, dates, content negotiation) | lib/http/request.js, lib/http/response.js | RFC 9110, https://www.rfc-editor.org/rfc/rfc9110.html | RFC 9112 for wire serialization | 5.1, 5.5, 5.6.7, 6.6.1, 8.3, 8.6, 10.2.2, 12.1, 12.4.2, 12.5.1, 12.5.3, 12.5.5, 15.3.5, 15.4, 15.4.5, 15.5.7 |
| Client address and scheme behind proxies (trust proxy) | lib/http/request.js | RFC 7239 Forwarded HTTP Extension, https://www.rfc-editor.org/rfc/rfc7239.html | RFC 9110 Section 7.6.3 (Via) | 4, 5.1-5.4, 6, 6.2, 6.3, 7.4, 8.1 |

#### Conformance checklist

1. An unrecognized or unimplemented method is answered with 501 Not Implemented (RFC 9110 Section 9.1).
2. A recognized method that the route does not allow is answered with 405 Method Not Allowed (RFC 9110 Section 9.1).
3. A 405 response carries an Allow header field listing the methods the target resource supports (RFC 9110 Section 15.5.6).
4. Method tokens are matched case-sensitively, so `get` does not dispatch to a GET handler (RFC 9110 Section 9.1).
5. HEAD returns the same header fields GET would, with no message body (RFC 9110 Section 9.3.2).
6. A successful OPTIONS response with no content sends `Content-Length: 0` and advertises supported methods via Allow (RFC 9110 Section 9.3.7).
7. Field names are compared case-insensitively on both request lookup and response set (RFC 9110 Section 5.1).
8. Leading and trailing whitespace is stripped from received field values before evaluation (RFC 9110 Section 5.5).
9. Setting a response header whose value contains CR, LF, or NUL is rejected rather than emitted (RFC 9110 Section 5.5).
10. Generated HTTP-date values (Date, Last-Modified, Expires, cookie expiry) use IMF-fixdate (RFC 9110 Section 5.6.7).
11. Responses include a Date header field (RFC 9110 Section 6.6.1).
12. No Content-Length header is sent on 1xx or 204 responses (RFC 9110 Section 8.6).
13. 204 and 304 responses never carry content, even if the handler writes a body (RFC 9110 Sections 15.3.5 and 15.4.5).
14. Redirect helpers set Location on 301, 302, 303, 307, and 308 (RFC 9110 Sections 10.2.2 and 15.4).
15. 307 and 308 are the codes used when the redirect must preserve the request method and content (RFC 9110 Sections 15.4.8 and 15.4.9).
16. Accept with `q=0` marks a media type as not acceptable and content negotiation never selects it (RFC 9110 Section 12.4.2).
17. When no representation matches Accept and the server does not fall back to a default, the response is 406 Not Acceptable (RFC 9110 Section 15.5.7).
18. A response selected by proactive negotiation includes Vary naming the request fields used (RFC 9110 Section 12.5.5).
19. Route matching compares an encoded `%2F` as data, never as a path separator, because reserved characters and their percent-encoded forms are not equivalent (RFC 3986 Section 2.2).
20. Percent-encoded unreserved characters match their decoded form, and hex digits compare case-insensitively (RFC 3986 Sections 2.3 and 6.2.2.1).
21. Dot segments (`.` and `..`) are resolved with remove_dot_segments before routing, so `/a/../admin` cannot bypass a mount (RFC 3986 Sections 5.2.4 and 6.2.2.3).
22. The query component is split from the path at the first `?` and never participates in path matching (RFC 3986 Section 3.4).
23. Forwarded header values are parsed as comma-separated forwarded-elements of `for`, `by`, `host`, and `proto` pairs (RFC 7239 Sections 4 and 5).
24. IPv6 addresses and node identifiers with a port in Forwarded are accepted only in quoted form (RFC 7239 Section 6).
25. `unknown` and underscore-prefixed obfuscated identifiers are accepted without being treated as IP addresses (RFC 7239 Sections 6.2 and 6.3).
26. The first `for` value is the originating client and later values are successive proxies, so client IP is taken from the rightmost untrusted hop (RFC 7239 Section 5.2).
27. Forwarded and X-Forwarded-* values are ignored unless the immediate peer is a configured trusted proxy (RFC 7239 Section 8.1).

### HTTP/1.1 message framing

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| HTTP/1.1 server framing, body length, keep-alive | lib/http/index.js, lib/app.js | RFC 9112 HTTP/1.1, https://www.rfc-editor.org/rfc/rfc9112.html (obsoletes RFC 7230) | RFC 9110 Sections 6.4, 7.2, 7.6.1; Node.js http, https://nodejs.org/api/http.html (server.headersTimeout, server.requestTimeout, server.keepAliveTimeout, server.maxHeadersCount, http.maxHeaderSize, http.validateHeaderName, http.validateHeaderValue, 'clientError', 'checkContinue', 'upgrade') | 2.2, 3, 3.2, 5.1, 5.2, 6.1, 6.2, 6.3, 7.1, 7.1.1, 7.1.2, 9.3, 9.3.2, 9.6, 11.2 |

#### Conformance checklist

1. A request carrying both Transfer-Encoding and Content-Length is framed by Transfer-Encoding alone or rejected, and the connection is closed after the response (RFC 9112 Section 6.3).
2. A request whose Transfer-Encoding does not end in `chunked` is answered with 400 and the connection is closed (RFC 9112 Section 6.3).
3. A request with an invalid Content-Length and no Transfer-Encoding is answered with 400 and the connection is closed (RFC 9112 Section 6.3).
4. Whitespace between a field name and the colon yields 400 Bad Request (RFC 9112 Section 5.1).
5. An HTTP/1.1 request lacking Host, with more than one Host line, or with an invalid Host value yields 400 (RFC 9112 Section 3.2).
6. A request containing obs-fold line folding is rejected with 400 or each obs-fold is replaced with SP before processing (RFC 9112 Section 5.2).
7. The server never generates a bare CR outside content (RFC 9112 Section 2.2).
8. At least one empty CRLF line received before the request-line is ignored (RFC 9112 Section 2.2).
9. An over-long request-target yields 414 and an over-long unknown method yields 501, with request-lines of at least 8000 octets supported (RFC 9112 Section 3).
10. Unrecognized chunk extensions are ignored and their total size is bounded (RFC 9112 Section 7.1.1).
11. Chunked trailer fields are not merged into the header section unless explicitly allowed (RFC 9112 Section 7.1.2).
12. A request with `Connection: close` causes the server to close after sending the final response (RFC 9112 Section 9.6).
13. Responses to pipelined requests are written in the order the requests were received (RFC 9112 Section 9.3.2).

### HTTP/2 and TLS transport

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| HTTP/2 server mode, h2 framing rules, TLS and ALPN negotiation | lib/app.js, lib/http/index.js | RFC 9113 HTTP/2, https://www.rfc-editor.org/rfc/rfc9113.html (obsoletes RFC 7540 and RFC 8740) | RFC 7541 HPACK, https://www.rfc-editor.org/rfc/rfc7541.html; Node.js http2, https://nodejs.org/api/http2.html (http2.createSecureServer, Settings object, http2session.goaway, http2.sensitiveHeaders, 'unknownProtocol', Compatibility API); RFC 8446 TLS 1.3 (obsoletes RFC 5077, 5246, 6961), https://www.rfc-editor.org/rfc/rfc8446.html; RFC 7301 ALPN, https://www.rfc-editor.org/rfc/rfc7301.html | RFC 9113: 3.4, 5.1, 5.1.2, 5.2, 5.4.1, 6.5, 6.5.3, 6.7, 6.8, 6.9.1, 7, 8.1.1, 8.2.1, 8.2.2, 8.3.1, 9.2, 9.2.1; RFC 8446: 4.2, 8, 9.1; RFC 7301: 3.1, 3.2, 6 |

#### Conformance checklist

1. The server connection preface is a SETTINGS frame sent as the first frame on the connection (RFC 9113 Section 3.4).
2. Every received non-ACK SETTINGS frame is acknowledged with a SETTINGS frame carrying the ACK flag (RFC 9113 Section 6.5.3).
3. A request carrying Connection, Keep-Alive, Proxy-Connection, Transfer-Encoding, or Upgrade is treated as malformed (RFC 9113 Section 8.2.2).
4. A TE header with any value other than `trailers` is treated as malformed (RFC 9113 Section 8.2.2).
5. A request containing uppercase field names is treated as malformed (RFC 9113 Section 8.2.1).
6. A non-CONNECT request missing `:method`, `:scheme`, or `:path` is malformed (RFC 9113 Section 8.3.1).
7. Malformed requests produce a stream error of type PROTOCOL_ERROR (RFC 9113 Section 8.1.1).
8. Streams opened beyond SETTINGS_MAX_CONCURRENT_STREAMS are refused with PROTOCOL_ERROR or REFUSED_STREAM (RFC 9113 Section 5.1.2).
9. A WINDOW_UPDATE that pushes a flow-control window above 2^31-1 is a FLOW_CONTROL_ERROR (RFC 9113 Section 6.9.1).
10. Graceful shutdown sends GOAWAY with the last processed stream identifier and lets in-flight streams finish (RFC 9113 Section 6.8).
11. A PING without ACK is answered with a PING carrying ACK and the identical 8-octet payload (RFC 9113 Section 6.7).
12. Authorization, Cookie, and Set-Cookie are emitted as never-indexed literals so HPACK compression cannot leak them (RFC 7541 Sections 6.2.3 and 7.1.3).
13. h2 over TLS requires TLS 1.2 or later and is selected with the ALPN identifier `h2` (RFC 9113 Section 9.2).
14. The server picks the most preferred protocol both sides support, and with no overlap it fails the handshake with a fatal no_application_protocol alert (RFC 7301 Section 3.2).
15. 0-RTT early data is disabled or restricted to replay-safe requests because TLS 1.3 gives no cross-connection replay protection (RFC 8446 Section 8).

### Error responses

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| HttpError classes, error handler, problem details | lib/errors.js, lib/middleware/errorHandler.js, lib/body/sendError.js | RFC 9457 Problem Details for HTTP APIs, https://www.rfc-editor.org/rfc/rfc9457.html (obsoletes RFC 7807) | RFC 9110 Sections 10.2.3, 11.6.1, 15.5, 15.6 | 3, 3.1, 3.1.1-3.1.5, 3.2, 4.2.1, 5 |

#### Conformance checklist

1. Problem responses are sent with media type `application/problem+json` (RFC 9457 Section 3).
2. The `status` member, when present, equals the HTTP status code of the response (RFC 9457 Section 3.1.2).
3. When `type` is absent it is treated as `about:blank`, and `title` then matches the status code reason phrase (RFC 9457 Sections 3.1.1 and 4.2.1).
4. `title` is stable across occurrences of the same problem type (RFC 9457 Section 3.1.3).
5. `detail` explains the occurrence to the client and does not carry debugging output (RFC 9457 Section 3.1.4).
6. Extension members such as `errors` or `code` are allowed and do not collide with the standard members (RFC 9457 Section 3.2).
7. Stack traces and internal implementation details are never serialized into production error responses (RFC 9457 Section 5).
8. A member whose value has the wrong JSON type is ignored rather than failing serialization of the whole problem (RFC 9457 Section 3.1).
9. A 401 response includes a WWW-Authenticate header field with at least one challenge (RFC 9110 Section 15.5.2).
10. 429 and 503 responses include Retry-After when the server knows when to retry (RFC 9110 Section 10.2.3).

### Body parsing

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| JSON body parser | lib/body/json.js | RFC 8259 The JavaScript Object Notation (JSON) Data Interchange Format, https://www.rfc-editor.org/rfc/rfc8259.html (obsoletes RFC 7159) | RFC 9110 Sections 8.3, 15.5.14, 15.5.16 | 2, 4, 6, 7, 8.1, 8.2, 9, 11 |
| URL-encoded form parser | lib/body/urlencoded.js | WHATWG URL Standard, application/x-www-form-urlencoded, https://url.spec.whatwg.org/ | RFC 3986 Section 2.1 | 1.3 (percent-encoded bytes), 5.1 (parsing), 5.2 (serializing), 6.2 (URLSearchParams) |
| Multipart form-data and file uploads | lib/body/multipart.js | RFC 7578 Returning Values from Forms: multipart/form-data, https://www.rfc-editor.org/rfc/rfc7578.html (obsoletes RFC 2388) | RFC 2046 MIME Part Two: Media Types, https://www.rfc-editor.org/rfc/rfc2046.html; RFC 6266, https://www.rfc-editor.org/rfc/rfc6266.html; RFC 8187, https://www.rfc-editor.org/rfc/rfc8187.html | RFC 7578: 4.1-4.7, 5.1, 7; RFC 2046: 5.1.1 |
| Text and raw parsers, media type matching, request content codings | lib/body/text.js, lib/body/raw.js, lib/body/rawBuffer.js, lib/body/typeMatch.js, lib/body/sendError.js | RFC 9110, https://www.rfc-editor.org/rfc/rfc9110.html | RFC 9112 Section 6.3 (body length) | 8.3, 8.3.1, 8.3.2, 8.4, 12.5.3, 15.5.14, 15.5.16 |

#### Conformance checklist

1. The JSON parser accepts any JSON value at the top level, including strings, numbers, and `null`, unless a strict object-or-array option is set (RFC 8259 Section 2).
2. A leading byte order mark is ignored rather than rejected, and JSON responses are never emitted with a BOM (RFC 8259 Section 8.1).
3. JSON bodies are decoded as UTF-8 regardless of a charset parameter, since application/json defines none (RFC 8259 Sections 8.1 and 11).
4. Duplicate member names resolve deterministically, and a `__proto__` member never alters the prototype of the parsed object (RFC 8259 Section 4).
5. Unescaped control characters U+0000 through U+001F inside strings are rejected (RFC 8259 Section 7).
6. Size and nesting depth limits are enforced, and a body over the size limit yields 413 Content Too Large (RFC 8259 Section 9; RFC 9110 Section 15.5.14).
7. Integers outside [-(2^53)+1, (2^53)-1] are documented as lossy, and an opt-in reviver keeps them as strings or BigInt (RFC 8259 Section 6).
8. URL-encoded bodies are split on `&`, empty sequences are skipped, each sequence is split on the first `=`, and a sequence without `=` yields an empty value (URL Standard Section 5.1).
9. `+` becomes a space in both names and values before percent-decoding (URL Standard Section 5.1).
10. A `%` not followed by two hex digits is kept literally instead of throwing (URL Standard Section 1.3, percent-decode).
11. Decoded bytes are interpreted as UTF-8 without BOM, with invalid sequences replaced by U+FFFD (URL Standard Section 5.1).
12. Every multipart part must carry `Content-Disposition: form-data` with a `name` parameter, and parts without one are rejected (RFC 7578 Section 4.2).
13. Directory components in an uploaded `filename` are stripped before the name is exposed or used for storage (RFC 7578 Section 4.2; RFC 6266 Section 4.3).
14. Multiple files sent under the same field name are collected together, not overwritten (RFC 7578 Section 4.3).
15. A part without Content-Type is treated as `text/plain` (RFC 7578 Section 4.4).
16. A `_charset_` field sets the default charset for text parts that lack one (RFC 7578 Section 4.6).
17. A part-level Content-Transfer-Encoding is ignored rather than decoded (RFC 7578 Section 4.7).
18. Boundaries longer than 70 characters or containing characters outside bchars are rejected (RFC 2046 Section 5.1.1).
19. A delimiter is recognized only at the start of a line after CRLF, the preamble and epilogue are ignored, and `--boundary--` ends the body (RFC 2046 Section 5.1.1).
20. When a part carries both `filename` and `filename*`, the UTF-8 decoded `filename*` wins (RFC 6266 Section 4.3; RFC 8187 Section 3.2.1).
21. A request body in an unsupported media type yields 415, and an unsupported request Content-Encoding yields 415 with an Accept-Encoding response field (RFC 9110 Section 15.5.16).

### Static files and conditional requests

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Static file serving, validators, 304, ranges, Cache-Control defaults | lib/middleware/static.js | RFC 9110, https://www.rfc-editor.org/rfc/rfc9110.html (Range semantics formerly RFC 7233, conditionals formerly RFC 7232) | RFC 9111 HTTP Caching, https://www.rfc-editor.org/rfc/rfc9111.html (obsoletes RFC 7234); RFC 3986 Section 5.2.4 | RFC 9110: 8.8.1, 8.8.2, 8.8.3, 8.8.3.2, 13.1.1-13.1.5, 13.2.2, 14.1.2, 14.2, 14.3, 14.4, 14.6, 15.3.7, 15.4.5, 15.5.17, 17.3; RFC 9111: 4.2.1, 5.1, 5.2.2.1, 5.2.2.2, 5.2.2.4, 5.2.2.5, 5.2.2.7, 5.2.2.9, 5.3 |
| Downloads (res.download, attachment) | lib/http/response.js | RFC 6266 Use of the Content-Disposition Header Field in HTTP, https://www.rfc-editor.org/rfc/rfc6266.html | RFC 8187, https://www.rfc-editor.org/rfc/rfc8187.html (obsoletes RFC 5987) | RFC 6266: 4.1, 4.2, 4.3, 7, Appendix D; RFC 8187: 3.2, 3.2.1 |

#### Conformance checklist

1. If-Match uses the strong comparison function and If-None-Match uses the weak comparison function (RFC 9110 Sections 8.8.3.2, 13.1.1, and 13.1.2).
2. A GET or HEAD whose If-None-Match matches the current ETag yields 304 Not Modified (RFC 9110 Section 13.1.2).
3. If-Modified-Since is ignored when If-None-Match is present and for methods other than GET and HEAD (RFC 9110 Section 13.1.3).
4. Preconditions are evaluated in the order If-Match, If-Unmodified-Since, If-None-Match, If-Modified-Since, If-Range (RFC 9110 Section 13.2.2).
5. A 304 carries the ETag, Cache-Control, Date, Expires, and Vary fields a 200 would have sent (RFC 9110 Section 15.4.5).
6. Last-Modified is never later than the Date of the same response (RFC 9110 Section 8.8.2.1).
7. A satisfiable single byte range yields 206 with `Content-Range: bytes first-last/complete-length` (RFC 9110 Sections 14.4 and 15.3.7).
8. An unsatisfiable range yields 416 with `Content-Range: bytes */complete-length` (RFC 9110 Sections 14.4 and 15.5.17).
9. Multiple ranges yield multipart/byteranges or coalesced ranges, and many overlapping or unordered small ranges may be refused (RFC 9110 Sections 14.2 and 14.6).
10. Range is ignored on any method other than GET (RFC 9110 Section 14.2).
11. If-Range with a non-matching or weak validator returns the full 200 representation (RFC 9110 Section 13.1.5).
12. Responses advertise `Accept-Ranges: bytes` when range support is enabled (RFC 9110 Section 14.3).
13. Encoded traversal such as `%2e%2e/` or `..%2f` never resolves outside the configured root (RFC 9110 Section 17.3; RFC 3986 Section 5.2.4).
14. The maxAge option emits `Cache-Control: max-age=N`, and no-store is available for sensitive paths (RFC 9111 Sections 5.2.2.1 and 5.2.2.5).
15. `private` is used whenever a response is user-specific so shared caches do not store it (RFC 9111 Section 5.2.2.7).
16. Downloads send `Content-Disposition: attachment` with an ASCII `filename` fallback and a UTF-8 `filename*` ext-value for non-ASCII names (RFC 6266 Section 4.3 and Appendix D; RFC 8187 Section 3.2.1).

### Cookies and sessions

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Cookie parsing, signed cookies, and Set-Cookie serialization (res.cookie) | lib/middleware/cookieParser.js, lib/http/response.js | RFC 6265 HTTP State Management Mechanism, https://www.rfc-editor.org/rfc/rfc6265.html (obsoletes RFC 2965; it is the current RFC until cookies-bis publishes and obsoletes it) | draft-ietf-httpbis-rfc6265bis-22 Cookies: HTTP State Management Mechanism, https://www.ietf.org/archive/id/draft-ietf-httpbis-rfc6265bis-22.html (in the RFC Editor queue per https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/; follow it for SameSite, prefixes, and lifetime caps) | RFC 6265: 4.1.1, 4.1.2.2, 4.2.1, 5.1.1, 5.4, 6.1; bis-22: 4.1.1, 4.1.2.1-4.1.2.7, 4.1.3, 5.5, 5.7 |
| Server-side sessions and trusted devices | lib/auth/session.js, lib/auth/trustedDevice.js | OWASP Session Management Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | draft-ietf-httpbis-rfc6265bis-22 Sections 4.1.2.7 and 4.1.3; NIST SP 800-63B-4, https://pages.nist.gov/800-63-4/sp800-63b.html (Sections 2.1.3, 2.2.3, 2.3.3, 5.1, 5.2) | Session ID Properties (entropy, name fingerprinting), Cookies, Renew the Session ID After Any Privilege Level Change, Session Expiration (idle and absolute timeout), Permissive and Strict Session Management |

#### Conformance checklist

1. The Cookie header is parsed as `; `-separated name=value pairs and a malformed pair does not abort parsing of the rest (RFC 6265 Sections 4.2.1 and 5.4).
2. Set-Cookie names are tokens and values are limited to cookie-octets or a quoted string, with other bytes encoded before emission (RFC 6265 Section 4.1.1).
3. A response never carries two Set-Cookie fields with the same cookie name, domain, and path (RFC 6265 Section 4.1.1).
4. When both Max-Age and Expires are set, the serialized Max-Age is consistent with Expires because Max-Age takes precedence (RFC 6265 Section 4.1.2.2).
5. Expires is serialized as an IMF-fixdate sane-cookie-date (RFC 6265 Section 4.1.1).
6. Max-Age and Expires are clamped to at most 400 days (34560000 seconds) with a warning (rfc6265bis-22 Section 5.5).
7. `SameSite=None` without `Secure` is refused at serialization time because user agents ignore it (rfc6265bis-22 Sections 4.1.2.7 and 5.7).
8. A cookie named with `__Secure-` is only emitted with Secure (rfc6265bis-22 Section 4.1.3).
9. A cookie named with `__Host-` is only emitted with Secure, `Path=/`, and no Domain (rfc6265bis-22 Section 4.1.3).
10. Serialized cookies stay within the 4096 byte per-cookie budget user agents are required to support (RFC 6265 Section 6.1).
11. Session identifiers carry at least 64 bits of entropy from a CSPRNG (OWASP Session Management, Session ID Entropy).
12. The default session cookie name does not reveal the framework (OWASP Session Management, Session ID Name Fingerprinting).
13. Session cookies default to Secure, HttpOnly, and SameSite=Lax or Strict, with no Domain attribute and a non-persistent lifetime (OWASP Session Management, Cookies).
14. The session identifier is regenerated after login, logout, and any privilege change (OWASP Session Management, Renew the Session ID After Any Privilege Level Change).
15. Idle and absolute timeouts are enforced on the server independently of cookie expiry (OWASP Session Management, Session Expiration).
16. Logout invalidates the server-side session record, not only the cookie (OWASP Session Management, Session Expiration).
17. A session ID the server never issued is rejected and replaced, never adopted (OWASP Session Management, strict session management).

### CSRF, CORS, and security headers

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| CSRF protection | lib/middleware/csrf.js | OWASP Cross-Site Request Forgery Prevention Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | W3C Fetch Metadata Request Headers, https://www.w3.org/TR/fetch-metadata/; RFC 6454 The Web Origin Concept, https://www.rfc-editor.org/rfc/rfc6454.html; rfc6265bis-22 Section 4.1.2.7 | Synchronizer Token Pattern, Signed Double-Submit Cookie, Fetch Metadata Headers, Verifying Origin via Standard Headers, Login CSRF; Fetch Metadata 2.3, 5.1; RFC 6454 5, 6.2, 7 |
| CORS | lib/middleware/cors.js | WHATWG Fetch Standard, CORS protocol, https://fetch.spec.whatwg.org/ | RFC 6454, https://www.rfc-editor.org/rfc/rfc6454.html; RFC 9110 Section 12.5.5 | 2.2, 3.3.1-3.3.5, 3.3.7, 4.8, 4.9, 4.10 |
| Content-Security-Policy | lib/middleware/helmet.js | W3C Content Security Policy Level 3, https://www.w3.org/TR/CSP3/ | OWASP HTTP Security Response Headers Cheat Sheet | 2.2.1, 2.3.1, 3.1, 3.2, 3.3, 6.1.3, 6.1.9, 6.1.10, 6.3.1, 6.4.1, 6.4.2, 6.5.1, 6.5.2, 7.1 |
| HSTS, nosniff, CORP, COOP, COEP, Origin-Agent-Cluster, Referrer-Policy, framing | lib/middleware/helmet.js | RFC 6797 HTTP Strict Transport Security (HSTS), https://www.rfc-editor.org/rfc/rfc6797.html; OWASP HTTP Security Response Headers Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html | Fetch Standard 3.6 and 3.7; WHATWG HTML Standard, https://html.spec.whatwg.org/multipage/browsers.html (7.1.2-7.1.4); W3C Referrer Policy, https://www.w3.org/TR/referrer-policy/ | RFC 6797: 6.1, 6.1.1, 6.1.2, 7.1, 7.2, 8.1; Fetch 3.6, 3.7; HTML 7.1.2, 7.1.3, 7.1.3.1, 7.1.4; Referrer Policy 3, 4.1, 8.1 |

#### Conformance checklist

1. CSRF tokens are unique per session, secret, and generated from a CSPRNG (OWASP CSRF, Synchronizer Token Pattern).
2. Signed double-submit tokens are an HMAC over a session-bound value with a server-side secret, and the naive unsigned variant is not the default (OWASP CSRF, Signed Double-Submit Cookie).
3. Token comparison uses a constant-time equality check (OWASP CSRF, Signed Double-Submit Cookie).
4. GET, HEAD, and OPTIONS are exempt from token checks and are never routed to state-changing handlers (OWASP CSRF; RFC 9110 Section 9.2.1).
5. Tokens are read from a header or body field, never from the URL query, so they do not leak into logs (OWASP CSRF, Token-Based Mitigation).
6. When Fetch Metadata mode is on, an unsafe request with `Sec-Fetch-Site: cross-site` is rejected (Fetch Metadata Section 2.3; OWASP CSRF, Fetch Metadata Headers).
7. Responses whose handling depends on Sec-Fetch-* headers send a matching Vary (Fetch Metadata Section 5.1).
8. The Origin header is compared as an exact scheme, host, and port triple, and the literal `null` origin is treated as cross-origin (RFC 6454 Sections 5, 6.2, and 7).
9. Login endpoints are protected against login CSRF like every other unsafe endpoint (OWASP CSRF, Login CSRF).
10. Access-Control-Allow-Origin carries exactly one serialized origin or `*`, never a list (Fetch Sections 3.3.3 and 3.3.4).
11. With credentials enabled, the middleware reflects the allowed origin instead of `*` and sends `Access-Control-Allow-Credentials: true` (Fetch Section 3.3.5).
12. A preflight is recognized only as OPTIONS with Origin and Access-Control-Request-Method, and it is answered with an ok (2xx) status (Fetch Sections 3.3.2 and 4.8).
13. Access-Control-Allow-Methods and Access-Control-Allow-Headers wildcards are not relied on for credentialed requests (Fetch Section 3.3.3).
14. Access-Control-Max-Age is emitted as delta-seconds (Fetch Sections 3.3.4 and 4.9).
15. Non-safelisted response headers the client must read are listed in Access-Control-Expose-Headers (Fetch Section 3.3.3).
16. When the allowed origin varies per request, the response carries `Vary: Origin` (RFC 9110 Section 12.5.5; Fetch Section 3.3).
17. Strict-Transport-Security always includes max-age, and includeSubDomains is emitted valueless (RFC 6797 Sections 6.1, 6.1.1, and 6.1.2).
18. Strict-Transport-Security is not sent on responses over plain HTTP (RFC 6797 Section 7.2).
19. Only one Strict-Transport-Security field is emitted per response, since user agents process only the first (RFC 6797 Section 8.1).
20. `max-age=0` is accepted as the way to withdraw HSTS (RFC 6797 Section 6.1.1).
21. CSP directives are serialized semicolon-separated with directive names that round-trip through the CSP parser (CSP3 Sections 2.2.1 and 3.1).
22. Script and style nonces are fresh and unguessable on every response and are never reused across responses (CSP3 Sections 2.3.1 and 7.1).
23. frame-ancestors is delivered only via the HTTP header, never a meta element (CSP3 Sections 3.3 and 6.4.2).
24. A report-only mode emits Content-Security-Policy-Report-Only instead of the enforcing header (CSP3 Section 3.2).
25. X-Content-Type-Options is exactly `nosniff` (Fetch Section 3.6).
26. Cross-Origin-Resource-Policy is one of same-site, same-origin, or cross-origin (Fetch Section 3.7).
27. Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy values are structured-header tokens from the defined set (HTML Sections 7.1.3.1 and 7.1.4).
28. Referrer-Policy accepts a comma-separated fallback list and the last recognized token wins (Referrer Policy Sections 4.1 and 8.1).
29. X-XSS-Protection is sent as `0` and X-Powered-By is removed (OWASP HTTP Security Response Headers Cheat Sheet).

### Rate limiting

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Rate limiter, 429 responses, quota headers | lib/middleware/rateLimit.js | RFC 6585 Additional HTTP Status Codes, https://www.rfc-editor.org/rfc/rfc6585.html (429 and 431) | RFC 9110 Section 10.2.3 (Retry-After); draft-ietf-httpapi-ratelimit-headers-11 RateLimit header fields for HTTP, https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/ (active WG draft, not an RFC); RFC 7239 Section 8.1 | RFC 6585: 4, 5; RFC 9110: 5.6.7, 10.2.3 |

#### Conformance checklist

1. A client over its quota receives 429 Too Many Requests (RFC 6585 Section 4).
2. 429 responses carry Retry-After as either non-negative delta-seconds or an IMF-fixdate HTTP-date (RFC 6585 Section 4; RFC 9110 Sections 5.6.7 and 10.2.3).
3. 429 responses carry no freshness information that would let a cache store them (RFC 6585 Section 4).
4. Oversized request header sections yield 431 Request Header Fields Too Large (RFC 6585 Section 5).
5. The client key comes from the socket address unless a trusted proxy chain is configured, because RFC 6585 leaves identification to the server and Forwarded values are spoofable (RFC 6585 Section 4; RFC 7239 Section 8.1).
6. When standard quota headers are enabled, RateLimit-Policy and RateLimit are emitted as structured-field lists as defined by the current draft, and the draft revision is pinned in a test fixture (draft-ietf-httpapi-ratelimit-headers-11).

### Compression

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Response compression (gzip, deflate, br) | lib/middleware/compress.js | RFC 9110 content codings, https://www.rfc-editor.org/rfc/rfc9110.html | RFC 1950 ZLIB, https://www.rfc-editor.org/rfc/rfc1950.html; RFC 1951 DEFLATE, https://www.rfc-editor.org/rfc/rfc1951.html; RFC 1952 GZIP, https://www.rfc-editor.org/rfc/rfc1952.html; RFC 7932 Brotli, https://www.rfc-editor.org/rfc/rfc7932.html; Node.js zlib, https://nodejs.org/api/zlib.html (flush, maxOutputLength, Brotli constants, Memory usage tuning) | RFC 9110: 8.4, 8.4.1.2, 8.4.1.3, 8.6, 8.8.1, 8.8.3, 12.4.2, 12.5.3, 12.5.5; RFC 1950: 2.2, 2.3; RFC 1952: 2.2, 2.3.1, 2.3.1.2; RFC 7932: 9.1, 12, 13 |

#### Conformance checklist

1. The coding is chosen from Accept-Encoding by q-value, codings with `q=0` are never used, and `identity;q=0` or `*;q=0` without an acceptable coding yields identity only when it is still allowed (RFC 9110 Sections 12.4.2 and 12.5.3).
2. A request with no Accept-Encoding receives an identity response, which is always acceptable in that case (RFC 9110 Section 12.5.3).
3. Every compressed response carries Content-Encoding and `Vary: Accept-Encoding` (RFC 9110 Sections 8.4 and 12.5.5).
4. Content-Length from the uncompressed body is removed or recomputed after compression (RFC 9110 Section 8.6).
5. A response that already has a Content-Encoding is never encoded a second time (RFC 9110 Section 8.4).
6. A strong ETag is changed or weakened when the representation is content-coded, since the coded bytes differ (RFC 9110 Sections 8.8.1 and 8.8.3).
7. HEAD, 204, and 304 responses are never passed through the compressor (RFC 9110 Sections 9.3.2, 15.3.5, and 15.4.5).
8. The `deflate` content coding emits zlib-wrapped data, not a raw DEFLATE stream (RFC 9110 Section 8.4.1.2; RFC 1950 Section 2.2).
9. zlib output has CM=8, an FCHECK making CMF*256+FLG a multiple of 31, and an ADLER-32 trailer (RFC 1950 Section 2.2).
10. gzip output starts with ID1=31, ID2=139, CM=8, keeps reserved FLG bits zero, and ends with CRC32 and ISIZE (RFC 1952 Sections 2.3 and 2.3.1).
11. The gzip decoder used for request bodies accepts multi-member streams and rejects bad ID or CM bytes (RFC 1952 Sections 2.2 and 2.3.1.2).
12. Brotli decoding enforces a hard output limit relative to the input size to stop decompression bombs (RFC 7932 Section 12).

### JWT, JWS, and JWKS

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| JWT sign and verify, including WebRTC room join tokens | lib/auth/jwt.js, lib/webrtc/joinToken.js | RFC 7519 JSON Web Token (JWT), https://www.rfc-editor.org/rfc/rfc7519.html | RFC 8725 JSON Web Token Best Current Practices (BCP 225, updates RFC 7519), https://www.rfc-editor.org/rfc/rfc8725.html; RFC 7515 JWS, https://www.rfc-editor.org/rfc/rfc7515.html; RFC 7518 JWA, https://www.rfc-editor.org/rfc/rfc7518.html | RFC 7519: 2, 4, 4.1.1-4.1.7, 5.1, 6, 7.2, 7.3; RFC 7515: 2, 4.1.1, 4.1.4, 4.1.11, 5.2, 7.1, 10.7, Appendix C; RFC 7518: 3.2-3.6; RFC 8725: 3.1-3.12 |
| JWK and JWKS key resolution | lib/auth/jwt.js | RFC 7517 JSON Web Key (JWK), https://www.rfc-editor.org/rfc/rfc7517.html | RFC 7518 Sections 6.2.1 and 6.3.1; RFC 8725 Section 3.10 | 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 5, 8.5.1 |

#### Conformance checklist

1. verify() requires a caller-supplied algorithm allowlist and rejects any `alg` outside it (RFC 8725 Section 3.1).
2. Tokens with `alg: none` are rejected by default (RFC 7518 Section 3.6; RFC 8725 Section 3.1).
3. An RSA or EC public key can never be used as an HMAC secret, so an RS256 key cannot verify an HS256 token (RFC 8725 Section 3.1; RFC 7515 Section 10.7).
4. HS256, HS384, and HS512 keys shorter than the hash output are rejected (RFC 7518 Section 3.2).
5. A human-memorizable password is not accepted as an HMAC key without a derivation step (RFC 8725 Section 3.5).
6. RS* and PS* keys smaller than 2048 bits are rejected (RFC 7518 Sections 3.3 and 3.5).
7. ES256 signatures are the 64-octet R||S concatenation, and DER-encoded signatures are rejected (RFC 7518 Section 3.4).
8. A token is rejected at or after `exp`, with only a small configurable clock-skew leeway (RFC 7519 Section 4.1.4).
9. A token is rejected before `nbf` minus leeway (RFC 7519 Section 4.1.5).
10. When an audience is configured, a token whose `aud` does not contain it is rejected, including when `aud` is absent (RFC 7519 Section 4.1.3; RFC 8725 Section 3.9).
11. The issuer is validated and the verifying key must belong to that issuer (RFC 8725 Section 3.8).
12. Duplicate header parameter or claim names cause rejection (RFC 7515 Section 4; RFC 7519 Section 4).
13. A `crit` header listing an extension the library does not understand makes the token invalid (RFC 7515 Section 4.1.11).
14. Segments use unpadded base64url with no whitespace, and padded or non-canonical segments are rejected (RFC 7515 Section 2 and Appendix C).
15. Only the three-segment compact serialization is accepted (RFC 7515 Section 7.1; RFC 7519 Section 7.2).
16. StringOrURI claims such as `iss` and `aud` are compared case-sensitively with no normalization (RFC 7519 Section 7.3).
17. NumericDate claims are seconds since the epoch, and sign() never writes milliseconds (RFC 7519 Section 2).
18. Explicit `typ` values let access tokens, ID tokens, and join tokens be validated by mutually exclusive rules (RFC 8725 Sections 3.11 and 3.12).
19. `kid`, `jku`, and `x5u` are treated as untrusted input, and `jku` or `x5u` URLs are never fetched unless allowlisted (RFC 8725 Section 3.10).
20. A JWK Set without a `keys` array is rejected, and keys with an unknown `kty` are skipped rather than failing the whole set (RFC 7517 Section 5).
21. Keys whose `use` or `key_ops` does not permit signature verification are not used for verify (RFC 7517 Sections 4.2 and 4.3).
22. EC JWKs require `crv`, `x`, and `y`, and RSA JWKs require `n` and `e` (RFC 7518 Sections 6.2.1 and 6.3.1).
23. Header and claims are decoded strictly as UTF-8 (RFC 8725 Section 3.7).

### OAuth 2.0, PKCE, OpenID Connect, and bearer tokens

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| OAuth 2.0 authorization code client with PKCE, provider discovery, and OpenID Connect ID tokens | lib/auth/oauth.js | RFC 6749 The OAuth 2.0 Authorization Framework, https://www.rfc-editor.org/rfc/rfc6749.html (obsoletes RFC 5849) | RFC 7636 PKCE, https://www.rfc-editor.org/rfc/rfc7636.html; RFC 9700 Best Current Practice for OAuth 2.0 Security (BCP 240, updates RFC 6749, 6750, 6819), https://www.rfc-editor.org/rfc/rfc9700.html; OAuth 2.1 draft-ietf-oauth-v2-1-16 (active WG draft that will replace RFC 6749 and 6750), https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/; RFC 9207, https://www.rfc-editor.org/rfc/rfc9207.html; RFC 8414 OAuth 2.0 Authorization Server Metadata, https://www.rfc-editor.org/rfc/rfc8414.html; OpenID Connect Core 1.0 incorporating errata set 2, https://openid.net/specs/openid-connect-core-1_0.html | RFC 6749: 3.1.2, 4.1.1, 4.1.2, 4.1.2.1, 4.1.3, 5.1, 5.2, 6, 10.12, 10.15; RFC 7636: 4.1-4.6, 7.2; RFC 9700: 2.1, 2.1.1, 2.1.2, 2.2.2, 2.4, 4.4, 4.7, 4.8, 4.11; RFC 8414: 2, 3, 3.2, 3.3, 6.1, 6.2; OIDC Core: 2, 3.1.2.1, 3.1.3.6, 3.1.3.7, 5.3 |
| Bearer token extraction and challenges | lib/auth/jwt.js, lib/auth/authorize.js | RFC 6750 The OAuth 2.0 Authorization Framework: Bearer Token Usage, https://www.rfc-editor.org/rfc/rfc6750.html | RFC 9110 Sections 11.6.1 and 15.5.2; RFC 9700 Section 2.3 | 2.1, 2.2, 2.3, 3, 3.1, 5.3 |

#### Conformance checklist

1. Every authorization request carries a fresh, one-time `state` bound to the user agent, and the callback rejects a missing or mismatched `state` (RFC 6749 Sections 4.1.1 and 10.12; RFC 9700 Section 4.7).
2. PKCE is always sent, and S256 is used whenever available; the client never falls back to `plain` after S256 (RFC 7636 Sections 4.2 and 7.2; RFC 9700 Section 2.1.1).
3. The code_verifier is 43 to 128 unreserved characters generated from at least 32 random octets (RFC 7636 Section 4.1).
4. The code_challenge equals BASE64URL(SHA256(ASCII(code_verifier))) with no padding (RFC 7636 Section 4.2).
5. The token request sends `code_verifier` and repeats the exact `redirect_uri` used in the authorization request (RFC 6749 Section 4.1.3; RFC 7636 Section 4.5).
6. An authorization code is redeemed at most once, and a replayed callback is rejected (RFC 6749 Section 4.1.2).
7. When the provider supports RFC 9207, the `iss` callback parameter is compared to the expected issuer by simple string comparison and a mismatch is rejected (RFC 9207 Section 2.4; RFC 9700 Section 4.4).
8. Authorization error callbacks surface the standard `error` codes without trusting `error_description` as HTML (RFC 6749 Section 4.1.2.1).
9. Token endpoint errors map `invalid_grant`, `invalid_client`, and the other defined codes to typed errors (RFC 6749 Section 5.2).
10. Any token-bearing response the framework itself produces carries `Cache-Control: no-store` (RFC 6749 Section 5.1).
11. The implicit and resource owner password credentials grants are not offered (RFC 9700 Sections 2.1.2 and 2.4; OAuth 2.1 draft-16).
12. Refresh tokens issued to public clients are rotated on use or sender-constrained (RFC 9700 Section 2.2.2).
13. Discovery reads `/.well-known/oauth-authorization-server` with the issuer path inserted after the host, and rejects metadata whose `issuer` is not identical to the configured issuer (RFC 8414 Sections 3 and 3.3).
14. Post-login return URLs are checked against an allowlist so the callback cannot become an open redirector (RFC 9700 Section 4.11; RFC 6749 Section 10.15).
15. OpenID Connect requests include the `openid` scope and a `nonce`, and the ID token must echo the same nonce (OIDC Core Sections 3.1.2.1 and 3.1.3.7).
16. ID token validation checks exact `iss`, that `aud` contains the client_id, `azp` when multiple audiences are present, and `exp` (OIDC Core Sections 2 and 3.1.3.7).
17. When an access token accompanies an ID token, `at_hash` is verified as the left half of the token hash (OIDC Core Section 3.1.3.6).
18. Bearer tokens are read from `Authorization: Bearer <b64token>`, and the scheme match is case-insensitive while the token syntax is validated (RFC 6750 Section 2.1; RFC 9110 Section 11.1).
19. Tokens in the URL query are rejected by default (RFC 6750 Section 2.3; OAuth 2.1 draft-16).
20. A missing or invalid token yields 401 with `WWW-Authenticate: Bearer` carrying `error="invalid_token"` when a token was presented, insufficient scope yields 403 `insufficient_scope`, and malformed requests yield 400 `invalid_request` (RFC 6750 Sections 3 and 3.1).
21. The `realm` attribute appears at most once in a Bearer challenge (RFC 6750 Section 3).

### Two-factor authentication and WebAuthn

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| TOTP generation and verification | lib/auth/twoFactor.js | RFC 6238 TOTP: Time-Based One-Time Password Algorithm, https://www.rfc-editor.org/rfc/rfc6238.html | RFC 4226 HOTP, https://www.rfc-editor.org/rfc/rfc4226.html; RFC 4648 Base16, Base32, and Base64 Data Encodings, https://www.rfc-editor.org/rfc/rfc4648.html (obsoletes RFC 3548); NIST SP 800-63B-4, https://pages.nist.gov/800-63-4/sp800-63b.html; Node.js crypto, https://nodejs.org/api/crypto.html (timingSafeEqual, randomBytes, createHmac, createPublicKey with format jwk, verify with dsaEncoding) | RFC 6238: 1.2, 4.1, 4.2, 5.1, 5.2, Appendix B; RFC 4226: 4, 5.3, 7.3, 7.4, Appendix D; RFC 4648: 3.2, 3.3, 3.5, 6 |
| Enrollment, recovery codes, trusted devices | lib/auth/enrollment.js, lib/auth/trustedDevice.js | NIST SP 800-63B-4 Digital Identity Guidelines: Authentication and Authenticator Management, https://pages.nist.gov/800-63-4/sp800-63b.html | OWASP Multifactor Authentication Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html | 2.1.3, 2.2.3, 2.3.3, 3.1.2.2, 3.1.4.2, 3.2.2, 4.1, 4.2, 5.1, 5.2; OWASP: Resetting MFA, Changing MFA Factors |
| WebAuthn registration and assertion | lib/auth/webauthn.js | W3C Web Authentication: An API for accessing Public Key Credentials Level 3 (W3C Recommendation), https://www.w3.org/TR/webauthn-3/ | RFC 8949 CBOR (STD 94, obsoletes RFC 7049), https://www.rfc-editor.org/rfc/rfc8949.html; RFC 9052 COSE Structures and Process (STD 96, obsoletes RFC 8152), https://www.rfc-editor.org/rfc/rfc9052.html; RFC 9053 COSE Initial Algorithms (obsoletes RFC 8152), https://www.rfc-editor.org/rfc/rfc9053.html; NIST SP 800-63B-4 Section 3.2.5 | WebAuthn: 5.8.1, 5.8.1.2, 6.1, 6.1.1, 6.1.3, 6.5, 7.1, 7.2, 8.2, 8.7, 13.4.3; RFC 8949: 3, 3.1-3.4, 4.2.1, 5.3, 5.6; RFC 9052: 7, 7.1; RFC 9053: 2.1, 2.2, 7.1.1, 7.2 |

#### Conformance checklist

1. The TOTP counter is floor((now - T0) / X) with defaults X = 30 and T0 = 0 (RFC 6238 Sections 4.1 and 4.2).
2. The counter is computed as a 64-bit value so codes remain correct after 2038 (RFC 6238 Section 4.2).
3. SHA-1, SHA-256, and SHA-512 variants reproduce every test vector in RFC 6238 Appendix B (RFC 6238 Section 1.2 and Appendix B).
4. Dynamic truncation reproduces the HOTP test values and produces at least 6 digits (RFC 4226 Sections 4 and 5.3, Appendix D).
5. Generated secrets are at least 128 bits and default to 160 bits (RFC 4226 Section 4, requirement R6).
6. Verification accepts at most one time step of drift in each direction by default (RFC 6238 Section 5.2).
7. A code that already verified successfully is rejected on reuse within its window (RFC 6238 Section 5.2; NIST SP 800-63B-4 Section 3.1.4.2).
8. Consecutive failed OTP attempts are throttled and the factor is disabled at no more than 100 consecutive failures (RFC 4226 Section 7.3; NIST SP 800-63B-4 Section 3.2.2).
9. Base32 secrets use the RFC 4648 Section 6 alphabet, decoding rejects characters outside it, and padding handling is explicit (RFC 4648 Sections 3.2, 3.3, and 6).
10. OTP and recovery code comparison uses crypto.timingSafeEqual on equal-length buffers (Node.js crypto, crypto.timingSafeEqual).
11. Stored TOTP secrets are protected at rest rather than kept in plain text (RFC 6238 Section 5.1).
12. Recovery codes are single-use look-up secrets of at least six decimal digits or equivalent and are stored hashed (NIST SP 800-63B-4 Section 3.1.2.2).
13. Changing or removing a second factor requires reauthentication with an existing factor and triggers an out-of-band notice (OWASP MFA, Changing MFA Factors; NIST SP 800-63B-4 Section 4.1).
14. Trusted-device tokens expire within the configured reauthentication bound, 30 days at AAL1 and 24 hours at AAL2 (NIST SP 800-63B-4 Sections 2.1.3 and 2.2.3).
15. Registration rejects clientDataJSON whose `type` is not `webauthn.create`, whose `challenge` differs from the issued challenge, or whose `origin` is not an allowed origin (WebAuthn Level 3 Sections 5.8.1 and 7.1).
16. Assertion verification rejects clientDataJSON whose `type` is not `webauthn.get` (WebAuthn Level 3 Section 7.2).
17. rpIdHash in authenticator data equals SHA-256 of the configured RP ID (WebAuthn Level 3 Sections 6.1, 7.1, and 7.2).
18. The UP flag must be set, and UV must be set when user verification is required (WebAuthn Level 3 Sections 6.1, 7.1, and 7.2).
19. A BS flag without BE is rejected as inconsistent authenticator data (WebAuthn Level 3 Sections 6.1 and 6.1.3).
20. The credential public key algorithm must be one of the requested pubKeyCredParams, supporting at least -7 (ES256), -8 (EdDSA), and -257 (RS256) (WebAuthn Level 3 Section 7.1; RFC 9053 Sections 2.1 and 2.2).
21. Credential IDs longer than 1023 bytes or already registered to another user are rejected (WebAuthn Level 3 Section 7.1).
22. `none` and `packed` attestation statement formats are verified as specified (WebAuthn Level 3 Sections 8.2 and 8.7).
23. The assertion signature is verified over authenticatorData concatenated with SHA-256(clientDataJSON), and ES256 assertion signatures are ASN.1 DER per the WebAuthn signature-format rules rather than raw COSE r||s (WebAuthn Level 3 Sections 6.5 and 7.2; RFC 9053 Section 2.1).
24. A nonzero signCount that does not exceed the stored value is flagged as a possible cloned authenticator (WebAuthn Level 3 Sections 6.1.1 and 7.2).
25. Challenges are at least 16 random bytes, single-use, and expire (WebAuthn Level 3 Section 13.4.3).
26. COSE EC2 keys are parsed with kty 2, crv -1 (P-256 = 1), x -2, and y -3, and OKP keys with Ed25519 = 6 (RFC 9052 Section 7.1; RFC 9053 Sections 7.1.1 and 7.2).
27. The CBOR decoder rejects ill-formed items, trailing bytes, and duplicate map keys, and handles indefinite-length items explicitly (RFC 8949 Sections 3.2, 5.3, and 5.6).

### WebSocket and server-sent events

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| WebSocket opening handshake | lib/ws/handshake.js | RFC 6455 The WebSocket Protocol, https://www.rfc-editor.org/rfc/rfc6455.html | RFC 9110 Sections 7.8 and 15.2.2; RFC 8441 Bootstrapping WebSockets with HTTP/2 (updates RFC 6455), https://www.rfc-editor.org/rfc/rfc8441.html | RFC 6455: 1.3, 4.1, 4.2.1, 4.2.2, 4.4, 10.2; RFC 8441: 3, 4, 5 |
| WebSocket framing, control frames, close handshake, permessage-deflate, rooms | lib/ws/connection.js, lib/ws/room.js, lib/ws/index.js | RFC 6455, https://www.rfc-editor.org/rfc/rfc6455.html | RFC 7692 Compression Extensions for WebSocket, https://www.rfc-editor.org/rfc/rfc7692.html; RFC 1951 | RFC 6455: 5.1, 5.2, 5.3, 5.4, 5.5, 5.5.1, 5.5.2, 5.5.3, 7.1, 7.4, 7.4.1, 8.1; RFC 7692: 5, 6, 6.1, 7, 7.1.1.1, 7.1.1.2, 7.1.2.1, 7.1.2.2, 7.2.1, 7.2.2, 8 |
| Server-sent events streams | lib/sse/index.js, lib/sse/stream.js | WHATWG HTML Standard Section 9.2 Server-sent events, https://html.spec.whatwg.org/multipage/server-sent-events.html | RFC 9110 Section 15.3.5 (204) | 9.2.3, 9.2.5, 9.2.6, 9.2.7 |

#### Conformance checklist

1. The handshake requires GET over HTTP/1.1 or later, Host, `Upgrade: websocket` matched case-insensitively, and a Connection field containing the `Upgrade` token (RFC 6455 Section 4.2.1).
2. A Sec-WebSocket-Key that does not base64-decode to exactly 16 bytes yields 400 (RFC 6455 Section 4.2.1).
3. A Sec-WebSocket-Version other than 13 yields 426 Upgrade Required with `Sec-WebSocket-Version: 13` (RFC 6455 Sections 4.2.1 and 4.4).
4. Sec-WebSocket-Accept for key `dGhlIHNhbXBsZSBub25jZQ==` is `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=` (RFC 6455 Sections 1.3 and 4.2.2).
5. The selected Sec-WebSocket-Protocol is always one the client offered, and none is sent when no offer matches (RFC 6455 Section 4.2.2).
6. When an origin allowlist is configured, a disallowed Origin is refused with an HTTP error such as 403 before upgrading (RFC 6455 Section 10.2).
7. An unmasked frame from the client makes the server close the connection with 1002 (RFC 6455 Sections 5.1 and 5.3).
8. Frames sent by the server are never masked (RFC 6455 Section 5.1).
9. Any nonzero RSV bit not claimed by a negotiated extension fails the connection (RFC 6455 Section 5.2).
10. A reserved or unknown opcode fails the connection (RFC 6455 Section 5.2).
11. Payload lengths use the minimal encoding, and a 64-bit length with the most significant bit set is rejected (RFC 6455 Section 5.2).
12. Control frames with payloads over 125 bytes or without FIN fail the connection (RFC 6455 Section 5.5).
13. A continuation frame with no message in progress, or a new data frame while a fragmented message is open, fails the connection, while control frames interleaved within fragments are processed (RFC 6455 Section 5.4).
14. A Ping is answered with a Pong carrying identical application data, unless a Close was already received (RFC 6455 Sections 5.5.2 and 5.5.3).
15. A received Close is echoed once, and the codes 1005, 1006, and 1015 are never placed in a Close frame (RFC 6455 Sections 5.5.1 and 7.4.1).
16. A Close frame with a 1-byte payload, an invalid close code, or a non-UTF-8 reason fails the connection with 1002 or 1007 (RFC 6455 Sections 5.5.1 and 7.4).
17. A text message that is not valid UTF-8, including when split across fragments, fails with 1007 (RFC 6455 Section 8.1).
18. A message over the configured size limit closes with 1009 (RFC 6455 Section 7.4.1).
19. RSV1 marks only the first frame of a compressed message and is never set on control frames (RFC 7692 Sections 6 and 6.1).
20. Compression strips the trailing `00 00 ff ff`, and decompression appends it before inflating (RFC 7692 Sections 7.2.1 and 7.2.2).
21. An offer with an unknown parameter or invalid value is declined, the server never answers with a larger server_max_window_bits than offered, and client_max_window_bits is only returned when offered (RFC 7692 Sections 7, 7.1.2.1, and 7.1.2.2).
22. server_no_context_takeover and client_no_context_takeover reset the compression context per message when negotiated (RFC 7692 Sections 7.1.1.1 and 7.1.1.2).
23. Inflated message size is bounded to defeat decompression bombs (RFC 7692 Section 8).
24. When WebSocket over HTTP/2 is enabled, the server advertises SETTINGS_ENABLE_CONNECT_PROTOCOL = 1, accepts extended CONNECT with `:protocol: websocket`, `:scheme`, and `:path`, answers 200 instead of 101, and skips Sec-WebSocket-Key and Accept processing (RFC 8441 Sections 3, 4, and 5).
25. SSE responses use `Content-Type: text/event-stream` and UTF-8 (HTML Section 9.2.5).
26. Multi-line data is emitted as one `data:` line per line so the client rejoins it with LF (HTML Section 9.2.6).
27. CR and LF are stripped or rejected in `event` and `id` values, since any of CR, LF, or CRLF ends a line (HTML Section 9.2.5).
28. An `id` value containing U+0000 is never emitted because clients ignore it (HTML Section 9.2.6).
29. `retry` is emitted only as ASCII digits (HTML Section 9.2.6).
30. Every event ends with a blank line, which is what dispatches it (HTML Section 9.2.6).
31. Keep-alive comments beginning with `:` are sent about every 15 seconds (HTML Section 9.2.7).
32. The Last-Event-ID request header is exposed to handlers for resumption after reconnect (HTML Section 9.2.3).
33. A 204 No Content response is available to tell the client to stop reconnecting (HTML Section 9.2.3).

### gRPC and Protocol Buffers

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| gRPC server, client, framing, metadata, deadlines, status, compression, keepalive, balancing | lib/grpc/server.js, lib/grpc/client.js, lib/grpc/call.js, lib/grpc/frame.js, lib/grpc/metadata.js, lib/grpc/status.js, lib/grpc/credentials.js, lib/grpc/balancer.js | gRPC over HTTP2, https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md | Status codes and their use in gRPC, https://github.com/grpc/grpc/blob/master/doc/statuscodes.md; gRPC Compression, https://github.com/grpc/grpc/blob/master/doc/compression.md; Keepalive User Guide, https://github.com/grpc/grpc/blob/master/doc/keepalive.md; Load Balancing in gRPC, https://github.com/grpc/grpc/blob/master/doc/load-balancing.md; RFC 9113; RFC 4648 Section 4 | PROTOCOL-HTTP2: Requests, Responses, Appendix A, HTTP2 Transport Mapping (Data Frames, Errors, Security, Connection Management: GOAWAY Frame, PING Frame); statuscodes: library-generated codes table; load-balancing: pick_first, round_robin |
| Protobuf binary codec and .proto parser | lib/grpc/codec.js, lib/grpc/proto.js | Protocol Buffers Encoding, https://protobuf.dev/programming-guides/encoding/ | Protocol Buffers Language Specification (Proto3), https://protobuf.dev/reference/protobuf/proto3-spec/; Language Guide (proto 3), https://protobuf.dev/programming-guides/proto3/ | Encoding: Base 128 Varints, Message Structure, Signed Integers, Non-varint Numbers, Length-Delimited Records, Repeated Elements, Oneofs, Last One Wins, Maps, Field Order, Encoded Proto Size Limitations; Spec: Syntax, Import Statement, Fields, Oneof, Map Field, Reserved, Enum Definition, Service Definition, String Literals |
| gRPC health checking and server reflection | lib/grpc/health.js, lib/grpc/watch.js, lib/grpc/reflection.js | GRPC Health Checking Protocol, https://github.com/grpc/grpc/blob/master/doc/health-checking.md | health.proto (grpc.health.v1), https://github.com/grpc/grpc-proto/blob/master/grpc/health/v1/health.proto; GRPC Server Reflection Protocol, https://github.com/grpc/grpc/blob/master/doc/server-reflection.md; reflection.proto (grpc.reflection.v1), https://github.com/grpc/grpc-proto/blob/master/grpc/reflection/v1/reflection.proto | health.proto Check, Watch, List; reflection.proto ServerReflectionRequest fields 1, 3-7, ServerReflectionResponse fields 1, 2, 4-7 |

#### Conformance checklist

1. A request whose content-type does not begin with `application/grpc` is answered with HTTP 415 so non-gRPC clients never read a 200 as success (PROTOCOL-HTTP2, Requests).
2. Only POST is accepted, the path is `/Service/Method`, and an unregistered method yields UNIMPLEMENTED (PROTOCOL-HTTP2, Requests; statuscodes, library-generated codes).
3. The client always sends `te: trailers` (PROTOCOL-HTTP2, Requests).
4. grpc-timeout accepts at most 8 ASCII digits followed by one of H, M, S, m, u, n, and an expired deadline yields DEADLINE_EXCEEDED on both sides (PROTOCOL-HTTP2, Requests; statuscodes).
5. Messages are framed as a 1-byte compressed flag and a 4-byte big-endian length, and a message split across DATA frames or several messages in one frame are both handled (PROTOCOL-HTTP2, Requests and Data Frames).
6. A message over the configured maximum size yields RESOURCE_EXHAUSTED (statuscodes, library-generated codes).
7. A compressed flag of 1 with no non-identity grpc-encoding yields INTERNAL (gRPC Compression).
8. A message compressed with an unsupported algorithm yields UNIMPLEMENTED, and the response lists supported codings in grpc-accept-encoding (gRPC Compression).
9. Responses send `:status 200` and content-type in headers, then trailers with grpc-status as a decimal string without leading zeros (PROTOCOL-HTTP2, Responses).
10. grpc-message is percent-encoded UTF-8 on send and percent-decoded on receive (PROTOCOL-HTTP2, Responses; RFC 3986 Section 2.1).
11. Immediate errors are sent as a Trailers-Only response, a single HEADERS frame with END_STREAM carrying grpc-status (PROTOCOL-HTTP2, Responses).
12. Metadata keys ending in `-bin` are base64 encoded on send, and both padded and unpadded values are accepted on receive (PROTOCOL-HTTP2, Requests; RFC 4648 Section 4).
13. Application metadata cannot use the reserved `grpc-` prefix (PROTOCOL-HTTP2, Requests).
14. A response ending without grpc-status yields INTERNAL on the client, and a non-200 HTTP status is synthesized into a gRPC status (statuscodes; PROTOCOL-HTTP2, Responses).
15. RST_STREAM codes map to gRPC status as REFUSED_STREAM to UNAVAILABLE, CANCEL to CANCELLED, ENHANCE_YOUR_CALM to RESOURCE_EXHAUSTED, INADEQUATE_SECURITY to PERMISSION_DENIED, and all others to INTERNAL (PROTOCOL-HTTP2, Errors).
16. Calls on streams above the GOAWAY last-stream-id fail with UNAVAILABLE and are safe to retry (PROTOCOL-HTTP2, GOAWAY Frame).
17. The library never generates INVALID_ARGUMENT, NOT_FOUND, ALREADY_EXISTS, FAILED_PRECONDITION, ABORTED, OUT_OF_RANGE, or DATA_LOSS on its own (statuscodes).
18. A client that pings more often than the server permits receives GOAWAY with ENHANCE_YOUR_CALM and `too_many_pings` debug data (Keepalive User Guide).
19. pick_first is the default policy, round_robin rotates only across READY subchannels, and a subchannel stays in TRANSIENT_FAILURE until it reports READY (Load Balancing in gRPC).
20. Varints are little-endian 7-bit groups with an MSB continuation bit and are rejected beyond 10 bytes (Encoding, Base 128 Varints).
21. Each record tag is `(field_number << 3) | wire_type`, and wire types 3 and 4 (groups) are skipped or rejected explicitly (Encoding, Message Structure).
22. A negative int32 encodes as a 10-byte varint, and sint32 and sint64 use ZigZag (Encoding, Signed Integers).
23. fixed32, sfixed32, and float are 4 bytes little-endian, and fixed64, sfixed64, and double are 8 bytes little-endian (Encoding, Non-varint Numbers).
24. The decoder accepts both packed and unpacked encodings for repeated scalars, and the encoder packs by default in proto3 (Encoding, Repeated Elements; Language Guide, packed default).
25. For a repeated non-repeated scalar field the last value wins, and repeated embedded messages merge (Encoding, Last One Wins).
26. When several members of one oneof appear on the wire, only the last one is kept (Language Guide, Oneof).
27. Maps encode as repeated key and value entry messages and decode regardless of entry order (Encoding, Maps; Language Guide, Maps).
28. Unknown fields are preserved and reserialized (Language Guide, Unknown Fields).
29. Field numbers outside 1 to 536,870,911, or inside 19,000 to 19,999, are rejected by the .proto parser (Language Guide, Field Numbers).
30. Decoded `string` fields must be valid UTF-8 (Language Guide, Strings).
31. The .proto parser requires the first enum value to be zero in proto3 files (Language Guide, Enumerations).
32. The parser accepts `syntax = "proto3";`, `import weak` and `import public`, `reserved` ranges and names, and `rpc` with `stream` on either side (Proto3 spec, Syntax, Import Statement, Reserved, Service Definition).
33. Map key types are limited to the integral types, bool, and string (Proto3 spec, Map Field).
34. String literals support hex, octal, `\u`, and `\U` escapes (Proto3 spec, String Literals).
35. Health Check with an empty service returns overall server status, and an unknown service fails with NOT_FOUND (health.proto, Check; health-checking.md).
36. Health Watch sends the current status immediately, sends again on every change, and for an unknown service sends SERVICE_UNKNOWN without ending the call (health.proto, Watch).
37. Health List returns all service statuses and may fail with RESOURCE_EXHAUSTED when too many exist (health.proto, List).
38. Reflection is served as `grpc.reflection.v1.ServerReflection/ServerReflectionInfo`, a bidirectional stream (reflection.proto).
39. list_services returns every registered service, and file_containing_symbol returns the defining file plus transitive dependencies not already sent on the stream (reflection.proto; server-reflection.md).
40. An unknown symbol or file yields error_response with error_code NOT_FOUND (5) instead of failing the stream (reflection.proto; server-reflection.md).

### Observability

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Prometheus metrics endpoint | lib/observe/metrics.js | Prometheus Exposition formats, https://prometheus.io/docs/instrumenting/exposition_formats/ | OpenMetrics 1.0, https://prometheus.io/docs/specs/om/open_metrics_spec/; Metric and label naming, https://prometheus.io/docs/practices/naming/ | Text format: Basic info, Line format, Comments help text and type information, Grouping and sorting, Histograms and summaries; HTTP Content-Type requirements |
| W3C trace context propagation | lib/observe/tracing.js, lib/middleware/requestId.js | W3C Trace Context (W3C Recommendation), https://www.w3.org/TR/trace-context/ | W3C Propagation format for distributed context: Baggage (Candidate Recommendation Snapshot), https://www.w3.org/TR/baggage/; RFC 9562 Universally Unique IDentifiers (UUIDs) (obsoletes RFC 4122), https://www.rfc-editor.org/rfc/rfc9562.html, for request IDs | Trace Context: 3.2.1, 3.2.2.1, 3.2.2.3, 3.2.2.4, 3.2.2.5.1, 3.2.4, 3.3.1, 3.3.1.3, 3.3.1.5, 3.4, 3.5, 4; Baggage: 3.2, 3.3, 3.3.2 |
| Structured logging and request logs | lib/observe/logger.js, lib/middleware/logger.js, lib/debug.js | OpenTelemetry Logs Data Model (Stable), https://opentelemetry.io/docs/specs/otel/logs/data-model/ | RFC 5424 The Syslog Protocol (obsoletes RFC 3164), https://www.rfc-editor.org/rfc/rfc5424.html | OTel: Log and Event Record Definition, Severity Fields; RFC 5424: 6.2.1, 6.2.3, 6.3, 8 |
| Health, liveness, and readiness endpoints | lib/observe/health.js | Kubernetes Liveness, Readiness, and Startup Probes, https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/ | Health Check Response Format for HTTP APIs, draft-inadarei-api-health-check-06 (expired individual draft, informative only), https://datatracker.ietf.org/doc/draft-inadarei-api-health-check/; Kubernetes Pod Lifecycle, https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ | Probe definitions, Check mechanisms (HTTP 200-399 success); Termination of Pods |

#### Conformance checklist

1. The text exposition is served as `text/plain; version=0.0.4` with LF line endings, and the final line ends with LF (Exposition formats, Basic info and Line format).
2. HELP text escapes backslash and line feed, and label values escape backslash, double quote, and line feed (Exposition formats, Comments help text and type information; Line format).
3. Each metric family has at most one TYPE line, placed before its first sample, and all lines of a family are emitted as one group (Exposition formats, Comments help text and type information; Grouping and sorting).
4. Histogram buckets are cumulative, in increasing `le` order, include `le="+Inf"` equal to `_count`, and are accompanied by `_sum` and `_count` (Exposition formats, Histograms and summaries).
5. Summaries emit `quantile` labels in increasing order plus `_sum` and `_count` (Exposition formats, Histograms and summaries).
6. Values render NaN, +Inf, and -Inf in the accepted spellings (Exposition formats, Line format).
7. Counters end in `_total`, durations are in seconds, and sizes are in bytes (Metric and label naming).
8. Label names beginning with `__` are rejected for user metrics (OpenMetrics 1.0, label names).
9. A scrape with an Accept header preferring OpenMetrics receives `application/openmetrics-text; version=1.0.0; charset=utf-8` ending in `# EOF` (Exposition formats, HTTP Content-Type requirements; OpenMetrics 1.0).
10. Unbounded values such as user IDs or raw paths are never used as label values by the built-in HTTP metrics (Metric and label naming, cardinality).
11. traceparent is parsed as version, 32-hex trace-id, 16-hex parent-id, and 2-hex flags, all lowercase (Trace Context Section 3.2.2).
12. Version `ff`, an all-zero trace-id, or an all-zero parent-id makes the header invalid (Trace Context Sections 3.2.2.1, 3.2.2.3, and 3.2.2.4).
13. A higher version is parsed for its first four fields and extra fields are ignored (Trace Context Section 3.2.4).
14. An invalid traceparent starts a new trace and discards tracestate (Trace Context Section 4).
15. Header names are accepted in any case and emitted lowercase (Trace Context Sections 3.2.1 and 3.3.1).
16. Outgoing requests carry a new parent-id and the sampled bit reflects the local decision (Trace Context Sections 3.2.2.5.1 and 3.4).
17. tracestate keeps at most 32 list-members, multiple tracestate headers are combined, a modified entry moves to the left, and at least 512 characters are propagated (Trace Context Sections 3.3.1.3, 3.3.1.5, and 3.5).
18. baggage keeps at most 64 list-members and 8192 bytes, percent-encodes values outside baggage-octet, and drops malformed entries (Baggage Sections 3.2, 3.3, and 3.3.2).
19. Log levels map onto RFC 5424 severities 0 through 7 and onto OpenTelemetry SeverityNumber ranges TRACE 1-4 through FATAL 21-24 (RFC 5424 Section 6.2.1; OTel Logs Data Model, Severity Fields).
20. Log timestamps are RFC 3339 UTC with uppercase `T` and `Z` (RFC 5424 Section 6.2.3).
21. Log records inside a request carry TraceId, SpanId, and TraceFlags from the active trace context (OTel Logs Data Model, Log and Event Record Definition).
22. CR, LF, and other control characters in user-supplied values are escaped so one request cannot forge extra log lines (RFC 5424 Section 8).
23. Liveness reports only that the process can make progress and never depends on downstream services, while readiness reflects dependencies (Kubernetes probes, probe definitions).
24. Healthy responses use a status from 200 to 399 and unhealthy readiness uses 503 (Kubernetes probes, Check mechanisms).
25. Readiness starts failing as soon as shutdown begins, before listeners close, because endpoint removal runs concurrently with SIGTERM (Kubernetes Pod Lifecycle, Termination of Pods).
26. The optional detailed body uses `application/health+json` with status pass, warn, or fail, where pass and warn map to 2xx and fail to 5xx (draft-inadarei-api-health-check-06).
27. Generated request IDs are UUIDv4 or UUIDv7 with correct version and variant bits, emitted in lowercase hex (RFC 9562 Sections 4, 4.1, 4.2, 5.4, and 5.7).
28. An incoming request ID is length and charset validated before being echoed or logged, and no code path treats it as an access capability (RFC 9562 Section 8).

### Runtime, lifecycle, and configuration

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Graceful shutdown and request timeouts | lib/lifecycle.js, lib/middleware/timeout.js | Node.js process signal events, https://nodejs.org/api/process.html | Node.js http server.close, closeIdleConnections, closeAllConnections, https://nodejs.org/api/http.html; RFC 9110 Sections 15.5.9, 15.6.4, 15.6.5; RFC 9112 Section 9.6; RFC 9113 Section 6.8; RFC 6455 Section 7.4.1; Kubernetes Pod Lifecycle | Signal events, Event 'exit', Event 'beforeExit', Event 'uncaughtException', Event 'unhandledRejection' |
| Cluster supervisor | lib/cluster.js, lib/webrtc/cluster.js | Node.js cluster, https://nodejs.org/api/cluster.html | Node.js process | How it works (round-robin distribution), cluster.schedulingPolicy, cluster.fork, worker.disconnect, worker.kill, Event 'exit', worker.exitedAfterDisconnect |
| Environment and .env loader | lib/env/index.js | Node.js Environment Variables (dotenv syntax), https://nodejs.org/api/environment_variables.html | Node.js process.loadEnvFile and process.env; The Twelve-Factor App III. Config, https://12factor.net/config | DotEnv; process.loadEnvFile; process.env |

#### Conformance checklist

1. Installing SIGTERM and SIGINT listeners replaces the default exit, so the lifecycle module must exit explicitly after draining (Node.js process, Signal events).
2. Shutdown calls server.close to stop accepting, then closeIdleConnections, then closeAllConnections after the grace timeout (Node.js http, server.close, server.closeIdleConnections, server.closeAllConnections).
3. While draining, HTTP/1.1 responses carry `Connection: close` (RFC 9112 Section 9.6).
4. While draining, HTTP/2 sessions receive GOAWAY and in-flight streams complete (RFC 9113 Section 6.8; Node.js http2, http2session.goaway).
5. While draining, WebSocket clients receive a Close frame with 1001 Going Away (RFC 6455 Section 7.4.1).
6. The default drain timeout is shorter than the Kubernetes default terminationGracePeriodSeconds of 30 seconds (Kubernetes Pod Lifecycle, Termination of Pods).
7. Work in the process 'exit' handler is synchronous only (Node.js process, Event 'exit').
8. A request that times out before the handler responds receives 503 or, for a slow client body, 408 with `Connection: close` (RFC 9110 Sections 15.5.9 and 15.6.4).
9. A proxied upstream timeout is reported as 504 (RFC 9110 Section 15.6.5).
10. The primary restarts a worker on 'exit' unless worker.exitedAfterDisconnect is true (Node.js cluster, Event 'exit' and worker.exitedAfterDisconnect).
11. Worker shutdown uses worker.disconnect and falls back to worker.kill after a timeout (Node.js cluster, worker.disconnect).
12. Round-robin scheduling is the default on every platform except Windows, and the supervisor documents that difference (Node.js cluster, cluster.schedulingPolicy).
13. The .env parser accepts `KEY=VALUE`, ignores an `export` prefix, and treats `#` as a comment only outside quotes (Node.js Environment Variables, DotEnv).
14. Single-quoted and double-quoted values are supported, quoted values may span lines, and `\n` is expanded as documented by Node (Node.js Environment Variables, DotEnv).
15. Variable names outside `^[a-zA-Z_]+[a-zA-Z0-9_]*$` are rejected (Node.js Environment Variables, DotEnv).
16. The loader produces the same key and value map as process.loadEnvFile for every fixture (Node.js process, process.loadEnvFile).
17. Variables already present in the real environment win over file values (The Twelve-Factor App, III. Config).
18. Lookups account for Windows treating environment variable names case-insensitively (Node.js process, process.env).
19. Compressed SSE and streaming responses call flush after each event so data is not held in the compressor (Node.js zlib, flush).
20. Decompression of request bodies sets maxOutputLength or an equivalent streaming cap (Node.js zlib, maxOutputLength).

### WebRTC signaling, STUN, TURN, and media servers

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Signaling, SDP handling, ICE candidates, rooms, bots | lib/webrtc/signaling.js, lib/webrtc/sdp.js, lib/webrtc/ice.js, lib/webrtc/peer.js, lib/webrtc/room.js, lib/webrtc/bot.js, lib/webrtc/index.js | RFC 9429 JavaScript Session Establishment Protocol (JSEP), https://www.rfc-editor.org/rfc/rfc9429.html (obsoletes RFC 8829) | RFC 8866 SDP (obsoletes RFC 4566), https://www.rfc-editor.org/rfc/rfc8866.html; RFC 8839 SDP Offer/Answer Procedures for ICE (obsoletes RFC 5245 and 6336), https://www.rfc-editor.org/rfc/rfc8839.html; RFC 8445 ICE (obsoletes RFC 5245), https://www.rfc-editor.org/rfc/rfc8445.html; RFC 8838 Trickle ICE, https://www.rfc-editor.org/rfc/rfc8838.html; W3C WebRTC: Real-Time Communication in Browsers (Recommendation), https://www.w3.org/TR/webrtc/ | RFC 9429: 3.2, 3.5.2, 4.1.8-4.1.12, 4.1.10.2, 5.2.1, 5.8, 5.10; RFC 8866: 5, 5.7, 5.13, 5.14, 7; RFC 8839: 5.1-5.6; RFC 8445: 2.5, 5.1.2.1, 5.3, 6.1.2.3, 7.1, 7.3.1.1, 8.1, 8.2; RFC 8838: 3, 9, 10, 13, 16; WebRTC: 4.2.1, 4.2.2, 4.6.1, 4.8.1, 10.7 |
| STUN server and message codec | lib/webrtc/stun.js, lib/webrtc/turn/codec.js | RFC 8489 Session Traversal Utilities for NAT (STUN), https://www.rfc-editor.org/rfc/rfc8489.html (obsoletes RFC 5389) | RFC 7064 STUN URI scheme, https://www.rfc-editor.org/rfc/rfc7064.html; Node.js dgram, https://nodejs.org/api/dgram.html | 5, 6.2.1, 6.3, 6.3.1, 7, 9.1, 9.2, 11, 14, 14.2, 14.5, 14.6, 14.7, 14.8, 14.9 |
| TURN relay server and ephemeral credentials | lib/webrtc/turn/server.js, lib/webrtc/turn/credentials.js | RFC 8656 Traversal Using Relays around NAT (TURN), https://www.rfc-editor.org/rfc/rfc8656.html (obsoletes RFC 5766 and RFC 6156) | RFC 7065 TURN URIs, https://www.rfc-editor.org/rfc/rfc7065.html; A REST API For Access To TURN Services, draft-uberti-behave-turn-rest-00 (expired individual draft, de facto convention), https://datatracker.ietf.org/doc/html/draft-uberti-behave-turn-rest-00 and https://datatracker.ietf.org/doc/draft-uberti-behave-turn-rest/; RFC 8489 Section 9.2 | RFC 8656: 3.2, 7.2, 8, 9, 11, 12, 12.5, 18, 21; RFC 7065: 3.1, 3.2; turn-rest: 2.1, 2.2, 4.2 |
| SFU and MCU adapters, cascading, recording, E2EE, media observability | lib/webrtc/sfu/index.js, lib/webrtc/sfu/mediasoup.js, lib/webrtc/sfu/livekit.js, lib/webrtc/sfu/memory.js, lib/webrtc/mcu/index.js, lib/webrtc/mcu/ffmpeg.js, lib/webrtc/cascade.js, lib/webrtc/recording.js, lib/webrtc/e2ee.js, lib/webrtc/observe.js | RFC 7667 RTP Topologies, https://www.rfc-editor.org/rfc/rfc7667.html (obsoletes RFC 5117) | RFC 9605 Secure Frame (SFrame), https://www.rfc-editor.org/rfc/rfc9605.html; mediasoup v3 API, https://mediasoup.org/documentation/v3/mediasoup/api/; LiveKit Room service API, https://docs.livekit.io/reference/server/server-apis/ | RFC 7667: 3.2.1, 3.4, 3.6, 3.6.2, 3.7, 3.9, 5, 6; RFC 9605: 4.3, 4.4.2, 4.5, 5, 9.3 |

#### Conformance checklist

1. Signaling accepts only the description types offer, pranswer, answer, and rollback (WebRTC Section 4.6.1).
2. Candidate messages carry candidate, sdpMid, sdpMLineIndex, and usernameFragment, and an empty or null candidate is relayed as end-of-candidates (WebRTC Section 4.8.1).
3. Trickled candidates are delivered to the remote peer exactly once and in the order sent (RFC 8838 Section 9).
4. Candidates that arrive before the matching description are queued, not dropped, since a candidate cannot be used before its description is applied (RFC 8838 Sections 9 and 10).
5. Glare is resolved by assigning polite and impolite roles, because JSEP leaves glare handling to the application (RFC 9429 Section 3.2; WebRTC Section 10.7).
6. A rollback returns the negotiation state to stable (RFC 9429 Section 4.1.10.2).
7. The SDP parser requires v=, o=, s=, and t= in order and rejects or ignores a description containing an unknown type letter (RFC 8866 Section 5).
8. SDP lines are emitted with CRLF and parsed tolerantly when terminated by LF alone (RFC 8866 Section 5).
9. Each media description has a c= line or the session has one (RFC 8866 Section 5.7).
10. a=candidate parses foundation (1 to 32 ice-chars), component-id, transport, priority (up to 10 digits), address, port, typ host, srflx, prflx, or relay, and optional raddr and rport (RFC 8839 Section 5.1).
11. ice-ufrag is accepted from 4 to 256 characters and emitted with at most 32, and ice-pwd is accepted from 22 to 256 characters (RFC 8839 Section 5.4).
12. Server-generated ICE credentials carry at least 24 random bits for the ufrag and 128 random bits for the password (RFC 8445 Section 5.3).
13. Candidate priority uses (2^24)*type preference + (2^8)*local preference + (256 - component ID) with type preferences 126, 110, 100, and 0 (RFC 8445 Section 5.1.2.1).
14. An ICE-lite endpoint offers only host candidates, answers connectivity checks, and never originates them (RFC 8445 Sections 2.5 and 8.2).
15. iceServers entries with turn or turns URLs always include username and credential (WebRTC Section 4.2.2).
16. STUN and TURN URLs parse per their schemes with default ports 3478 and 5349 for the TLS variants (RFC 7064 Sections 3.1 and 3.2; RFC 7065 Sections 3.1 and 3.2).
17. A packet whose top two bits are not zero or whose magic cookie is not 0x2112A442 is not treated as STUN (RFC 8489 Section 5).
18. The STUN length field excludes the 20-byte header and is a multiple of 4, and every attribute is padded to 4 bytes (RFC 8489 Sections 5 and 14).
19. A Binding success response echoes the transaction ID and carries XOR-MAPPED-ADDRESS of the request source (RFC 8489 Sections 6.3 and 14.2).
20. XOR-MAPPED-ADDRESS XORs the port with the top 16 bits of the magic cookie, IPv4 with the cookie, and IPv6 with the cookie concatenated with the transaction ID (RFC 8489 Section 14.2).
21. An unknown comprehension-required attribute (0x0000 to 0x7FFF) yields a 420 error listing it in UNKNOWN-ATTRIBUTES (RFC 8489 Sections 6.3.1 and 14.9).
22. FINGERPRINT is CRC-32 XOR 0x5354554e and must be the last attribute (RFC 8489 Section 14.7).
23. MESSAGE-INTEGRITY is HMAC-SHA1 and MESSAGE-INTEGRITY-SHA256 is HMAC-SHA256 over the message with the length adjusted to end at the attribute (RFC 8489 Sections 14.5 and 14.6).
24. The long-term credential mechanism challenges with 401 carrying REALM and NONCE and answers a stale nonce with 438 (RFC 8489 Sections 9.2 and 14.8).
25. Nonces carry the `obMatJos2` cookie prefix when security feature bits are advertised (RFC 8489 Section 9.2).
26. Transaction IDs are 96 bits from a CSPRNG (RFC 8489 Section 5).
27. Client retransmissions start at an RTO of at least 500 ms with Rc = 7 and Rm = 16 by default (RFC 8489 Section 6.2.1).
28. Requests without the magic cookie are handled under the RFC 3489 backward-compatibility rules (RFC 8489 Section 11).
29. Allocate without REQUESTED-TRANSPORT yields 400, and an unsupported transport yields 442 (RFC 8656 Section 7.2).
30. Allocate without valid long-term credentials is challenged with 401 (RFC 8656 Section 7.2).
31. Allocate on a 5-tuple that already has an allocation yields 437 (RFC 8656 Section 7.2).
32. Per-user quota exhaustion yields 486 and server capacity exhaustion yields 508 (RFC 8656 Section 7.2).
33. Allocation lifetime defaults to 600 seconds and is capped at 3600 seconds (RFC 8656 Sections 3.2 and 7.2).
34. Refresh with LIFETIME 0 deletes the allocation (RFC 8656 Section 8).
35. Permissions are keyed by peer IP address only, expire after 300 seconds, and data from peers without a permission is dropped (RFC 8656 Section 9).
36. Channel numbers are limited to 0x4000 through 0x4FFF and bindings expire after 10 minutes (RFC 8656 Section 12).
37. ChannelData messages over TCP are padded to a multiple of 4 bytes (RFC 8656 Section 12.5).
38. Peer addresses in denylisted or internal ranges are refused with 403 so the relay cannot reach private networks (RFC 8656 Section 21).
39. REQUESTED-ADDRESS-FAMILY and dual allocation are honored or rejected explicitly (RFC 8656 Section 18).
40. Ephemeral TURN usernames are `expiry:userId`, passwords are base64(HMAC-SHA1(secret, username)), the default ttl is 86400 seconds, and the server rejects an expired timestamp (draft-uberti-behave-turn-rest-00 Sections 2.2 and 4.2).
41. UDP payloads are kept under the path MTU because oversized datagrams are silently dropped (Node.js dgram, Note about UDP datagram size).
42. The SFU adapter forwards selected streams without decoding and keeps SSRC handling consistent per projected stream (RFC 7667 Section 3.7).
43. The MCU adapter generates new mixed streams and terminates RTCP per endpoint (RFC 7667 Sections 3.6 and 3.9).
44. The E2EE layer never reuses a (KID, CTR) pair and refuses to encrypt twice with the same key and nonce (RFC 9605 Sections 4.3 and 9.3).
45. SFrame keys and salts are derived with HKDF using the KID as an 8-byte big-endian integer (RFC 9605 Section 4.4.2).
46. Each E2EE session uses a single cipher suite from the defined AES-CTR-HMAC or AES-GCM suites (RFC 9605 Section 4.5).
47. The mediasoup adapter only calls transport.consume after router.canConsume returns true for the producer and the client rtpCapabilities (mediasoup v3 API, router.canConsume).
48. The LiveKit adapter calls `POST /twirp/livekit.RoomService/<Method>` with a JSON body and a Bearer JWT holding the roomCreate, roomList, or roomAdmin grant the method needs (LiveKit Room service API).

### Outbound HTTP client

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| fetch client (redirects, decoding, TLS, agents) | lib/fetch/index.js | WHATWG Fetch Standard, https://fetch.spec.whatwg.org/ | RFC 9110 Sections 9.3.2, 10.1.5, 12.5.3, 15.4; RFC 9525 Service Identity in TLS (obsoletes RFC 6125), https://www.rfc-editor.org/rfc/rfc9525.html; Node.js https, https://nodejs.org/api/https.html; Node.js tls, https://nodejs.org/api/tls.html | Fetch: main fetch, HTTP-redirect fetch, Request class; RFC 9525: 6, 6.3, 6.4; tls.connect (rejectUnauthorized, servername, checkServerIdentity, ALPNProtocols) |

#### Conformance checklist

1. 303 redirects are followed with GET, 301 and 302 switch POST to GET, and 307 and 308 keep the method and body (RFC 9110 Sections 15.4.2-15.4.4, 15.4.8, 15.4.9; Fetch Standard, HTTP-redirect fetch).
2. More than 20 redirects end in a network error (Fetch Standard, HTTP-redirect fetch).
3. Authorization is removed when a redirect crosses to a different origin (Fetch Standard, HTTP-redirect fetch).
4. A request body on GET or HEAD is rejected with a TypeError (Fetch Standard, Request class).
5. Certificate verification is on by default and cannot be disabled silently, since rejectUnauthorized defaults to true (Node.js tls, tls.connect).
6. Hostname verification matches DNS-ID subjectAltName entries, never the Common Name, and a wildcard matches only a complete left-most label (RFC 9525 Sections 6 and 6.3).
7. IP address targets are verified against iPAddress subjectAltName entries octet for octet, and SNI is not sent for IP literals (RFC 9525 Section 6.4; Node.js tls, servername).
8. The client advertises only the codings it can decode in Accept-Encoding and decodes gzip, deflate, and br responses with an output cap (RFC 9110 Section 12.5.3; Node.js zlib, maxOutputLength).
9. HEAD responses resolve with an empty body even if Content-Length is present (RFC 9110 Section 9.3.2).
10. A default User-Agent identifies the library and can be overridden (RFC 9110 Section 10.1.5).
11. Keep-alive agents cap TLS session caching through maxCachedSessions (Node.js https, https.Agent).

## Database drivers (upcoming in-house wire-protocol drivers)

These rows govern the planned replacement of the devDependency drivers behind lib/orm/adapters/postgres.js, lib/orm/adapters/mysql.js, lib/orm/adapters/mongo.js, lib/orm/adapters/redis.js, and lib/orm/adapters/sqlite.js, plus the shared SQL generation in lib/orm/adapters/sql-base.js and lib/orm/query.js. Vendor documentation is versioned; the versions observed on 2026-09-28 are PostgreSQL 18, MySQL 8.4 reference manual with the MySQL source documentation labeled 26.7.0, and MongoDB 8.3.

### PostgreSQL

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| PostgreSQL frontend/backend protocol 3.0 and 3.2 | lib/orm/adapters/postgres.js | PostgreSQL 18 Chapter 54 Frontend/Backend Protocol, https://www.postgresql.org/docs/current/protocol.html | 54.1 Overview, https://www.postgresql.org/docs/current/protocol-overview.html; 54.2 Message Flow, https://www.postgresql.org/docs/current/protocol-flow.html; 54.7 Message Formats, https://www.postgresql.org/docs/current/protocol-message-formats.html; 54.8 Error and Notice Message Fields, https://www.postgresql.org/docs/current/protocol-error-fields.html; RFC 7301 (direct SSL ALPN) | 54.1, 54.2.1-54.2.4, 54.2.7-54.2.10, 54.7, 54.8 |
| PostgreSQL SCRAM-SHA-256 authentication | lib/orm/adapters/postgres.js | PostgreSQL 18 Section 54.3 SASL Authentication, https://www.postgresql.org/docs/current/sasl-authentication.html | RFC 5802 SCRAM, https://www.rfc-editor.org/rfc/rfc5802.html; RFC 7677 SCRAM-SHA-256 and SCRAM-SHA-256-PLUS (updates RFC 5802), https://www.rfc-editor.org/rfc/rfc7677.html | 54.3, 54.3.1; RFC 5802: 2.2, 3, 5, 5.1, 6, 7; RFC 7677: 3, 4 |

#### Conformance checklist

1. Every regular message is read as a type byte followed by an Int32 length that counts itself but not the type byte, and the startup, SSLRequest, GSSENCRequest, and CancelRequest packets carry no type byte (PostgreSQL 54.1 and 54.7).
2. A message is buffered completely before it is decoded, so a partial frame never desynchronizes the stream (PostgreSQL 54.1).
3. StartupMessage sends protocol 196608 (3.0) or 196610 (3.2), always includes `user`, and ends with a zero byte (PostgreSQL 54.7).
4. NegotiateProtocolVersion downgrades the minor version and records the unrecognized options instead of failing (PostgreSQL 54.1 and 54.7).
5. SSLRequest uses code 80877103, exactly one response byte (S or N) is read before handing the socket to TLS, and any extra buffered byte is a protocol violation (PostgreSQL 54.2.10 and 54.7).
6. Direct SSL negotiation, when used, sends ALPN `postgresql` (PostgreSQL 54.2.10; RFC 7301 Section 3.1).
7. Authentication request codes are decoded as 0 Ok, 3 cleartext, 5 MD5 with a 4-byte salt, 10 SASL with a mechanism list, 11 SASL continue, and 12 SASL final (PostgreSQL 54.7).
8. SCRAM-SHA-256-PLUS with tls-server-end-point channel binding is preferred when TLS is active, and SCRAM-SHA-256 otherwise (PostgreSQL 54.3; RFC 5802 Sections 6 and 7).
9. The client-first-message may carry an empty username because the server uses the startup user (PostgreSQL 54.3).
10. SaltedPassword is Hi(SASLprep(password), salt, i), and ClientProof is ClientKey XOR HMAC(StoredKey, AuthMessage) using SHA-256 (RFC 5802 Sections 2.2 and 3; RFC 7677 Section 3).
11. The server nonce must begin with the client nonce, and `=` and `,` in usernames are escaped as `=3D` and `=2C` (RFC 5802 Section 5.1).
12. The ServerSignature in server-final-message is verified and a mismatch aborts the connection (RFC 5802 Sections 3 and 5).
13. An iteration count below 4096 is rejected (RFC 7677 Section 3).
14. After authentication the driver consumes BackendKeyData and ParameterStatus messages and becomes ready only at ReadyForQuery (PostgreSQL 54.2.1).
15. The ReadyForQuery status byte I, T, or E drives the driver's transaction state (PostgreSQL 54.2.1 and 54.7).
16. A simple Query with several statements yields one result per statement, and an empty query yields EmptyQueryResponse (PostgreSQL 54.2.2).
17. Parameterized queries use Parse, Bind, Describe, Execute, and Sync, and after an ErrorResponse the driver expects the server to skip to Sync and then ReadyForQuery (PostgreSQL 54.2.3).
18. Bind and DataRow use length -1 for NULL, and format code 0 is text while 1 is binary in network byte order (PostgreSQL 54.1 and 54.7).
19. Pipelined extended queries keep responses matched to requests across Sync boundaries (PostgreSQL 54.2.4).
20. NoticeResponse and ParameterStatus are handled whenever they arrive, not only after a command (PostgreSQL 54.2.7).
21. Cancellation opens a new connection and sends CancelRequest (80877102) with the backend PID and secret key, which is 4 bytes in 3.0 and up to 256 bytes in 3.2 (PostgreSQL 54.2.8 and 54.7).
22. Clean shutdown sends Terminate before closing the socket (PostgreSQL 54.2.9).
23. ErrorResponse parsing always exposes S, V, C (SQLSTATE), and M, maps D, H, P, and the schema, table, column, and constraint fields when present, and ignores unknown field codes (PostgreSQL 54.8).

### MySQL

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| MySQL client/server protocol | lib/orm/adapters/mysql.js | MySQL Client/Server Protocol, https://dev.mysql.com/doc/dev/mysql-server/latest/PAGE_PROTOCOL.html | MySQL Packets, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_packets.html; Integer Types, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_dt_integers.html; OK_Packet, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_ok_packet.html; ERR_Packet, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_err_packet.html; Command Phase, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_command_phase.html; Text Resultset, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_com_query_response_text_resultset.html; Prepared Statements, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_command_phase_ps.html | Packets; Integer Types; OK_Packet; ERR_Packet; command page; Text Resultset; Prepared Statements |
| MySQL connection setup and caching_sha2_password | lib/orm/adapters/mysql.js | MySQL Connection Phase, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_connection_phase.html | Protocol::HandshakeV10, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_connection_phase_packets_protocol_handshake_v10.html; Protocol::HandshakeResponse, https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_connection_phase_packets_protocol_handshake_response.html; Caching_sha2_password information, https://dev.mysql.com/doc/dev/mysql-server/latest/page_caching_sha2_authentication_exchanges.html; MySQL 8.4 Reference Manual 8.4.1.2 Caching SHA-2 Pluggable Authentication, https://dev.mysql.com/doc/refman/8.4/en/caching-sha2-pluggable-authentication.html | connection page; HandshakeV10; HandshakeResponse41; caching_sha2 scramble and fast or full authentication; refman 8.4.1.2 |

#### Conformance checklist

1. Every packet is a 3-byte little-endian payload length plus a 1-byte sequence ID, and a payload of 0xFFFFFF bytes or more is split, with an empty trailing packet when the size is an exact multiple (MySQL Packets).
2. The sequence ID increments per packet and resets to 0 at the start of every command (MySQL Packets; MySQL command page example).
3. HandshakeV10 parsing requires protocol version 10 and assembles the scramble from the 8-byte part 1 and a part 2 of MAX(13, auth_plugin_data_len - 8) bytes (Protocol::HandshakeV10).
4. HandshakeResponse41 always sets CLIENT_PROTOCOL_41, writes the 23-byte zero filler, length-encodes auth_response under CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA, and includes database, plugin name, and connection attributes only when their capability flags are set (Protocol::HandshakeResponse).
5. With CLIENT_SSL, an SSLRequest is sent and TLS established before HandshakeResponse (MySQL connection page).
6. AuthSwitchRequest (0xFE) restarts authentication with the named plugin and AuthMoreData (0x01) continues the current one (MySQL connection page).
7. The caching_sha2_password scramble is XOR(SHA256(password), SHA256(SHA256(SHA256(password)), nonce)) (Caching_sha2_password information).
8. Full authentication sends the password only over TLS or a Unix socket, or through the RSA key pair exchange, never in plain text over unencrypted TCP (MySQL 8.4 Reference Manual 8.4.1.2).
9. Length-encoded integers use one byte below 0xFB and prefixes 0xFC, 0xFD, and 0xFE for 2, 3, and 8 byte values (Integer Types).
10. ERR_Packet is decoded as 0xFF, a 2-byte error code, `#`, a 5-character SQLSTATE, and the message (ERR_Packet).
11. OK_Packet exposes affected_rows and last_insert_id as length-encoded integers plus status flags and warnings, and OK versus EOF is decided by the header and length rules on the OK_Packet page (OK_Packet).
12. A text resultset is read as column count, column definitions, an EOF only without CLIENT_DEPRECATE_EOF, rows where 0xFB is NULL, and a terminating OK or EOF, looping while SERVER_MORE_RESULTS_EXISTS is set (Text Resultset).
13. Parameterized queries use COM_STMT_PREPARE, COM_STMT_EXECUTE, and COM_STMT_CLOSE with the binary resultset format (Prepared Statements).

### MongoDB and BSON

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| MongoDB wire protocol and OP_MSG | lib/orm/adapters/mongo.js | MongoDB Wire Protocol (MongoDB 8.3 manual), https://www.mongodb.com/docs/manual/reference/mongodb-wire-protocol/ | OP_MSG specification (Accepted), https://github.com/mongodb/specifications/blob/master/source/message/OP_MSG.md; MongoDB Handshake specification (Accepted), https://github.com/mongodb/specifications/blob/master/source/mongodb-handshake/handshake.md | Standard Message Header, Opcodes, OP_MSG (flagBits, Sections, checksum), OP_COMPRESSED; OP_MSG spec: flagBits, sections, Global Command Arguments; Handshake: client metadata, limits |
| BSON codec | lib/orm/adapters/mongo.js | BSON (Binary JSON) Specification 1.1, https://bsonspec.org/spec.html | none | document, e_list, element, e_name, string, cstring, binary subtypes |
| MongoDB SCRAM authentication | lib/orm/adapters/mongo.js | MongoDB Authentication specification (Accepted), https://github.com/mongodb/specifications/blob/master/source/auth/auth.md | RFC 5802; RFC 7677 | Default Authentication Methods, SCRAM-SHA-1, SCRAM-SHA-256, Caching credentials in SCRAM, Connection String Options |

#### Conformance checklist

1. The message header is four little-endian int32 values, and messageLength counts the header itself (MongoDB Wire Protocol, Standard Message Header).
2. Unknown required flag bits 0 to 15 cause an error and unknown optional bits 16 to 31 are ignored (MongoDB Wire Protocol, OP_MSG; OP_MSG specification).
3. Every OP_MSG has exactly one kind 0 section, and each kind 1 identifier is unique and absent from the body (OP_MSG specification).
4. Every command body carries `$db` (OP_MSG specification, Global Command Arguments).
5. A request sent with moreToCome expects no reply, and w:0 writes always set moreToCome (OP_MSG specification).
6. When checksumPresent is set, the trailing CRC-32C is verified (MongoDB Wire Protocol, OP_MSG).
7. Outgoing messages respect maxMessageSizeBytes and documents respect maxBsonObjectSize from the handshake (OP_MSG specification).
8. OP_COMPRESSED is decoded from originalOpcode, uncompressedSize, and compressorId, with 0 noop, 1 snappy, 2 zlib, and 3 zstd (MongoDB Wire Protocol, OP_COMPRESSED).
9. The first command on a connection is hello, or legacy hello with helloOk, carrying client metadata of at most 512 bytes truncated in the specified order, and later hello calls omit the metadata (MongoDB Handshake specification).
10. A BSON document is an int32 total length including itself, the element list, and a terminating 0x00 (BSON 1.1, document).
11. Element names are cstrings, so a key containing NUL is rejected at encode time (BSON 1.1, e_name).
12. BSON strings are an int32 length that includes the trailing NUL, then UTF-8 bytes, then 0x00 (BSON 1.1, string).
13. All numeric values are little-endian, datetimes are int64 milliseconds since the epoch, and arrays are documents keyed "0", "1", and so on (BSON 1.1).
14. Every element type from 0x01 to 0x13 plus 0xFF and 0x7F round-trips, and the deprecated types 0x06, 0x0C, 0x0E, and 0x0F are decoded but never emitted (BSON 1.1).
15. UUIDs use binary subtype 0x04, and regex options are stored in alphabetical order (BSON 1.1).
16. SCRAM-SHA-256 is chosen when saslSupportedMechs lists it, otherwise SCRAM-SHA-1 (MongoDB Authentication, Default Authentication Methods).
17. SCRAM-SHA-1 uses HEX(MD5(username + ":mongo:" + password)) as the password, and SCRAM-SHA-256 uses the SASLprep-prepared raw password (MongoDB Authentication, SCRAM-SHA-1 and SCRAM-SHA-256).
18. saslStart sends `options: { skipEmptyExchange: true }` and saslContinue repeats with the conversationId until `done` is true (MongoDB Authentication, SCRAM-SHA-256).
19. An iteration count below 4096 is an error (MongoDB Authentication).
20. The auth source defaults to the URI database, or `admin` when none is given, for SCRAM mechanisms (MongoDB Authentication, Connection String Options).
21. Speculative authentication in the initial hello is used when available, and the server signature is always verified (MongoDB Authentication; RFC 5802 Section 5).

### Redis

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| RESP2 and RESP3 client | lib/orm/adapters/redis.js | Redis serialization protocol specification, https://redis.io/docs/latest/develop/reference/protocol-spec/ | HELLO command reference, https://redis.io/docs/latest/commands/hello/ | RESP versions, RESP protocol description (all type subsections, Streamed strings, Streamed aggregated data types), Client handshake, Sending commands, Multiple commands and pipelining |
| Redis Cluster slot routing | lib/orm/adapters/redis.js | Redis cluster specification, https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/ | none | Key distribution model, Hash tags, MOVED Redirection, ASK redirection, Client connections and redirection handling, Multi-keys operations, Appendix A |

#### Conformance checklist

1. Commands are always sent as a RESP array of bulk strings (RESP spec, Sending commands to a Redis server).
2. CRLF terminates every protocol part, and simple strings and simple errors are rejected if they contain CR or LF (RESP spec, Simple strings).
3. `$0` decodes to an empty string while `$-1` and `*-1` decode to null, never to an empty value (RESP spec, Bulk strings, Null bulk strings, Null arrays).
4. Integers are signed 64-bit and values beyond Number.MAX_SAFE_INTEGER are returned as BigInt (RESP spec, Integers).
5. The error prefix, the first uppercase word such as ERR or WRONGTYPE, is exposed on the thrown error, for both simple and bulk errors (RESP spec, Simple errors, Bulk errors).
6. RESP3 null, boolean `#t`/`#f`, double including `inf`, `-inf`, and `nan`, big number, verbatim string with its 3-byte encoding, map, set, and attribute types all decode (RESP spec, RESP3 type subsections).
7. Attributes are accumulated separately and attached to the reply that follows rather than returned as the reply (RESP spec, Attributes).
8. Push frames are routed to the pub/sub handler and never consume a pending command's reply slot (RESP spec, Pushes).
9. Streamed strings (`$?` with `;len` chunks ending in `;0`) and streamed aggregates (`?` count ending in `.`) are parsed (RESP spec, Streamed strings and Streamed aggregated data types).
10. The handshake sends `HELLO 3` with optional AUTH and SETNAME, falls back to RESP2 on `-NOPROTO` or an unknown-command error, and treats an AUTH failure as a connection error even though the connection stays in RESP2 (RESP spec, Client handshake; HELLO).
11. Under RESP2, map-shaped replies such as HGETALL are rebuilt from flat key and value arrays (RESP spec, Maps).
12. Pipelined replies are matched to commands in FIFO order (RESP spec, Multiple commands and pipelining).
13. Bulk payloads larger than the server's 512 MB default proto-max-bulk-len are refused client side (RESP spec, Bulk strings).
14. HASH_SLOT is CRC16 (XMODEM) of the key modulo 16384, and CRC16 of "123456789" is 0x31C3 (Cluster spec, Key distribution model).
15. Hash tags hash only the text between the first `{` and the next `}` when it is non-empty, so `foo{}{bar}` hashes whole, `foo{{bar}}zap` hashes `{bar`, and `foo{bar}{zap}` hashes `bar` (Cluster spec, Hash tags).
16. A `-MOVED slot host:port` reply updates the slot map and retries on the new node, and an empty host means the same host (Cluster spec, MOVED Redirection).
17. A `-ASK` reply retries once on the target preceded by ASKING and does not update the slot map (Cluster spec, ASK redirection).
18. Topology is discovered with CLUSTER SHARDS, with CLUSTER SLOTS only as a fallback because it is deprecated (Cluster spec, Client connections and redirection handling).
19. Multi-key commands whose keys map to different slots are rejected client side, and `-TRYAGAIN` during resharding is retried with backoff (Cluster spec, Multi-keys operations).

### SQLite

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| SQLite adapter on node:sqlite | lib/orm/adapters/sqlite.js | Node.js SQLite (node:sqlite, Stability 1.2 Release candidate), https://nodejs.org/api/sqlite.html | SQLite C-language Interface Specification, https://www.sqlite.org/c3ref/intro.html; SQLite Transaction, https://www.sqlite.org/lang_transaction.html | DatabaseSync options, database.exec, database.prepare, StatementSync run, get, all, iterate, setReadBigInts, named parameters, Type conversion between JavaScript and SQLite; sqlite3 and sqlite3_stmt objects; BEGIN DEFERRED, IMMEDIATE, EXCLUSIVE, SAVEPOINT |

#### Conformance checklist

1. The adapter documents that node:sqlite executes synchronously and keeps long statements off the request path (node:sqlite, DatabaseSync).
2. Foreign key enforcement stays on, matching the enableForeignKeyConstraints default of true (node:sqlite, DatabaseSync options).
3. enableDoubleQuotedStringLiterals stays false so a double-quoted token is always an identifier (node:sqlite, DatabaseSync options; SQLite Keywords).
4. Every value is bound through prepare with `?` or `$`, `:`, or `@` named parameters, never interpolated into SQL text (node:sqlite, named parameters).
5. Insert results come from run(), using changes and lastInsertRowid (node:sqlite, statement.run).
6. INTEGER columns that may exceed 2^53 are read with setReadBigInts (node:sqlite, statement.setReadBigInts).
7. Booleans are written as 1 and 0, undefined and null become NULL, and BLOBs come back as Uint8Array (node:sqlite, Type conversion).
8. Write transactions start with BEGIN IMMEDIATE so a read-to-write upgrade cannot fail mid-transaction with SQLITE_BUSY (SQLite Transaction).
9. Nested ORM transactions use SAVEPOINT and RELEASE because BEGIN does not nest (SQLite Transaction).
10. A busy timeout is configured and SQLITE_BUSY on COMMIT is retried or surfaced as a typed error (SQLite Transaction; node:sqlite, timeout option).
11. Prepared statements map one to one onto sqlite3_stmt objects and are released when the connection closes (SQLite C-language Interface Specification).

### SQL identifier quoting and document field names

| Feature | Module path | Primary standard | Secondary sources | Key sections |
| --- | --- | --- | --- | --- |
| Identifier and literal quoting per dialect | lib/orm/adapters/sql-base.js, lib/orm/query.js, lib/orm/schema.js, lib/orm/migrate.js, lib/orm/views.js, lib/orm/procedures.js | PostgreSQL 18 Section 4.1 Lexical Structure, https://www.postgresql.org/docs/current/sql-syntax-lexical.html | MySQL 8.4 Reference Manual 11.2 Schema Object Names, https://dev.mysql.com/doc/refman/8.4/en/identifiers.html; SQLite Keywords, https://www.sqlite.org/lang_keywords.html; MongoDB Field Names with Periods and Dollar Signs, https://www.mongodb.com/docs/manual/core/dot-dollar-considerations/; BSON 1.1 e_name | PostgreSQL 4.1.1, 4.1.2.1, 4.1.2.2, 4.1.2.4, 4.1.4; MySQL 11.2, 11.2.1; SQLite Keywords (four quoting forms) |

#### Conformance checklist

1. PostgreSQL identifiers are wrapped in double quotes with every embedded double quote doubled, and an identifier containing NUL is rejected (PostgreSQL 4.1.1).
2. PostgreSQL identifiers longer than 63 bytes are rejected instead of being silently truncated by the server (PostgreSQL 4.1.1).
3. Because quoting makes PostgreSQL identifiers case-sensitive, the ORM quotes every generated identifier consistently so `"User"` and `user` never refer to the same table by accident (PostgreSQL 4.1.1).
4. Values reach PostgreSQL as `$n` parameters, and any literal that must be inlined doubles single quotes and never relies on backslash escapes (PostgreSQL 4.1.2.1, 4.1.2.2, and 4.1.4).
5. MySQL identifiers are wrapped in backticks with every embedded backtick doubled (MySQL 11.2).
6. MySQL identifiers containing U+0000 or supplementary characters, or ending in a space, are rejected, and names longer than the identifier length limit are rejected (MySQL 11.2 and 11.2.1).
7. MySQL generation never uses double-quoted identifiers, since they are identifiers only under ANSI_QUOTES (MySQL 11.2).
8. SQLite identifiers use double quotes, never single quotes, brackets, or backticks (SQLite Keywords).
9. Generated SQLite SQL never depends on the double-quoted-string fallback misfeature (SQLite Keywords).
10. MongoDB field names that start with `$` or contain `.` are rejected by default or accessed only through $getField, $setField, and $literal (MongoDB Field Names with Periods and Dollar Signs).
11. MongoDB field names containing NUL are rejected before encoding, since BSON element names are cstrings (BSON 1.1, e_name).

## Citations to re-check by hand

These were confirmed only partially because the fetched page came back truncated or summarized. Tests built from them should re-read the source first.

- MySQL caching_sha2_password status bytes (fast-auth success and full-auth request, and the RSA public key request) are not on the fetched pages; only the scramble formula and the rule that full authentication needs TLS or RSA are cited.
- MySQL OK_Packet versus EOF_Packet length thresholds are cited by page, not by value.
- MySQL COM_* command byte values live on the enum_server_command page, which is not in this registry yet.
- Fetch Standard: the Vary: Origin guidance and the wildcard-with-credentials rule are cited as section 3.3.5 plus RFC 9110 section 12.5.5; "HTTP-redirect fetch" is cited by name.
- WebAuthn: the DER encoding of ES256 assertion signatures is cited as "within 6.5".
- W3C Trace Context: handling of an invalid traceparent is cited as section 4.
- SQLite: the keywords page does not state how a double quote inside a quoted identifier is escaped, so no statement depends on it.
- Node.js http options insecureHTTPParser, requireHostHeader, and joinDuplicateHeaders are not cited because the fetched page was truncated.

Not yet covered: RFC 8840 (SDP end-of-candidates), the gRPC HTTP-to-gRPC status mapping document, the protobuf JSON mapping, RFC 7034 (X-Frame-Options), and JSON Schema for lib/middleware/validator.js.
## Sources index

Every URL below was fetched on 2026-09-28 and its title confirmed; each appears once, sorted by URL.

- https://12factor.net/config - The Twelve-Factor App, III. Config - verified 2026-09-28
- https://bsonspec.org/spec.html - BSON (Binary JSON): Specification, version 1.1 - verified 2026-09-28
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html - Cross-Site Request Forgery Prevention Cheat Sheet (OWASP) - verified 2026-09-28
- https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html - HTTP Security Response Headers Cheat Sheet (OWASP) - verified 2026-09-28
- https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html - Multifactor Authentication Cheat Sheet (OWASP) - verified 2026-09-28
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html - Session Management Cheat Sheet (OWASP) - verified 2026-09-28
- https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/ - RateLimit header fields for HTTP (draft-ietf-httpapi-ratelimit-headers-11, active WG draft) - verified 2026-09-28
- https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/ - Cookies: HTTP State Management Mechanism (datatracker status page, RFC Ed Queue) - verified 2026-09-28
- https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/ - The OAuth 2.1 Authorization Framework (draft-ietf-oauth-v2-1-16, active WG draft) - verified 2026-09-28
- https://datatracker.ietf.org/doc/draft-inadarei-api-health-check/ - Health Check Response Format for HTTP APIs (draft-inadarei-api-health-check-06, expired) - verified 2026-09-28
- https://datatracker.ietf.org/doc/draft-uberti-behave-turn-rest/ - A REST API For Access To TURN Services (datatracker status page, expired) - verified 2026-09-28
- https://datatracker.ietf.org/doc/html/draft-uberti-behave-turn-rest-00 - draft-uberti-behave-turn-rest-00 A REST API For Access To TURN Services - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_caching_sha2_authentication_exchanges.html - MySQL: Caching_sha2_password information - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_dt_integers.html - MySQL: Integer Types - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_err_packet.html - MySQL: ERR_Packet - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_ok_packet.html - MySQL: OK_Packet - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_basic_packets.html - MySQL: MySQL Packets - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_com_query_response_text_resultset.html - MySQL: Text Resultset - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_command_phase_ps.html - MySQL: Prepared Statements - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_command_phase.html - MySQL: Command Phase - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_connection_phase_packets_protocol_handshake_response.html - MySQL: Protocol::HandshakeResponse - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_connection_phase_packets_protocol_handshake_v10.html - MySQL: Protocol::HandshakeV10 - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_connection_phase.html - MySQL: Connection Phase - verified 2026-09-28
- https://dev.mysql.com/doc/dev/mysql-server/latest/PAGE_PROTOCOL.html - MySQL: Client/Server Protocol - verified 2026-09-28
- https://dev.mysql.com/doc/refman/8.4/en/caching-sha2-pluggable-authentication.html - MySQL 8.4 Reference Manual, 8.4.1.2 Caching SHA-2 Pluggable Authentication - verified 2026-09-28
- https://dev.mysql.com/doc/refman/8.4/en/identifiers.html - MySQL 8.4 Reference Manual, 11.2 Schema Object Names - verified 2026-09-28
- https://docs.livekit.io/reference/server/server-apis/ - Room service API (LiveKit) - verified 2026-09-28
- https://fetch.spec.whatwg.org/ - Fetch Standard (WHATWG Living Standard) - verified 2026-09-28
- https://github.com/grpc/grpc-proto/blob/master/grpc/health/v1/health.proto - health.proto, package grpc.health.v1 (grpc-proto repository) - verified 2026-09-28
- https://github.com/grpc/grpc-proto/blob/master/grpc/reflection/v1/reflection.proto - reflection.proto, package grpc.reflection.v1 (grpc-proto repository) - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/compression.md - gRPC Compression - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/health-checking.md - GRPC Health Checking Protocol - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/keepalive.md - Keepalive User Guide for gRPC Core (and dependents) - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/load-balancing.md - Load Balancing in gRPC - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md - gRPC over HTTP2 - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/server-reflection.md - GRPC Server Reflection Protocol - verified 2026-09-28
- https://github.com/grpc/grpc/blob/master/doc/statuscodes.md - Status codes and their use in gRPC - verified 2026-09-28
- https://github.com/mongodb/specifications/blob/master/source/auth/auth.md - Authentication (MongoDB specifications, Accepted) - verified 2026-09-28
- https://github.com/mongodb/specifications/blob/master/source/message/OP_MSG.md - OP_MSG (MongoDB specifications, Accepted) - verified 2026-09-28
- https://github.com/mongodb/specifications/blob/master/source/mongodb-handshake/handshake.md - MongoDB Handshake (MongoDB specifications, Accepted) - verified 2026-09-28
- https://html.spec.whatwg.org/multipage/browsers.html - HTML Standard, Loading web pages (WHATWG Living Standard) - verified 2026-09-28
- https://html.spec.whatwg.org/multipage/server-sent-events.html - HTML Standard, 9.2 Server-sent events (WHATWG Living Standard) - verified 2026-09-28
- https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/ - Liveness, Readiness, and Startup Probes (Kubernetes) - verified 2026-09-28
- https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ - Pod Lifecycle (Kubernetes) - verified 2026-09-28
- https://mediasoup.org/documentation/v3/mediasoup/api/ - mediasoup :: API (v3) - verified 2026-09-28
- https://nodejs.org/api/cluster.html - Cluster, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/crypto.html - Crypto, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/dgram.html - UDP/datagram sockets, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/environment_variables.html - Environment Variables, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/http.html - HTTP, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/http2.html - HTTP/2, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/https.html - HTTPS, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/process.html - Process, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/sqlite.html - SQLite, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/tls.html - TLS (SSL), Node.js v26.10.0 Documentation - verified 2026-09-28
- https://nodejs.org/api/zlib.html - Zlib, Node.js v26.10.0 Documentation - verified 2026-09-28
- https://openid.net/specs/openid-connect-core-1_0.html - OpenID Connect Core 1.0 incorporating errata set 2 - verified 2026-09-28
- https://opentelemetry.io/docs/specs/otel/logs/data-model/ - Logs Data Model (OpenTelemetry, Stable) - verified 2026-09-28
- https://pages.nist.gov/800-63-4/sp800-63b.html - NIST SP 800-63B-4 Digital Identity Guidelines: Authentication and Authenticator Management - verified 2026-09-28
- https://prometheus.io/docs/instrumenting/exposition_formats/ - Exposition formats (Prometheus) - verified 2026-09-28
- https://prometheus.io/docs/practices/naming/ - Metric and label naming (Prometheus) - verified 2026-09-28
- https://prometheus.io/docs/specs/om/open_metrics_spec/ - OpenMetrics 1.0 - verified 2026-09-28
- https://protobuf.dev/programming-guides/encoding/ - Encoding (Protocol Buffers documentation) - verified 2026-09-28
- https://protobuf.dev/programming-guides/proto3/ - Language Guide (proto 3) (Protocol Buffers documentation) - verified 2026-09-28
- https://protobuf.dev/reference/protobuf/proto3-spec/ - Protocol Buffers Language Specification (Proto3) - verified 2026-09-28
- https://redis.io/docs/latest/commands/hello/ - HELLO (Redis command reference) - verified 2026-09-28
- https://redis.io/docs/latest/develop/reference/protocol-spec/ - Redis serialization protocol specification - verified 2026-09-28
- https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/ - Redis cluster specification - verified 2026-09-28
- https://url.spec.whatwg.org/ - URL Standard (WHATWG Living Standard) - verified 2026-09-28
- https://www.ietf.org/archive/id/draft-ietf-httpbis-rfc6265bis-22.html - draft-ietf-httpbis-rfc6265bis-22 Cookies: HTTP State Management Mechanism - verified 2026-09-28
- https://www.mongodb.com/docs/manual/core/dot-dollar-considerations/ - Field Names with Periods and Dollar Signs (MongoDB 8.3 Database Manual) - verified 2026-09-28
- https://www.mongodb.com/docs/manual/reference/mongodb-wire-protocol/ - MongoDB Wire Protocol (MongoDB 8.3 Database Manual) - verified 2026-09-28
- https://www.postgresql.org/docs/current/protocol-error-fields.html - PostgreSQL 18 Documentation, 54.8. Error and Notice Message Fields - verified 2026-09-28
- https://www.postgresql.org/docs/current/protocol-flow.html - PostgreSQL 18 Documentation, 54.2. Message Flow - verified 2026-09-28
- https://www.postgresql.org/docs/current/protocol-message-formats.html - PostgreSQL 18 Documentation, 54.7. Message Formats - verified 2026-09-28
- https://www.postgresql.org/docs/current/protocol-overview.html - PostgreSQL 18 Documentation, 54.1. Overview - verified 2026-09-28
- https://www.postgresql.org/docs/current/protocol.html - PostgreSQL 18 Documentation, Chapter 54. Frontend/Backend Protocol - verified 2026-09-28
- https://www.postgresql.org/docs/current/sasl-authentication.html - PostgreSQL 18 Documentation, 54.3. SASL Authentication - verified 2026-09-28
- https://www.postgresql.org/docs/current/sql-syntax-lexical.html - PostgreSQL 18 Documentation, 4.1. Lexical Structure - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc1950.html - RFC 1950 ZLIB Compressed Data Format Specification version 3.3 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc1951.html - RFC 1951 DEFLATE Compressed Data Format Specification version 1.3 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc1952.html - RFC 1952 GZIP file format specification version 4.3 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc2046.html - RFC 2046 Multipurpose Internet Mail Extensions (MIME) Part Two: Media Types - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc3986.html - RFC 3986 Uniform Resource Identifier (URI): Generic Syntax - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc4226.html - RFC 4226 HOTP: An HMAC-Based One-Time Password Algorithm - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc4648.html - RFC 4648 The Base16, Base32, and Base64 Data Encodings - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc5424.html - RFC 5424 The Syslog Protocol - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc5802.html - RFC 5802 Salted Challenge Response Authentication Mechanism (SCRAM) SASL and GSS-API Mechanisms - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6238.html - RFC 6238 TOTP: Time-Based One-Time Password Algorithm - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6265.html - RFC 6265 HTTP State Management Mechanism - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6266.html - RFC 6266 Use of the Content-Disposition Header Field in the Hypertext Transfer Protocol (HTTP) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6454.html - RFC 6454 The Web Origin Concept - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6455.html - RFC 6455 The WebSocket Protocol - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6585.html - RFC 6585 Additional HTTP Status Codes - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6749.html - RFC 6749 The OAuth 2.0 Authorization Framework - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6750.html - RFC 6750 The OAuth 2.0 Authorization Framework: Bearer Token Usage - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc6797.html - RFC 6797 HTTP Strict Transport Security (HSTS) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7064.html - RFC 7064 URI Scheme for the Session Traversal Utilities for NAT (STUN) Protocol - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7065.html - RFC 7065 Traversal Using Relays around NAT (TURN) Uniform Resource Identifiers - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7239.html - RFC 7239 Forwarded HTTP Extension - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7301.html - RFC 7301 Transport Layer Security (TLS) Application-Layer Protocol Negotiation Extension - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7515.html - RFC 7515 JSON Web Signature (JWS) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7517.html - RFC 7517 JSON Web Key (JWK) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7518.html - RFC 7518 JSON Web Algorithms (JWA) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7519.html - RFC 7519 JSON Web Token (JWT) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7541.html - RFC 7541 HPACK: Header Compression for HTTP/2 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7578.html - RFC 7578 Returning Values from Forms: multipart/form-data - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7636.html - RFC 7636 Proof Key for Code Exchange by OAuth Public Clients - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7667.html - RFC 7667 RTP Topologies - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7677.html - RFC 7677 SCRAM-SHA-256 and SCRAM-SHA-256-PLUS Simple Authentication and Security Layer (SASL) Mechanisms - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7692.html - RFC 7692 Compression Extensions for WebSocket - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc7932.html - RFC 7932 Brotli Compressed Data Format - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8187.html - RFC 8187 Indicating Character Encoding and Language for HTTP Header Field Parameters - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8259.html - RFC 8259 The JavaScript Object Notation (JSON) Data Interchange Format - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8414.html - RFC 8414 OAuth 2.0 Authorization Server Metadata - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8441.html - RFC 8441 Bootstrapping WebSockets with HTTP/2 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8445.html - RFC 8445 Interactive Connectivity Establishment (ICE): A Protocol for Network Address Translator (NAT) Traversal - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8446.html - RFC 8446 The Transport Layer Security (TLS) Protocol Version 1.3 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8489.html - RFC 8489 Session Traversal Utilities for NAT (STUN) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8656.html - RFC 8656 Traversal Using Relays around NAT (TURN): Relay Extensions to Session Traversal Utilities for NAT (STUN) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8725.html - RFC 8725 JSON Web Token Best Current Practices (BCP 225) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8838.html - RFC 8838 Trickle ICE: Incremental Provisioning of Candidates for the Interactive Connectivity Establishment (ICE) Protocol - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8839.html - RFC 8839 Session Description Protocol (SDP) Offer/Answer Procedures for Interactive Connectivity Establishment (ICE) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8866.html - RFC 8866 SDP: Session Description Protocol - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc8949.html - RFC 8949 Concise Binary Object Representation (CBOR) (STD 94) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9052.html - RFC 9052 CBOR Object Signing and Encryption (COSE): Structures and Process (STD 96) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9053.html - RFC 9053 CBOR Object Signing and Encryption (COSE): Initial Algorithms - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9110.html - RFC 9110 HTTP Semantics - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9111.html - RFC 9111 HTTP Caching - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9112.html - RFC 9112 HTTP/1.1 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9113.html - RFC 9113 HTTP/2 - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9207.html - RFC 9207 OAuth 2.0 Authorization Server Issuer Identification - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9429.html - RFC 9429 JavaScript Session Establishment Protocol (JSEP) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9457.html - RFC 9457 Problem Details for HTTP APIs - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9525.html - RFC 9525 Service Identity in TLS - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9562.html - RFC 9562 Universally Unique IDentifiers (UUIDs) - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9605.html - RFC 9605 Secure Frame (SFrame): Lightweight Authenticated Encryption for Real-Time Media - verified 2026-09-28
- https://www.rfc-editor.org/rfc/rfc9700.html - RFC 9700 Best Current Practice for OAuth 2.0 Security (BCP 240) - verified 2026-09-28
- https://www.sqlite.org/c3ref/intro.html - C-language Interface Specification for SQLite - verified 2026-09-28
- https://www.sqlite.org/lang_keywords.html - SQLite Keywords - verified 2026-09-28
- https://www.sqlite.org/lang_transaction.html - Transaction (SQLite) - verified 2026-09-28
- https://www.w3.org/TR/baggage/ - Propagation format for distributed context: Baggage (W3C Candidate Recommendation Snapshot) - verified 2026-09-28
- https://www.w3.org/TR/CSP3/ - Content Security Policy Level 3 (W3C Working Draft) - verified 2026-09-28
- https://www.w3.org/TR/fetch-metadata/ - Fetch Metadata Request Headers (W3C Working Draft) - verified 2026-09-28
- https://www.w3.org/TR/referrer-policy/ - Referrer Policy (W3C Candidate Recommendation) - verified 2026-09-28
- https://www.w3.org/TR/trace-context/ - Trace Context (W3C Recommendation) - verified 2026-09-28
- https://www.w3.org/TR/webauthn-3/ - Web Authentication: An API for accessing Public Key Credentials Level 3 (W3C Recommendation) - verified 2026-09-28
- https://www.w3.org/TR/webrtc/ - WebRTC: Real-Time Communication in Browsers (W3C Recommendation) - verified 2026-09-28
