"use client";

import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductsGridProps {
  products: Product[];
  onAddToCart: (id: number | string) => void;
  // TAMBAHKAN INI: Agar sinkron dengan page.tsx yang mengirim fungsi update stok
  onUpdateStock: (id: number | string, newStock: number) => Promise<void>;
}

export default function ProductsGrid({
  products,
  onAddToCart,
  onUpdateStock, // Terima prop-nya di sini
}: ProductsGridProps) {
  return (
    <div className="products-container">
      <div className="section-header">
        <h3>
          <i className="bi bi-grid"></i> Katalog Barang
        </h3>
        <div className="filter-buttons">
          <button className="filter-btn active">Semua</button>
        </div>
      </div>

      <div className="products-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              // Jika ProductCard kamu juga butuh update stok, kirim ke bawah
              // onUpdateStock={onUpdateStock}
            />
          ))
        ) : (
          <div className="text-center w-full py-10 text-gray-500">
            <i className="bi bi-search text-4xl d-block mb-2"></i>
            Barang tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
