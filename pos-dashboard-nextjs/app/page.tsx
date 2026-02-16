"use client";

import { useState, useEffect, useCallback } from "react";
import TopNavbar from "@/components/TopNavbar";
import StatsCards from "@/components/StatsCards";
import ProductsGrid from "@/components/ProductsGrid";
import Cart from "@/components/Cart";
import CheckoutModal from "@/components/CheckoutModal";
import Notifications from "@/components/Notifications";
import { Product, CartItem } from "@/types";
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
  const [isLoading, setIsLoading] = useState(false);
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
   * Menggunakan fallback (?? 0) untuk mencegah error TypeScript di Railway
   */
  const mapProductData = useCallback((data: any[]): Product[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: item.id_barang ?? item.id ?? Math.random(),
      title: item.nama ?? "Produk Tanpa Nama",
      author: `Kode: ${item.kode_barang ?? "-"}`,
      price: Number(item.harga_jual ?? item.harga ?? 0),
      stock: Number(item.stok ?? 0),
      sold: Number(item.terjual ?? 0),
      icon: "bi-box-seam",
      kode_barang: item.kode_barang ?? "",
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

      // Memastikan nilai statsData ada sebelum di-parse
      const totalSales = parseFloat(statsData?.total_penjualan) || 0;
      setStats({
        todaySales: formatRupiah(totalSales),
        totalTransactions: Number(statsData?.total_transaksi ?? 0),
        itemsSold: Number(statsData?.total_items ?? 0),
        newCustomers: 24, // Placeholder
      });
    } catch (error) {
      console.error("Sync Error:", error);
      addNotification("Gagal mengambil data dari server", "danger");
    }
  }, [mapProductData, addNotification]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /**
   * UPDATE STOK
   */
  const handleUpdateStock = async (
    productId: number | string,
    newStockValue: number,
  ) => {
    try {
      // Optimistic Update (Update UI dulu agar terasa cepat)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock: newStockValue } : p,
        ),
      );

      await updateStock(productId, newStockValue);
      addNotification("Stok berhasil diperbarui", "success");
      await refreshData();
    } catch (error: any) {
      addNotification(error.message || "Gagal memperbarui stok", "danger");
      refreshData(); // Kembalikan data jika gagal
    }
  };

  /**
   * LOGIKA KERANJANG
   */
  const handleAddToCart = useCallback(
    (productId: number | string) => {
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

      addNotification(`${product.title} masuk keranjang`, "success");
    },
    [products, addNotification],
  );

  /**
   * FITUR SEARCH
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
        subtotal={subtotal}
        onProcessPayment={async (method, cash) => {
          if (isLoading) return;
          setIsLoading(true);
          try {
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

            setCart([]);
            setIsCheckoutModalOpen(false);
            addNotification("Transaksi Berhasil!", "success");
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
