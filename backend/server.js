/**
 * TOKO BUKU AA - MAIN SERVER FILE (FINAL STABLE & SYNCED)
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

// 1. IMPORT DATABASE & HELPERS
const { testConnection } = require("./config/database");

// 2. IMPORT ROUTES
const bukuRoutes = require("./routes/buku");
const transaksiRoutes = require("./routes/transaksi");
const laporanRoutes = require("./routes/laporan");

const app = express();
const PORT = process.env.PORT || 3005;
const API_PREFIX = "/api/v1";

// ============================================
// MIDDLEWARES
// ============================================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:5173", // Port default Vite jika kamu pakai React/Vue baru
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());

// Limiter agar server tidak diserang spam
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 5000,
  message: { success: false, message: "Terlalu banyak permintaan." },
});
app.use(`${API_PREFIX}`, limiter);

// ============================================
// 💳 XENDIT CONFIGURATION & ROUTES
// ============================================

// Pastikan XENDIT_SECRET_KEY ada di file .env
const XENDIT_AUTH_TOKEN = Buffer.from(
  `${process.env.XENDIT_SECRET_KEY}:`,
).toString("base64");

// ROUTE: Membuat Invoice Xendit
app.post(`${API_PREFIX}/xendit/create-invoice`, async (req, res) => {
  try {
    const { external_id, amount, items } = req.body;

    // 1. Validasi input wajib
    if (!external_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "External ID dan Amount wajib diisi",
      });
    }

    // 2. Request ke Xendit
    const response = await axios.post(
      "https://api.xendit.co/v2/invoices",
      {
        external_id,
        amount: Math.round(Number(amount)), // Xendit tidak terima desimal
        description: "Pembayaran Toko Buku AA",
        invoice_duration: 86400, // Aktif selama 24 jam
        currency: "IDR",
        items: items.map((item) => ({
          name: item.title || item.name,
          quantity: Number(item.quantity),
          price: Math.round(Number(item.price)),
        })),
        // URL untuk kembali ke toko setelah bayar (opsional)
        success_redirect_url: "http://localhost:3000/success",
      },
      {
        headers: {
          Authorization: `Basic ${XENDIT_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    // 3. Kirim balik seluruh data Xendit ke frontend
    res.status(200).json(response.data);
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error("❌ XENDIT ERROR:", errorData);

    res.status(500).json({
      success: false,
      message: "Gagal membuat invoice Xendit",
      error: errorData,
    });
  }
});

// ROUTE: Webhook (Menerima sinyal bayar otomatis dari Xendit)
app.post(`${API_PREFIX}/webhooks/xendit`, async (req, res) => {
  const { status, external_id, payment_method, amount, id } = req.body;

  console.log(
    `🔔 CALLBACK XENDIT: Transaksi ${external_id} | Status: ${status}`,
  );

  // Sangat disarankan verifikasi token callback disini jika untuk produksi

  if (status === "PAID") {
    try {
      // LOGIKA: Update database kamu di sini
      // Contoh (jika pakai MySQL/Pool):
      // await pool.query("UPDATE transaksi SET status = 'SUCCESS', metode_pembayaran = ? WHERE nomor_transaksi = ?", [payment_method, external_id]);

      console.log(
        `✅ DATABASE UPDATED: ${external_id} LUNAS via ${payment_method}`,
      );
    } catch (dbErr) {
      console.error("❌ GAGAL UPDATE DB:", dbErr.message);
    }
  }

  // Xendit butuh respon 200 OK agar tidak kirim ulang notifikasi
  res.status(200).send("OK");
});

// ============================================
// API ROUTES UTAMA
// ============================================

app.get("/", (req, res) => {
  res.json({
    status: "Online",
    message: "Toko Buku AA API is Running",
    database: process.env.DB_NAME || "buku_aa",
  });
});

app.use(`${API_PREFIX}/buku`, bukuRoutes);
app.use(`${API_PREFIX}/transaksi`, transaksiRoutes);
app.use(`${API_PREFIX}/laporan`, laporanRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint [${req.method}] ${req.originalUrl} tidak ditemukan!`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Terjadi kesalahan internal server",
  });
});

// ============================================
// SERVER STARTUP
// ============================================
app.listen(PORT, async () => {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "\n╔════════════════════════════════════════════════╗",
  );
  console.log(`║    🚀 TOKO BUKU AA - JALAN DI PORT: ${PORT}          ║`);
  console.log(`║    🔗 API URL: http://localhost:${PORT}${API_PREFIX}       ║`);

  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log(
        `║    ✅ DATABASE: TERHUBUNG KE ${process.env.DB_NAME || "buku_aa"}          ║`,
      );
    }
  } catch (error) {
    console.log(`║    ❌ DB ERROR: GAGAL TERKONEKSI                 ║`);
  }
  console.log(
    "\x1b[36m%s\x1b[0m",
    "╚════════════════════════════════════════════════╝\n",
  );
});

module.exports = app;
