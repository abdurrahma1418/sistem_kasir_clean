'use client';

interface StatsCardsProps {
  todaySales: number;
  totalTransactions: number;
  booksSold: number;
  newCustomers: number;
}

export default function StatsCards({
  todaySales,
  totalTransactions,
  booksSold,
  newCustomers,
}: StatsCardsProps) {
  return (
    <div className="stats-row">
      <div className="stat-card glass-card">
        <div className="stat-icon bg-success">
          <i className="bi bi-currency-dollar"></i>
        </div>
        <div className="stat-content">
          <p className="stat-label">Penjualan Hari Ini</p>
          <h3 className="stat-value">{todaySales}</h3>
          <span className="stat-change positive">
            <i className="bi bi-arrow-up"></i> +12.5%
          </span>
        </div>
      </div>
      <div className="stat-card glass-card">
        <div className="stat-icon bg-info">
          <i className="bi bi-cart-check"></i>
        </div>
        <div className="stat-content">
          <p className="stat-label">Total Transaksi</p>
          <h3 className="stat-value">{totalTransactions}</h3>
          <span className="stat-change positive">
            <i className="bi bi-arrow-up"></i> +8.3%
          </span>
        </div>
      </div>
      <div className="stat-card glass-card">
        <div className="stat-icon bg-warning">
          <i className="bi bi-box-seam"></i>
        </div>
        <div className="stat-content">
          <p className="stat-label">Barang Terjual</p>
          <h3 className="stat-value">{booksSold}</h3>
          <span className="stat-change negative">
            <i className="bi bi-arrow-down"></i> -2.1%
          </span>
        </div>
      </div>
      <div className="stat-card glass-card">
        <div className="stat-icon bg-danger">
          <i className="bi bi-graph-up"></i>
        </div>
        <div className="stat-content">
          <p className="stat-label">Total Pendapatan</p>
          <h3 className="stat-value">{newCustomers}</h3>
          <span className="stat-change positive">
            <i className="bi bi-arrow-up"></i> +5.7%
          </span>
        </div>
      </div>
    </div>
  );
}
