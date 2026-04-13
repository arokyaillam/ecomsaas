import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';

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

      products = productsData?.data || productsData || [];
      categories = categoriesData?.data || categoriesData || [];
    }
  } catch (err) {
    console.error('Error loading store data:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="p-8 text-center max-w-md rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Store Not Found
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Domain: {domain}
          </p>
          {error && <p className="mt-4 text-sm" style={{ color: 'var(--accent)' }}>Error: {error}</p>}
        </div>
      </div>
    );
  }

  const currency = store.currency || 'USD';
  const heroImage = store.hero?.image;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />

      {/* Hero Section */}
      <section className="pt-20 lg:pt-0">
        <div className="grid lg:grid-cols-2 min-h-[70vh] lg:min-h-[90vh]">
          {/* Content */}
          <div className="flex flex-col justify-center px-6 py-16 lg:px-16 lg:py-24 order-2 lg:order-1">
            <div className="max-w-xl mx-auto lg:mx-0">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                New Collection 2025
              </span>
              <h1 className="text-hero mb-6" style={{ color: 'var(--text-primary)' }}>
                {store.hero?.title || 'Discover Your Style'}
              </h1>
              <p className="text-body-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                {store.hero?.subtitle || 'Curated products for the modern lifestyle. Quality meets simplicity.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="btn-primary"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/categories"
                  className="btn-secondary"
                >
                  Explore Categories
                </Link>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative h-80 lg:h-auto order-1 lg:order-2">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Hero"
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <span className="text-6xl font-display" style={{ color: 'var(--border)' }}>Hero Image</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Truck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Free Shipping</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Secure Payment</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <RefreshCw className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Easy Returns</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>30-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-display mb-2" style={{ color: 'var(--text-primary)' }}>
                  Shop by Category
                </h2>
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  Browse our curated collections
                </p>
              </div>
              <Link
                href="/categories"
                className="hidden md:flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.slice(0, 4).map((category: any) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden card-hover"
                >
                  <div className="absolute inset-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {category.image && (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="font-display text-lg md:text-xl text-white mb-1">
                      {category.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white transition-colors">
                      Shop Now
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="section" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-display mb-2" style={{ color: 'var(--text-primary)' }}>
                  Featured Products
                </h2>
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  Handpicked for you
                </p>
              </div>
              <Link
                href="/products"
                className="hidden md:flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 8).map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                />
              ))}
            </div>

            <div className="mt-12 text-center md:hidden">
              <Link href="/products" className="btn-secondary">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="section">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-headline mb-4" style={{ color: 'var(--text-primary)' }}>
              Stay in the Loop
            </h2>
            <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>
              Subscribe to our newsletter for exclusive offers, new arrivals, and style tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="font-display text-xl font-semibold mb-4 block" style={{ color: 'var(--text-primary)' }}>
                {store.name}
              </Link>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Curated products for the modern lifestyle.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/products" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>All Products</Link></li>
                <li><Link href="/categories" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>Categories</Link></li>
                <li><Link href="/search" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>Search</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Account</h4>
              <ul className="space-y-2">
                <li><Link href="/account" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>My Account</Link></li>
                <li><Link href="/account/orders" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>Orders</Link></li>
                <li><Link href="/cart" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>Contact Us</Link></li>
                <li><Link href="/faq" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              &copy; {new Date().getFullYear()} {store.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
