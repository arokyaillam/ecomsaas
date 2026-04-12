'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, User, Heart, Search } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { CartDrawer } from './CartDrawer';

interface HeaderProps {
  store?: any;
  categories?: any[];
}

export function Header({ store, categories = [] }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cart } = useCart();

  const storeName = store?.name || 'BRUTAL';
  const cartItemCount = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[var(--ease-smooth)] ${
          isScrolled
            ? 'bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-300 relative group"
            >
              <span className="relative z-10">{storeName}</span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-sm uppercase tracking-[0.15em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 relative group py-2"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search - Desktop */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              <Link
                href="/account"
                className="hidden sm:flex p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="hidden sm:flex p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-300 group"
                aria-label={`Cart with ${cartItemCount} items`}
              >
                <ShoppingBag className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-mono font-bold rounded-none flex items-center justify-center animate-badge-pop border-2 border-[var(--bg-primary)]">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[var(--text-primary)] border-2 border-[var(--border)] hover:border-[var(--text-primary)] transition-all duration-300"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <div className="relative w-6 h-6">
                  <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-1.5'}`} />
                  <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'top-1/2 -translate-y-1/2'}`} />
                  <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-1.5'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar for scroll */}
        {isScrolled && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--accent)]" style={{ width: 'var(--scroll-progress, 0%)' }} />
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Mobile Menu - Enhanced */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-[var(--ease-smooth)] ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-lg transition-opacity duration-500 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Content */}
        <div
          className={`absolute inset-x-0 top-20 bottom-0 bg-[var(--bg-primary)] border-t-4 border-[var(--text-primary)] overflow-y-auto transition-transform duration-500 ease-[var(--ease-brutal)] ${
            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <nav className="flex flex-col p-8 gap-2">
            {/* Main Links */}
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-mono text-3xl sm:text-4xl uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] transition-all duration-300 py-4 border-b border-[var(--border)] opacity-0 animate-slide-right"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards',
                  animationPlayState: isMobileMenuOpen ? 'running' : 'paused'
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Secondary Links */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-4 border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all duration-300"
              >
                <User className="w-5 h-5" />
                <span className="font-mono text-sm uppercase">Account</span>
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-4 border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all duration-300"
              >
                <Heart className="w-5 h-5" />
                <span className="font-mono text-sm uppercase">Wishlist</span>
              </Link>
            </div>

            {/* Categories Section */}
            {categories.length > 0 && (
              <div className="mt-8">
                <p className="text-caption text-[var(--text-muted)] mb-6">
                  Shop by Category
                </p>
                <div className="flex flex-wrap gap-3">
                  {categories.slice(0, 6).map((cat: any, index: number) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-5 py-3 bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-sm uppercase tracking-wider border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all duration-300 opacity-0 animate-fade-up"
                      style={{
                        animationDelay: `${300 + index * 50}ms`,
                        animationFillMode: 'forwards',
                        animationPlayState: isMobileMenuOpen ? 'running' : 'paused'
                      }}
                    >
                      {cat.nameEn || cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Store Info */}
            <div className="mt-auto pt-12 pb-8">
              <p className="text-caption text-[var(--text-muted)]">
                © 2026 {storeName}. All rights reserved.
              </p>
            </div>
          </nav>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export { SearchBar } from './SearchBar';
