const { query } = require("../config/database"); // Gunakan query helper agar konsisten

const handleXenditWebhook = async (req, res) => {
  const callbackData = req.body;

  try {
    // Catatan: Xendit mengirim 'status' dan 'external_id'
    const { external_id, status, amount } = callbackData;

    // Kita cek apakah statusnya PAID (sudah dibayar) atau SETTLED
    if (status === "PAID" || status === "SETTLED") {
      // UPDATE: Cari berdasarkan nomor_transaksi, bukan id_transaksi
      // UPDATE: Gunakan status_pembayaran = 'lunas' agar sinkron dengan model
      const sql = `
        UPDATE transaksi 
        SET status_pembayaran = 'lunas', 
            updated_at = NOW() 
        WHERE nomor_transaksi = ?
      `;

      const result = await query(sql, [external_id]);

      if (result.affectedRows > 0) {
        console.log(
          `✅ Transaksi ${external_id} Berhasil Dibayar: Rp${amount}`,
        );
      } else {
        console.log(`⚠️ Transaksi ${external_id} tidak ditemukan di database`);
      }
    }

    // Selalu kirim status 200 ke Xendit
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    res.status(500).json({ success: false });
  }
};

module.exports = { handleXenditWebhook };
