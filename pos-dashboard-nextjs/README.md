# TOKO BUKU AA - Dashboard

Project Next.js untuk Dashboard Toko Buku AA.

## Fitur

- Dashboard statistik penjualan
- Katalog produk dengan filter dan pencarian
- Keranjang belanja dengan manajemen quantity
- Checkout dengan berbagai metode pembayaran
- Desain glassmorphism dengan tema hijau elegan
- Responsive untuk mobile dan desktop

## Instalasi

```bash
npm install
```

## Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Build untuk Production

```bash
npm run build
npm start
```

## Environment Variables

Buat file `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
```

## Teknologi

- Next.js 14
- React 18
- TypeScript
- Zustand (State Management)
- Bootstrap Icons
- CSS (Tanpa framework CSS eksternal)

## Struktur Project

```
toko-buku-aa-nextjs/
├── app/
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Halaman utama
├── components/           # React components
│   ├── Sidebar.tsx
│   ├── TopNavbar.tsx
│   ├── StatsCards.tsx
│   ├── ProductsGrid.tsx
│   ├── ProductCard.tsx
│   ├── Cart.tsx
│   ├── CheckoutModal.tsx
│   └── Notifications.tsx
├── hooks/               # Custom hooks
│   └── useNotification.ts
├── lib/                 # Utilities
│   ├── api.ts           # API functions
│   └── utils.ts         # Helper functions
├── types/               # TypeScript types
│   └── index.ts
└── public/              # Static assets
```
