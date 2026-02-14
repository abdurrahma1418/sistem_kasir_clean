const { pool } = require("../config/database");

class LaporanController {
  // 1. Statistik
  getStatistik = async (req, res) => {
    try {
      const [results] = await pool.query(`
        SELECT COALESCE(SUM(total), 0) as total_penjualan, COUNT(id_transaksi) as total_transaksi
        FROM transaksi WHERE DATE(tanggal) = CURDATE()
      `);
      res.json({ success: true, data: results[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 2. Produk Terlaris
  getTopProducts = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const [results] = await pool.query(
        `
        SELECT b.nama, SUM(dt.jumlah) as total_terjual 
        FROM detail_transaksi dt 
        JOIN barang b ON dt.id_barang = b.id_barang 
        GROUP BY b.id_barang ORDER BY total_terjual DESC LIMIT ?
      `,
        [limit],
      );
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 3. Laporan Harian
  getDailyReport = async (req, res) => {
    try {
      const [results] = await pool.query(
        "SELECT * FROM transaksi WHERE DATE(tanggal) = CURDATE()",
      );
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 4. Laporan Bulanan (INI YANG SERING BIKIN CRASH KALAU HILANG)
  getMonthlyReport = async (req, res) => {
    try {
      const [results] = await pool.query(
        "SELECT * FROM transaksi WHERE MONTH(tanggal) = MONTH(CURDATE())",
      );
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

// WAJIB: Gunakan 'new' saat ekspor
module.exports = new LaporanController();
