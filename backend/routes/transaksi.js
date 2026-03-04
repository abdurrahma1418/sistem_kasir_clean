const express = require("express");
const router = express.Router();
const { Xendit } = require("xendit-node");
const transaksiModel = require("../models/transaksi");

// 1. INISIALISASI XENDIT
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});
const { Invoice } = xenditClient;

/**
 * [A] AMBIL STATISTIK HARI INI
 */
router.get("/statistik/hari-ini", async (req, res) => {
  try {
    const stats = await transaksiModel.getStatistikHariIni();
    res.json({
      success: true,
      data: stats || { total_penjualan: 0, total_transaksi: 0, total_items: 0 },
    });
  } catch (error) {
    console.error("❌ Error Stats Hari Ini:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil statistik" });
  }
});

/**
 * [B] AMBIL STATISTIK PERIODE
 */
router.get("/statistik/periode", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Parameter start dan end diperlukan",
        });
    }
    const stats = await transaksiModel.getStatistikPeriode(start, end);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("❌ Error Stats Periode:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * [C] AMBIL SEMUA TRANSAKSI
 */
router.get("/", async (req, res) => {
  try {
    const data = await transaksiModel.getAll();
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("❌ Error Fetch All:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil riwayat" });
  }
});

/**
 * [D] DETAIL TRANSAKSI BERDASARKAN ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Format ID tidak valid" });
    }
    const data = await transaksiModel.getById(id);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    res.json({ success: true, data: data });
  } catch (error) {
    console.error("❌ Error Fetch Detail:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * [E] PROSES TRANSAKSI BARU (FIXED ANTI-NaN)
 */
router.post("/", async (req, res) => {
  try {
    const {
      total,
      total_harga,
      metode_pembayaran,
      items,
      bayar,
      uang_diterima,
    } = req.body;

    // --- PROTEKSI ANTI-NaN ---
    // Menggunakan parseFloat dan || 0 agar jika data kosong hasilnya 0, bukan NaN
    const rawTotal = total_harga || total || 0;
    const rawBayar = uang_diterima || bayar || 0;

    const finalTotal = isNaN(parseFloat(rawTotal)) ? 0 : parseFloat(rawTotal);
    const finalBayar = isNaN(parseFloat(rawBayar)) ? 0 : parseFloat(rawBayar);

    // 1. Validasi Input Dasar
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Keranjang belanja kosong" });
    }

    if (finalTotal <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Total harga tidak valid atau nol" });
    }

    const nomor_transaksi = `TRX-${Date.now()}`;
    let xenditInvoice = null;

    // 2. Jika Non-Tunai, Hubungi Xendit
    if (metode_pembayaran !== "cash") {
      try {
        xenditInvoice = await Invoice.createInvoice({
          data: {
            externalId: nomor_transaksi,
            amount: finalTotal,
            description: `Pembayaran Toko Buku AA - ${nomor_transaksi}`,
            currency: "IDR",
            successRedirectUrl: `${process.env.FRONTEND_URL}/pembayaran-berhasil`,
            failureRedirectUrl: `${process.env.FRONTEND_URL}/pembayaran-gagal`,
          },
        });
      } catch (xenditErr) {
        console.error("❌ Xendit Error:", xenditErr);
        return res
          .status(502)
          .json({ success: false, message: "Gagal membuat invoice Xendit" });
      }
    }

    // 3. Simpan ke Database via Model
    // Kita pastikan data yang dikirim ke model adalah ANGKA BERSIH
    const status_awal = metode_pembayaran === "cash" ? "SUCCESS" : "PENDING";

    const hasilSimpan = await transaksiModel.create({
      items,
      total: finalTotal,
      metode_pembayaran: metode_pembayaran || "cash",
      nomor_transaksi,
      status: status_awal,
      bayar: metode_pembayaran === "cash" ? finalBayar : finalTotal,
      external_id: xenditInvoice ? xenditInvoice.id : null,
      payment_url: xenditInvoice ? xenditInvoice.invoiceUrl : null,
    });

    // 4. Respon ke Frontend
    res.json({
      success: true,
      message: "Transaksi berhasil diproses",
      data: {
        id_transaksi: hasilSimpan.insertId,
        nomor_transaksi: nomor_transaksi,
        status: status_awal,
        payment_url: xenditInvoice ? xenditInvoice.invoiceUrl : null,
      },
    });
  } catch (error) {
    console.error("❌ Error Utama Transaksi:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan transaksi ke database",
      error: error.message,
    });
  }
});

/**
 * [F] HAPUS TRANSAKSI
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await transaksiModel.delete(id);
    res.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus transaksi" });
  }
});

module.exports = router;
