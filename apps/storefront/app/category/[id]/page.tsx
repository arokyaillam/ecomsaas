import { headers } from 'next/headers';
import {
  getStoreByDomain,
  getStoreProducts,
  getStoreCategories,
  getStoreSubcategories,
} from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const categoryId = resolvedParams.id;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentSubcategoryId = resolvedSearchParams.subcategoryId || null;

  let store = null;
  let products: any[] = [];
  let category: any = null;
  let categories: any[] = [];
  let subcategories: any[] = [];
  let error = null;
  let domain = 'localhost';

  try {
    const headersList = await headers();
    domain = headersList.get('x-store-domain') || 'localhost';

    store = await getStoreByDomain(domain);

    if (store) {
      const [allProducts, allCategories, allSubcategories] = await Promise.all([
        getStoreProducts(store.id),
        getStoreCategories(store.id),
        getStoreSubcategories(store.id, categoryId),
      ]);

      categories = allCategories;
      category = allCategories.find((c: any) => c.id === categoryId);
      subcategories = allSubcategories;

      if (!category) {
        return notFound();
      }

      // Filter products by categoryId
      products = allProducts.filter((p: any) => p.categoryId === categoryId);

      // Filter by subcategoryId if present
      if (currentSubcategoryId) {
        products = products.filter((p: any) => p.subcategoryId === currentSubcategoryId);
      }
    }
  } catch (err) {
    console.error('Error loading category:', err);
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
            <Link
              href="/categories"
              className="transition-colors hover:opacity-70"
              style={{ color: theme.textSecondaryColor }}
            >
              Categories
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
              {category?.nameEn}
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
                Category
              </span>
            </div>

            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold mb-4"
              style={{ color: theme.textColor }}
            >
              {category?.nameEn}
            </h1>
            {category?.nameAr && (
              <p
                className="text-2xl mb-6"
                style={{ color: theme.textColor }}
                dir="rtl"
              >
                {category.nameAr}
              </p>
            )}
            <p
              className="text-lg"
              style={{ color: theme.textSecondaryColor }}
            >
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section
        className="sticky top-20 z-30 py-4 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: `${theme.surfaceColor}f0`,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${theme.borderColor}`,
          borderBottom: `1px solid ${theme.borderColor}`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <Link
                href="/products"
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:opacity-80"
                style={{
                  backgroundColor: theme.surfaceColor,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textSecondaryColor,
                }}
              >
                All Products
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:opacity-80"
                  style={
                    cat.id === categoryId
                      ? {
                          backgroundColor: theme.primaryColor,
                          color: 'white',
                          border: 'none',
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

            {/* Sort Dropdown - Placeholder for future */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm whitespace-nowrap"
                style={{ color: theme.textSecondaryColor }}
              >
                Sort by:
              </span>
              <select
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: theme.backgroundColor,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textColor,
                }}
              >
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          {/* Subcategory Pills */}
          {subcategories.length > 0 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              <span
                className="text-sm mr-2"
                style={{ color: theme.textSecondaryColor }}
              >
                Subcategories:
              </span>
              <Link
                href={`/category/${categoryId}`}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:opacity-80"
                style={
                  !currentSubcategoryId
                    ? {
                        backgroundColor: theme.accentColor,
                        color: 'white',
                        border: 'none',
                      }
                    : {
                        backgroundColor: theme.backgroundColor,
                        border: `1px solid ${theme.borderColor}`,
                        color: theme.textSecondaryColor,
                      }
                }
              >
                All
              </Link>
              {subcategories.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/category/${categoryId}?subcategoryId=${sub.id}`}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:opacity-80"
                  style={
                    currentSubcategoryId === sub.id
                      ? {
                          backgroundColor: theme.accentColor,
                          color: 'white',
                          border: 'none',
                        }
                      : {
                          backgroundColor: theme.backgroundColor,
                          border: `1px solid ${theme.borderColor}`,
                          color: theme.textSecondaryColor,
                        }
                  }
                >
                  {sub.nameEn}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
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
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <h3
                className="font-display text-2xl font-semibold mb-2"
                style={{ color: theme.textColor }}
              >
                No products found
              </h3>
              <p style={{ color: theme.textSecondaryColor }}>
                Check back soon for new arrivals in this category!
              </p>
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
