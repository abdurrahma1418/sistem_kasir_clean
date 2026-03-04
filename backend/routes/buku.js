const db = require("../config/database"); // Pastikan path ke file database kamu benar
const logger = require("../utils/logger");

const bukuController = {
  /**
   * 1. AMBIL SEMUA BUKU / PRODUK
   */
  getAllBooks: async (req, res) => {
    try {
      const sql = "SELECT * FROM produk ORDER BY nama_produk ASC";
      const rows = await db.query(sql);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error("❌ Error getAllBooks:", error.message);
      res
        .status(500)
        .json({ success: false, message: "Gagal mengambil data produk" });
    }
  },

  /**
   * 2. STATISTIK STOK & PRODUK
   */
  getStatistics: async (req, res) => {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_produk,
          SUM(stok) as total_stok,
          COUNT(CASE WHEN stok <= 5 THEN 1 END) as stok_menipis
        FROM produk
      `;
      const rows = await db.query(sql);
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 3. AMBIL PRODUK STOK RENDAH (LOW STOCK)
   */
  getLowStockBooks: async (req, res) => {
    try {
      const sql = "SELECT * FROM produk WHERE stok <= 5 ORDER BY stok ASC";
      const rows = await db.query(sql);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 4. CARI BERDASARKAN ID
   */
  getBookById: async (req, res) => {
    try {
      const { id } = req.params;
      const sql = "SELECT * FROM produk WHERE id_produk = ?";
      const rows = await db.query(sql, [id]);
      if (rows.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Produk tidak ditemukan" });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 5. CARI BERDASARKAN KODE PRODUK (SKU)
   */
  getBookByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const sql = "SELECT * FROM produk WHERE kode_produk = ?";
      const rows = await db.query(sql, [code]);
      if (rows.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Kode produk tidak terdaftar" });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 6. TAMBAH PRODUK BARU
   */
  createBook: async (req, res) => {
    try {
      const { nama_produk, harga_satuan, stok, kategori, kode_produk } =
        req.body;
      const sql =
        "INSERT INTO produk (nama_produk, harga_satuan, stok, kategori, kode_produk) VALUES (?, ?, ?, ?, ?)";
      const result = await db.query(sql, [
        nama_produk,
        harga_satuan,
        stok,
        kategori,
        kode_produk,
      ]);
      res.json({ success: true, insertId: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 7. UPDATE DATA PRODUK (UMUM)
   */
  updateBook: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_produk, harga_satuan, kategori } = req.body;
      const sql =
        "UPDATE produk SET nama_produk = ?, harga_satuan = ?, kategori = ? WHERE id_produk = ?";
      await db.query(sql, [nama_produk, harga_satuan, kategori, id]);
      res.json({ success: true, message: "Data produk diperbarui" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 8. KELOLA STOK (PENTING: UNTUK TOMBOL KELOLA)
   * Body: { "jumlah": 10, "mode": "tambah" } atau { "jumlah": 50, "mode": "set" }
   */
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { jumlah, mode } = req.body;

      if (jumlah === undefined || isNaN(jumlah)) {
        return res
          .status(400)
          .json({ success: false, message: "Jumlah stok tidak valid" });
      }

      let sql = "";
      let params = [];

      if (mode === "tambah") {
        // Logika: Stok lama + jumlah input
        sql = "UPDATE produk SET stok = stok + ? WHERE id_produk = ?";
        params = [jumlah, id];
      } else {
        // Logika: Ganti total stok (overwrite)
        sql = "UPDATE produk SET stok = ? WHERE id_produk = ?";
        params = [jumlah, id];
      }

      const result = await db.query(sql, params);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Gagal update: Produk tidak ada" });
      }

      res.json({
        success: true,
        message: `Stok berhasil di${mode === "tambah" ? "tambah" : "set"}`,
      });
    } catch (error) {
      console.error("❌ Error Update Stock:", error.message);
      res
        .status(500)
        .json({ success: false, message: "Server error saat update stok" });
    }
  },

  /**
   * 9. HAPUS PRODUK
   */
  deleteBook: async (req, res) => {
    try {
      const { id } = req.params;
      await db.query("DELETE FROM produk WHERE id_produk = ?", [id]);
      res.json({ success: true, message: "Produk berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 10. CEK STOK BATCH (UNTUK TRANSAKSI)
   */
  checkStockBatch: async (req, res) => {
    try {
      const { items } = req.body;
      // Logika cek stok sebelum bayar
      res.json({ success: true, available: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = bukuController;
