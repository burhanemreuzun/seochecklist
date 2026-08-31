const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'seochecklist',
  charset: 'utf8mb4',
  // Sınırı olmayan bağlantı denemesi, yanlış yapılandırılmış bir sunucuda tüm
  // isteklerin donmasına yol açar. Hızlı başarısızlık tercih edilir.
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true,
};

let pool;
function getPool() {
  if (!pool) pool = mysql.createPool(config);
  return pool;
}

/** Veritabanı adı olmadan bağlanır — CREATE DATABASE için gerekli. */
function serverConnection() {
  const { database, connectionLimit, waitForConnections, ...rest } = config;
  return mysql.createConnection({ ...rest, multipleStatements: true });
}

module.exports = { getPool, serverConnection, config };
