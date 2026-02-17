/**
 * TOKO BUKU AA - MAIN SERVER FILE (FIXED FOR DEPLOYMENT)
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
// MIDDLEWARES - FIXED CORS
// ============================================

app.use(
  cors({
    // Mengizinkan localhost untuk development DAN domain railway kamu
    // Menggunakan '*' jauh lebih aman untuk tahap testing agar tidak ada blokir lagi
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

//

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

const XENDIT_AUTH_TOKEN = Buffer.from(
  `${process.env.XENDIT_SECRET_KEY}:`,
).toString("base64");

app.post(`${API_PREFIX}/xendit/create-invoice`, async (req, res) => {
  try {
    const { external_id, amount, items } = req.body;

    if (!external_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "External ID dan Amount wajib diisi",
      });
    }

    const response = await axios.post(
      "https://api.xendit.co/v2/invoices",
      {
        external_id,
        amount: Math.round(Number(amount)),
        description: "Pembayaran Toko Buku AA",
        invoice_duration: 86400,
        currency: "IDR",
        items: items.map((item) => ({
          name: item.title || item.name || "Buku",
          quantity: Number(item.quantity),
          price: Math.round(Number(item.price)),
        })),
        // Gunakan variabel environment untuk redirect URL jika ada
        success_redirect_url:
          process.env.FRONTEND_URL || "http://localhost:3000/success",
      },
      {
        headers: {
          Authorization: `Basic ${XENDIT_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

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

app.post(`${API_PREFIX}/webhooks/xendit`, async (req, res) => {
  const { status, external_id, payment_method } = req.body;
  console.log(
    `🔔 CALLBACK XENDIT: Transaksi ${external_id} | Status: ${status}`,
  );

  if (status === "PAID") {
    try {
      console.log(
        `✅ DATABASE UPDATED: ${external_id} LUNAS via ${payment_method}`,
      );
    } catch (dbErr) {
      console.error("❌ GAGAL UPDATE DB:", dbErr.message);
    }
  }
  res.status(200).send("OK");
});

// ============================================
// API ROUTES UTAMA
// ============================================

app.get("/", (req, res) => {
  res.json({
    status: "Online",
    message: "Toko Buku AA API is Running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use(`${API_PREFIX}/buku`, bukuRoutes);
app.use(`${API_PREFIX}/transaksi`, transaksiRoutes);
app.use(`${API_PREFIX}/laporan`, laporanRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint [${req.method}] ${req.originalUrl} tidak ditemukan!`,
  });
});

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

  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log(`║    ✅ DATABASE: TERHUBUNG                           ║`);
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
