import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';

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
      [products, categories] = await Promise.all([
        getStoreProducts(store.id),
        getStoreCategories(store.id),
      ]);
    }
  } catch (err) {
    console.error('Error loading store data:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (!store) {
    return (
      <div
        className="min-h-screen flex items-center justify-center grain"
        style={{ backgroundColor: '#0f172a' }}
      >
        <div
          className="p-8 text-center max-w-md rounded-2xl"
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h1 className="font-display text-3xl font-bold mb-4 text-white">
            Store Not Found
          </h1>
          <p className="mb-4" style={{ color: '#94a3b8' }}>
            Domain: {domain}
          </p>
          {error && <p className="mb-4 text-red-400 text-sm">Error: {error}</p>}
          <p style={{ color: '#94a3b8' }}>
            Please make sure:
            <br />
            1. The backend is running on port 8000
            <br />
            2. Database has been migrated
            <br />
            3. A store exists with domain &quot;{domain}&quot;
          </p>
        </div>
      </div>
    );
  }

  const theme = store.theme;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.backgroundColor }}>
      {/* Header */}
      <Header store={store} categories={categories} />

      {/* Hero Section */}
      <Hero hero={store.hero} theme={theme} />

      {/* Categories - Magazine Style */}
      {categories.length > 0 && (
        <section id="categories" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <div
                  className="inline-flex items-center gap-3 mb-4"
                >
                  <div
                    className="w-12 h-px"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-medium"
                    style={{ color: theme.textSecondaryColor }}
                  >
                    Browse
                  </span>
                </div>
                <h2
                  className="font-display text-4xl sm:text-5xl font-semibold"
                  style={{ color: theme.textColor }}
                >
                  Categories
                </h2>
              </div>
              <Link
                href="/categories"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium line-reveal pb-1"
                style={{ color: theme.primaryColor }}
              >
                View All
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Categories Grid - Editorial Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.slice(0, 4).map((category: any, index: number) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden card-editorial"
                  style={{
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                >
                  {/* Background with gradient */}
                  <div
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                    style={{
                      background:
                        index === 0
                          ? `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.accentColor}20)`
                          : index === 1
                            ? `linear-gradient(135deg, ${theme.accentColor}30, ${theme.primaryColor}20)`
                            : index === 2
                              ? `linear-gradient(135deg, ${theme.secondaryColor || theme.primaryColor}30, ${theme.accentColor}20)`
                              : `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor || theme.accentColor}30)`,
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-semibold"
                      style={{
                        backgroundColor: theme.backgroundColor,
                        color: theme.primaryColor,
                      }}
                    >
                      0{index + 1}
                    </div>

                    <div>
                      <h3
                        className="font-display text-2xl font-semibold mb-2"
                        style={{ color: theme.textColor }}
                      >
                        {category.nameEn}
                      </h3>
                      {category.nameAr && (
                        <p
                          className="text-sm"
                          style={{ color: theme.textSecondaryColor }}
                          dir="rtl"
                        >
                          {category.nameAr}
                        </p>
                      )}
                      <div
                        className="flex items-center gap-2 mt-4 text-sm font-medium transition-all group-hover:gap-3"
                        style={{ color: theme.primaryColor }}
                      >
                        <span>Explore</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="transition-transform group-hover:translate-x-1"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile View All Link */}
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: theme.primaryColor }}
              >
                View All Categories
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products - Editorial Grid */}
      {products.length > 0 && (
        <section id="products" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-px"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-medium"
                    style={{ color: theme.textSecondaryColor }}
                  >
                    Curated For You
                  </span>
                </div>
                <h2
                  className="font-display text-4xl sm:text-5xl font-semibold"
                  style={{ color: theme.textColor }}
                >
                  Featured Products
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium line-reveal pb-1"
                style={{ color: theme.primaryColor }}
              >
                View All Products
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="animate-fade-up opacity-0"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <ProductCard
                    product={product}
                    theme={theme}
                    currency={store.currency}
                  />
                </div>
              ))}
            </div>

            {/* Mobile View All Link */}
            <div className="mt-12 text-center sm:hidden">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: theme.primaryColor }}
              >
                View All Products
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative rounded-3xl p-12 md:p-16 overflow-hidden"
            style={{
              backgroundColor: theme.surfaceColor,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            {/* Background decoration */}
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2"
              style={{ backgroundColor: theme.accentColor }}
            />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <div
                className="inline-flex items-center gap-3 mb-6"
              >
                <div
                  className="w-12 h-px"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <span
                  className="text-xs uppercase tracking-[0.3em] font-medium"
                  style={{ color: theme.textSecondaryColor }}
                >
                  Newsletter
                </span>
                <div
                  className="w-12 h-px"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>

              <h2
                className="font-display text-4xl sm:text-5xl font-semibold mb-4"
                style={{ color: theme.textColor }}
              >
                Stay in the Loop
              </h2>
              <p
                className="text-lg mb-8"
                style={{ color: theme.textSecondaryColor }}
              >
                Subscribe to receive exclusive offers, early access to new arrivals,
                and curated style inspiration.
              </p>

              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-full text-base outline-none transition-all focus:ring-2"
                  style={{
                    backgroundColor: theme.backgroundColor,
                    border: `1px solid ${theme.borderColor}`,
                    color: theme.textColor,
                  }}
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-full font-medium text-white transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Editorial Style */}
      <footer
        className="py-16 px-4 sm:px-6 lg:px-8"
        style={{
          borderTop: `1px solid ${theme.borderColor}`,
          backgroundColor: theme.backgroundColor,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                {theme.logoUrl ? (
                  <img
                    src={theme.logoUrl}
                    alt={store.name}
                    className="w-10 h-10 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                    }}
                  >
                    {store.name.charAt(0)}
                  </div>
                )}
                <span
                  className="font-display text-2xl font-semibold"
                  style={{ color: theme.textColor }}
                >
                  {store.name}
                </span>
              </div>
              <p
                className="text-base leading-relaxed max-w-sm mb-6"
                style={{ color: theme.textSecondaryColor }}
              >
                Curating exceptional products for those who appreciate quality,
                design, and craftsmanship.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {['Instagram', 'Twitter', 'Pinterest'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      backgroundColor: theme.surfaceColor,
                      border: `1px solid ${theme.borderColor}`,
                      color: theme.textSecondaryColor,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {social === 'Instagram' && (
                        <>
                          <rect width="20" height="20" x="2" y="2" rx="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </>
                      )}
                      {social === 'Twitter' && (
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.5 4-8 8-5 1.4.7 2.3 1.9 3 3.4z" />
                      )}
                      {social === 'Pinterest' && (
                        <line x1="12" x2="12" y1="8" y2="21" />
                      )}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4
                className="font-display text-lg font-semibold mb-6"
                style={{ color: theme.textColor }}
              >
                Quick Links
              </h4>
              <ul className="space-y-3">
                {['Shop All', 'Categories', 'New Arrivals', 'Sale'].map(
                  (link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm transition-colors hover:opacity-70 line-reveal inline-block"
                        style={{ color: theme.textSecondaryColor }}
                      >
                        {link}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4
                className="font-display text-lg font-semibold mb-6"
                style={{ color: theme.textColor }}
              >
                Support
              </h4>
              <ul className="space-y-3">
                {['Contact Us', 'FAQ', 'Shipping', 'Returns'].map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm transition-colors hover:opacity-70 line-reveal inline-block"
                      style={{ color: theme.textSecondaryColor }}
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: `1px solid ${theme.borderColor}` }}
          >
            <p
              className="text-sm"
              style={{ color: theme.textSecondaryColor }}
            >
              © 2026 {store.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: theme.textSecondaryColor }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: theme.textSecondaryColor }}
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
