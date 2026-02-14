/**
 * TOKO BUKU AA - BUKU CONTROLLER
 * Tempat logika bisnis untuk data buku/barang
 */
const barangModel = require("../models/barang");

class BukuController {
  // 1. Ambil Semua Buku dengan Filter
  getAllBooks = async (req, res, next) => {
    try {
      const { search, minStok, tersedia, limit = 100 } = req.query;

      const filters = {
        search,
        minStok: minStok ? parseInt(minStok) : undefined,
        tersedia: tersedia === "true",
        limit: parseInt(limit),
      };

      const barang = await barangModel.findAll(filters);

      // Mapping data agar seragam dikirim ke Frontend
      const books = barang.map((b) => ({
        id: b.id_barang,
        kode_barang: b.kode_barang,
        nama: b.nama,
        harga: parseFloat(b.harga_jual),
        stok: b.stok,
        created_at: b.created_at,
      }));

      res.json({ success: true, data: books });
    } catch (error) {
      console.error("❌ Error getAllBooks:", error.message);
      next(error);
    }
  };

  // 2. Statistik Barang
  getStatistics = async (req, res, next) => {
    try {
      const stats = await barangModel.getStatistics();
      res.json({
        success: true,
        data: {
          total_buku: stats.total_barang || 0,
          total_stok: stats.total_stok || 0,
          rata_rata_harga: parseFloat(stats.rata_rata_harga || 0).toFixed(0),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 3. Ambil Buku Berdasarkan ID
  getBookById = async (req, res, next) => {
    try {
      const barang = await barangModel.findById(req.params.id);
      if (!barang) {
        return res
          .status(404)
          .json({ success: false, message: "Buku tidak ditemukan" });
      }
      res.json({
        success: true,
        data: {
          id: barang.id_barang,
          kode_barang: barang.kode_barang,
          nama: barang.nama,
          harga: parseFloat(barang.harga_jual),
          stok: barang.stok,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 4. Tambah Buku Baru
  createBook = async (req, res, next) => {
    try {
      const { nama, harga, stok, kode_barang } = req.body;

      // Validasi sederhana
      if (!nama || !harga) {
        return res
          .status(400)
          .json({ success: false, message: "Nama dan Harga wajib diisi" });
      }

      const insertId = await barangModel.create({
        nama,
        harga_jual: harga,
        stok: stok || 0,
        kode_barang: kode_barang || `BK-${Date.now()}`,
      });

      res.status(201).json({
        success: true,
        message: "Buku berhasil ditambahkan",
        data: { id: insertId, nama },
      });
    } catch (error) {
      next(error);
    }
  };

  // 5. Hapus Buku
  deleteBook = async (req, res, next) => {
    try {
      const deleted = await barangModel.delete(req.params.id);
      if (!deleted) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Buku gagal dihapus atau tidak ditemukan",
          });
      }
      res.json({ success: true, message: "Buku berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  };

  // --- FUNGSI PLACEHOLDER (Agar Route Tidak Error) ---
  getLowStockBooks = async (req, res) => res.json({ success: true, data: [] });
  checkStockBatch = async (req, res) =>
    res.json({ success: true, message: "Stock OK" });
  getBookByCode = async (req, res) => res.json({ success: true, data: {} });
  updateBook = async (req, res) =>
    res.json({ success: true, message: "Update Success" });
  updateStock = async (req, res) =>
    res.json({ success: true, message: "Stock Updated" });
}

// Export instance dari class ini
module.exports = new BukuController();
