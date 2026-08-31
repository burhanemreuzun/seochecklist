/**
 * Kimlik doğrulama.
 *
 * Tek parolalı, ekip içi bir araç için tasarlandı; kullanıcı hesabı yok.
 *
 * Güvenlik notları:
 *  - Parola hiçbir yerde düz metin tutulmaz. .env içinde yalnızca scrypt özeti
 *    (APP_PASSWORD_HASH) bulunur ve .env sürüm kontrolüne girmez.
 *  - Karşılaştırma zamanlama saldırısına kapalı biçimde yapılır.
 *  - Oturum çerezi HMAC ile imzalanır; httpOnly olduğu için JavaScript okuyamaz.
 *  - Parola denemeleri IP başına sınırlanır.
 *
 * Ek bağımlılık kullanılmaz; hepsi Node'un yerleşik crypto modülüyle yapılır.
 */

const crypto = require('crypto');

const COOKIE = 'sck';
const SESSION_DAYS = 30;

// ─────────────────────────── parola ───────────────────────────

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/**
 * Düz parolayı ".env" ya da hosting panelinde saklanabilir bir özete çevirir.
 *
 * Biçim:  scrypt.N.r.p.<tuz>.<anahtar>   — ayırıcı nokta, kodlama base64url
 *
 * Ayırıcı olarak "$" KULLANILMAZ. Bazı hosting panelleri ortam değişkenlerini
 * süreçlere kabuk üzerinden aktarır; orada "$16384" bir değişken sanılıp
 * silinir ve özet sessizce bozulur. base64url ayrıca "+", "/" ve "=" üretmez,
 * yani değer her ortamda olduğu gibi taşınır.
 */
function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(plain.normalize('NFKC'), salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p,
  });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p,
          salt.toString('base64url'), key.toString('base64url')].join('.');
}

/** Özeti bileşenlerine ayırır; hem yeni (nokta) hem eski ($) biçimi tanır. */
function parseHash(stored) {
  const raw = String(stored || '').trim();
  const parts = raw.includes('.') && raw.startsWith('scrypt.') ? raw.split('.') : raw.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;

  const [, N, r, p, salt, key] = parts;
  if (![N, r, p].every((n) => Number.isInteger(Number(n)) && Number(n) > 0)) return null;

  // base64url ve klasik base64'ün ikisi de çözülür.
  const dec = (v) => Buffer.from(v, /[-_]/.test(v) || !/[+/=]/.test(v) ? 'base64url' : 'base64');
  const saltBuf = dec(salt);
  const keyBuf = dec(key);
  if (!saltBuf.length || !keyBuf.length) return null;

  return { N: Number(N), r: Number(r), p: Number(p), salt: saltBuf, key: keyBuf };
}

/** Özetin yapısal olarak geçerli olup olmadığını söyler (teşhis için). */
const isHashWellFormed = (stored) => parseHash(stored) !== null;

/** Girilen parolayı saklanan özetle karşılaştırır. Zamanlama sızıntısı yapmaz. */
function verifyPassword(plain, stored) {
  try {
    const h = parseHash(stored);
    if (!h) return false;
    const actual = crypto.scryptSync(String(plain).normalize('NFKC'), h.salt, h.key.length, {
      N: h.N, r: h.r, p: h.p,
    });
    return crypto.timingSafeEqual(h.key, actual);
  } catch {
    return false;
  }
}

// ─────────────────────────── oturum ───────────────────────────

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET tanımlı değil ya da çok kısa. `npm run set-password` çalıştır.');
  }
  return s;
}

const sign = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

/** Son kullanma tarihi taşıyan, imzalı oturum jetonu üretir. */
function issueToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_DAYS * 864e5 })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Cookie başlığından tek bir çerezi okur. Express 5 çerezleri kendiliğinden ayrıştırmaz. */
function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

/**
 * Oturum çerezini yazar.
 *
 * `Secure` bayrağı ortam değişkenine değil, isteğin kendisine bakılarak eklenir:
 * Express `trust proxy` açık olduğu için `req.secure`, ters vekil sunucunun
 * gönderdiği X-Forwarded-Proto başlığını da hesaba katar. Böylece HTTPS
 * arkasında bayrak kendiliğinden açılır, localhost'ta ise açılmaz; unutulan bir
 * ayar yüzünden giriş sessizce bozulmaz.
 */
function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 86400}`,
  ];
  if (req.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

const isAuthenticated = (req) => verifyToken(readCookie(req, COOKIE));

/** Korumalı rotalar için ara katman. */
function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Oturum açman gerekiyor.' });
}

// ─────────────────────────── deneme sınırı ───────────────────────────

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map(); // ip -> { count, resetAt }

function rateLimit(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    return { allowed: false, retryInMin: Math.ceil((rec.resetAt - now) / 60000) };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - rec.count };
}

const resetRateLimit = (ip) => attempts.delete(ip);

// Süresi dolmuş kayıtları ara sıra temizle ki bellek sızıntısı olmasın.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of attempts) if (rec.resetAt < now) attempts.delete(ip);
}, WINDOW_MS).unref();

module.exports = {
  hashPassword, verifyPassword, isHashWellFormed,
  issueToken, verifyToken, isAuthenticated, requireAuth,
  setSessionCookie, clearSessionCookie, readCookie,
  rateLimit, resetRateLimit,
  COOKIE,
};
