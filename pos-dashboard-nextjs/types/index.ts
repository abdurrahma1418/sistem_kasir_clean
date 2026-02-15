// types/index.ts

export type PaymentMethod = "cash" | "card" | "qris" | "transfer";

// Tipe Category ditambahkan agar import di page.tsx tidak error
export type Category = "umum" | "novel" | "alat_sekolah" | "buku_anak";

export interface Product {
  id: number | string; // Menggunakan number | string agar fleksibel
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
  todaySales: string | number;
  totalTransactions: number;
  booksSold: number;
  newCustomers: number;
}

export interface Notification {
  id: string;
  message: string;
  type: "success" | "danger" | "warning" | "info";
}

// Sesuaikan PaymentData dengan skema database detail_transaksi kamu
export interface PaymentData {
  items: {
    id_barang: number | string;
    jumlah: number;
    harga_satuan: number;
  }[];
  metode_pembayaran: PaymentMethod;
  uang_diterima: number;
  total_harga: number;
}

export interface TransactionResponse {
  nomor_transaksi: string;
  total: number;
}
