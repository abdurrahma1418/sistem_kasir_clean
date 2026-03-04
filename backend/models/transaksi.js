/**
 * TOKO BUKU AA - TRANSAKSI MODEL (FIXED FOR MEMORY SCHEMA)
 */
const { query, transaction } = require("../config/database");
const logger = require("../utils/logger");

const TransaksiModel = {
  /**
   * 1. STATISTIK HARI INI
   */
  getStatistikHariIni: async () => {
    try {
      const sql = `
            SELECT 
                COUNT(*) as total_transaksi, 
                COALESCE(SUM(total_harga), 0) as total_penjualan,
                (SELECT COALESCE(SUM(jumlah), 0) FROM detail_transaksi dt 
                 JOIN transaksi t ON dt.id_transaksi = t.id_transaksi 
                 WHERE DATE(t.tgl_transaksi) = CURDATE()) as total_items
            FROM transaksi 
            WHERE DATE(tgl_transaksi) = CURDATE()
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
                DATE(tgl_transaksi) as tanggal,
                COUNT(*) as jumlah_transaksi,
                SUM(total_harga) as total_pendapatan
            FROM transaksi
            WHERE DATE(tgl_transaksi) BETWEEN ? AND ?
            GROUP BY DATE(tgl_transaksi)
            ORDER BY DATE(tgl_transaksi) ASC
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
        const nomor_transaksi = data.nomor_transaksi || `TRX-${Date.now()}`;
        const total = Number(data.total || 0);
        const bayar = Number(data.bayar || 0);
        const kembalian = bayar >= total ? bayar - total : 0;
        const metode = data.metode_pembayaran || "cash";
        const status =
          data.status || (metode === "cash" ? "SUCCESS" : "PENDING");

        // INSERT KE TABEL 'transaksi'
        // Catatan: Jika external_id & payment_url tidak ada di DB, bagian ini akan error.
        // Saya asumsikan Anda sudah menambahkannya atau ini akan di-skip.
        const [headerResult] = await connection.query(
          `INSERT INTO transaksi 
          (nomor_transaksi, tgl_transaksi, total_harga, bayar, kembalian, status, metode_pembayaran) 
          VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
          [nomor_transaksi, total, bayar, kembalian, status, metode],
        );

        const transaksiId = headerResult.insertId;

        for (const item of data.items) {
          // Normalisasi field sesuai tabel 'produk'
          const id_produk = item.id_produk || item.id_buku || item.id;
          const qty = Number(item.jumlah || item.qty || item.quantity || 0);
          const harga = Number(
            item.harga_satuan || item.harga || item.price || 0,
          );
          const subtotal = harga * qty;

          if (!id_produk)
            throw new Error("ID Produk tidak valid untuk salah satu item");

          // 1. Simpan ke detail_transaksi
          await connection.query(
            `INSERT INTO detail_transaksi (id_transaksi, id_produk, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)`,
            [transaksiId, id_produk, qty, harga, subtotal],
          );

          // 2. Potong Stok di tabel 'produk'
          await connection.query(
            `UPDATE produk SET stok = stok - ? WHERE id_produk = ?`,
            [qty, id_produk],
          );
        }

        return { insertId: transaksiId, nomor_transaksi };
      });
    } catch (error) {
      logger.error("Error create transaksi", { error: error.message });
      throw error;
    }
  },

  /**
   * 4. AMBIL SEMUA TRANSAKSI
   */
  getAll: async () => {
    try {
      return await query("SELECT * FROM transaksi ORDER BY tgl_transaksi DESC");
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
        // JOIN ke tabel 'produk' sesuai skema memori
        const items = await query(
          `SELECT dt.*, p.nama_produk 
           FROM detail_transaksi dt 
           JOIN produk p ON dt.id_produk = p.id_produk
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
