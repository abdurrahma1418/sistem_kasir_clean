"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function SuccessPage() {
  // Membersihkan keranjang setelah sukses
  useEffect(() => {
    localStorage.removeItem("cart");
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center p-6">
      {/* Container Utama - Mengikuti style kartu di gambar */}
      <div className="w-full max-w-2xl bg-white rounded-[30px] border border-[#D1C4E9] shadow-sm overflow-hidden p-10 text-center">
        {/* Ikon Sukses dengan gradasi ungu sesuai tombol 'Tambah Barang' */}
        <div className="w-24 h-24 bg-gradient-to-r from-[#8E24AA] to-[#7B1FA2] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Judul dengan font gelap seperti 'Kelola Barang' */}
        <h1 className="text-[#1A1A1A] text-3xl font-bold mb-4">
          Pembayaran Berhasil!
        </h1>

        <p className="text-[#666666] text-lg mb-10 leading-relaxed">
          Terima kasih telah berbelanja di{" "}
          <span className="font-bold text-[#7B1FA2]">TOKO BUKU AA</span>.<br />
          Pembayaran Anda telah diverifikasi dan pesanan sedang diproses.
        </p>

        {/* Tombol Aksi - Menggunakan gradasi ungu yang sama dengan gambar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-gradient-to-r from-[#7B1FA2] to-[#9C27B0] text-white font-semibold rounded-full shadow-md hover:opacity-90 transition-all text-center"
          >
            Kembali Belanja
          </Link>

          <Link
            href="/transaksi"
            className="px-8 py-3 bg-white text-[#7B1FA2] font-semibold border-2 border-[#7B1FA2] rounded-full hover:bg-[#F3E5F5] transition-all text-center"
          >
            Lihat Riwayat Transaksi
          </Link>
        </div>
      </div>

      {/* Footer Branding Kecil */}
      <p className="mt-8 text-[#BDBDBD] text-sm font-medium uppercase tracking-widest">
        Toko Buku AA - POS System
      </p>
    </div>
  );
}
