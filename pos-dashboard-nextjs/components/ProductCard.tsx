'use client';

import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card" onClick={() => onAddToCart(product.id)}>
      <div className="product-image">
        <i className={`bi ${product.icon}`}></i>
      </div>
      <div className="product-category">{product.category}</div>
      <div className="product-title">{product.title}</div>
      <div className="product-author">{product.author}</div>
      <div className="product-footer">
        <div className="product-price">{product.price}</div>
        <div className="product-stock">Stok: {product.stock}</div>
      </div>
    </div>
  );
}
