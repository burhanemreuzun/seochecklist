/**
 * Veritabanını ve tabloları oluşturur. Tekrar tekrar çalıştırılabilir, zarar vermez.
 *   npm run db:migrate
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../../.env') });
const fs = require('fs');
const path = require('path');
const { serverConnection, config } = require('./pool');

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

    console.log(`✔ Veritabanı hazır: ${config.database} @ ${config.host}:${config.port}`);
  } catch (err) {
    console.error('✖ Veritabanı kurulum hatası:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
