/**
 * TOKO BUKU AA - API SERVICE (COMPLETE & SYNCED)
 * Gabungan Fungsi Produk, Transaksi, dan Laporan
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== ""
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:3005/api/v1";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      console.error("⚠️ Respon Server Bukan JSON:", textError);
      throw new Error(
        "Server mengalami masalah (Endpoint salah atau Backend mati).",
      );
    }

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Error ${response.status}: Terjadi kesalahan.`,
      );
    }

    return result.data ?? result;
  } catch (error: any) {
    console.error(`❌ [API Error at ${endpoint}]:`, error.message);
    throw error;
  }
}

// ============================================
// 📦 FUNGSI PRODUK (BARANG)
// ============================================

export const fetchProducts = () => fetchAPI("/buku");

export const createProduct = (data: any) =>
  fetchAPI("/buku", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Update data buku secara lengkap
 * @param id_barang ID dari database
 */
export const updateProduct = (id_barang: string | number, data: any) =>
  fetchAPI(`/buku/${id_barang}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

/**
 * Update stok buku saja
 * Menggunakan PUT karena backend merespon 404 pada PATCH
 */
export const updateStock = (id_barang: string | number, newStock: number) => {
  return fetchAPI(`/buku/${id_barang}`, {
    method: "PUT",
    body: JSON.stringify({
      stok: Number(newStock),
      id_barang: id_barang, // Redundansi untuk backend
    }),
  });
};

export const deleteProduct = (id_barang: string | number) =>
  fetchAPI(`/buku/${id_barang}`, {
    method: "DELETE",
  });

// ============================================
// 💰 FUNGSI TRANSAKSI
// ============================================

export const fetchTransactions = () => fetchAPI("/transaksi");

export const fetchTransactionById = (id: string | number) =>
  fetchAPI(`/transaksi/${id}`);

export const deleteTransaction = (id: string | number) =>
  fetchAPI(`/transaksi/${id}`, {
    method: "DELETE",
  });

/**
 * Update data transaksi (Fungsi yang tadi dicari oleh sistem)
 */
export const updateTransaction = (id: string | number, data: any) =>
  fetchAPI(`/transaksi/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const fetchPeriodStats = (period: string) =>
  fetchAPI(`/transaksi/statistik/${period}`);

/**
 * Membuat transaksi baru
 * Otomatis menghitung total jika tidak disertakan
 */
export const createTransaction = async (data: any) => {
  let calculatedTotal = 0;
  if (data.items && Array.isArray(data.items)) {
    calculatedTotal = data.items.reduce((acc: number, item: any) => {
      const price = Number(item.price || item.harga_satuan || item.harga || 0);
      const qty = Number(item.quantity || item.jumlah || 0);
      return acc + price * qty;
    }, 0);
  }

  const finalPayload = {
    ...data,
    total_harga: data.total_harga || calculatedTotal,
    uang_diterima:
      data.uang_diterima ??
      (data.metode_pembayaran === "cash" ? 0 : calculatedTotal),
  };

  return fetchAPI("/transaksi", {
    method: "POST",
    body: JSON.stringify(finalPayload),
  });
};

// ============================================
// 📊 LAPORAN & STATISTIK
// ============================================

export const fetchStatistics = () => fetchAPI("/laporan/statistik");

export const fetchTopProducts = () => fetchAPI("/laporan/produk-terlaris");
