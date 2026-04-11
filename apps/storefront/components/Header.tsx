'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, User, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { CartDrawer } from './CartDrawer';

// Re-export SearchBar for compatibility
export { SearchBar } from './SearchBar';

interface HeaderProps {
  store?: any;
  categories?: any[];
}

export function Header({ store, categories = [] }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cart } = useCart();

  const storeName = store?.name || 'BRUTAL';
  const cartItemCount = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
              className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              {storeName}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-sm uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Account */}
              <Link
                href="/account"
                className="hidden sm:block p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="hidden sm:block p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                aria-label={`Cart with ${cartItemCount} items`}
              >
                <ShoppingBag className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-mono font-bold rounded-none flex items-center justify-center animate-badge-pop border border-[var(--bg-primary)]">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[var(--text-primary)] border-2 border-[var(--border)] hover:border-[var(--text-primary)] transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-x-0 top-20 bg-[var(--bg-primary)] border-b-4 border-[var(--text-primary)] transition-all duration-300 z-40 ${
          isMobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col p-6 gap-2">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-mono text-xl uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors py-3 border-b border-[var(--border)]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {link.label}
            </Link>
          ))}

          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <p className="text-caption text-[var(--text-muted)] mb-4">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm font-mono uppercase hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] transition-colors"
                  >
                    {cat.nameEn || cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
