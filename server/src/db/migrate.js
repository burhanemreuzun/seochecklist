/**
 * Veritabanını ve tabloları oluşturur. Tekrar tekrar çalıştırılabilir, zarar vermez.
 *   npm run db:migrate
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../../.env') });
const fs = require('fs');
const path = require('path');
const { serverConnection, config } = require('./pool');

/** MySQL'de "ADD COLUMN IF NOT EXISTS" yok; sütunun varlığı önce sorgulanır. */
async function addMissingColumns(conn, database) {
  const columns = [
    ['categories',      'list', "VARCHAR(16) NOT NULL DEFAULT 'audit' AFTER `key`"],
    ['checklist_items', 'list', "VARCHAR(16) NOT NULL DEFAULT 'audit' AFTER code"],
    ['posts',           'flow', "ENUM('audit','write') NOT NULL DEFAULT 'audit' AFTER editor"],
  ];
  for (const [table, column, definition] of columns) {
    const [[row]] = await conn.query(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [database, table, column]
    );
    if (!row.n) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`  + ${table}.${column} sütunu eklendi`);
    }
  }
}

(async () => {
  const conn = await serverConnection();
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.changeUser({ database: config.database });

    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(sql);

    // CREATE TABLE IF NOT EXISTS var olan tabloya sütun eklemez; eski
    // kurulumları güncel şemaya taşımak için eksik sütunlar burada eklenir.
    await addMissingColumns(conn, config.database);

    console.log(`✔ Veritabanı hazır: ${config.database} @ ${config.host}:${config.port}`);
  } catch (err) {
    console.error('✖ Veritabanı kurulum hatası:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
