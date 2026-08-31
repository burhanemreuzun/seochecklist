const express = require('express');
const { getPool } = require('../db/pool');
const { auditUrl } = require('../audit');

const router = express.Router();
const db = () => getPool();

/** async route hatalarini merkezi hata yakalayiciya tasir. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const httpError = (status, message) => Object.assign(new Error(message), { status });

function validUrl(value) {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

// ─────────────────────────── saglik ───────────────────────────
router.get('/health', wrap(async (_req, res) => {
  let database = 'down';
  try {
    await db().query('SELECT 1');
    database = 'up';
  } catch { /* down kalir */ }
  res.json({
    ok: database === 'up',
    database,
    ai: process.env.GEMINI_API_KEY
      ? { enabled: true, model: process.env.GEMINI_MODEL || 'gemini-3.7-flash' }
      : { enabled: false, model: null },
  });
}));

// ─────────────────────────── checklist tanimi ───────────────────────────
router.get('/checklist', wrap(async (_req, res) => {
  const [categories] = await db().query('SELECT * FROM categories ORDER BY sort');
  const [items] = await db().query(
    'SELECT code, category_key, label, why, how, severity, weight, mode, sort FROM checklist_items WHERE is_active = 1 ORDER BY sort'
  );
  res.json({ categories, items });
}));

// ─────────────────────────── yazilar ───────────────────────────
router.get('/posts', wrap(async (req, res) => {
  const { status, q } = req.query;
  const where = [];
  const params = {};
  if (status) { where.push('p.status = :status'); params.status = status; }
  if (q) { where.push('(p.title LIKE :q OR p.url LIKE :q)'); params.q = `%${q}%`; }

  const [rows] = await db().query(
    `SELECT p.*,
            (SELECT COUNT(*) FROM post_checks c WHERE c.post_id = p.id AND c.is_checked = 1) AS checked_count,
            (SELECT a.score FROM audits a WHERE a.post_id = p.id ORDER BY a.id DESC LIMIT 1) AS last_score,
            (SELECT a.created_at FROM audits a WHERE a.post_id = p.id ORDER BY a.id DESC LIMIT 1) AS last_audit_at
       FROM posts p
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY p.updated_at DESC
       LIMIT 200`,
    params
  );
  res.json(rows);
}));

router.post('/posts', wrap(async (req, res) => {
  const { title, url, focus_keyword, editor, status, notes } = req.body || {};
  if (!title || !String(title).trim()) throw httpError(400, 'Baslik zorunlu.');
  if (url && !validUrl(url)) throw httpError(400, 'Gecerli bir http/https adresi gir.');

  const [r] = await db().query(
    `INSERT INTO posts (title, url, focus_keyword, editor, status, notes)
     VALUES (:title, :url, :focus_keyword, :editor, :status, :notes)`,
    {
      title: String(title).trim(),
      url: url ? validUrl(url) : null,
      focus_keyword: focus_keyword || null,
      editor: editor || null,
      status: ['draft', 'review', 'published'].includes(status) ? status : 'draft',
      notes: notes || null,
    }
  );
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [r.insertId]);
  res.status(201).json(post);
}));

router.get('/posts/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, 'Yazi bulunamadi.');

  const [checks] = await db().query('SELECT * FROM post_checks WHERE post_id = ?', [id]);
  const [[audit]] = await db().query(
    'SELECT * FROM audits WHERE post_id = ? ORDER BY id DESC LIMIT 1', [id]
  );
  let findings = [];
  if (audit) {
    const [rows] = await db().query('SELECT * FROM audit_findings WHERE audit_id = ?', [audit.id]);
    findings = rows;
  }
  res.json({ post, checks, audit: audit || null, findings });
}));

router.patch('/posts/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['title', 'url', 'focus_keyword', 'editor', 'status', 'notes'];
  const fields = allowed.filter((k) => k in (req.body || {}));
  if (!fields.length) throw httpError(400, 'Guncellenecek alan yok.');
  if (req.body.url && !validUrl(req.body.url)) throw httpError(400, 'Gecerli bir http/https adresi gir.');

  const params = { id };
  fields.forEach((k) => { params[k] = req.body[k] === '' ? null : req.body[k]; });
  await db().query(
    `UPDATE posts SET ${fields.map((k) => `${k} = :${k}`).join(', ')} WHERE id = :id`,
    params
  );
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, 'Yazi bulunamadi.');
  res.json(post);
}));

router.delete('/posts/:id', wrap(async (req, res) => {
  const [r] = await db().query('DELETE FROM posts WHERE id = ?', [Number(req.params.id)]);
  if (!r.affectedRows) throw httpError(404, 'Yazi bulunamadi.');
  res.status(204).end();
}));

// ─────────────────────────── elle isaretleme ───────────────────────────
router.put('/posts/:id/checks/:code', wrap(async (req, res) => {
  const postId = Number(req.params.id);
  const code = req.params.code;
  const isChecked = req.body?.is_checked ? 1 : 0;
  const note = req.body?.note ?? null;
  const by = req.body?.checked_by || null;

  const [[item]] = await db().query('SELECT code FROM checklist_items WHERE code = ?', [code]);
  if (!item) throw httpError(404, 'Checklist maddesi bulunamadi.');

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
/** Denetimi calistirir; postId verilirse sonucu kalici olarak kaydeder. */
async function runAndStore({ url, focusKeyword, postId = null, useAi = true }) {
  let result, error = null;
  try {
    result = await auditUrl(url, { focusKeyword, useAi });
  } catch (err) {
    error = err.message;
    throw Object.assign(err, { status: err.code === 'FETCH_FAILED' || err.code === 'BAD_STATUS' ? 422 : 500 });
  } finally {
    if (postId && error) {
      await db().query(
        `INSERT INTO audits (post_id, url, focus_keyword, score, error) VALUES (?,?,?,0,?)`,
        [postId, url, focusKeyword || null, error]
      );
    }
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
        .map((f) => [auditId, f.code, f.status, f.source, f.message || null, f.evidence ? String(f.evidence).slice(0, 4000) : null]);
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

/** Kayitli bir yaziyi denetler. */
router.post('/posts/:id/audit', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [[post]] = await db().query('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, 'Yazi bulunamadi.');

  const url = validUrl(req.body?.url || post.url || '');
  if (!url) throw httpError(400, 'Bu yazi icin gecerli bir URL tanimli degil.');

  if (url !== post.url) await db().query('UPDATE posts SET url = ? WHERE id = ?', [url, id]);

  const result = await runAndStore({
    url,
    focusKeyword: req.body?.focus_keyword ?? post.focus_keyword,
    postId: id,
    useAi: req.body?.use_ai !== false,
  });
  res.json(result);
}));

/** Kayit acmadan tek seferlik denetim. */
router.post('/audit', wrap(async (req, res) => {
  const url = validUrl(req.body?.url || '');
  if (!url) throw httpError(400, 'Gecerli bir http/https adresi gir.');
  const result = await runAndStore({
    url,
    focusKeyword: req.body?.focus_keyword,
    useAi: req.body?.use_ai !== false,
  });
  res.json(result);
}));

router.get('/posts/:id/audits', wrap(async (req, res) => {
  const [rows] = await db().query(
    'SELECT id, score, pass_count, warn_count, fail_count, ai_used, error, created_at FROM audits WHERE post_id = ? ORDER BY id DESC LIMIT 20',
    [Number(req.params.id)]
  );
  res.json(rows);
}));

module.exports = router;
