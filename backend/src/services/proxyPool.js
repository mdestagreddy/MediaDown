const PROXY_SOURCE_URL =
  'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text';
const CACHE_TTL_MS = 300000; // 5 minutes
const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

let cache = { list: [], lastFetch: 0 };
const blacklist = new Set();

const PROXY_ERROR_HINTS = [
  'proxy', 'socks', 'connection', 'timeout', 'econnreset',
  'econnrefused', 'getaddrinfo', 'enotfound', 'network',
  'socket hang', 'connect eacces', 'proxyerror'
];

/**
 * Fetch the raw SOCKS5 proxy list from ProxyScrape.
 * The API returns one proxy per line in <protocol>://<ip>:<port> format.
 */
async function fetchProxies() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(PROXY_SOURCE_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MediaDown/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Proxy API returned status ${response.status}`);
    }

    const text = await response.text();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && l.toLowerCase().startsWith('socks5://'));

    return lines;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Ensure the proxy list is loaded (fetch if missing or stale).
 */
async function ensureProxies() {
  const now = Date.now();
  if (cache.list.length > 0 && now - cache.lastFetch < CACHE_TTL_MS) {
    return cache.list;
  }

  try {
    const proxies = await fetchProxies();
    cache.list = proxies;
    cache.lastFetch = now;
    blacklist.clear();
    if (proxies.length > 0) {
      console.log(`[ProxyPool] Loaded ${proxies.length} SOCKS5 proxies`);
    }
  } catch (err) {
    console.error('[ProxyPool] Failed to fetch proxies:', err.message);
    if (cache.list.length === 0) throw err;
  }

  return cache.list;
}

/**
 * Return a random SOCKS5 proxy from the available (non-blacklisted) pool.
 * Returns null when no proxy is available.
 */
function getProxy() {
  const available = cache.list.filter((p) => !blacklist.has(p));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getAvailableProxies() {
  return cache.list.filter((p) => !blacklist.has(p));
}

function blacklistProxy(proxy) {
  if (proxy) {
    blacklist.add(proxy);
  }
}

function clearBlacklist() {
  blacklist.clear();
}

/**
 * Returns true when the error message looks proxy/network-related.
 */
function isProxyError(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return PROXY_ERROR_HINTS.some((h) => lower.includes(h));
}

/**
 * Wrap an async function with automatic proxy retry.
 *
 * When `useProxy` is true the function receives a random SOCKS5 proxy string.
 * If the function rejects with a proxy-related error, the failed proxy is
 * blacklisted and the function is retried with a fresh proxy.
 *
 * @param {function(string|null): Promise<any>} fn  callback receiving the proxy
 * @param {boolean} useProxy  whether proxy rotation is enabled
 * @param {number}  retries  maximum retry attempts
 */
async function withProxyRetry(fn, useProxy, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let proxy = null;

    if (useProxy) {
      proxy = getProxy();
      if (!proxy) {
        await ensureProxies();
        proxy = getProxy();
      }
    }

    try {
      return await fn(proxy);
    } catch (err) {
      lastError = err;

      if (proxy && isProxyError(err.message) && attempt < retries) {
        blacklistProxy(proxy);
        const remaining = getAvailableProxies().length;
        console.log(
          `[ProxyPool] Proxy failed (${proxy}), retrying ` +
          `(${attempt + 1}/${retries}, ${remaining} remaining)`
        );
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

module.exports = {
  PROXY_SOURCE_URL,
  fetchProxies,
  ensureProxies,
  getProxy,
  getAvailableProxies,
  blacklistProxy,
  clearBlacklist,
  isProxyError,
  withProxyRetry,
  MAX_RETRIES
};
