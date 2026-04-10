'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FloatingSearch } from './FloatingSearch';

// Re-export SearchBar for compatibility
export { SearchBar } from './SearchBar';

interface HeaderProps {
  store: any;
  categories: any[];
}

export function Header({ store, categories }: HeaderProps) {
  const theme = store.theme;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: `${theme.surfaceColor}f0`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-20 gap-8">

            {/* Logo & Store Name */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              {theme.logoUrl ? (
                <Image
                  src={theme.logoUrl}
                  alt={store.name}
                  width={40}
                  height={40}
                  className="rounded-lg object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-xl font-bold transition-transform group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <span
                className="hidden sm:block font-display text-2xl font-semibold tracking-tight"
                style={{ color: theme.textColor }}
              >
                {store.name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="/"
                className="text-sm font-medium tracking-wide hover:opacity-70 transition-opacity relative line-reveal py-1"
                style={{ color: theme.textColor }}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium tracking-wide hover:opacity-70 transition-opacity relative line-reveal py-1"
                style={{ color: theme.textColor }}
              >
                Shop
              </Link>
              <Link
                href="/categories"
                className="text-sm font-medium tracking-wide hover:opacity-70 transition-opacity relative line-reveal py-1"
                style={{ color: theme.textColor }}
              >
                Categories
              </Link>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-6">
              {/* Search - Desktop */}
              <div className="hidden md:block w-64 lg:w-80">
                <FloatingSearch categories={categories} theme={theme} />
              </div>

              {/* Cart Button */}
              <button
                className="relative p-3 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: theme.backgroundColor,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textColor,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {/* Cart Badge */}
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  0
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-3 rounded-full transition-all"
                style={{
                  backgroundColor: theme.backgroundColor,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textColor,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {mobileMenuOpen ? (
                    <>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M4 12h16" />
                      <path d="M4 18h16" />
                      <path d="M4 6h16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden animate-fade-in"
          style={{ top: '80px' }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="absolute top-0 left-0 right-0 p-6 animate-slide-left"
            style={{
              backgroundColor: theme.surfaceColor,
              borderBottom: `1px solid ${theme.borderColor}`,
            }}
          >
            {/* Mobile Search */}
            <div className="mb-6 md:hidden">
              <FloatingSearch categories={categories} theme={theme} />
            </div>

            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium py-2 border-b"
                style={{ color: theme.textColor, borderColor: theme.borderColor }}
              >
                Home
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium py-2 border-b"
                style={{ color: theme.textColor, borderColor: theme.borderColor }}
              >
                Shop
              </Link>
              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium py-2 border-b"
                style={{ color: theme.textColor, borderColor: theme.borderColor }}
              >
                Categories
              </Link>
            </nav>

            {/* Categories Quick Links */}
            {categories.length > 0 && (
              <div className="mt-6">
                <p
                  className="text-xs uppercase tracking-wider mb-4"
                  style={{ color: theme.textSecondaryColor }}
                >
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 8).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 rounded-full text-sm"
                      style={{
                        backgroundColor: theme.backgroundColor,
                        color: theme.textColor,
                        border: `1px solid ${theme.borderColor}`,
                      }}
                    >
                      {cat.nameEn}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
