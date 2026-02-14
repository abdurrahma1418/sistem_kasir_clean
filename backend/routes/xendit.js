const express = require("express");
const router = express.Router();
const axios = require("axios");
const { pool } = require("../config/database"); // Pastikan pool diexport dari database.js

const XENDIT_AUTH_TOKEN = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString('base64');

// ==========================================
// 1. ROUTE: CREATE INVOICE
// ==========================================
router.post("/create-invoice", async (req, res) => {
  try {
    const { external_id, amount, items } = req.body;

    const response = await axios.post(
      'https://api.xendit.co/v2/invoices',
      {
        external_id,
        amount,
        description: "Pembayaran Toko Buku AA",
        currency: "IDR",
        items: items.map(item => ({
          name: item.title,
          quantity: item.quantity,
          price: item.price
        }))
      },
      {
        headers: {
          'Authorization': `Basic ${XENDIT_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. ROUTE: WEBHOOK (CALLBACK)
// ==========================================
router.post("/callback", async (req, res) => {
  const { status, external_id, payment_method, amount } = req.body;
  
  console.log(`🔔 Callback diterima untuk: ${external_id} | Status: ${status}`);

  if (status === "PAID") {
    try {
      // LOGIKA: Update status transaksi di database kamu
      // Kita asumsikan tabel transaksi kamu punya kolom 'status' dan 'external_id'
      await pool.query(
        "UPDATE transaksi SET status = 'SUCCESS', metode_pembayaran = ? WHERE nomor_transaksi = ?",
        [payment_method, external_id]
      );
      
      console.log(`✅ Database Updated: ${external_id} is now SUCCESS`);
    } catch (dbError) {
      console.error("❌ Database Update Error:", dbError.message);
    }
  }

  // Xendit butuh respon 200 OK agar mereka tidak mengirim ulang callback
  res.status(200).send("OK");
});

module.exports = router;
