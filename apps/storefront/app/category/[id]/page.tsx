import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories, getStoreSubcategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';

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
            {category?.nameEn}
          </h1>
          {category?.nameAr && (
            <p className="text-xl mb-4" style={{ color: theme.textColor }} dir="rtl">
              {category.nameAr}
            </p>
          )}
          <p className="text-lg" style={{ color: theme.textSecondaryColor }}>
            {products.length} product{products.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </section>

      {/* Category Filter Bar */}
      {categories.length > 0 && (
        <section className="px-4 pb-8" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: theme.surfaceColor,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textSecondaryColor,
                }}
              >
                All
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                  style={cat.id === categoryId ? {
                    backgroundColor: theme.primaryColor,
                    color: 'white',
                    border: 'none',
                  } : {
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`,
                    color: theme.textSecondaryColor,
                  }}
                >
                  {cat.nameEn}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subcategory Filter Bar */}
      {subcategories.length > 0 && (
        <section className="px-4 pb-8" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/category/${categoryId}`}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                style={!currentSubcategoryId ? {
                  backgroundColor: theme.primaryColor,
                  color: 'white',
                  border: 'none',
                } : {
                  backgroundColor: theme.surfaceColor,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textSecondaryColor,
                }}
              >
                All
              </Link>
              {subcategories.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/category/${categoryId}?subcategoryId=${sub.id}`}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                  style={currentSubcategoryId === sub.id ? {
                    backgroundColor: theme.primaryColor,
                    color: 'white',
                    border: 'none',
                  } : {
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`,
                    color: theme.textSecondaryColor,
                  }}
                >
                  {sub.nameEn}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-8 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondaryColor} strokeWidth="1" className="mx-auto mb-4">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <h3 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>No products in this category</h3>
              <p style={{ color: theme.textSecondaryColor }}>Check back soon for new arrivals!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-xl transition-all hover:-translate-y-1 group"
                  style={{
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`
                  }}
                >
                  <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: theme.backgroundColor }}>
                    {product.images ? (
                      <Image
                        src={product.images.split(',')[0]}
                        alt={product.titleEn}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondaryColor} strokeWidth="1">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 truncate" style={{ color: theme.textColor }}>
                      {product.titleEn}
                    </h4>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.textSecondaryColor }}>
                      {product.descriptionEn || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                        {store.currency} {product.salePrice}
                      </span>
                      {product.discount > 0 && (
                        <span style={{ color: theme.accentColor }}>
                          -{product.discount}{product.discountType === 'Percent' ? '%' : ''}
                        </span>
                      )}
                    </div>
                    {product.currentQuantity <= 0 ? (
                      <button 
                        disabled
                        className="w-full mt-4 py-2 text-sm text-white rounded-lg opacity-50 cursor-not-allowed transition-opacity"
                        style={{ backgroundColor: theme.textSecondaryColor }}
                      >
                        Out of Stock
                      </button>
                    ) : (
                      <button
                        className="w-full mt-4 py-2 text-sm text-white rounded-lg transition-opacity hover:opacity-90"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
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
