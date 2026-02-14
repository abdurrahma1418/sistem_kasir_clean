# Toko Buku AA - Backend API

Backend API profesional untuk Toko Buku AA menggunakan Node.js, Express, dan MySQL.

## Fitur

- Connection pooling dengan mysql2
- Auto stock deduction pada transaksi
- Error handling yang komprehensif
- Logging dengan Winston
- Rate limiting
- Request validation
- Transaction support
- RESTful API

## Struktur Database

### Tabel `buku`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary Key (Auto Increment) |
| kode_barang | VARCHAR | Kode unik produk |
| nama | VARCHAR | Nama buku |
| harga | DECIMAL | Harga jual |
| stok | INT | Jumlah stok tersedia |
| terjual | INT | Total terjual |

### Tabel `transaksi`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary Key |
| nomor_transaksi | VARCHAR | Nomor unik transaksi |
| tanggal | DATETIME | Waktu transaksi |
| subtotal | DECIMAL | Subtotal sebelum pajak |
| diskon | DECIMAL | Diskon |
| pajak | DECIMAL | Pajak (11%) |
| total | DECIMAL | Total pembayaran |
| metode_pembayaran | ENUM | cash, card, qris, transfer |
| uang_diterima | DECIMAL | Uang dari pelanggan |
| kembalian | DECIMAL | Kembalian |
| nama_kasir | VARCHAR | Nama kasir |
| status | ENUM | pending, completed, cancelled |

### Tabel `transaksi_detail`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary Key |
| transaksi_id | INT | Foreign Key ke transaksi |
| buku_id | INT | Foreign Key ke buku |
| kode_barang | VARCHAR | Kode barang |
| nama_buku | VARCHAR | Nama buku (snapshot) |
| quantity | INT | Jumlah beli |
| harga_satuan | DECIMAL | Harga saat transaksi |
| subtotal | DECIMAL | Subtotal item |

## Instalasi

```bash
cd backend
npm install
```

## Konfigurasi

Salin file `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

Edit file `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=penjualan_aa
```

## Menjalankan Server

### Development (dengan auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### Buku

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/buku` | Semua buku dengan filter |
| GET | `/api/v1/buku/:id` | Detail buku |
| GET | `/api/v1/buku/kode/:kode` | Cari by kode barang |
| GET | `/api/v1/buku/statistik` | Statistik buku |
| GET | `/api/v1/buku/stok-rendah` | Buku stok rendah |
| POST | `/api/v1/buku/check-stock` | Cek ketersediaan stok |
| POST | `/api/v1/buku` | Tambah buku (Admin) |
| PUT | `/api/v1/buku/:id` | Update buku (Admin) |
| DELETE | `/api/v1/buku/:id` | Hapus buku (Admin) |

### Transaksi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/transaksi` | Semua transaksi |
| GET | `/api/v1/transaksi/:id` | Detail transaksi |
| GET | `/api/v1/transaksi/nomor/:nomor` | Cari by nomor |
| GET | `/api/v1/transaksi/statistik/hari-ini` | Statistik hari ini |
| GET | `/api/v1/transaksi/statistik/periode` | Statistik periode |
| POST | `/api/v1/transaksi` | Buat transaksi baru |
| POST | `/api/v1/transaksi/:id/batalkan` | Batalkan transaksi |

## Contoh Request

### Mendapatkan Semua Buku

```bash
curl http://localhost:3000/api/v1/buku
```

### Filter dan Pencarian

```bash
curl "http://localhost:3000/api/v1/buku?search=laskar&tersedia=true&limit=10"
```

### Membuat Transaksi

```bash
curl -X POST http://localhost:3000/api/v1/transaksi \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "id": 1, "quantity": 2 },
      { "id": 3, "quantity": 1 }
    ],
    "metode_pembayaran": "cash",
    "uang_diterima": 300000,
    "nama_kasir": "Admin"
  }'
```

### Response Sukses

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nomor_transaksi": "TRX-20250126-00001",
    "tanggal": "2025-01-26T10:30:00.000Z",
    "subtotal": 270000,
    "pajak": 29700,
    "total": 299700,
    "metode_pembayaran": "cash",
    "uang_diterima": 300000,
    "kembalian": 300,
    "status": "completed",
    "items": [...]
  },
  "message": "Transaksi berhasil",
  "timestamp": "2025-01-26T10:30:00.000Z"
}
```

### Response Error - Stok Tidak Cukup

```json
{
  "success": false,
  "error": {
    "message": "Stok tidak mencukupi",
    "insufficient": [
      {
        "id": 1,
        "nama": "Laskar Pelangi",
        "requested": 5,
        "available": 3,
        "reason": "Stok tidak mencukupi"
      }
    ]
  },
  "timestamp": "2025-01-26T10:30:00.000Z"
}
```

## Error Handling

Kode error HTTP yang digunakan:

| Code | Deskripsi |
|------|-----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request - Validasi gagal |
| 404 | Not Found - Resource tidak ada |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database error |

## Logging

Log tersimpan di folder `logs/`:
- `combined.log` - Semua log
- `error.log` - Hanya error

## Database Migration

Jika tabel transaksi belum ada, jalankan query ini:

```sql
CREATE TABLE IF NOT EXISTS transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_transaksi VARCHAR(50) UNIQUE NOT NULL,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(15,2) NOT NULL,
    diskon DECIMAL(15,2) DEFAULT 0,
    pajak DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    metode_pembayaran ENUM('cash', 'card', 'qris', 'transfer') NOT NULL,
    uang_diterima DECIMAL(15,2),
    kembalian DECIMAL(15,2),
    pelanggan_id INT NULL,
    nama_kasir VARCHAR(100),
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nomor_transaksi (nomor_transaksi),
    INDEX idx_tanggal (tanggal),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaksi_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaksi_id INT NOT NULL,
    buku_id INT NOT NULL,
    kode_barang VARCHAR(50),
    nama_buku VARCHAR(255),
    quantity INT NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
    INDEX idx_transaksi_id (transaksi_id),
    INDEX idx_buku_id (buku_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Lisensi

ISC
