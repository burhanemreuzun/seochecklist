/**
 * checklist.seed.js içindeki madde tanımlarını veritabanına yazar.
 * Var olan maddeleri günceller, listeden çıkarılanları pasife çeker; silmez,
 * çünkü eski denetim kayıtları onlara bağlıdır.
 *   npm run db:seed
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../../.env') });
const { getPool } = require('./pool');
const { CATEGORIES, ITEMS } = require('./checklist.seed');

(async () => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const c of CATEGORIES) {
      await conn.query(
        `INSERT INTO categories (\`key\`, label, icon, sort) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE label=VALUES(label), icon=VALUES(icon), sort=VALUES(sort)`,
        [c.key, c.label, c.icon, c.sort]
      );
    }

    let sort = 0;
    for (const it of ITEMS) {
      sort += 10;
      await conn.query(
        `INSERT INTO checklist_items
           (code, category_key, label, why, how, severity, weight, mode, sort, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,1)
         ON DUPLICATE KEY UPDATE
           category_key=VALUES(category_key), label=VALUES(label), why=VALUES(why),
           how=VALUES(how), severity=VALUES(severity), weight=VALUES(weight),
           mode=VALUES(mode), sort=VALUES(sort), is_active=1`,
        [it.code, it.category, it.label, it.why, it.how, it.severity, it.weight, it.mode, sort]
      );
    }

    const codes = ITEMS.map((i) => i.code);
    const [res] = await conn.query(
      `UPDATE checklist_items SET is_active = 0 WHERE code NOT IN (?)`,
      [codes]
    );

    await conn.commit();
    console.log(`✔ ${CATEGORIES.length} kategori, ${ITEMS.length} madde yazıldı.`);
    if (res.affectedRows) console.log(`  ${res.affectedRows} eski madde pasife alındı.`);
  } catch (err) {
    await conn.rollback();
    console.error('✖ Madde yükleme hatası:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
