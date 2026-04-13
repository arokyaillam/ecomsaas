import { headers } from 'next/headers';
import { getStoreByDomain, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f172a' }}
      >
        <div
          className="p-8 text-center max-w-md rounded-2xl"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#1e293b' }}
        >
          <h1 className="font-display text-3xl font-bold mb-4 text-white">
            Store Not Found
          </h1>
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
      <Header />

      {/* Page Header - Editorial Style */}
      <section
        className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/3"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/3"
          style={{ backgroundColor: theme.accentColor }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-8 text-sm">
            <Link
              href="/"
              className="transition-colors hover:opacity-70"
              style={{ color: theme.textSecondaryColor }}
            >
              Home
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.textSecondaryColor}
              strokeWidth="2"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span
              className="font-medium"
              style={{ color: theme.textColor }}
            >
              Categories
            </span>
          </nav>

          {/* Title Section */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-4">
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

            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold mb-4"
              style={{ color: theme.textColor }}
            >
              Categories
            </h1>
            <p
              className="text-lg"
              style={{ color: theme.textSecondaryColor }}
            >
              Explore our curated collections — {categories.length} categor
              {categories.length !== 1 ? 'ies' : 'y'} available
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid - Editorial Layout */}
      <section
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="max-w-7xl mx-auto">
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.textSecondaryColor}
                strokeWidth="1"
                className="mx-auto mb-4"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <h3
                className="font-display text-2xl font-semibold mb-2"
                style={{ color: theme.textColor }}
              >
                No categories yet
              </h3>
              <p style={{ color: theme.textSecondaryColor }}>Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category: any, index: number) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden card-editorial animate-fade-up opacity-0"
                  style={{
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`,
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  {/* Gradient Background */}
                  <div
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                    style={{
                      background:
                        index % 3 === 0
                          ? `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.accentColor}15)`
                          : index % 3 === 1
                            ? `linear-gradient(135deg, ${theme.accentColor}20, ${theme.primaryColor}15)`
                            : `linear-gradient(135deg, ${theme.secondaryColor || theme.primaryColor}20, ${theme.accentColor}15)`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-display font-bold"
                        style={{
                          backgroundColor: theme.backgroundColor,
                          color: theme.primaryColor,
                          border: `1px solid ${theme.borderColor}`,
                        }}
                      >
                        0{index + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
                        style={{
                          backgroundColor: theme.primaryColor,
                          color: 'white',
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
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <h3
                        className="font-display text-3xl font-semibold mb-2 transition-colors"
                        style={{ color: theme.textColor }}
                      >
                        {category.nameEn}
                      </h3>
                      {category.nameAr && (
                        <p
                          className="text-base mb-3"
                          style={{ color: theme.textSecondaryColor }}
                          dir="rtl"
                        >
                          {category.nameAr}
                        </p>
                      )}
                      <span
                        className="inline-flex items-center gap-2 text-sm font-medium"
                        style={{ color: theme.primaryColor }}
                      >
                        Explore Collection
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
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-16 px-4 sm:px-6 lg:px-8"
        style={{
          borderTop: `1px solid ${theme.borderColor}`,
          backgroundColor: theme.backgroundColor,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                }}
              >
                {store.name.charAt(0)}
              </div>
              <span
                className="font-display text-xl font-semibold"
                style={{ color: theme.textColor }}
              >
                {store.name}
              </span>
            </div>
            <p
              className="text-sm"
              style={{ color: theme.textSecondaryColor }}
            >
              © 2026 {store.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
