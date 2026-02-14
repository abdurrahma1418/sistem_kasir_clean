"use client";

import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductsGridProps {
  products: Product[];
  onAddToCart: (id: number) => void;
}

export default function ProductsGrid({
  products,
  onAddToCart,
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
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
