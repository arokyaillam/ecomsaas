import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';

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
          matchesQuery = title.includes(query) || desc.includes(query) || titleAr.includes(query);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="p-8 text-center max-w-md border rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#1e293b' }}>
          <h1 className="text-2xl font-bold mb-4 text-white">Store Not Found</h1>
          <p style={{ color: '#94a3b8' }}>Domain: {domain}</p>
        </div>
      </div>
    );
  }

  const theme = store.theme;
  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.backgroundColor }}>
      <Header store={store} categories={categories} />

      {/* Page Header */}
      <section className="py-12 px-4 shadow-sm" style={{ backgroundColor: theme.surfaceColor, borderBottom: `1px solid ${theme.borderColor}` }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2" style={{ color: theme.textColor }}>
            Search Results
          </h1>
          <p className="text-lg" style={{ color: theme.textSecondaryColor }}>
            {products.length} product{products.length !== 1 ? 's' : ''} found {query ? `for "${query}"` : ''} {selectedCategory ? `in ${selectedCategory.nameEn}` : ''}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-24 rounded-2xl" style={{ backgroundColor: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondaryColor} strokeWidth="1" className="mx-auto mb-4">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>No matches found</h3>
              <p style={{ color: theme.textSecondaryColor }} className="mb-6">Try adjusting your search or filtering by a different category.</p>
              <Link
                href="/products"
                className="px-6 py-3 rounded-lg text-white font-medium inline-block transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-xl transition-all hover:-translate-y-1 group flex flex-col"
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
                  <div className="p-4 flex-grow flex flex-col">
                    <h4 className="font-semibold mb-2 line-clamp-2" style={{ color: theme.textColor }}>
                      {product.titleEn}
                    </h4>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                        {store.currency} {product.salePrice}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: `${theme.accentColor}20`, color: theme.accentColor }}>
                          Save {product.discount}{product.discountType === 'Percent' ? '%' : ''}
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
      <footer className="py-12 px-4 mt-auto" style={{ borderTop: `1px solid ${theme.borderColor}`, backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm" style={{ color: theme.textSecondaryColor }}>
            Powered by EcomSaaS • Dynamic Theme System
          </p>
        </div>
      </footer>
    </div>
  );
}
