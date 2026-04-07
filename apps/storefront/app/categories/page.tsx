import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';

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
      <Header store={store} categories={categories} />

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
