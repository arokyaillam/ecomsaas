import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { ArrowRight, Mail } from 'lucide-react';

export default async function Home() {
  let store = null;
  let products = [];
  let categories = [];
  let error = null;
  let domain = 'localhost';

  try {
    const headersList = await headers();
    domain = headersList.get('x-store-domain') || 'localhost';

    store = await getStoreByDomain(domain);

    if (store) {
      const [productsData, categoriesData] = await Promise.all([
        getStoreProducts(store.id),
        getStoreCategories(store.id),
      ]);

      // Handle pagination response format
      products = productsData?.data || productsData || [];
      categories = categoriesData?.data || categoriesData || [];
    }
  } catch (err) {
    console.error('Error loading store data:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] noise">
        <div className="p-8 text-center max-w-md border-4 border-[var(--text-primary)] bg-[var(--bg-secondary)]">
          <h1 className="font-mono text-3xl font-bold mb-4 text-[var(--text-primary)]">
            Store Not Found
          </h1>
          <p className="mb-4 text-[var(--text-secondary)]">
            Domain: {domain}
          </p>
          {error && <p className="mb-4 text-[var(--accent)] text-sm font-mono">Error: {error}</p>}
          <div className="text-[var(--text-secondary)] text-sm space-y-1">
            <p>Please make sure:</p>
            <p>1. Backend running on port 8000</p>
            <p>2. Database migrated</p>
            <p>3. Store exists for "{domain}"</p>
          </div>
        </div>
      </div>
    );
  }

  const currency = store.currency || 'USD';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <Header store={store} categories={categories} />

      {/* Hero Section */}
      <Hero store={store} categories={categories} />

      {/* Categories Section */}
      {categories.length > 0 && (
        <section id="categories" className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-[1800px] mx-auto">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-4 mb-4 opacity-0 animate-fade-up">
                  <div className="w-12 h-[2px] bg-[var(--accent)]" />
                  <span className="text-caption text-[var(--accent)]">Browse</span>
                </div>
                <h2 className="text-display text-[var(--text-primary)] opacity-0 animate-fade-up delay-100">
                  CATEGORIES
                </h2>
              </div>
              <Link
                href="/categories"
                className="hidden sm:flex items-center gap-2 btn-ghost"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Categories Grid - Brutalist Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.slice(0, 4).map((category: any, index: number) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="group relative aspect-[4/5] border-4 border-[var(--text-primary)] bg-[var(--bg-secondary)] overflow-hidden hover:translate-y-[-8px] hover:shadow-[8px_8px_0_var(--text-primary)] transition-all duration-300 opacity-0 animate-fade-up"
                  style={{ animationDelay: `${(index + 2) * 100}ms`, animationFillMode: 'forwards' }}
                >
                  {/* Background Number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[12rem] font-bold text-[var(--text-primary)] opacity-5">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="w-12 h-12 bg-[var(--accent)] flex items-center justify-center">
                      <span className="font-mono text-xl font-bold text-[var(--bg-primary)]">
                        0{index + 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-mono text-2xl font-bold text-[var(--text-primary)] mb-1">
                        {category.nameEn}
                      </h3>
                      {category.nameAr && (
                        <p className="text-sm text-[var(--text-secondary)]" dir="rtl">
                          {category.nameAr}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-4 text-[var(--accent)] font-mono text-sm uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>

                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 border-4 border-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>

            {/* Mobile View All */}
            <div className="mt-8 text-center sm:hidden">
              <Link href="/categories" className="btn-outline">
                View All Categories
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {products.length > 0 && (
        <section id="products" className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-[1800px] mx-auto">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-4 mb-4 opacity-0 animate-fade-up">
                  <div className="w-12 h-[2px] bg-[var(--accent)]" />
                  <span className="text-caption text-[var(--accent)]">Curated For You</span>
                </div>
                <h2 className="text-display text-[var(--text-primary)] opacity-0 animate-fade-up delay-100">
                  FEATURED
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-2 btn-ghost"
              >
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="opacity-0 animate-fade-up"
                  style={{
                    animationDelay: `${(index + 3) * 100}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <ProductCard
                    product={product}
                    store={store}
                    currency={currency}
                  />
                </div>
              ))}
            </div>

            {/* Mobile View All */}
            <div className="mt-12 text-center sm:hidden">
              <Link href="/products" className="btn-outline">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)] opacity-5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--text-primary)] opacity-3 blur-[100px] rounded-full" />

        <div className="max-w-[1800px] mx-auto">
          <div className="relative border-4 border-[var(--text-primary)] bg-[var(--bg-secondary)] p-12 md:p-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-12 h-[2px] bg-[var(--accent)]" />
                <span className="text-caption text-[var(--accent)]">Newsletter</span>
                <div className="w-12 h-[2px] bg-[var(--accent)]" />
              </div>

              <h2 className="font-mono text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
                JOIN THE CLUB
              </h2>
              <p className="text-body-lg text-[var(--text-secondary)] mb-8">
                Subscribe for exclusive drops, early access &amp; curated inspiration.
              </p>

              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  className="flex-1 px-6 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border)] text-[var(--text-primary)] font-mono uppercase placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  className="btn-brutalist whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Decorative Corner */}
            <div className="absolute top-4 right-4 w-4 h-4 bg-[var(--accent)]" />
            <div className="absolute bottom-4 left-4 w-4 h-4 bg-[var(--accent)]" />
          </div>
        </div>
      </section>

      {/* Footer - Neo-Brutalist */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t-4 border-[var(--text-primary)]">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[var(--accent)] flex items-center justify-center"
                >
                  <span className="font-mono text-2xl font-bold text-[var(--bg-primary)]">
                    {store.name.charAt(0)}
                  </span>
                </div>
                <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">
                  {store.name}
                </span>
              </div>
              <p className="text-body text-[var(--text-secondary)] max-w-md mb-6">
                Curating exceptional products for those who appreciate raw design,
                honest craftsmanship, and brutalist aesthetics.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {/* Instagram */}
                <a
                  href="#"
                  className="w-12 h-12 border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" strokeWidth="2"/>
                    <circle cx="18" cy="6" r="1" fill="currentColor"/>
                  </svg>
                </a>
                {/* Twitter/X */}
                <a
                  href="#"
                  className="w-12 h-12 border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* Email */}
                <a
                  href="#"
                  className="w-12 h-12 border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-mono text-lg font-bold text-[var(--text-primary)] mb-6 uppercase">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {['Shop All', 'Categories', 'New Arrivals', 'Sale'].map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors font-mono text-sm uppercase tracking-wider"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-mono text-lg font-bold text-[var(--text-primary)] mb-6 uppercase">
                Support
              </h4>
              <ul className="space-y-3">
                {['Contact Us', 'FAQ', 'Shipping', 'Returns'].map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors font-mono text-sm uppercase tracking-wider"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t-2 border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-caption text-[var(--text-muted)]">
              © 2026 {store.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-caption text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
