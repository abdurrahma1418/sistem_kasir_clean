'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils';

interface DataPoint {
  tanggal: string;
  total_penjualan: string;
  total_transaksi: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  title?: string;
}

export default function RevenueChart({ data, title = 'Grafik Pendapatan' }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '25px' }}>
        <h3 style={{ marginBottom: '20px' }}>
          <i className="bi bi-bar-chart"></i> {title}
        </h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
          Tidak ada data untuk ditampilkan
        </p>
      </div>
    );
  }

  // Parse data and sort by date
  const chartData = data
    .map(d => ({
      date: new Date(d.tanggal),
      value: parseFloat(d.total_penjualan) || 0,
      transactions: d.total_transaksi || 0,
      label: new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const width = 700;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max values
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  // Calculate bar dimensions
  const barWidth = Math.min(50, (chartWidth / chartData.length) * 0.7);
  const barGap = (chartWidth - barWidth * chartData.length) / (chartData.length + 1);

  return (
    <div className="glass-card" style={{ padding: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-bar-chart-fill" style={{ color: 'var(--accent)' }}></i> {title}
        </h3>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Total: <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>
            {formatRupiah(chartData.reduce((sum, d) => sum + d.value, 0))}
          </strong>
        </div>
      </div>

      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--accent-light)" stopOpacity="0.7" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Y-axis labels and grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const value = minValue + valueRange * ratio;
          const y = padding.top + chartHeight - ratio * chartHeight;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted)"
              >
                {value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' :
                 value >= 1000 ? (value / 1000).toFixed(0) + 'K' :
                 value > 0 ? value.toString() : '0'}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {chartData.map((d, i) => {
          const x = padding.left + barGap + i * (barWidth + barGap);
          const barHeight = ((d.value - minValue) / valueRange) * chartHeight;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="6"
                filter="url(#shadow)"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              />

              {/* Value on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--text-primary)"
              >
                {d.value >= 1000000 ? (d.value / 1000000).toFixed(1) + 'M' :
                 d.value >= 1000 ? (d.value / 1000).toFixed(0) + 'K' :
                 d.value > 0 ? formatRupiah(d.value) : '0'}
              </text>

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-muted)"
              >
                {d.label}
              </text>

              {/* Transaction count below bar */}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 35}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {d.transactions} trx
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent-light) 100%)'
          }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>Pendapatan</span>
        </div>
      </div>
    </div>
  );
}
