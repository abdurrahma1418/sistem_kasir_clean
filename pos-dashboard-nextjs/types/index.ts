export type PaymentMethod = 'cash' | 'card' | 'qris' | 'transfer';

export interface Product {
  id: number;
  title: string;
  author: string;
  price: number;
  stock: number;
  sold: number;
  icon: string;
  kode_barang: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Statistics {
  todaySales: number;
  totalTransactions: number;
  booksSold: number;
  newCustomers: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

export interface PaymentData {
  items: { id: number; quantity: number }[];
  metode_pembayaran: PaymentMethod;
  uang_diterima: number | null;
  nama_kasir: string;
}

export interface TransactionResponse {
  nomor_transaksi: string;
  total: number;
}
