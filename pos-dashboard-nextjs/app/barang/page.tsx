"use client";

import { useState, useEffect, useCallback } from "react";
import TopNavbar from "@/components/TopNavbar";
import { Product } from "@/types";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { useNotificationStore } from "@/hooks/useNotification";

export default function BarangPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    kode_barang: "",
    harga: 0,
    stok: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(
        data.map((item: any) => ({
          id: item.id || item.id_barang,
          title: item.nama,
          price: item.harga,
          stock: item.stok,
          kode_barang: item.kode_barang,
        })),
      );
    } catch (error) {
      addNotification("Gagal muat data", "danger");
    }
  }, [addNotification]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setIsModalOpen(false);
      loadProducts();
      addNotification("Berhasil disimpan", "success");
    } catch (error) {
      addNotification("Gagal simpan", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // KONSTRUKSI WARNA BARU (INDIGO)
  const PRIMARY_COLOR = "rgb(99, 102, 241)"; // Indigo
  const SHADOW_COLOR = "rgba(99, 102, 241, 0.5)";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F4F7FF",
        fontFamily: "sans-serif",
      }}
    >
      <TopNavbar
        onSidebarToggle={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main style={{ padding: "40px 20px" }}>
        {/* CARD UTAMA */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            backgroundColor: "#fff",
            borderRadius: "40px",
            boxShadow: `0 12px 32px rgba(0,0,0,0.03)`,
            border: "1px solid #E0E7FF",
            overflow: "hidden",
          }}
        >
          {/* HEADER DENGAN TOMBOL INDIGO PANJANG */}
          <div
            style={{
              padding: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#EEF2FF",
                  borderRadius: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: PRIMARY_COLOR,
                }}
              >
                <i className="bi bi-box-seam" style={{ fontSize: "24px" }}></i>
              </div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1E293B",
                  margin: 0,
                }}
              >
                Kelola Barang
              </h2>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ nama: "", kode_barang: "", harga: 0, stok: 0 });
                setIsModalOpen(true);
              }}
              style={{
                flex: 1,
                maxWidth: "700px",
                height: "55px",
                background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, #4F46E5 100%)`,
                color: "white",
                border: "none",
                borderRadius: "50px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: `0 12px 32px ${SHADOW_COLOR}`,
                transition: "transform 0.2s",
              }}
            >
              + Tambah Barang
            </button>
          </div>

          {/* TABEL */}
          <div style={{ padding: "0 30px 30px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#94A3B8",
                    borderBottom: "2px solid #F8FAFC",
                  }}
                >
                  <th style={{ padding: "15px" }}>Kode</th>
                  <th style={{ padding: "15px" }}>Nama Barang</th>
                  <th style={{ padding: "15px" }}>Harga</th>
                  <th style={{ padding: "15px" }}>Stok</th>
                  <th style={{ padding: "15px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <td style={{ padding: "20px 15px", color: "#64748B" }}>
                      {p.kode_barang}
                    </td>
                    <td
                      style={{
                        padding: "20px 15px",
                        color: "#1E293B",
                        fontWeight: "500",
                      }}
                    >
                      {p.title}
                    </td>
                    <td
                      style={{
                        padding: "20px 15px",
                        color: PRIMARY_COLOR,
                        fontWeight: "bold",
                      }}
                    >
                      {formatRupiah(p.price)}
                    </td>
                    <td style={{ padding: "20px 15px", color: "#64748B" }}>
                      {p.stock}
                    </td>
                    <td style={{ padding: "20px 15px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setFormData({
                            nama: p.title,
                            kode_barang: p.kode_barang,
                            harga: p.price,
                            stok: p.stock,
                          });
                          setIsModalOpen(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94A3B8",
                          marginRight: "10px",
                        }}
                      >
                        <i className="bi bi-pencil-square hover:text-indigo-600"></i>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Hapus?"))
                            deleteProduct(p.id).then(loadProducts);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94A3B8",
                        }}
                      >
                        <i className="bi bi-trash hover:text-red-500"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL (POPUP) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "500px",
              borderRadius: "35px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, #4F46E5 100%)`,
                padding: "25px",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontWeight: "bold" }}>
                {editingProduct ? "Edit Barang" : "Tambah Barang"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "35px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "#64748B",
                    marginBottom: "8px",
                    fontWeight: "800",
                    letterSpacing: "0.05em",
                  }}
                >
                  NAMA BARANG
                </label>
                <input
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    outline: "none",
                  }}
                  placeholder="Contoh: Atomic Habits"
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "#64748B",
                    marginBottom: "8px",
                    fontWeight: "800",
                    letterSpacing: "0.05em",
                  }}
                >
                  KODE BARANG
                </label>
                <input
                  value={formData.kode_barang}
                  onChange={(e) =>
                    setFormData({ ...formData, kode_barang: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    outline: "none",
                  }}
                  placeholder="B001"
                />
              </div>
              <div
                style={{ display: "flex", gap: "20px", marginBottom: "30px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748B",
                      marginBottom: "8px",
                      fontWeight: "800",
                      letterSpacing: "0.05em",
                    }}
                  >
                    HARGA
                  </label>
                  <input
                    type="number"
                    value={formData.harga}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        harga: Number(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#64748B",
                      marginBottom: "8px",
                      fontWeight: "800",
                      letterSpacing: "0.05em",
                    }}
                  >
                    STOK
                  </label>
                  <input
                    type="number"
                    value={formData.stok}
                    onChange={(e) =>
                      setFormData({ ...formData, stok: Number(e.target.value) })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "18px",
                  border: "none",
                  background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, #4F46E5 100%)`,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: "pointer",
                  boxShadow: `0 8px 20px ${SHADOW_COLOR}`,
                }}
              >
                {isSaving ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
