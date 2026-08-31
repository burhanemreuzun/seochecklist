const express = require('express');
const { getPool } = require('../db/pool');
const { auditUrl } = require('../audit');

const router = express.Router();
const db = () => getPool();

/** async rota hatalarını merkezî hata yakalayıcıya taşır. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const httpError = (status, message) => Object.assign(new Error(message), { status });

const STATUSES = ['draft', 'review', 'published'];

/** Yol parametresindeki kimliği doğrular; geçersizse 400 üretir. */
function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Geçersiz kayıt numarası.');
  return id;
}

function validUrl(value) {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

/**
 * Yazı alanlarını doğrular ve veritabanına yazılabilir hale getirir.
 * Ham MySQL hatalarının kullanıcıya sızmaması için tüm sınırlar burada uygulanır.
 */
function cleanPostFields(body, { partial = false } = {}) {
  const out = {};

  if ('title' in body) {
    const title = String(body.title ?? '').trim();
    if (!title) throw httpError(400, 'Yazı başlığı boş bırakılamaz.');
    if (title.length > 255) throw httpError(400, 'Yazı başlığı en fazla 255 karakter olabilir.');
    out.title = title;
  } else if (!partial) {
    throw httpError(400, 'Yazı başlığı zorunlu.');
  }

  if ('url' in body) {
    const raw = String(body.url ?? '').trim();
    if (!raw) out.url = null;
    else {
      const url = validUrl(raw);
      if (!url) throw httpError(400, 'Geçerli bir http veya https adresi gir.');
      if (url.length > 768) throw httpError(400, 'Adres çok uzun.');
      out.url = url;
    }
  }

  if ('focus_keyword' in body) {
    const kw = String(body.focus_keyword ?? '').trim();
    if (kw.length > 160) throw httpError(400, 'Odak anahtar kelime en fazla 160 karakter olabilir.');
    out.focus_keyword = kw || null;
  }

  if ('editor' in body) {
    const ed = String(body.editor ?? '').trim();
    out.editor = ed ? ed.slice(0, 120) : null;
  }

  if ('status' in body) {
    const st = String(body.status ?? '').trim();
    if (!STATUSES.includes(st)) throw httpError(400, 'Geçersiz durum. Taslak, kontrolde veya yayında olmalı.');
    out.status = st;
  }

  if ('notes' in body) {
    const n = String(body.notes ?? '').trim();
    out.notes = n || null;
  }

  return out;
}

// ─────────────────────────── sağlık ───────────────────────────
router.get('/health', wrap(async (_req, res) => {
  let database = 'kapalı';
  try {
    await db().query('SELECT 1');
    database = 'açık';
  } catch { /* kapalı kalır */ }
  res.json({
    ok: database === 'açık',
    database,
    ai: process.env.GEMINI_API_KEY
      ? { enabled: true, model: process.env.GEMINI_MODEL || 'gemini-3.7-flash' }
      : { enabled: false, model: null },
  });
}));

// ─────────────────────────── kontrol listesi tanımı ───────────────────────────
router.get('/checklist', wrap(async (_req, res) => {
  const [categories] = await db().query('SELECT * FROM categories ORDER BY sort');
  const [items] = await db().query(
    `SELECT code, category_key, label, why, how, severity, weight, mode, sort
       FROM checklist_items WHERE is_active = 1 ORDER BY sort`
  );
  res.json({ categories, items });
}));

// ─────────────────────────── yazılar ───────────────────────────
router.get('/posts', wrap(async (req, res) => {
  const { status, q } = req.query;
  const where = [];
  const params = {};
  if (status) {
    if (!STATUSES.includes(String(status))) throw httpError(400, 'Geçersiz durum süzgeci.');
    where.push('p.status = :status');
    params.status = status;
  }
  if (q) { where.push('(p.title LIKE :q OR p.url LIKE :q)'); params.q = `%${q}%`; }

  const [rows] = await db().query(
    `SELECT p.*,
            (SELECT COUNT(*) FROM post_checks c WHERE c.post_id = p.id AND c.is_checked = 1) AS checked_count,
            (SELECT a.score FROM audits a WHERE a.post_id = p.id AND a.error IS NULL ORDER BY a.id DESC LIMIT 1) AS last_score,
            (SELECT a.created_at FROM audits a WHERE a.post_id = p.id AND a.error IS NULL ORDER BY a.id DESC LIMIT 1) AS last_audit_at
       FROM posts p
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY p.updated_at DESC
       LIMIT 200`,
    params
  );
  res.json(rows);
}));

router.post('/posts', wrap(async (req, res) => {
  const f = cleanPostFields(req.body || {});
  const [r] = await db().query(
    `INSERT INTO posts (title, url, focus_keyword, editor, status, notes)
     VALUES (:title, :url, :focus_keyword, :editor, :status, :notes)`,
    {
      title: f.title,
      url: f.url ?? null,
      focus_keyword: f.focus_keyword ?? null,
      editor: f.editor ?? null,
      status: f.status ?? 'draft',
      notes: f.notes ?? null,
    }
  );
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [r.insertId]);
  res.status(201).json(post);
}));

router.get('/posts/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, 'Yazı bulunamadı.');

  const [checks] = await db().query('SELECT * FROM post_checks WHERE post_id = ?', [id]);
  const [[audit]] = await db().query(
    'SELECT * FROM audits WHERE post_id = ? AND error IS NULL ORDER BY id DESC LIMIT 1', [id]
  );
  let findings = [];
  if (audit) {
    const [rows] = await db().query('SELECT * FROM audit_findings WHERE audit_id = ?', [audit.id]);
    findings = rows;
  }
  res.json({ post, checks, audit: audit || null, findings });
}));

router.patch('/posts/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const f = cleanPostFields(req.body || {}, { partial: true });
  const keys = Object.keys(f);
  if (!keys.length) throw httpError(400, 'Güncellenecek alan yok.');

  const [r] = await db().query(
    `UPDATE posts SET ${keys.map((k) => `${k} = :${k}`).join(', ')} WHERE id = :id`,
    { ...f, id }
  );
  if (!r.affectedRows) {
    const [[exists]] = await db().query('SELECT id FROM posts WHERE id = ?', [id]);
    if (!exists) throw httpError(404, 'Yazı bulunamadı.');
  }
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [id]);
  res.json(post);
}));

router.delete('/posts/:id', wrap(async (req, res) => {
  const [r] = await db().query('DELETE FROM posts WHERE id = ?', [parseId(req.params.id)]);
  if (!r.affectedRows) throw httpError(404, 'Yazı bulunamadı.');
  res.status(204).end();
}));

// ─────────────────────────── elle işaretleme ───────────────────────────
router.put('/posts/:id/checks/:code', wrap(async (req, res) => {
  const postId = parseId(req.params.id);
  const code = String(req.params.code);

  const [[post]] = await db().query('SELECT id FROM posts WHERE id = ?', [postId]);
  if (!post) throw httpError(404, 'Yazı bulunamadı.');

  const [[item]] = await db().query('SELECT code, mode FROM checklist_items WHERE code = ?', [code]);
  if (!item) throw httpError(404, 'Kontrol listesi maddesi bulunamadı.');
  // Ürün kuralı: makinenin ölçebildiği maddeyi editör elle işaretleyemez.
  if (item.mode !== 'manual')
    throw httpError(409, 'Bu madde otomatik ölçülüyor, elle işaretlenemez. Denetimi çalıştır.');

  const isChecked = req.body?.is_checked ? 1 : 0;
  const note = req.body?.note ? String(req.body.note).slice(0, 2000) : null;
  const by = req.body?.checked_by ? String(req.body.checked_by).slice(0, 120) : null;

  await db().query(
    `INSERT INTO post_checks (post_id, item_code, is_checked, note, checked_by, checked_at)
     VALUES (:postId, :code, :isChecked, :note, :by, :ts)
     ON DUPLICATE KEY UPDATE
       is_checked = VALUES(is_checked), note = VALUES(note),
       checked_by = VALUES(checked_by), checked_at = VALUES(checked_at)`,
    { postId, code, isChecked, note, by, ts: isChecked ? new Date() : null }
  );
  const [[row]] = await db().query(
    'SELECT * FROM post_checks WHERE post_id = ? AND item_code = ?', [postId, code]
  );
  res.json(row);
}));

// ─────────────────────────── denetim ───────────────────────────
/** Denetimi çalıştırır; postId verilirse sonucu kalıcı olarak kaydeder. */
async function runAndStore({ url, focusKeyword, postId = null, useAi = true }) {
  let result;
  try {
    result = await auditUrl(url, { focusKeyword, useAi });
  } catch (err) {
    if (postId) {
      // Başarısız denetim de kayda geçer; neyin ne zaman denendiği kaybolmasın.
      await db().query(
        'INSERT INTO audits (post_id, url, focus_keyword, score, error) VALUES (?,?,?,0,?)',
        [postId, url, focusKeyword || null, err.message]
      ).catch(() => { /* kayıt tutulamadıysa asıl hatayı gölgeleme */ });
    }
    throw Object.assign(err, {
      status: ['FETCH_FAILED', 'BAD_STATUS'].includes(err.code) ? 422 : 500,
    });
  }

  if (postId) {
    const conn = await db().getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query(
        `INSERT INTO audits (post_id, url, focus_keyword, score, pass_count, warn_count, fail_count, ai_used, duration_ms)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [postId, result.url, focusKeyword || null, result.score, result.counts.pass,
         result.counts.warn, result.counts.fail, result.ai.used ? 1 : 0, result.durationMs]
      );
      const auditId = ins.insertId;
      const rows = result.findings
        .filter((f) => f.status !== 'manual')
        .map((f) => [auditId, f.code, f.status, f.source, f.message || null,
                     f.evidence ? String(f.evidence).slice(0, 4000) : null]);
      if (rows.length) {
        await conn.query(
          'INSERT INTO audit_findings (audit_id, item_code, status, source, message, evidence) VALUES ?',
          [rows]
        );
      }
      await conn.commit();
      result.auditId = auditId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
  return result;
}

/** Kayıtlı bir yazıyı denetler. */
router.post('/posts/:id/audit', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, 'Yazı bulunamadı.');

  const url = validUrl(String(req.body?.url || post.url || '').trim());
  if (!url) throw httpError(400, 'Bu yazı için geçerli bir adres tanımlı değil.');
  if (url !== post.url) await db().query('UPDATE posts SET url = ? WHERE id = ?', [url, id]);

  const result = await runAndStore({
    url,
    focusKeyword: req.body?.focus_keyword ?? post.focus_keyword,
    postId: id,
    useAi: req.body?.use_ai !== false,
  });
  res.json(result);
}));

/** Kayıt açmadan tek seferlik denetim. */
router.post('/audit', wrap(async (req, res) => {
  const url = validUrl(String(req.body?.url || '').trim());
  if (!url) throw httpError(400, 'Geçerli bir http veya https adresi gir.');
  const result = await runAndStore({
    url,
    focusKeyword: req.body?.focus_keyword,
    useAi: req.body?.use_ai !== false,
  });
  res.json(result);
}));

router.get('/posts/:id/audits', wrap(async (req, res) => {
  const [rows] = await db().query(
    `SELECT id, score, pass_count, warn_count, fail_count, ai_used, error, created_at
       FROM audits WHERE post_id = ? ORDER BY id DESC LIMIT 20`,
    [parseId(req.params.id)]
  );
  res.json(rows);
}));

module.exports = router;
