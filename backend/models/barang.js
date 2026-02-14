/**
 * TOKO BUKU AA - BARANG/BUKU MODEL (FIXED)
 */

const { query } = require("../config/database");
const logger = require("../utils/logger");

class BarangModel {
  /**
   * [BARU] CEK STOK SEKALIGUS (Batch)
   * Dibutuhkan oleh TransaksiModel sebelum memproses pembayaran
   */
  async checkStockBatch(items) {
    try {
      for (const item of items) {
        const id_barang = item.id_barang || item.id;
        const qty_beli = item.jumlah || item.quantity;

        // Ambil stok dari database (sesuaikan nama tabel 'buku' atau 'barang')
        const sql = `SELECT stok, nama FROM barang WHERE id_barang = ?`;
        const rows = await query(sql, [id_barang]);

        if (rows.length === 0) {
          return {
            available: false,
            message: `Produk ID ${id_barang} tidak ditemukan`,
          };
        }

        if (rows[0].stok < qty_beli) {
          return {
            available: false,
            message: `Stok "${rows[0].nama}" tidak mencukupi (Sisa: ${rows[0].stok})`,
          };
        }
      }
      return { available: true };
    } catch (error) {
      logger.error("Error checkStockBatch:", error.message);
      throw error;
    }
  }

  /**
   * Potong Stok (Digunakan untuk transaksi)
   * Menggunakan connection dari transaction pool agar atomik
   */
  async deductStock(connection, id_barang, quantity) {
    const sql = `UPDATE barang SET stok = stok - ? WHERE id_barang = ? AND stok >= ?`;

    // Pastikan menggunakan connection.query dari parameter (untuk transaction)
    const [result] = await connection.query(sql, [
      quantity,
      id_barang,
      quantity,
    ]);

    if (result.affectedRows === 0) {
      throw new Error(
        `Gagal potong stok: Barang ID ${id_barang} tidak cukup atau hilang`,
      );
    }
    return result;
  }

  /**
   * Get all barang dengan filter
   */
  async findAll(filters = {}) {
    try {
      let sql = `SELECT * FROM barang WHERE 1=1`;
      const params = [];

      if (filters.search) {
        sql += " AND (nama LIKE ? OR kode_barang LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.minStok !== undefined) {
        sql += " AND stok >= ?";
        params.push(parseInt(filters.minStok));
      }

      sql += " ORDER BY id_barang DESC";

      if (filters.limit) {
        sql += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      return await query(sql, params);
    } catch (error) {
      logger.error("Error fetching barang:", error.message);
      throw new Error("Gagal mengambil data barang");
    }
  }

  async findById(id) {
    try {
      const sql = `SELECT * FROM barang WHERE id_barang = ?`;
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      logger.error(`Error findById ${id}:`, error.message);
      throw new Error("Gagal mengambil detail barang");
    }
  }

  async create(data) {
    try {
      const sql = `INSERT INTO barang (kode_barang, nama, harga_beli, harga_jual, stok) VALUES (?, ?, ?, ?, ?)`;
      const params = [
        data.kode_barang || `BRG-${Date.now()}`,
        data.nama,
        data.harga_beli || 0,
        data.harga_jual,
        data.stok || 0,
      ];

      const result = await query(sql, params);
      return await this.findById(result.insertId);
    } catch (error) {
      logger.error("Error create barang:", error.message);
      throw new Error("Gagal menambah barang baru");
    }
  }

  async delete(id) {
    try {
      const sql = "DELETE FROM barang WHERE id_barang = ?";
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error("Error deleting barang:", error.message);
      throw new Error("Gagal menghapus barang");
    }
  }
}

// Pastikan ekspor sudah benar sebagai instance
module.exports = new BarangModel();
