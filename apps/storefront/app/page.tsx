import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  
  const store = await getStoreByDomain(domain);
  
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 gradient-text">Store Not Found</h1>
          <p className="text-secondary-color">
            The store &quot;{domain}&quot; does not exist.
          </p>
        </div>
      </div>
    );
  }

  const [products, categories] = await Promise.all([
    getStoreProducts(store.id),
    getStoreCategories(store.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {store.theme.logoUrl ? (
                <Image 
                  src={store.theme.logoUrl} 
                  alt={store.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold">
                  {store.name.charAt(0)}
                </div>
              )}
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                {store.name}
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-secondary-color hover:text-[var(--text)] transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-secondary-color hover:text-[var(--text)] transition-colors">
                Products
              </Link>
              <Link href="/categories" className="text-secondary-color hover:text-[var(--text)] transition-colors">
                Categories
              </Link>
            </nav>
            <button className="btn-primary">
              Shop Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            Welcome to {store.name}
          </h2>
          <p className="text-xl text-secondary-color mb-8 max-w-2xl mx-auto">
            Discover amazing products curated just for you. 
            Powered by EcomSaaS with dynamic theming.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-4">
              Explore Products
            </button>
            <button className="px-8 py-4 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-2xl font-bold mb-8 text-center gradient-text">
              Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="glass-card p-6 text-center hover:bg-[var(--surface)] transition-all hover:-translate-y-1 cursor-pointer"
                >
                  <h4 className="font-semibold text-lg mb-1" style={{ color: 'var(--text)' }}>
                    {category.nameEn}
                  </h4>
                  {category.nameAr && (
                    <p className="text-sm text-secondary-color" dir="rtl">
                      {category.nameAr}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-2xl font-bold mb-8 text-center gradient-text">
              Featured Products
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any) => (
                <div
                  key={product.id}
                  className="glass-card overflow-hidden hover:bg-[var(--surface)] transition-all hover:-translate-y-1 group"
                >
                  <div className="aspect-square bg-[var(--surface)] relative overflow-hidden">
                    {product.images ? (
                      <Image
                        src={product.images.split(',')[0]}
                        alt={product.titleEn}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary-color">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 truncate" style={{ color: 'var(--text)' }}>
                      {product.titleEn}
                    </h4>
                    <p className="text-secondary-color text-sm mb-3 line-clamp-2">
                      {product.descriptionEn || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[var(--primary)]">
                        {store.currency} {product.salePrice}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-[var(--accent)]">
                          -{product.discount}{product.discountType === 'Percent' ? '%' : ''}
                        </span>
                      )}
                    </div>
                    <button className="btn-primary w-full mt-4 py-2 text-sm">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 px-4 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
                {store.name.charAt(0)}
              </div>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {store.name}
              </span>
            </div>
            <p className="text-sm text-secondary-color">
              Powered by EcomSaaS • Dynamic Theme System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
