/**
 * TOKO BUKU AA - MAIN SERVER FILE (FINAL PRODUCTION READY)
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

// 1. IMPORT DATABASE & HELPERS
// Pastikan file database.js meng-export pool dan testConnection
const { testConnection, pool } = require("./config/database");

// 2. IMPORT ROUTES
const bukuRoutes = require("./routes/buku");
const transaksiRoutes = require("./routes/transaksi");
const laporanRoutes = require("./routes/laporan");

const app = express();
const PORT = process.env.PORT || 3005;

// ============================================
// MIDDLEWARES - FIXED CORS
// ============================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-callback-token"],
    credentials: true,
  }),
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5000,
  message: { success: false, message: "Terlalu banyak permintaan." },
});
app.use(limiter);

// ============================================
// API ROUTES (LANGSUNG TANPA PREFIX)
// ============================================

app.get("/", (req, res) => {
  res.json({
    status: "Online",
    message: "API Toko Buku AA Berhasil Dijalankan",
    database: "Connected",
  });
});

app.use("/buku", bukuRoutes);
app.use("/transaksi", transaksiRoutes);
app.use("/laporan", laporanRoutes);

// ============================================
// 💳 XENDIT CONFIGURATION & WEBHOOKS
// ============================================

const XENDIT_AUTH_TOKEN = Buffer.from(
  `${process.env.XENDIT_SECRET_KEY}:`,
).toString("base64");

// ENDPOINT: Membuat Invoice
app.post("/xendit/create-invoice", async (req, res) => {
  try {
    const { external_id, amount, items } = req.body;
    const response = await axios.post(
      "https://api.xendit.co/v2/invoices",
      {
        external_id,
        amount: Math.round(Number(amount)),
        description: "Pembayaran Toko Buku AA",
        currency: "IDR",
        items: items.map((item) => ({
          name: item.title || item.name || "Buku",
          quantity: Number(item.quantity),
          price: Math.round(Number(item.price)),
        })),
        success_redirect_url: process.env.FRONTEND_URL,
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
    console.error("❌ XENDIT ERROR:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Gagal membuat invoice" });
  }
});

// ENDPOINT: Webhook (Otomasi Update Database)
app.post("/webhooks/xendit", async (req, res) => {
  // Verifikasi Keamanan Token dari Xendit
  const callbackToken = req.headers["x-callback-token"];
  if (
    process.env.XENDIT_CALLBACK_TOKEN &&
    callbackToken !== process.env.XENDIT_CALLBACK_TOKEN
  ) {
    console.log("⚠️ Webhook ditolak: Token tidak valid");
    return res.status(403).json({ message: "Invalid Token" });
  }

  const { status, external_id } = req.body;
  console.log(`🔔 XENDIT EVENT: ${external_id} [${status}]`);

  try {
    if (status === "PAID" || status === "SETTLED") {
      // Jika Lunas atau Bayar Terlambat
      await pool.query(
        "UPDATE transaksi SET status = 'SUCCESS', tgl_transaksi = NOW() WHERE nomor_transaksi = ?",
        [external_id],
      );
      console.log(`✅ DATABASE: ${external_id} BERHASIL DIUPDATE (PAID)`);
    } else if (status === "EXPIRED") {
      // Jika Waktu Bayar Habis
      await pool.query(
        "UPDATE transaksi SET status = 'CANCELLED' WHERE nomor_transaksi = ?",
        [external_id],
      );
      console.log(`💀 DATABASE: ${external_id} DIBATALKAN (EXPIRED)`);
    }

    res.status(200).send("OK");
  } catch (dbErr) {
    console.error("❌ DB UPDATE ERROR:", dbErr.message);
    res.status(500).send("Database Error");
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error("❌ FATAL ERROR:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ============================================
// SERVER STARTUP
// ============================================
app.listen(PORT, async () => {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "\n╔════════════════════════════════════════════════╗",
  );
  console.log(`║    🚀 TOKO BUKU AA - RUNNING ON PORT: ${PORT}       ║`);
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log(`║    ✅ DATABASE: TERHUBUNG                           ║`);
    }
  } catch (error) {
    console.log(`║    ❌ DATABASE: GAGAL KONEKSI                     ║`);
  }
  console.log(
    "\x1b[36m%s\x1b[0m",
    "╚════════════════════════════════════════════════╝\n",
  );
});

module.exports = app;
