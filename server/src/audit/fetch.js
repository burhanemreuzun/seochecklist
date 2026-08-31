const TIMEOUT = Number(process.env.FETCH_TIMEOUT_MS || 20000);
const UA =
  process.env.FETCH_USER_AGENT ||
  'SEOChecklistBot/1.0 (+https://github.com/burhanemreuzun/seochecklist)';

/** Verilen adresi çekip HTML'i ve yanıt üstbilgilerini döndürür. */
async function fetchPage(url) {
  const started = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ac.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    });
    const html = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url || url,
      redirected: (res.url || url) !== url,
      headers: Object.fromEntries(res.headers.entries()),
      html,
      ttfbMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Bir adresin durumunu HEAD ile yoklar; HEAD desteklenmiyorsa GET'e düşer.
 * Kırık bağlantı ve görsel boyutu kontrollerinde kullanılır.
 */
async function probe(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), Math.min(TIMEOUT, 12000));
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ac.signal,
      headers: { 'User-Agent': UA },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: ac.signal,
        headers: { 'User-Agent': UA, Range: 'bytes=0-0' },
      });
    }
    const len = res.headers.get('content-length');
    return {
      url,
      ok: res.ok,
      status: res.status,
      bytes: len ? Number(len) : null,
      contentType: res.headers.get('content-type') || null,
    };
  } catch (err) {
    return { url, ok: false, status: 0, bytes: null, contentType: null, error: err.name || 'error' };
  } finally {
    clearTimeout(timer);
  }
}

/** Eş zamanlı istek sayısını sınırlayarak çalıştırır. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

module.exports = { fetchPage, probe, mapLimit };
