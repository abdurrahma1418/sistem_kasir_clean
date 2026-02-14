/**
 * TOKO BUKU AA - DATABASE CONFIGURATION (ULTRA STABLE)
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "buku_aa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Kita matikan dulu namedPlaceholders agar format standar ? bisa jalan universal
  namedPlaceholders: false,
};

const pool = mysql.createPool(poolConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Database Terhubung: ${poolConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database Gagal Konek:", error.message);
    return false;
  }
}

/**
 * Perbaikan Fungsi Query agar tidak crash saat params kosong
 */
async function query(sql, params = []) {
  try {
    // Pastikan params selalu array jika namedPlaceholders false
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error("❌ Database Query Error:", error.message);
    throw error;
  }
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Berikan koneksi ke callback agar query di dalam transaksi pakai koneksi yang sama
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error("❌ Transaction Error:", error.message);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
