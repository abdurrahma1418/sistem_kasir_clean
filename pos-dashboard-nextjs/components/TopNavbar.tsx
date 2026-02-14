'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface TopNavbarProps {
  onSidebarToggle: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const navItems = [
  { href: '/', icon: 'bi-grid-1x2-fill', text: 'Dashboard' },
  { href: '/transaksi', icon: 'bi-receipt-cutoff', text: 'Transaction' },
  { href: '/barang', icon: 'bi-box-seam', text: 'Inventory' },
  { href: '/stok', icon: 'bi-clipboard-data', text: 'Report' },
];

export default function TopNavbar({
  onSidebarToggle,
  searchQuery,
  onSearchChange,
}: TopNavbarProps) {
  const pathname = usePathname();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="top-navbar">
      {/* Logo Section */}
      <div className="navbar-brand">
        <Link href="/" className="brand-logo">
          <i className="bi bi-book-half"></i>
          <span>TOKO BUKU AA</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="navbar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.text}</span>
          </Link>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="navbar-actions">
        {/* Search */}
        <div className={`search-container ${searchOpen ? 'open' : ''}`}>
          <button
            className="search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <i className="bi bi-search"></i>
          </button>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Notifications */}
        <button className="notification-btn">
          <i className="bi bi-bell"></i>
          <span className="notification-badge">3</span>
        </button>

        {/* User Profile */}
        <div className="user-profile">
          <img
            src="https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff"
            alt="User"
            className="user-avatar"
          />
          <div className="user-info">
            <span className="user-name">John Doe</span>
            <span className="user-role">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
