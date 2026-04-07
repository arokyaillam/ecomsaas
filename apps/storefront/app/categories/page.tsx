import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';

export default async function CategoriesPage() {
  let store = null;
  let categories: any[] = [];
  let error = null;
  let domain = 'localhost';

  try {
    const headersList = await headers();
    domain = headersList.get('x-store-domain') || 'localhost';

    store = await getStoreByDomain(domain);

    if (store) {
      categories = await getStoreCategories(store.id);
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="p-8 text-center max-w-md border rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#1e293b' }}>
          <h1 className="text-2xl font-bold mb-4 text-white">Store Not Found</h1>
          <p style={{ color: '#94a3b8' }}>Domain: {domain}</p>
          {error && <p className="mt-2 text-red-400 text-sm">Error: {error}</p>}
        </div>
      </div>
    );
  }

  const theme = store.theme;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.backgroundColor }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${theme.borderColor}`,
        backgroundColor: theme.surfaceColor,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {theme.logoUrl ? (
                <Image
                  src={theme.logoUrl}
                  alt={store.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`
                  }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <Link href="/" className="text-xl font-bold" style={{ color: theme.textColor }}>
                {store.name}
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" style={{ color: theme.textSecondaryColor }} className="hover:opacity-80 transition-opacity">
                Home
              </Link>
              <Link href="/products" style={{ color: theme.textSecondaryColor }} className="hover:opacity-80 transition-opacity">
                Products
              </Link>
              <Link href="/categories" style={{ color: theme.textColor, fontWeight: 600 }} className="hover:opacity-80 transition-opacity">
                Categories
              </Link>
            </nav>
            <button
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Cart
            </button>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section className="py-12 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Categories
          </h1>
          <p className="text-lg" style={{ color: theme.textSecondaryColor }}>
            Browse by category — {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} available
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-8 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondaryColor} strokeWidth="1" className="mx-auto mb-4">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <h3 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>No categories yet</h3>
              <p style={{ color: theme.textSecondaryColor }}>Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="p-8 rounded-xl transition-all hover:-translate-y-1 group cursor-pointer"
                  style={{
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                      opacity: 0.9
                    }}
                  >
                    {(category.nameEn || '?').charAt(0)}
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
                    {category.nameEn}
                  </h3>
                  {category.nameAr && (
                    <p className="text-sm mb-2" style={{ color: theme.textSecondaryColor }} dir="rtl">
                      {category.nameAr}
                    </p>
                  )}
                  <span className="text-sm font-medium group-hover:underline" style={{ color: theme.primaryColor }}>
                    Browse →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 mt-20" style={{ borderTop: `1px solid ${theme.borderColor}`, backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
              >
                {store.name.charAt(0)}
              </div>
              <span className="font-semibold" style={{ color: theme.textColor }}>
                {store.name}
              </span>
            </div>
            <p className="text-sm" style={{ color: theme.textSecondaryColor }}>
              Powered by EcomSaaS • Dynamic Theme System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
