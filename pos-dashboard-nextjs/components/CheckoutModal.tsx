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
  // Sesuaikan dengan parameter yang ada di page.tsx
  onProcessPayment: (
    method: PaymentMethod,
    cashReceived: number,
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

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("cash");
      setCashReceived(0);
      setShowProcessingModal(false);
    }
  }, [isOpen]);

  // Otomatis isi cashReceived jika non-tunai
  useEffect(() => {
    if (paymentMethod !== "cash") {
      setCashReceived(total);
    } else {
      setCashReceived(0);
    }
  }, [paymentMethod, total]);

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    try {
      if (paymentMethod === "cash") {
        if (cashReceived < total) {
          alert("Uang tunai kurang!");
          return;
        }
        await onProcessPayment(paymentMethod, cashReceived);
      } else {
        // Logika Non-Tunai (Xendit/Lainnya)
        setShowProcessingModal(true);
        setLoadingMessage("Menyiapkan pembayaran...");

        // Catatan: Untuk demo sementara, kita anggap sukses
        // karena integrasi Xendit memerlukan konfigurasi Backend yang spesifik
        await onProcessPayment(paymentMethod, total);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Gagal memproses pembayaran.");
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
              <div className="summary-card">
                <h6>Total Tagihan</h6>
                <h2 className="text-accent">{formatRupiah(total)}</h2>
              </div>

              <div className="payment-methods">
                <h6>Pilih Metode Pembayaran</h6>
                <div className="payment-options">
                  {(
                    ["cash", "card", "qris", "transfer"] as PaymentMethod[]
                  ).map((m) => (
                    <label
                      key={m}
                      className={`payment-option ${paymentMethod === m ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        className="d-none"
                        checked={paymentMethod === m}
                        onChange={() => setPaymentMethod(m)}
                      />
                      <i
                        className={`bi bi-${
                          m === "cash"
                            ? "cash"
                            : m === "card"
                              ? "credit-card"
                              : m === "qris"
                                ? "qr-code-scan"
                                : "bank"
                        }`}
                      ></i>
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

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
                    className={`change-display mt-2 ${
                      change >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {change >= 0
                      ? `Kembalian: ${formatRupiah(change)}`
                      : `Kurang: ${formatRupiah(Math.abs(change))}`}
                  </div>
                </div>
              )}

              {isNonCashPayment && (
                <div className="alert alert-info mt-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Metode <strong>{paymentMethod.toUpperCase()}</strong> dipilih.
                  Pastikan perangkat pembayaran siap.
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={showProcessingModal}
            >
              Batal
            </button>
            <button
              className="btn btn-success"
              onClick={handleProcessPayment}
              disabled={
                showProcessingModal ||
                (paymentMethod === "cash" && cashReceived < total)
              }
            >
              {showProcessingModal ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>

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
