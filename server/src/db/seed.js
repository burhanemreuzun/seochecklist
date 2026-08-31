/**
 * checklist.seed.js içindeki madde tanımlarını veritabanına yazar.
 * Var olan maddeleri günceller, listeden çıkarılanları pasife çeker; silmez,
 * çünkü eski denetim kayıtları onlara bağlıdır.
 *   npm run db:seed
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../../.env') });
const { getPool } = require('./pool');
const audit = require('./checklist.seed');
const writing = require('./writing.seed');

const LISTS = [
  { list: 'audit', ...audit },
  { list: 'write', ...writing },
];

(async () => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const allCodes = [];
    let toplamMadde = 0;
    let toplamKategori = 0;

    for (const { list, CATEGORIES, ITEMS } of LISTS) {
      for (const c of CATEGORIES) {
        await conn.query(
          `INSERT INTO categories (\`key\`, \`list\`, label, icon, sort) VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             \`list\`=VALUES(\`list\`), label=VALUES(label), icon=VALUES(icon), sort=VALUES(sort)`,
          [c.key, list, c.label, c.icon, c.sort]
        );
      }
      toplamKategori += CATEGORIES.length;

      let sort = 0;
      for (const it of ITEMS) {
        sort += 10;
        await conn.query(
          `INSERT INTO checklist_items
             (code, \`list\`, category_key, label, why, how, severity, weight, mode, sort, is_active)
           VALUES (?,?,?,?,?,?,?,?,?,?,1)
           ON DUPLICATE KEY UPDATE
             \`list\`=VALUES(\`list\`), category_key=VALUES(category_key), label=VALUES(label),
             why=VALUES(why), how=VALUES(how), severity=VALUES(severity), weight=VALUES(weight),
             mode=VALUES(mode), sort=VALUES(sort), is_active=1`,
          // Yazım listesinin tamamı elle işaretlenir: ortada ölçülecek bir sayfa yoktur.
          [it.code, list, it.category, it.label, it.why, it.how, it.severity, it.weight,
           it.mode || 'manual', sort]
        );
        allCodes.push(it.code);
      }
      toplamMadde += ITEMS.length;
    }

    const codes = allCodes;
    const [res] = await conn.query(
      `UPDATE checklist_items SET is_active = 0 WHERE code NOT IN (?)`,
      [codes]
    );

    await conn.commit();
    console.log(`✔ ${toplamKategori} kategori, ${toplamMadde} madde yazıldı (denetim + yazım).`);
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
