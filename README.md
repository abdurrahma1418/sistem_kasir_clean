# 🏪 TOKO BUKU AA - Sistem Kasir

![License](https://img.shields.io/badge/license-ISC-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![Next.js](https://img.shields.io/badge/Next.js-14.2.18-black)

Sistem kasir lengkap untuk Toko Buku AA dengan backend Express.js dan dashboard Next.js. Aplikasi ini memudahkan pengelolaan transaksi penjualan, manajemen stok buku, dan pembuatan laporan keuangan.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Project](#struktur-project)
- [Instalasi](#instalasi)
- [Konfigurasi Database](#konfigurasi-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Dokumentasi API](#dokumentasi-api)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## ✨ Fitur Utama

### Backend API
- ✅ **Manajemen Buku**
  - CRUD lengkap untuk data buku
  - Pencarian berdasarkan kode atau judul
  - Monitor stok rendah
  - Statistik buku

- ✅ **Transaksi Penjualan**
  - Proses checkout cepat
  - Kalkulasi otomatis (subtotal, pajak, diskon)
  - Generasi nomor transaksi unik
  - Pembatalan transaksi

- ✅ **Laporan**
  - Laporan penjualan harian
  - Laporan penjualan periode tertentu
  - Ringkasan statistik

### Dashboard Frontend
- 📊 **Dashboard Utama**
  - Statistik penjualan real-time
  - Kartu statistik (total penjualan, transaksi, dll)
  - Navigasi sidebar yang intuitif

- 🛒 **Kasir/Transaksi**
  - Keranjang belanja dinamis
  - Modal checkout
  - Notifikasi status
  - Pencarian produk

- 📦 **Manajemen Stok**
  - Daftar produk dengan kategori
  - Indikator stok rendah

## 🛠 Teknologi yang Digunakan

### Backend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| Node.js | >=18.0.0 | Runtime JavaScript |
| Express.js | 4.18.2 | Web Framework |
| MySQL2 | 3.6.5 | Database Driver |
| dotenv | 16.3.1 | Environment Variables |
| CORS | 2.8.5 | Cross-Origin Resource Sharing |
| Helmet | 7.1.0 | Security Headers |
| Joi | 17.11.0 | Input Validation |
| Winston | 3.11.0 | Logging |

### Frontend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| Next.js | 14.2.18 | React Framework |
| React | 18.3.1 | UI Library |
| TypeScript | 5.x | Type Safety |
| Zustand | 5.0.2 | State Management |
| Bootstrap Icons | 1.11.0 | Icon Library |

## 📁 Struktur Project

```
sistem_kasir/
├── backend/                    # Backend API
│   ├── config/                 # Konfigurasi database
│   ├── controllers/            # Logika bisnis
│   ├── middleware/             # Middleware (validasi, error handling)
│   ├── migrations/             # Migrasi database
│   ├── models/                 # Model data
│   ├── routes/                 # Route API
│   ├── utils/                  # Utility functions
│   ├── server.js               # Entry point backend
│   ├── package.json
│   └── .env.example            # Template environment variables
│
├── pos-dashboard-nextjs/       # Dashboard Next.js
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utility & API client
│   ├── types/                  # TypeScript types
│   ├── package.json
│   └── next.config.js
│
├── pos-dashboard.html          # Dashboard HTML standalone
├── app.js                      # Server untuk HTML dashboard
├── styles.css                  # Styles untuk HTML dashboard
└── README.md
```

## 🚀 Instalasi

### Prasyarat

Pastikan sudah terinstall:
- Node.js >= 18.0.0
- MySQL >= 5.7
- npm >= 9.0.0

### Langkah-langkah Instalasi

1. **Clone repository**
```bash
git clone https://github.com/abdurrahma1418/sistem_kasir.git
cd sistem_kasir
```

2. **Install dependencies Backend**
```bash
cd backend
npm install
```

3. **Install dependencies Frontend**
```bash
cd ../pos-dashboard-nextjs
npm install
```

## 🗄 Konfigurasi Database

### 1. Buat Database MySQL

```sql
CREATE DATABASE penjualan_aa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Buat Tabel Buku

```sql
USE penjualan_aa;

CREATE TABLE buku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_buku VARCHAR(50) UNIQUE NOT NULL,
    judul VARCHAR(255) NOT NULL,
    penulis VARCHAR(100),
    penerbit VARCHAR(100),
    tahun_terbit INT,
    kategori VARCHAR(50),
    harga_jual DECIMAL(10, 2) NOT NULL,
    stok INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Buat Tabel Transaksi

```sql
CREATE TABLE transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_transaksi VARCHAR(50) UNIQUE NOT NULL,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_item INT DEFAULT 0,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    pajak DECIMAL(10, 2) DEFAULT 0,
    diskon DECIMAL(10, 2) DEFAULT 0,
    total_bayar DECIMAL(10, 2) DEFAULT 0,
    bayar DECIMAL(10, 2) DEFAULT 0,
    kembalian DECIMAL(10, 2) DEFAULT 0,
    status ENUM('selesai', 'dibatalkan') DEFAULT 'selesai',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Buat Tabel Detail Transaksi

```sql
CREATE TABLE detail_transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaksi_id INT NOT NULL,
    buku_id INT NOT NULL,
    jumlah INT NOT NULL,
    harga_satuan DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
    FOREIGN KEY (buku_id) REFERENCES buku(id)
);
```

### 5. Konfigurasi Environment

Copy file `.env.example` ke `.env`:

```bash
cd backend
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_anda
DB_NAME=penjualan_aa

# Transaction Settings
TAX_RATE=0.11
```

## ▶ Menjalankan Aplikasi

### Backend

```bash
cd backend
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### Frontend (Development)

```bash
cd pos-dashboard-nextjs
npm run dev
```

Dashboard akan berjalan di `http://localhost:3001`

### Frontend (Production)

```bash
cd pos-dashboard-nextjs
npm run build
npm start
```

### HTML Dashboard Standalone

```bash
node app.js
```

Dashboard HTML akan berjalan di `http://localhost:3002`

## 📚 Dokumentasi API

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### 📚 Buku

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/buku` | Daftar semua buku |
| GET | `/buku/:id` | Detail buku berdasarkan ID |
| GET | `/buku/kode/:kode` | Cari buku berdasarkan kode |
| GET | `/buku/statistik` | Statistik buku |
| GET | `/buku/stok-rendah` | Daftar buku stok rendah |
| POST | `/buku` | Tambah buku baru |
| PUT | `/buku/:id` | Update data buku |
| DELETE | `/buku/:id` | Hapus buku |

#### 💰 Transaksi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/transaksi` | Daftar semua transaksi |
| GET | `/transaksi/:id` | Detail transaksi |
| GET | `/transaksi/nomor/:nomor` | Cari transaksi berdasarkan nomor |
| GET | `/transaksi/statistik/hari-ini` | Statistik penjualan hari ini |
| GET | `/transaksi/statistik/periode` | Statistik periode tertentu |
| POST | `/transaksi` | Buat transaksi baru |
| POST | `/transaksi/:id/batalkan` | Batalkan transaksi |

#### 📊 Laporan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/laporan/harian` | Laporan penjualan harian |
| GET | `/laporan/periode` | Laporan periode tertentu |

### Contoh Request

#### Menambah Buku Baru

```bash
POST /api/v1/buku
Content-Type: application/json

{
  "kode_buku": "BK001",
  "judul": "Laskar Pelangi",
  "penulis": "Andrea Hirata",
  "penerbit": "Bentang Pustaka",
  "tahun_terbit": 2005,
  "kategori": "Fiksi",
  "harga_jual": 85000,
  "stok": 50
}
```

#### Membuat Transaksi

```bash
POST /api/v1/transaksi
Content-Type: application/json

{
  "items": [
    {
      "buku_id": 1,
      "jumlah": 2
    },
    {
      "buku_id": 3,
      "jumlah": 1
    }
  ],
  "diskon": 0,
  "bayar": 200000
}
```

## 📖 Panduan Penggunaan

### 1. Menambah Produk Baru

1. Buka menu "Barang" di dashboard
2. Klik tombol "Tambah Barang"
3. Isi data buku (kode, judul, penulis, harga, stok)
4. Klik "Simpan"

### 2. Memproses Transaksi

1. Buka menu "Transaksi" di dashboard
2. Scan atau cari kode buku
3. Masukkan jumlah barang
4. Klik "Tambah ke Keranjang"
5. Ulangi untuk barang lain
6. Klik "Checkout" untuk memproses pembayaran
7. Masukkan jumlah pembayaran
8. Klik "Proses Pembayaran"

### 3. Melihat Laporan

1. Buka menu "Laporan"
2. Pilih jenis laporan (harian/periode)
3. Pilih tanggal/periode
4. Klik "Generate"

## 🔧 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solusi:** Pastikan MySQL service berjalan
```bash
# Windows
net start MySQL

# Linux
sudo systemctl start mysql
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solusi:** Ganti port di `.env` atau matikan proses yang menggunakan port tersebut.

### CORS Error

**Solusi:** Tambahkan origin frontend di `backend/server.js`
```javascript
app.use(cors({
    origin: 'http://localhost:3001'
}));
```

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📄 Lisensi

Proyek ini dilisensikan under ISC License.

## 👥 Author

**Abdurrahman**
- GitHub: [@abdurrahma1418](https://github.com/abdurrahma1418)

## 🙏 Terima Kasih

Terima kasih telah menggunakan Sistem Kasir Toko Buku AA ini! Jika ada pertanyaan atau masalah, silakan buat issue di repository.
