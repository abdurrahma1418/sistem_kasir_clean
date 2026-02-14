"use client";

import { useState, useEffect, useCallback } from "react";
import TopNavbar from "@/components/TopNavbar";
import { Product } from "@/types";
import { fetchProducts, updateStock } from "@/lib/api";
import { useNotificationStore } from "@/hooks/useNotification";

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  // KONSTANTA STYLE
  const PRIMARY_COLOR = "rgb(99, 102, 241)";
  const SHADOW_STYLE = "0 12px 32px rgba(99, 102, 241, 0.4)";

  // Fungsi memuat data dari API
  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      // Mapping field id_barang ke id untuk konsistensi frontend
      const mappedData = data.map((item: any) => ({
        id: item.id_barang || item.id,
        title: item.nama,
        price: item.harga,
        stock: Number(item.stok) || 0,
        kode_barang: item.kode_barang,
      }));
      setProducts(mappedData);
    } catch (error) {
      addNotification("Gagal memuat data barang", "danger");
    }
  }, [addNotification]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fungsi Update Stok (Perbaikan Utama)
  const handleUpdate = async (type: "add" | "set") => {
    // Validasi dasar
    if (!selectedProduct || isUpdating) return;

    const inputVal = selectedProduct.inputValue;
    if (inputVal === "" || inputVal === null) {
      addNotification("Masukkan angka terlebih dahulu", "warning");
      return;
    }

    const inputAmount = Number(inputVal);
    const currentStock = Number(selectedProduct.stock);

    // Hitung stok akhir
    const finalStock =
      type === "add" ? currentStock + inputAmount : inputAmount;

    if (finalStock < 0) {
      addNotification("Stok tidak boleh kurang dari 0", "warning");
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Kirim ke Database (Gunakan id asli dari DB)
      await updateStock(selectedProduct.id, finalStock);

      // 2. Optimistic Update: Langsung update state lokal agar UI berubah seketika
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, stock: finalStock } : p,
        ),
      );

      addNotification(
        type === "add"
          ? `Berhasil menambah ${inputAmount} stok`
          : `Stok berhasil diatur ke ${finalStock}`,
        "success",
      );

      // 3. Reset & Tutup Modal
      setIsModalOpen(false);
      setSelectedProduct(null);

      // 4. Background refresh untuk memastikan sinkronisasi data terbaru
      loadProducts();
    } catch (error: any) {
      addNotification(error.message || "Gagal memperbarui database", "danger");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kode_barang.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStock === "low")
      return matchesSearch && p.stock > 0 && p.stock <= 10;
    if (filterStock === "out") return matchesSearch && p.stock === 0;
    return matchesSearch;
  });

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

      <main
        style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* STATS CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {[
            {
              label: "Total Barang",
              val: products.length,
              icon: "bi-boxes",
              color: PRIMARY_COLOR,
            },
            {
              label: "Stok Rendah",
              val: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
              icon: "bi-exclamation-triangle",
              color: "#F59E0B",
            },
            {
              label: "Stok Habis",
              val: products.filter((p) => p.stock === 0).length,
              icon: "bi-x-circle",
              color: "#EF4444",
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "30px",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                border: "1px solid #E0E7FF",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "15px",
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                <i className={`bi ${stat.icon}`}></i>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#64748B",
                    fontWeight: "500",
                  }}
                >
                  {stat.label}
                </p>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: "#1E293B",
                  }}
                >
                  {stat.val}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* TABLE CARD */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "40px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            border: "1px solid #E0E7FF",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #F1F5F9",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "bold",
                color: "#1E293B",
              }}
            >
              Monitoring Stok
            </h2>
            <div
              style={{
                display: "flex",
                backgroundColor: "#F1F5F9",
                padding: "5px",
                borderRadius: "15px",
              }}
            >
              {["all", "low", "out"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStock(f as any)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: filterStock === f ? "#fff" : "transparent",
                    color: filterStock === f ? PRIMARY_COLOR : "#64748B",
                    boxShadow:
                      filterStock === f
                        ? "0 4px 10px rgba(0,0,0,0.05)"
                        : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {f === "all" ? "Semua" : f === "low" ? "Rendah" : "Habis"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#94A3B8",
                    fontSize: "14px",
                  }}
                >
                  <th style={{ padding: "15px" }}>Barang</th>
                  <th style={{ padding: "15px" }}>Kode</th>
                  <th style={{ padding: "15px" }}>Stok</th>
                  <th style={{ padding: "15px" }}>Status</th>
                  <th style={{ padding: "15px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #F8FAFC",
                      transition: "background 0.3s",
                    }}
                  >
                    <td
                      style={{
                        padding: "15px",
                        color: "#1E293B",
                        fontWeight: "600",
                      }}
                    >
                      {p.title}
                    </td>
                    <td style={{ padding: "15px", color: "#64748B" }}>
                      {p.kode_barang}
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        color: "#1E293B",
                        fontWeight: "700",
                        fontSize: "16px",
                      }}
                    >
                      {p.stock}
                    </td>
                    <td style={{ padding: "15px" }}>
                      <span
                        style={{
                          padding: "5px 12px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          backgroundColor:
                            p.stock === 0
                              ? "#FEE2E2"
                              : p.stock <= 10
                                ? "#FEF3C7"
                                : "#DCFCE7",
                          color:
                            p.stock === 0
                              ? "#EF4444"
                              : p.stock <= 10
                                ? "#D97706"
                                : "#16A34A",
                        }}
                      >
                        {p.stock === 0
                          ? "Habis"
                          : p.stock <= 10
                            ? "Rendah"
                            : "Aman"}
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          setSelectedProduct({ ...p, inputValue: "" });
                          setIsModalOpen(true);
                        }}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "12px",
                          border: "none",
                          backgroundColor: PRIMARY_COLOR,
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && selectedProduct && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "400px",
              borderRadius: "35px",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, #4F46E5 100%)`,
                padding: "25px",
                color: "white",
                textAlign: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>{selectedProduct.title}</h3>
              <p style={{ margin: "5px 0 0", opacity: 0.8 }}>
                Stok Saat Ini: {selectedProduct.stock}
              </p>
            </div>

            <div style={{ padding: "30px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#64748B",
                  marginBottom: "10px",
                }}
              >
                JUMLAH STOK
              </label>
              <input
                type="number"
                autoFocus
                value={selectedProduct.inputValue}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    inputValue: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "15px",
                  border: "2px solid #F1F5F9",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center",
                  outline: "none",
                  marginBottom: "25px",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <button
                  onClick={() => handleUpdate("add")}
                  disabled={isUpdating}
                  style={{
                    padding: "15px",
                    borderRadius: "18px",
                    border: `2px solid ${PRIMARY_COLOR}`,
                    color: PRIMARY_COLOR,
                    background: "transparent",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {isUpdating ? "..." : "+ Tambah"}
                </button>
                <button
                  onClick={() => handleUpdate("set")}
                  disabled={isUpdating}
                  style={{
                    padding: "15px",
                    borderRadius: "18px",
                    border: "none",
                    background: PRIMARY_COLOR,
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: SHADOW_STYLE,
                  }}
                >
                  {isUpdating ? "..." : "Set Baru"}
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                }}
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
