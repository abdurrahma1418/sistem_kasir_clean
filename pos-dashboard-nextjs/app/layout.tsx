import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOKO BUKU AA",
  description: "Sistem Kasir Toko Buku AA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
