import { headers } from 'next/headers';
import {
  getStoreByDomain,
  getStoreProducts,
  getStoreCategories,
} from '@/lib/store';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.toLowerCase() || '';
  const categoryId = resolvedSearchParams.category || '';

  let store = null;
  let products: any[] = [];
  let categories: any[] = [];
  let error = null;
  let domain = 'localhost';

  try {
    const headersList = await headers();
    domain = headersList.get('x-store-domain') || 'localhost';

    store = await getStoreByDomain(domain);

    if (store) {
      const [allProducts, allCategories] = await Promise.all([
        getStoreProducts(store.id),
        getStoreCategories(store.id),
      ]);

      categories = allCategories;

      // Filter the products
      products = allProducts.filter((p: any) => {
        let matchesQuery = true;
        let matchesCategory = true;

        if (query) {
          const title = (p.titleEn || '').toLowerCase();
          const desc = (p.descriptionEn || '').toLowerCase();
          const titleAr = (p.titleAr || '').toLowerCase();
          matchesQuery =
            title.includes(query) || desc.includes(query) || titleAr.includes(query);
        }

        if (categoryId) {
          matchesCategory = p.categoryId === categoryId;
        }

        return matchesQuery && matchesCategory;
      });
    }
  } catch (err) {
    console.error('Error loading search results:', err);
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
        </div>
      </div>
    );
  }

  const theme = store.theme;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.backgroundColor }}>
      <Header store={store} categories={categories} />

      {/* Page Header - Editorial Style */}
      <section
        className="relative py-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: theme.surfaceColor,
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-6 text-sm">
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
              Search
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1
                className="font-display text-4xl sm:text-5xl font-semibold mb-2"
                style={{ color: theme.textColor }}
              >
                Search Results
              </h1>
              <p style={{ color: theme.textSecondaryColor }}>
                {products.length} product{products.length !== 1 ? 's' : ''} found
                {query ? ` for "${query}"` : ''}
                {selectedCategory ? ` in ${selectedCategory.nameEn}` : ''}
              </p>
            </div>

            {/* Back to browse */}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:opacity-80 self-start"
              style={{
                backgroundColor: theme.backgroundColor,
                border: `1px solid ${theme.borderColor}`,
                color: theme.textColor,
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
                <path d="m15 18-6-6 6-6" />
              </svg>
              Browse All
            </Link>
          </div>
        </div>
      </section>

      {/* Search Filters */}
      <section
        className="py-4 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: theme.backgroundColor,
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <span
              className="text-sm whitespace-nowrap"
              style={{ color: theme.textSecondaryColor }}
            >
              Filter by:
            </span>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              style={
                !categoryId
                  ? {
                      backgroundColor: theme.primaryColor,
                      color: 'white',
                    }
                  : {
                      backgroundColor: theme.surfaceColor,
                      border: `1px solid ${theme.borderColor}`,
                      color: theme.textSecondaryColor,
                    }
              }
            >
              All Categories
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/search?q=${encodeURIComponent(query)}&category=${cat.id}`}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={
                  categoryId === cat.id
                    ? {
                        backgroundColor: theme.primaryColor,
                        color: 'white',
                      }
                    : {
                        backgroundColor: theme.surfaceColor,
                        border: `1px solid ${theme.borderColor}`,
                        color: theme.textSecondaryColor,
                      }
                }
              >
                {cat.nameEn}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div
              className="text-center py-24 rounded-2xl"
              style={{
                backgroundColor: theme.surfaceColor,
                border: `1px solid ${theme.borderColor}`,
              }}
            >
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
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3
                className="font-display text-2xl font-semibold mb-2"
                style={{ color: theme.textColor }}
              >
                No matches found
              </h3>
              <p
                className="mb-6"
                style={{ color: theme.textSecondaryColor }}
              >
                Try adjusting your search or filtering by a different category.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
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
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="animate-fade-up opacity-0"
                  style={{
                    animationDelay: `${index * 50}ms`,
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
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{
          borderTop: `1px solid ${theme.borderColor}`,
          backgroundColor: theme.backgroundColor,
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p
            className="text-sm"
            style={{ color: theme.textSecondaryColor }}
          >
            Powered by EcomSaaS • Dynamic Theme System
          </p>
        </div>
      </footer>
    </div>
  );
}
