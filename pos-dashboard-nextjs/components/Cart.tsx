'use client';

import { CartItem as CartItemType } from '@/types';
import { formatRupiah } from '@/lib/utils';

interface CartProps {
  cart: CartItemType[];
  onUpdateQuantity: (id: number, change: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  subtotal: string;
  discount: string;
  total: string;
  onCheckout: () => void;
}

export default function Cart({
  cart,
  onUpdateQuantity,
  onRemove,
  onClear,
  subtotal,
  discount,
  total,
  onCheckout,
}: CartProps) {
  return (
    <div className="cart-container">
      <div className="cart-header glass-card">
        <div className="cart-title">
          <i className="bi bi-cart4"></i>
          <h3>Keranjang Belanja</h3>
        </div>
        <button className="btn-clear-cart" onClick={onClear}>
          <i className="bi bi-trash3-fill"></i>
          <span>Kosongkan</span>
        </button>
      </div>
      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <i className="bi bi-cart-x"></i>
            <p>Keranjang kosong</p>
          </div>
        ) : (
          cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <div className="cart-item-image">
                <i className={`bi ${item.icon}`}></i>
              </div>
              <div className="cart-item-details">
                <div className="cart-item-title">{item.title}</div>
                <div className="cart-item-price">{formatRupiah(item.price)}</div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQuantity(item.id, -1)}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <button className="cart-item-remove" onClick={() => onRemove(item.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="cart-summary glass-card">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{subtotal}</span>
        </div>
        <div className="summary-row">
          <span>Diskon</span>
          <span className="text-success">{discount}</span>
        </div>
        <hr />
        <div className="summary-row total">
          <span>Total</span>
          <span className="total-amount">{total}</span>
        </div>
        <div className="cart-actions">
          <button className="btn-hold">
            <i className="bi bi-pause-circle"></i>
            Hold
          </button>
          <button className="btn-checkout" onClick={onCheckout} disabled={cart.length === 0}>
            <i className="bi bi-credit-card"></i>
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
