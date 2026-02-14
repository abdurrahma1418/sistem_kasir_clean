"use client";

import { useState, useEffect } from "react";
import { CartItem as CartItemType, PaymentMethod } from "@/types";
import { formatRupiah } from "@/lib/utils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItemType[];
  subtotal: number;
  total: number;
  onProcessPayment: (
    method: PaymentMethod,
    cashReceived?: number,
    xenditData?: any, // Tambahkan untuk menyimpan info Xendit ke DB
  ) => Promise<void>;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  subtotal,
  total,
  onProcessPayment,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Memproses...");

  const change = cashReceived - total;

  useEffect(() => {
    if (paymentMethod === "cash") {
      setCashReceived(0);
    } else {
      setCashReceived(total);
    }
  }, [paymentMethod, total]);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("cash");
      setCashReceived(0);
      setShowProcessingModal(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    // 1. Logika Tunai (CASH)
    if (paymentMethod === "cash") {
      if (cashReceived < total) {
        alert("Uang tunai kurang!");
        return;
      }
      await onProcessPayment(paymentMethod, cashReceived);
      return;
    }

    // 2. Logika Non-Tunai (XENDIT)
    setShowProcessingModal(true);
    setLoadingMessage("Menghubungkan ke Xendit...");

    try {
      const response = await fetch(
        "http://localhost:3005/api/v1/xendit/create-invoice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            external_id: `INV-${Date.now()}`,
            amount: total,
            items: cart,
          }),
        },
      );

      const invoice = await response.json();

      if (invoice.invoice_url) {
        // Simpan transaksi ke DB lokal dengan status PENDING
        await onProcessPayment(paymentMethod, 0, {
          xendit_id: invoice.id,
          external_id: invoice.external_id,
          status: "PENDING",
        });

        // Buka link pembayaran Xendit
        window.open(invoice.invoice_url, "_blank");

        onClose();
        alert("Silakan selesaikan pembayaran di tab baru yang terbuka.");
      } else {
        throw new Error("Gagal mendapatkan link pembayaran");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Gagal memproses pembayaran online.");
    } finally {
      setShowProcessingModal(false);
    }
  };

  const isNonCashPayment = paymentMethod !== "cash";

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-credit-card"></i> Pembayaran
            </h5>
            <button
              className="modal-close"
              onClick={onClose}
              disabled={showProcessingModal}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="payment-summary">
              {/* Ringkasan Pesanan */}
              <div className="summary-card">
                <h6>Total Tagihan</h6>
                <h2 className="text-accent">{formatRupiah(total)}</h2>
              </div>

              {/* Pilihan Metode */}
              <div className="payment-methods">
                <h6>Pilih Metode Pembayaran</h6>
                <div className="payment-options">
                  {["cash", "card", "qris", "transfer"].map((m) => (
                    <label
                      key={m}
                      className={`payment-option ${paymentMethod === m ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === m}
                        onChange={() => setPaymentMethod(m as PaymentMethod)}
                      />
                      <i
                        className={`bi bi-${m === "cash" ? "cash" : m === "card" ? "credit-card" : m === "qris" ? "qr-code-scan" : "bank"}`}
                      ></i>
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Input Tunai */}
              {paymentMethod === "cash" && (
                <div className="cash-input-section mt-3">
                  <div className="cash-input-wrapper">
                    <span className="currency-symbol">Rp</span>
                    <input
                      type="number"
                      value={cashReceived || ""}
                      onChange={(e) =>
                        setCashReceived(parseFloat(e.target.value) || 0)
                      }
                      className="cash-amount-input"
                      placeholder="Masukkan jumlah uang..."
                      autoFocus
                    />
                  </div>
                  <div
                    className={`change-display mt-2 ${change >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {change >= 0
                      ? `Kembalian: ${formatRupiah(change)}`
                      : `Kurang: ${formatRupiah(Math.abs(change))}`}
                  </div>
                </div>
              )}

              {/* Info Pembayaran Online */}
              {isNonCashPayment && (
                <div className="alert alert-info mt-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Anda akan diarahkan ke halaman pembayaran aman Xendit untuk
                  metode <strong>{paymentMethod.toUpperCase()}</strong>.
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              className="btn btn-success"
              onClick={handleProcessPayment}
              disabled={paymentMethod === "cash" && cashReceived < total}
            >
              {showProcessingModal ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay Sederhana */}
      {showProcessingModal && (
        <div className="processing-modal-overlay">
          <div className="text-center bg-white p-4 rounded shadow">
            <div className="spinner-border text-primary mb-3"></div>
            <h5>{loadingMessage}</h5>
          </div>
        </div>
      )}
    </>
  );
}
