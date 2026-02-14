'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { href: '/', icon: 'bi-speedometer2', text: 'Dashboard' },
  { href: '/transaksi', icon: 'bi-receipt', text: 'Transaksi' },
  { href: '/barang', icon: 'bi-box-seam', text: 'Barang' },
  { href: '/stok', icon: 'bi-boxes', text: 'Stok Barang' },
];

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMobile,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isMobile) onMobileClose();
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
        isMobile && isMobileOpen ? 'mobile-open' : ''
      }`}
    >
      <div className="sidebar-header">
        <div className="logo-container">
          <i className="bi bi-shop logo-icon"></i>
          <span className="logo-text">TOKO BUKU AA</span>
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle}>
          <i className="bi bi-chevron-left"></i>
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, item.href)}
          >
            <i className={`bi ${item.icon}`}></i>
            <span className="nav-text">{item.text}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
