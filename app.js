/**
 * TOKO BUKU AA - POS SYSTEM (FINAL STABLE FOR XENDIT)
 */

const API_BASE_URL = "http://localhost:3005/api/v1";

// 1. STATE MANAGEMENT
let productsData = [];
let cart = [];
let currentFilter = "Semua";

// 2. ELEMEN DOM
const productsGrid = document.getElementById("productsGrid");
const cartItemsContainer = document.getElementById("cartItems");
const cashReceivedInput = document.getElementById("cashReceived");
const checkoutBtn = document.getElementById("checkoutBtn");
const totalDisplay = document.getElementById("total");

// 3. UTILITIES
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    const result = await response.json();

    if (!response.ok) {
      // Menangkap pesan error spesifik dari backend/xendit
      throw new Error(result.error || result.message || "Kesalahan API");
    }
    return result;
  } catch (error) {
    console.error("📡 API Fetch Error:", error.message);
    throw error;
  }
}

function showNotification(msg, type = "info") {
  alert(`${type.toUpperCase()}: ${msg}`);
}

// 4. PRODUK & STATISTIK
async function loadProducts() {
  try {
    const res = await fetchAPI("/buku");
    if (res.data) {
      productsData = res.data.map((book) => ({
        id: book.id_barang || book.id_buku || book.id,
        title: book.nama,
        price: Number(book.harga),
        stock: book.stok,
        category: book.kategori || "Semua",
        icon: "bi-book",
      }));
      filterProducts(currentFilter);
    }
  } catch (e) {
    showNotification("Gagal memuat produk: " + e.message, "danger");
  }
}

async function loadStatistics() {
  try {
    const res = await fetchAPI("/transaksi/statistik/hari-ini");
    if (res.success) {
      if (document.getElementById("todaySales"))
        document.getElementById("todaySales").textContent = formatRupiah(
          res.data.total_penjualan || 0,
        );
      if (document.getElementById("totalTransactions"))
        document.getElementById("totalTransactions").textContent =
          res.data.total_transaksi || 0;
      if (document.getElementById("booksSold"))
        document.getElementById("booksSold").textContent =
          res.data.total_items || 0;
    }
  } catch (e) {
    console.error("Gagal memuat statistik");
  }
}

function renderProducts(products) {
  if (!productsGrid) return;
  productsGrid.innerHTML = products.length
    ? products
        .map(
          (p) => `
            <div class="product-card" onclick="addToCart(${p.id})">
                <div class="product-image"><i class="bi ${p.icon}"></i></div>
                <div class="product-title">${p.title}</div>
                <div class="product-footer">
                    <div class="price">${formatRupiah(p.price)}</div>
                    <div class="stock">Stok: ${p.stock}</div>
                </div>
            </div>`,
        )
        .join("")
    : '<div class="text-center p-5 w-100 text-white">Produk tidak ditemukan</div>';
}

function filterProducts(category) {
  currentFilter = category;
  const filtered =
    category === "Semua"
      ? productsData
      : productsData.filter((p) => p.category === category);
  renderProducts(filtered);
}

// 5. KERANJANG (CART)
function addToCart(productId) {
  const product = productsData.find((p) => p.id === productId);
  if (!product || product.stock <= 0)
    return showNotification("Stok habis!", "warning");

  const item = cart.find((i) => i.id === productId);
  if (item) {
    if (item.quantity < product.stock) {
      item.quantity++;
    } else {
      return showNotification("Stok maksimal", "warning");
    }
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCart();
}

function updateQuantity(id, change) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter((i) => i.id !== id);
  updateCart();
}

function updateCart() {
  renderCart();
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.11; // PPN 11%
  const total = subtotal + tax;

  if (totalDisplay) totalDisplay.textContent = formatRupiah(total);
  if (document.getElementById("subtotal"))
    document.getElementById("subtotal").textContent = formatRupiah(subtotal);
  if (document.getElementById("taxAmount"))
    document.getElementById("taxAmount").textContent = formatRupiah(tax);

  calculateChange(total);
}

function renderCart() {
  if (!cartItemsContainer) return;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<div class="empty-state text-center p-4"><p class="text-muted">Keranjang kosong</p></div>';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  if (checkoutBtn) checkoutBtn.disabled = false;
  cartItemsContainer.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item d-flex justify-content-between align-items-center mb-2 p-2 rounded bg-dark-subtle">
            <div class="small">
                <div class="fw-bold">${item.title}</div>
                <div class="text-primary">${formatRupiah(item.price)} x ${item.quantity}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-light" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="fw-bold">${item.quantity}</span>
                <button class="btn btn-sm btn-outline-light" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        </div>`,
    )
    .join("");
}

// 6. PEMBAYARAN & CHECKOUT
function calculateChange(total) {
  const cash = Number(cashReceivedInput?.value) || 0;
  const change = cash - total;
  const el = document.getElementById("changeAmount");
  if (el) el.textContent = formatRupiah(Math.max(change, 0));
}

async function processCheckout() {
  if (cart.length === 0) return;

  try {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total_harga = Math.round(subtotal + subtotal * 0.11);

    const paymentMethod =
      document.querySelector('input[name="paymentMethod"]:checked')?.value ||
      "cash";
    const cashReceived = Number(cashReceivedInput?.value) || 0;

    // Validasi Cash
    if (paymentMethod === "cash" && cashReceived < total_harga) {
      return showNotification("Uang tunai kurang!", "warning");
    }

    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Memproses...';

    // --- ALUR XENDIT (QRIS / TRANSFER) ---
    if (paymentMethod === "qris" || paymentMethod === "transfer") {
      const xenditPayload = {
        external_id: "TRX-" + Date.now(),
        amount: total_harga,
        items: cart.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // Memanggil Endpoint sesuai Backend terbaru
      const result = await fetchAPI("/xendit/create-invoice", {
        method: "POST",
        body: JSON.stringify(xenditPayload),
      });

      if (result.invoice_url) {
        showNotification("Mengarahkan ke Xendit...", "success");
        window.location.href = result.invoice_url;
      } else {
        throw new Error("Gagal mendapatkan link pembayaran");
      }
    } else {
      // --- ALUR CASH ---
      const payload = {
        items: cart.map((item) => ({
          id_barang: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        metode_pembayaran: "cash",
        uang_diterima: cashReceived,
        total_harga: total_harga,
      };

      const result = await fetchAPI("/transaksi", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.success) {
        showNotification("Transaksi Berhasil!", "success");
        resetPOS();
      }
    }
  } catch (error) {
    showNotification(error.message, "danger");
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = "Proses Pembayaran";
  }
}

function resetPOS() {
  cart = [];
  updateCart();
  if (cashReceivedInput) cashReceivedInput.value = "";
  loadStatistics();
  loadProducts();
}

// 7. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadStatistics();

  checkoutBtn?.addEventListener("click", processCheckout);

  cashReceivedInput?.addEventListener("input", () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    calculateChange(subtotal + subtotal * 0.11);
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      filterProducts(e.target.innerText);
    }
  });

  document.getElementById("clearCart")?.addEventListener("click", () => {
    if (confirm("Kosongkan keranjang?")) {
      cart = [];
      updateCart();
    }
  });
});

// Global exposure agar tombol HTML (onclick) bisa memanggil fungsi ini
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
