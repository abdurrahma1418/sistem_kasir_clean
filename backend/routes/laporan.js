const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");

// Rute Statistik
router.get("/statistik", laporanController.getStatistik);

// Rute Produk Terlaris
router.get("/produk-terlaris", laporanController.getTopProducts);

// Rute Harian
router.get("/harian", laporanController.getDailyReport);

// Rute Bulanan (Baris 31 biasanya ada di area ini)
router.get("/bulanan", laporanController.getMonthlyReport);

module.exports = router;
