const { fetch } = require('../');

async function doFetch(url, opts = {}) {
    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/json')) return { data: await r.json(), status: r.status, headers: r.headers };
    return { data: await r.text(), status: r.status, headers: r.headers };
}

/**
 * Poll until `predicate()` returns truthy, instead of sleeping a fixed time.
 *
 * @param {Function} predicate - Condition to wait for.
 * @param {number} [timeout=5000] - Give up after this many ms.
 * @param {number} [interval=5] - Poll interval in ms.
 * @returns {Promise<void>} Resolves once the condition holds; rejects on timeout.
 */
async function waitFor(predicate, timeout = 5000, interval = 5) {
    const deadline = Date.now() + timeout;
    while (!predicate()) {
        if (Date.now() > deadline) throw new Error(`waitFor timed out after ${timeout}ms`);
        await new Promise(r => setTimeout(r, interval));
    }
}

module.exports = { doFetch, fetch, waitFor };
