/**
 * TOKO BUKU AA - MAIN SERVER FILE (FIXED - NO PREFIX)
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

// ============================================
// MIDDLEWARES - OPEN ACCESS (FIX CORS)
// ============================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());

// Limiter (Batas aman untuk produksi)
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
    message: "Toko Buku AA API is Running",
    environment: process.env.NODE_ENV || "production",
  });
});

// Jalur yang dicari Frontend kamu: /buku, /transaksi, /laporan
app.use("/buku", bukuRoutes);
app.use("/transaksi", transaksiRoutes);
app.use("/laporan", laporanRoutes);

// ============================================
// 💳 XENDIT ROUTES
// ============================================

const XENDIT_AUTH_TOKEN = Buffer.from(
  `${process.env.XENDIT_SECRET_KEY}:`,
).toString("base64");

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
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/webhooks/xendit", (req, res) => {
  console.log("🔔 XENDIT CALLBACK:", req.body);
  res.status(200).send("OK");
});

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
  console.log(`║    🚀 TOKO BUKU AA - PORT: ${PORT}               ║`);
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log(`║    ✅ DATABASE: TERHUBUNG                           ║`);
    }
  } catch (error) {
    console.log(`║    ❌ DB ERROR: GAGAL KONEKSI                     ║`);
  }
  console.log(
    "\x1b[36m%s\x1b[0m",
    "╚════════════════════════════════════════════════╝\n",
  );
});

module.exports = app;
