"use client";

import { useState, useEffect, useCallback } from "react";
import TopNavbar from "@/components/TopNavbar";
import RevenueChart from "@/components/RevenueChart";
import { formatRupiah } from "@/lib/utils";
import {
  fetchTransactions,
  fetchTransactionById,
  updateTransaction,
  deleteTransaction,
  fetchProducts,
  fetchPeriodStats,
} from "@/lib/api";
import { useNotificationStore } from "@/hooks/useNotification";

interface Transaction {
  id: string;
  nomor_transaksi: string;
  total: string | number;
  metode_pembayaran: string;
  uang_diterima: string | number | null;
  kembalian: string | number;
  tanggal: string;
  items: TransactionItem[];
  bayar?: string | number;
}

interface TransactionItem {
  id: number;
  nama: string;
  kode_barang?: string;
  harga?: number;
  quantity: number;
  subtotal: number;
}

// Printable Receipt Component
function PrintableReceipt({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Tunai",
      card: "Kartu Debit/Kredit",
      qris: "QRIS",
      transfer: "Transfer",
    };
    return labels[method] || method;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Screen Receipt Preview */}
      <div className="receipt-preview">
        <div className="receipt-header">
          <div className="receipt-logo">
            <i className="bi bi-book-half"></i>
          </div>
          <h2 className="receipt-title">TOKO BUKU AA</h2>
          <p className="receipt-subtitle">Jatinangor</p>
          <p className="receipt-subtitle">Telp: (021) 1234-5678</p>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-info">
          <div className="receipt-row">
            <span>No. Transaksi</span>
            <span className="receipt-value">
              : {transaction.nomor_transaksi}
            </span>
          </div>
          <div className="receipt-row">
            <span>Tanggal</span>
            <span className="receipt-value">
              : {formatTanggal(transaction.tanggal)}
            </span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-items">
          {transaction.items.map((item, idx) => (
            <div key={idx} className="receipt-item">
              <div className="item-name">{item.nama}</div>
              <div className="item-details">
                <span>
                  {item.quantity} x {formatRupiah(item.harga)}
                </span>
                <span className="item-subtotal">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-total">
          <div className="receipt-row receipt-row-total">
            <span>TOTAL</span>
            <span className="receipt-total-amount">
              {formatRupiah(parseFloat(transaction.total))}
            </span>
          </div>
          <div className="receipt-row">
            <span>Metode</span>
            <span>
              : {getPaymentMethodLabel(transaction.metode_pembayaran)}
            </span>
          </div>
          {transaction.metode_pembayaran === "cash" && (
            <>
              <div className="receipt-row">
                <span>Uang Diterima</span>
                <span>
                  : {formatRupiah(parseFloat(transaction.uang_diterima || "0"))}
                </span>
              </div>
              <div className="receipt-row">
                <span>Kembalian</span>
                <span>: {formatRupiah(parseFloat(transaction.kembalian))}</span>
              </div>
            </>
          )}
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-footer">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          <div className="receipt-qrcode">
            <i className="bi bi-qr-code"></i>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="receipt-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          <i className="bi bi-x-lg"></i> Tutup
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <i className="bi bi-printer"></i> Cetak Struk
        </button>
      </div>
    </>
  );
}

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReceiptView, setIsReceiptView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "today" | "week" | "month" | "all"
  >("today");
  const [chartData, setChartData] = useState<any[]>([]);

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const loadTransactions = useCallback(async () => {
    try {
      const data = await fetchTransactions();
      // Map backend response to frontend format
      const mappedData: Transaction[] = data.map((tx: any) => ({
        id: tx.id_transaksi?.toString() || tx.id?.toString(),
        nomor_transaksi: tx.nomor_transaksi || "",
        total: tx.total,
        metode_pembayaran: tx.metode_pembayaran || "cash",
        uang_diterima: tx.bayar,
        kembalian: tx.kembalian,
        tanggal: tx.tanggal,
        bayar: tx.bayar,
        items: (tx.items || []).map((item: any) => ({
          id: item.id_barang,
          nama: item.nama,
          kode_barang: item.kode_barang,
          harga: item.harga,
          quantity: item.jumlah,
          subtotal: item.subtotal,
        })),
      }));
      setTransactions(mappedData);
    } catch (error) {
      addNotification("Gagal memuat data transaksi", "danger");
    }
  }, [addNotification]);

  // Load chart data based on date filter
  useEffect(() => {
    const loadChartData = async () => {
      try {
        const now = new Date();
        let startDate: string;
        let endDate: string;

        if (dateFilter === "today") {
          // For today, show last 7 days
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        } else if (dateFilter === "month") {
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = monthAgo.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        } else {
          // All - show last 30 days
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = monthAgo.toISOString().split("T")[0];
          endDate = now.toISOString().split("T")[0];
        }

        const stats = await fetchPeriodStats(startDate, endDate);
        setChartData(stats.daily || []);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      }
    };

    loadChartData();
  }, [dateFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const openDetailModal = async (transactionId: string) => {
    try {
      const data = await fetchTransactionById(transactionId);
      // Map backend response to frontend format
      const mappedData: Transaction = {
        id: data.id_transaksi?.toString() || data.id?.toString(),
        nomor_transaksi: data.nomor_transaksi || "",
        total: data.total,
        metode_pembayaran: data.metode_pembayaran || "cash",
        uang_diterima: data.bayar,
        kembalian: data.kembalian,
        tanggal: data.tanggal,
        bayar: data.bayar,
        items: (data.items || []).map((item: any) => ({
          id: item.id_barang,
          nama: item.nama,
          kode_barang: item.kode_barang,
          harga: item.harga,
          quantity: item.jumlah,
          subtotal: item.subtotal,
        })),
      };
      setSelectedTransaction(mappedData);
      setIsDetailModalOpen(true);
    } catch (error) {
      addNotification("Gagal memuat detail transaksi", "danger");
    }
  };

  const openEditModal = async (transactionId: string) => {
    try {
      const data = await fetchTransactionById(transactionId);
      // Map backend response to frontend format
      const mappedData: Transaction = {
        id: data.id_transaksi?.toString() || data.id?.toString(),
        nomor_transaksi: data.nomor_transaksi || "",
        total: data.total,
        metode_pembayaran: data.metode_pembayaran || "cash",
        uang_diterima: data.bayar,
        kembalian: data.kembalian,
        tanggal: data.tanggal,
        bayar: data.bayar,
        items: (data.items || []).map((item: any) => ({
          id: item.id_barang,
          nama: item.nama,
          kode_barang: item.kode_barang,
          harga: item.harga,
          quantity: item.jumlah,
          subtotal: item.subtotal,
        })),
      };
      setSelectedTransaction(mappedData);
      setIsEditModalOpen(true);
    } catch (error) {
      addNotification("Gagal memuat data transaksi", "danger");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    try {
      await deleteTransaction(id);
      addNotification("Transaksi berhasil dihapus", "success");
      loadTransactions();
    } catch (error: any) {
      addNotification(error.message || "Gagal menghapus transaksi", "danger");
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Tunai",
      card: "Kartu Debit/Kredit",
      qris: "QRIS",
      transfer: "Transfer",
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      cash: "bi-cash",
      card: "bi-credit-card",
      qris: "bi-qr-code-scan",
      transfer: "bi-bank",
    };
    return icons[method] || "bi-wallet2";
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      filtered = filtered.filter((t) => {
        const date = new Date(t.tanggal);
        return date.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((t) => new Date(t.tanggal) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter((t) => new Date(t.tanggal) >= monthAgo);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.nomor_transaksi.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );
  };

  const filteredTransactions = filterTransactions();
  const totalRevenue = filteredTransactions.reduce(
    (sum, t) => sum + parseFloat(t.total),
    0,
  );

  return (
    <>
      <TopNavbar
        onSidebarToggle={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="main-content">
        <div className="content-container">
          {/* Statistics */}
          <div className="stats-row">
            <div className="stat-card glass-card">
              <div className="stat-icon bg-success">
                <i className="bi bi-receipt"></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Transaksi</p>
                <h3 className="stat-value">{filteredTransactions.length}</h3>
              </div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon bg-info">
                <i className="bi bi-currency-dollar"></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Pendapatan</p>
                <h3 className="stat-value">{formatRupiah(totalRevenue)}</h3>
              </div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon bg-warning">
                <i className="bi bi-cart-check"></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Rata-rata</p>
                <h3 className="stat-value">
                  {filteredTransactions.length > 0
                    ? formatRupiah(totalRevenue / filteredTransactions.length)
                    : "Rp 0"}
                </h3>
              </div>
            </div>
          </div>

          {/* Revenue Chart & Transactions List - Side by Side */}
          <div className="transactions-grid-layout">
            <RevenueChart
              data={chartData}
              title={
                dateFilter === "today"
                  ? "Grafik Pendapatan (7 Hari Terakhir)"
                  : dateFilter === "week"
                    ? "Grafik Pendapatan (Minggu Ini)"
                    : dateFilter === "month"
                      ? "Grafik Pendapatan (Bulan Ini)"
                      : "Grafik Pendapatan (30 Hari Terakhir)"
              }
            />

            {/* Transactions List */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <div className="section-header">
                <h3>
                  <i className="bi bi-receipt-cutoff"></i> Daftar Transaksi
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={`filter-btn ${dateFilter === "today" ? "active" : ""}`}
                    onClick={() => setDateFilter("today")}
                  >
                    Hari Ini
                  </button>
                  <button
                    className={`filter-btn ${dateFilter === "week" ? "active" : ""}`}
                    onClick={() => setDateFilter("week")}
                  >
                    Minggu Ini
                  </button>
                  <button
                    className={`filter-btn ${dateFilter === "month" ? "active" : ""}`}
                    onClick={() => setDateFilter("month")}
                  >
                    Bulan Ini
                  </button>
                  <button
                    className={`filter-btn ${dateFilter === "all" ? "active" : ""}`}
                    onClick={() => setDateFilter("all")}
                  >
                    Semua
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <th
                        style={{
                          padding: "15px",
                          textAlign: "left",
                          color: "var(--text-secondary)",
                        }}
                      >
                        No. Transaksi
                      </th>
                      <th
                        style={{
                          padding: "15px",
                          textAlign: "left",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Tanggal
                      </th>
                      <th
                        style={{
                          padding: "15px",
                          textAlign: "left",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Metode
                      </th>
                      <th
                        style={{
                          padding: "15px",
                          textAlign: "left",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Total
                      </th>
                      <th
                        style={{
                          padding: "15px",
                          textAlign: "center",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          <i
                            className="bi bi-inbox"
                            style={{
                              fontSize: "48px",
                              display: "block",
                              marginBottom: "10px",
                            }}
                          ></i>
                          Tidak ada transaksi ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <td
                            style={{
                              padding: "15px",
                              color: "var(--accent-light)",
                              fontWeight: 600,
                            }}
                          >
                            {transaction.nomor_transaksi}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {formatTanggal(transaction.tanggal)}
                          </td>
                          <td style={{ padding: "15px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                background: "rgba(79, 157, 109, 0.1)",
                                color: "var(--accent)",
                                fontSize: "12px",
                              }}
                            >
                              <i
                                className={`bi ${getPaymentMethodIcon(transaction.metode_pembayaran)}`}
                              ></i>
                              {getPaymentMethodLabel(
                                transaction.metode_pembayaran,
                              )}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              color: "var(--accent-light)",
                              fontWeight: 600,
                            }}
                          >
                            {formatRupiah(parseFloat(transaction.total))}
                          </td>
                          <td style={{ padding: "15px", textAlign: "center" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                onClick={() => openDetailModal(transaction.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "6px",
                                  color: "var(--info)",
                                  cursor: "pointer",
                                }}
                                title="Lihat Detail"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                onClick={() => openEditModal(transaction.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "6px",
                                  color: "var(--warning)",
                                  cursor: "pointer",
                                }}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTransaction(transaction.id)
                                }
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--glass-bg)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "6px",
                                  color: "var(--danger)",
                                  cursor: "pointer",
                                }}
                                title="Hapus"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedTransaction && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsDetailModalOpen(false);
            setIsReceiptView(false);
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: isReceiptView ? "420px" : "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {!isReceiptView ? (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-receipt"></i> Detail Transaksi
                  </h5>
                  <button
                    className="modal-close"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <div
                    className="summary-card"
                    style={{ marginBottom: "20px" }}
                  >
                    <h6>Informasi Transaksi</h6>
                    <div className="summary-details">
                      <div className="summary-item">
                        <span>Nomor Transaksi:</span>
                        <span
                          style={{
                            color: "var(--accent-light)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedTransaction.nomor_transaksi}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span>Tanggal:</span>
                        <span>
                          {formatTanggal(selectedTransaction.tanggal)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span>Metode Pembayaran:</span>
                        <span>
                          {getPaymentMethodLabel(
                            selectedTransaction.metode_pembayaran,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="summary-card"
                    style={{ marginBottom: "20px" }}
                  >
                    <h6>Item Pembelian</h6>
                    <div className="summary-details">
                      {selectedTransaction.items.map((item, idx) => (
                        <div className="summary-item" key={idx}>
                          <span>
                            {item.nama} x{item.quantity}
                          </span>
                          <span>{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))}
                      <hr
                        style={{
                          borderColor: "var(--border-color)",
                          margin: "10px 0",
                        }}
                      />
                      <div
                        className="summary-item"
                        style={{ fontSize: "16px", fontWeight: 700 }}
                      >
                        <span>Total</span>
                        <span style={{ color: "var(--accent-light)" }}>
                          {formatRupiah(parseFloat(selectedTransaction.total))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedTransaction.metode_pembayaran === "cash" && (
                    <div className="summary-card">
                      <h6>Detail Pembayaran</h6>
                      <div className="summary-details">
                        <div className="summary-item">
                          <span>Uang Diterima:</span>
                          <span>
                            {formatRupiah(
                              parseFloat(
                                selectedTransaction.uang_diterima || "0",
                              ),
                            )}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span>Kembalian:</span>
                          <span style={{ color: "var(--accent-light)" }}>
                            {formatRupiah(
                              parseFloat(selectedTransaction.kembalian),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    <i className="bi bi-x-lg"></i> Tutup
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsReceiptView(true)}
                  >
                    <i className="bi bi-printer"></i> Cetak Struk
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-receipt"></i> Struk Pembelian
                  </h5>
                  <button
                    className="modal-close"
                    onClick={() => setIsReceiptView(false)}
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                </div>
                <div
                  className="modal-body"
                  style={{ background: "#f5f5f5", padding: "20px" }}
                >
                  <PrintableReceipt
                    transaction={selectedTransaction}
                    onClose={() => {
                      setIsDetailModalOpen(false);
                      setIsReceiptView(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedTransaction && (
        <div
          className="modal-overlay"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-pencil"></i> Edit Transaksi
              </h5>
              <button
                className="modal-close"
                onClick={() => setIsEditModalOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="summary-card" style={{ marginBottom: "20px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  <i className="bi bi-info-circle"></i> Edit transaksi akan
                  memperbarui metode pembayaran dan jumlah uang diterima. Item
                  tidak dapat diubah.
                </p>
              </div>

              <div className="summary-card">
                <h6>Informasi Saat Ini</h6>
                <div className="summary-details">
                  <div className="summary-item">
                    <span>Nomor:</span>
                    <span>{selectedTransaction.nomor_transaksi}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total:</span>
                    <span
                      style={{ color: "var(--accent-light)", fontWeight: 700 }}
                    >
                      {formatRupiah(parseFloat(selectedTransaction.total))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cash-input" style={{ marginTop: "20px" }}>
                <label>Metode Pembayaran</label>
                <div className="payment-options">
                  {["cash", "card", "qris", "transfer"].map((method) => (
                    <label
                      key={method}
                      className={`payment-option ${
                        selectedTransaction.metode_pembayaran === method
                          ? "active"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={
                          selectedTransaction.metode_pembayaran === method
                        }
                        onChange={(e) =>
                          setSelectedTransaction({
                            ...selectedTransaction,
                            metode_pembayaran: e.target.value,
                          })
                        }
                      />
                      <i className={`bi ${getPaymentMethodIcon(method)}`}></i>
                      <span>{getPaymentMethodLabel(method)}</span>
                    </label>
                  ))}
                </div>

                {selectedTransaction.metode_pembayaran === "cash" && (
                  <>
                    <label style={{ marginTop: "15px" }}>Uang Diterima</label>
                    <input
                      type="number"
                      value={parseFloat(
                        selectedTransaction.uang_diterima || "0",
                      )}
                      onChange={(e) =>
                        setSelectedTransaction({
                          ...selectedTransaction,
                          uang_diterima: parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder="Masukkan jumlah"
                    />
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-success"
                onClick={async () => {
                  try {
                    await updateTransaction(selectedTransaction.id, {
                      metode_pembayaran: selectedTransaction.metode_pembayaran,
                      uang_diterima: selectedTransaction.uang_diterima
                        ? parseFloat(
                            selectedTransaction.uang_diterima.toString(),
                          )
                        : null,
                    });
                    addNotification("Transaksi berhasil diperbarui", "success");
                    setIsEditModalOpen(false);
                    loadTransactions();
                  } catch (error: any) {
                    addNotification(
                      error.message || "Gagal memperbarui transaksi",
                      "danger",
                    );
                  }
                }}
              >
                <i className="bi bi-check-circle"></i> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
