const transaksiModel = require("../models/transaksi");
const logger = require("../utils/logger");
const { successResponse, errorResponse } = require("../utils/response");
const { Xendit } = require("xendit-node");

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});
const { Invoice } = xenditClient;

class TransaksiController {
  async createTransaction(req, res, next) {
    try {
      // PERBAIKAN 1: Ambil semua kemungkinan nama variabel total
      const {
        items,
        metode_pembayaran,
        uang_diterima,
        total_harga,
        total: totalBody,
      } = req.body;

      // 1. Validasi Keranjang
      if (!items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, "Keranjang belanja kosong", 400);
      }

      // PERBAIKAN 2: Pastikan 'total' dapat angka, jangan sampai 0 atau undefined
      // Kita cek total_harga dulu, kalau kosong cek total, kalau kosong lagi baru ambil uang_diterima
      const total = Number(total_harga || totalBody || 0);

      if (total <= 0) {
        return errorResponse(
          res,
          "Total harga tidak valid (Harus lebih dari 0)",
          400,
        );
      }

      // 2. Transform items
      const transformedItems = items.map((item) => ({
        id_barang: item.id || item.id_barang,
        jumlah: item.quantity || item.jumlah,
        harga: item.price || item.harga,
      }));

      const nomor_transaksi = `TRX-${Date.now()}`;
      let xenditInvoice = null;

      // 3. Logika Xendit
      if (metode_pembayaran && metode_pembayaran !== "cash") {
        try {
          xenditInvoice = await Invoice.createInvoice({
            data: {
              externalId: nomor_transaksi,
              amount: total,
              description: `Pembayaran Toko Buku AA - ${nomor_transaksi}`,
              currency: "IDR",
              successRedirectUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pembayaran-berhasil`,
              failureRedirectUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pembayaran-gagal`,
            },
          });
        } catch (xenditErr) {
          logger.error("Xendit Error", { error: xenditErr });
          return errorResponse(res, "Gagal terhubung ke Xendit", 502);
        }
      }

      // 4. Simpan ke Database
      const result = await transaksiModel.create({
        items: transformedItems,
        nomor_transaksi,
        total: total,
        metode_pembayaran: metode_pembayaran || "cash",
        bayar:
          metode_pembayaran === "cash" ? Number(uang_diterima || 0) : total,
        external_id: xenditInvoice ? xenditInvoice.id : null,
        payment_url: xenditInvoice ? xenditInvoice.invoiceUrl : null,
      });

      return successResponse(
        res,
        {
          data: {
            ...result,
            payment_url: xenditInvoice ? xenditInvoice.invoiceUrl : null,
          },
          message: "Transaksi berhasil dibuat",
        },
        201,
      );
    } catch (error) {
      logger.error("Error in createTransaction", { error: error.message });
      const status = error.message.includes("Stok") ? 400 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  // Fungsi lain (getTodayStats, dll) sudah benar, tidak perlu diubah.
  async getTodayStats(req, res, next) {
    try {
      const stats = await transaksiModel.getStatistikHariIni();
      return successResponse(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getPeriodStats(req, res, next) {
    try {
      const { start, end } = req.query;
      const stats = await transaksiModel.getStatistikPeriode(start, end);
      return successResponse(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(req, res, next) {
    try {
      const result = await transaksiModel.getAll();
      return successResponse(res, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await transaksiModel.getById(id);
      if (!data) return errorResponse(res, "Transaksi tidak ditemukan", 404);
      return successResponse(res, { data });
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req, res, next) {
    try {
      await transaksiModel.delete(req.params.id);
      return successResponse(res, { message: "Berhasil dihapus" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransaksiController();
