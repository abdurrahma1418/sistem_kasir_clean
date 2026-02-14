/**
 * TOKO BUKU AA - ERROR HANDLER MIDDLEWARE (STABLE)
 */

// Class untuk Error kustom agar bisa set status code manual
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Terjadi kesalahan pada server";

  // 1. Tangani Error Spesifik MySQL (Sangat Penting!)
  if (err.code === "ECONNREFUSED") {
    message = "Database tidak terhubung. Pastikan XAMPP/MySQL aktif.";
    statusCode = 503;
  }

  if (err.code === "ER_DUP_ENTRY") {
    message = "Data sudah ada dalam database (Duplicate Entry).";
    statusCode = 400;
  }

  // 2. Tangani Error JSON (Jika user kirim JSON rusak)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    message = "Format JSON yang dikirim tidak valid.";
    statusCode = 400;
  }

  // 3. Log Error ke Console (Warna Merah untuk debug)
  console.error(
    `\x1b[31m❌ [${req.method}] ${req.url} - Error: ${message}\x1b[0m`,
  );
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // 4. Kirim Response
  res.status(statusCode).json({
    success: false,
    message: message,
    // Stack trace hanya muncul di mode development agar aman
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * Handle 404 - Not Found
 */
const notFoundHandler = (req, res, next) => {
  const message = `Pesan: Route ${req.originalUrl} dengan method ${req.method} tidak ada.`;
  res.status(404).json({
    success: false,
    message: message,
  });
};

// Pastikan export object agar bisa di-destructure di server.js
module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
};
