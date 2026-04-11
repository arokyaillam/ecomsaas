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
  const minPrice = parseFloat(resolvedSearchParams.minPrice || '0') || 0;
  const maxPrice = parseFloat(resolvedSearchParams.maxPrice || '0') || 0;
  const sortBy = resolvedSearchParams.sort || 'relevance';
  const inStock = resolvedSearchParams.inStock === 'true';
  const onSale = resolvedSearchParams.onSale === 'true';

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
        let matchesPrice = true;
        let matchesStock = true;
        let matchesSale = true;

        if (query) {
          const title = (p.titleEn || '').toLowerCase();
          const desc = (p.descriptionEn || '').toLowerCase();
          const titleAr = (p.titleAr || '').toLowerCase();
          matchesQuery =
            title.includes(query) ||
            desc.includes(query) ||
            titleAr.includes(query);
        }

        if (categoryId) {
          matchesCategory = p.categoryId === categoryId;
        }

        if (minPrice > 0) {
          const price = parseFloat(p.salePrice || p.regularPrice || 0);
          matchesPrice = price >= minPrice;
        }

        if (maxPrice > 0) {
          const price = parseFloat(p.salePrice || p.regularPrice || 0);
          matchesPrice = matchesPrice && price <= maxPrice;
        }

        if (inStock) {
          matchesStock = (p.currentQuantity || 0) > 0;
        }

        if (onSale) {
          matchesSale = p.salePrice && p.salePrice < p.regularPrice;
        }

        return matchesQuery && matchesCategory && matchesPrice && matchesStock && matchesSale;
      });

      // Sort products
      switch (sortBy) {
        case 'price_asc':
          products.sort((a, b) => {
            const priceA = parseFloat(a.salePrice || a.regularPrice || 0);
            const priceB = parseFloat(b.salePrice || b.regularPrice || 0);
            return priceA - priceB;
          });
          break;
        case 'price_desc':
          products.sort((a, b) => {
            const priceA = parseFloat(a.salePrice || a.regularPrice || 0);
            const priceB = parseFloat(b.salePrice || b.regularPrice || 0);
            return priceB - priceA;
          });
          break;
        case 'newest':
          products.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          break;
        case 'name_asc':
          products.sort((a, b) => {
            const nameA = (a.titleEn || '').toLowerCase();
            const nameB = (b.titleEn || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case 'name_desc':
          products.sort((a, b) => {
            const nameA = (a.titleEn || '').toLowerCase();
            const nameB = (b.titleEn || '').toLowerCase();
            return nameB.localeCompare(nameA);
          });
          break;
        case 'popularity':
          products.sort((a, b) => {
            const viewsA = parseInt(a.views || 0);
            const viewsB = parseInt(b.views || 0);
            return viewsB - viewsA;
          });
          break;
        default:
          // relevance - keep original order
          break;
      }
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

  // Build search URL with current filters
  const buildSearchUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categoryId && !updates.category) params.set('category', categoryId);
    if (minPrice > 0 && !updates.minPrice) params.set('minPrice', minPrice.toString());
    if (maxPrice > 0 && !updates.maxPrice) params.set('maxPrice', maxPrice.toString());
    if (sortBy !== 'relevance' && !updates.sort) params.set('sort', sortBy);
    if (inStock && !updates.inStock) params.set('inStock', 'true');
    if (onSale && !updates.onSale) params.set('onSale', 'true');

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    return `/search?${params.toString()}`;
  };

  const activeFiltersCount = [
    categoryId,
    minPrice > 0,
    maxPrice > 0,
    inStock,
    onSale,
  ].filter(Boolean).length;

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
                {query ? `Search: "${query}"` : 'All Products'}
              </h1>
              <p style={{ color: theme.textSecondaryColor }}>
                {products.length} product{products.length !== 1 ? 's' : ''} found
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

      {/* Filters Bar */}
      <section
        className="py-4 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: theme.backgroundColor,
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm"
                style={{ color: theme.textSecondaryColor }}
              >
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  window.location.href = buildSearchUrl({ sort: e.target.value });
                }}
                className="px-3 py-2 rounded-lg text-sm border cursor-pointer"
                style={{
                  backgroundColor: theme.surfaceColor,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="name_desc">Name: Z-A</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>

            <div className="h-6 w-px" style={{ backgroundColor: theme.borderColor }} />

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <Link
                href={buildSearchUrl({ category: undefined })}
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
                All
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={buildSearchUrl({ category: cat.id })}
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
        </div>
      </section>

      {/* Main Content */}
      <section
        className="py-8 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div
                className="p-4 rounded-xl space-y-6 sticky top-4"
                style={{
                  backgroundColor: theme.surfaceColor,
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="font-semibold"
                    style={{ color: theme.textColor }}
                  >
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: 'white',
                      }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </div>

                {/* Price Range */}
                <div>
                  <h4
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.textColor }}
                  >
                    Price Range
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      defaultValue={minPrice > 0 ? minPrice : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTimeout(() => {
                          window.location.href = buildSearchUrl({
                            minPrice: value || undefined,
                          });
                        }, 500);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm border"
                      style={{
                        backgroundColor: theme.backgroundColor,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    />
                    <span style={{ color: theme.textSecondaryColor }}>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      defaultValue={maxPrice > 0 ? maxPrice : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTimeout(() => {
                          window.location.href = buildSearchUrl({
                            maxPrice: value || undefined,
                          });
                        }, 500);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm border"
                      style={{
                        backgroundColor: theme.backgroundColor,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h4
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.textColor }}
                  >
                    Availability
                  </h4>
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => {
                        window.location.href = buildSearchUrl({
                          inStock: e.target.checked ? 'true' : undefined,
                        });
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span
                      className="text-sm"
                      style={{ color: theme.textSecondaryColor }}
                    >
                      In Stock Only
                    </span>
                  </label>
                </div>

                {/* Deals */}
                <div>
                  <h4
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.textColor }}
                  >
                    Deals
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onSale}
                      onChange={(e) => {
                        window.location.href = buildSearchUrl({
                          onSale: e.target.checked ? 'true' : undefined,
                        });
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span
                      className="text-sm"
                      style={{ color: theme.textSecondaryColor }}
                    >
                      On Sale
                    </span>
                  </label>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Link
                    href="/search"
                    className="block text-center py-2 text-sm rounded-lg transition-colors"
                    style={{
                      color: theme.primaryColor,
                      border: `1px solid ${theme.borderColor}`,
                    }}
                  >
                    Clear All Filters
                  </Link>
                )}
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
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
                    Try adjusting your search or filters to find what you&apos;re looking for.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
          </div>
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
