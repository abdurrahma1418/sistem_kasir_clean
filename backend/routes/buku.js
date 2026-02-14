const express = require("express");
const router = express.Router();
const bukuController = require("../controllers/bukuController");

// 1. Koleksi & Statistik
router.get("/", bukuController.getAllBooks);
router.get("/statistik", bukuController.getStatistics);
router.get("/low-stock", bukuController.getLowStockBooks);

// 2. Detail
router.get("/id/:id", bukuController.getBookById);
router.get("/kode/:code", bukuController.getBookByCode);

// 3. Mutasi Data
router.post("/", bukuController.createBook);
router.put("/:id", bukuController.updateBook);
router.patch("/:id/stok", bukuController.updateStock);
router.delete("/:id", bukuController.deleteBook);

// 4. Utilitas
router.post("/check-stock", bukuController.checkStockBatch);

module.exports = router;
