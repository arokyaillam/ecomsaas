import { headers } from 'next/headers';
import { getStoreByDomain, getStoreProducts, getStoreCategories } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';

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
      [products, categories] = await Promise.all([
        getStoreProducts(store.id),
        getStoreCategories(store.id),
      ]);
    }
  } catch (err) {
    console.error('Error loading store data:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }
  
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="p-8 text-center max-w-md border rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#1e293b' }}>
          <h1 className="text-2xl font-bold mb-4 text-white">Store Not Found</h1>
          <p className="mb-4" style={{ color: '#94a3b8' }}>
            Domain: {domain}
          </p>
          {error && (
            <p className="mb-4 text-red-400 text-sm">
              Error: {error}
            </p>
          )}
          <p style={{ color: '#94a3b8' }}>
            Please make sure:<br/>
            1. The backend is running on port 8000<br/>
            2. Database has been migrated<br/>
            3. A store exists with domain &quot;{domain}&quot;
          </p>
        </div>
      </div>
    );
  }

  // Use theme colors from store
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
              <h1 className="text-xl font-bold" style={{ color: theme.textColor }}>
                {store.name}
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" style={{ color: theme.textSecondaryColor }} className="hover:opacity-80 transition-opacity">
                Home
              </Link>
              <Link href="/products" style={{ color: theme.textSecondaryColor }} className="hover:opacity-80 transition-opacity">
                Products
              </Link>
              <Link href="/categories" style={{ color: theme.textSecondaryColor }} className="hover:opacity-80 transition-opacity">
                Categories
              </Link>
            </nav>
            <button 
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Shop Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Welcome to {store.name}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: theme.textSecondaryColor }}>
            Discover amazing products curated just for you. 
            Powered by EcomSaaS with dynamic theming.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              className="text-lg px-8 py-4 rounded-xl font-medium text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Explore Products
            </button>
            <button 
              className="px-8 py-4 rounded-xl font-medium transition-colors"
              style={{ 
                border: `1px solid ${theme.borderColor}`, 
                color: theme.textColor,
                backgroundColor: theme.surfaceColor
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Debug info - remove in production */}
      <div className="px-4 py-2 text-center text-xs" style={{ color: theme.textSecondaryColor }}>
        Store: {store.name} | Products: {products.length} | Categories: {categories.length}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="max-w-7xl mx-auto">
            <h3 
              className="text-2xl font-bold mb-8 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="p-6 text-center rounded-xl transition-all hover:-translate-y-1 cursor-pointer"
                  style={{ 
                    backgroundColor: theme.surfaceColor,
                    border: `1px solid ${theme.borderColor}`,
                    color: theme.textColor
                  }}
                >
                  <h4 className="font-semibold text-lg mb-1">
                    {category.nameEn}
                  </h4>
                  {category.nameAr && (
                    <p className="text-sm" style={{ color: theme.textSecondaryColor }} dir="rtl">
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
        <section className="py-16 px-4" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="max-w-7xl mx-auto">
            <h3 
              className="text-2xl font-bold mb-8 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Featured Products
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any) => (
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
                        className="w-full mt-4 py-2 text-sm text-white rounded-lg opacity-50 cursor-not-allowed"
                        style={{ backgroundColor: theme.textSecondaryColor }}
                      >
                        Out of Stock
                      </button>
                    ) : (
                      <button 
                        className="w-full mt-4 py-2 text-sm text-white rounded-lg"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
