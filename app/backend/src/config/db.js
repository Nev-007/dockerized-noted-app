const mysql = require('mysql2/promise');

let pool = null;

/** Validate that a database name contains only safe identifier characters. */
function assertSafeIdentifier(name) {
  if (!/^[A-Za-z0-9_$]+$/.test(name)) {
    throw new Error(`Unsafe DB_NAME value: "${name}". Only letters, digits, underscores, and $ are allowed.`);
  }
}

/**
 * Bootstrap: create the database if it doesn't exist,
 * then build a pool scoped to that database.
 */
async function initDB() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_PASSWORD) {
    throw new Error('DB_PASSWORD environment variable is required');
  }

  // Guard against SQL injection via DB_NAME template literal below.
  assertSafeIdentifier(DB_NAME);

  // 1. Connect WITHOUT a database to run CREATE DATABASE
  const bootstrap = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 2,
  });

  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``
  );
  await bootstrap.end();

  // 2. Create the app pool scoped to the database
  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // 3. Create the notes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(200) NOT NULL,
      content    TEXT NOT NULL,
      tag        VARCHAR(50) DEFAULT 'general',
      pinned     TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log(`✅  Database "${DB_NAME}" ready`);
}

/**
 * Return the live pool reference.
 */
function getPool() {
  if (!pool) throw new Error('Database not initialised – call initDB() first');
  return pool;
}

module.exports = { initDB, getPool };
