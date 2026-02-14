  "use client";

  import { useState, useEffect, useCallback } from "react";
  import TopNavbar from "@/components/TopNavbar";
  import StatsCards from "@/components/StatsCards";
  import ProductsGrid from "@/components/ProductsGrid";
  import Cart from "@/components/Cart";
  import CheckoutModal from "@/components/CheckoutModal";
  import Notifications from "@/components/Notifications";
  import { Product, CartItem, Category } from "@/types";
  import { formatRupiah } from "@/lib/utils";
  import {
    fetchProducts,
    fetchStatistics,
    createTransaction,
    updateStock,
  } from "@/lib/api";
  import { useNotificationStore } from "@/hooks/useNotification";

  export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // State loading untuk keren-kerenan
    const [stats, setStats] = useState({
      todaySales: "Rp 0",
      totalTransactions: 0,
      itemsSold: 0,
      newCustomers: 0,
    });

    const addNotification = useNotificationStore(
      (state) => state.addNotification,
    );

    /**
     * MENGUBAH DATA API MENJADI FORMAT UI
     * Menggunakan id_barang sebagai ID utama agar sinkron dengan Database
     */
    const mapProductData = useCallback((data: any[]): Product[] => {
      if (!Array.isArray(data)) return [];
      return data.map((item) => ({
        id: item.id_barang || item.id, // Fallback ke id jika id_barang tidak ada
        title: item.nama || "Produk Tanpa Nama",
        author: `Kode: ${item.kode_barang || "-"}`,
        price: Number(item.harga_jual || item.harga || 0),
        category: (["novel", "alat_sekolah", "buku_anak"].includes(item.kategori)
          ? item.kategori
          : "umum") as Category,
        stock: Number(item.stok) || 0,
        sold: Number(item.terjual) || 0,
        icon: "bi-box-seam",
        kode_barang: item.kode_barang,
      }));
    }, []);

    /**
     * REFRESH DATA DARI SERVER
     */
    const refreshData = useCallback(async () => {
      try {
        const [productData, statsData] = await Promise.all([
          fetchProducts(),
          fetchStatistics(),
        ]);

        setProducts(mapProductData(productData));

        setStats({
          todaySales: formatRupiah(parseFloat(statsData.total_penjualan) || 0),
          totalTransactions: Number(statsData.total_transaksi) || 0,
          itemsSold: Number(statsData.total_items) || 0,
          newCustomers: 24, // Contoh statis
        });
      } catch (error) {
        console.error("Sync Error:", error);
        addNotification("Gagal mengambil data terbaru dari server", "danger");
      }
    }, [mapProductData, addNotification]);

    // Load awal
    useEffect(() => {
      refreshData();
    }, [refreshData]);

    /**
     * HANDLE UPDATE STOK (GUDANG/MANUAL)
     */
    const handleUpdateStock = async (
      productId: number,
      newStockValue: number,
    ) => {
      try {
        // 1. Update UI secara lokal (Biar instan/keren)
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, stock: newStockValue } : p,
          ),
        );

        // 2. Kirim ke Backend
        await updateStock(productId, newStockValue);
        addNotification("Stok berhasil diperbarui", "success");

        // 3. Re-fetch biar data benar-benar valid
        await refreshData();
      } catch (error: any) {
        addNotification(error.message || "Gagal memperbarui stok", "danger");
        refreshData(); // Rollback UI
      }
    };

    /**
     * TAMBAH KE KERANJANG
     */
    const handleAddToCart = useCallback(
      (productId: number) => {
        const product = products.find((p) => p.id === productId);

        if (!product || product.stock <= 0) {
          addNotification("Maaf, stok barang habis!", "warning");
          return;
        }

        setCart((prev) => {
          const existing = prev.find((item) => item.id === productId);
          if (existing) {
            if (existing.quantity < product.stock) {
              return prev.map((item) =>
                item.id === productId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              );
            }
            addNotification("Stok tidak mencukupi!", "warning");
            return prev;
          }
          return [...prev, { ...product, quantity: 1 }];
        });

        addNotification(`${product?.title} masuk keranjang`, "success");
      },
      [products, addNotification],
    );

    /**
     * FILTER PENCARIAN
     */
    const filteredProducts = products.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return (
      <>
        <TopNavbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSidebarToggle={() => {}}
        />

        <main className="main-content">
          <div className="content-container">
            <StatsCards
              todaySales={stats.todaySales as any}
              totalTransactions={stats.totalTransactions}
              booksSold={stats.itemsSold}
              newCustomers={stats.newCustomers}
            />

            <div className="pos-section">
              <ProductsGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                onUpdateStock={handleUpdateStock}
              />

              <Cart
                cart={cart}
                onUpdateQuantity={(id, change) => {
                  setCart((prev) =>
                    prev
                      .map((i) =>
                        i.id === id ? { ...i, quantity: i.quantity + change } : i,
                      )
                      .filter((i) => i.quantity > 0),
                  );
                }}
                onRemove={(id) =>
                  setCart((prev) => prev.filter((i) => i.id !== id))
                }
                onClear={() => setCart([])}
                subtotal={formatRupiah(subtotal)}
                discount="Rp 0"
                total={formatRupiah(subtotal)}
                onCheckout={() => setIsCheckoutModalOpen(true)}
              />
            </div>
          </div>
        </main>

        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          cart={cart}
          total={subtotal}
          onProcessPayment={async (method, cash) => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              // PAYLOAD SESUAI TABEL transaksi & detail_transaksi
              const payload = {
                items: cart.map((i) => ({
                  id_barang: i.id,
                  jumlah: i.quantity,
                  harga_satuan: i.price,
                })),
                metode_pembayaran: method,
                uang_diterima: Number(cash),
                total_harga: subtotal,
              };

              await createTransaction(payload);

              // RESET SETELAH BERHASIL
              setCart([]);
              setIsCheckoutModalOpen(false);
              addNotification("Transaksi Berhasil Disimpan!", "success");

              // REFRESH STOK TERBARU (PENTING!)
              await refreshData();
            } catch (e: any) {
              addNotification(e.message || "Transaksi Gagal!", "danger");
            } finally {
              setIsLoading(false);
            }
          }}
        />

        <Notifications />
      </>
    );
  }
