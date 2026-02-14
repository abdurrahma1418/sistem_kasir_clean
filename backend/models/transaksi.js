/**
 * TOKO BUKU AA - TRANSAKSI MODEL (FIXED & SYNCED)
 */
const { query, transaction } = require("../config/database");
const logger = require("../utils/logger");
const barangModel = require("./barang");

const TransaksiModel = {
  /**
   * 1. STATISTIK HARI INI
   */
  getStatistikHariIni: async () => {
    try {
      const sql = `
            SELECT 
                COUNT(*) as total_transaksi, 
                COALESCE(SUM(total), 0) as total_penjualan,
                (SELECT COALESCE(SUM(jumlah), 0) FROM detail_transaksi dt 
                 JOIN transaksi t ON dt.id_transaksi = t.id_transaksi 
                 WHERE DATE(t.created_at) = CURDATE()) as total_items
            FROM transaksi 
            WHERE DATE(created_at) = CURDATE()
        `;
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      logger.error("Error getStatistikHariIni", { error: error.message });
      throw error;
    }
  },

  /**
   * 2. STATISTIK PERIODE
   */
  getStatistikPeriode: async (start, end) => {
    try {
      const sql = `
            SELECT 
                DATE(created_at) as tanggal,
                COUNT(*) as jumlah_transaksi,
                SUM(total) as total_pendapatan
            FROM transaksi
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `;
      return await query(sql, [start, end]);
    } catch (error) {
      logger.error("Error getStatistikPeriode", { error: error.message });
      throw error;
    }
  },

  /**
   * 3. MEMBUAT TRANSAKSI BARU
   */
  create: async (data) => {
    try {
      return await transaction(async (connection) => {
        // Validasi Stok
        const stockCheck = await barangModel.checkStockBatch(data.items);
        if (!stockCheck.available) {
          throw new Error(`Stok tidak mencukupi untuk beberapa barang`);
        }

        const nomor_transaksi = data.nomor_transaksi || `TRX-${Date.now()}`;
        const total = data.total;
        const bayar = data.bayar || 0;
        const kembalian = bayar >= total ? bayar - total : 0;
        const metode = data.metode_pembayaran || "cash";
        const status = metode === "cash" ? "lunas" : "pending";

        const [headerResult] = await connection.query(
          `INSERT INTO transaksi 
          (nomor_transaksi, total, bayar, kembalian, metode_pembayaran, status_pembayaran, external_id, payment_url) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nomor_transaksi,
            total,
            bayar,
            kembalian,
            metode,
            status,
            data.external_id || null,
            data.payment_url || null,
          ],
        );

        const transaksiId = headerResult.insertId;

        for (const item of data.items) {
          // PERBAIKAN: Normalisasi field id_barang
          const id_barang = item.id_barang || item.id_buku || item.id;
          const qty = item.jumlah || item.qty || item.quantity;
          const harga = item.harga || item.price;
          const subtotal = harga * qty;

          if (!id_barang) throw new Error("ID Barang tidak valid");

          // Simpan Detail
          await connection.query(
            `INSERT INTO detail_transaksi (id_transaksi, id_barang, jumlah, subtotal) VALUES (?, ?, ?, ?)`,
            [transaksiId, id_barang, qty, subtotal],
          );

          // Potong Stok
          await barangModel.deductStock(connection, id_barang, qty);
        }

        return { insertId: transaksiId, nomor_transaksi };
      });
    } catch (error) {
      logger.error("Error create transaksi", { error: error.message });
      throw error; // Ini penting agar transaction melakukan rollback
    }
  },

  /**
   * 4. AMBIL SEMUA TRANSAKSI
   */
  getAll: async () => {
    try {
      return await query("SELECT * FROM transaksi ORDER BY created_at DESC");
    } catch (error) {
      logger.error("Error getAll transaksi", { error: error.message });
      throw error;
    }
  },

  /**
   * 5. AMBIL DETAIL TRANSAKSI
   */
  getById: async (id) => {
    try {
      const rows = await query(
        "SELECT * FROM transaksi WHERE id_transaksi = ?",
        [id],
      );
      if (rows.length > 0) {
        // PERBAIKAN: JOIN ke tabel 'barang' bukan 'buku'
        const items = await query(
          `SELECT dt.*, b.nama as nama_barang 
           FROM detail_transaksi dt 
           JOIN barang b ON dt.id_barang = b.id_barang
           WHERE dt.id_transaksi = ?`,
          [id],
        );
        rows[0].items = items;
        return rows[0];
      }
      return null;
    } catch (error) {
      logger.error("Error getById transaksi", { error: error.message });
      throw error;
    }
  },

  /**
   * 6. HAPUS TRANSAKSI
   */
  delete: async (id) => {
    try {
      return await query("DELETE FROM transaksi WHERE id_transaksi = ?", [id]);
    } catch (error) {
      logger.error("Error delete transaksi", { error: error.message });
      throw error;
    }
  },
};

module.exports = TransaksiModel;
