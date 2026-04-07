import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  store: any;
  categories: any[];
}

export function Header({ store, categories }: HeaderProps) {
  const theme = store.theme;

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      borderBottom: `1px solid ${theme.borderColor}`, 
      backgroundColor: theme.surfaceColor,
      backdropFilter: 'blur(10px)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3 shrink-0">
            {theme.logoUrl ? (
              <Image 
                src={theme.logoUrl} 
                alt={store.name}
                width={44}
                height={44}
                className="rounded-lg object-contain"
              />
            ) : (
              <div 
                className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` 
                }}
              >
                {store.name.charAt(0)}
              </div>
            )}
            <Link href="/" className="text-xl font-bold hidden sm:block" style={{ color: theme.textColor }}>
              {store.name}
            </Link>
          </div>

          {/* Search Bar (Amazon Style) */}
          <div className="flex-grow hidden md:flex items-center justify-center max-w-3xl">
            <SearchBar categories={categories} theme={theme} />
          </div>

          {/* Navigation & Cart */}
          <div className="flex items-center gap-6 shrink-0">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
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
              className="px-6 py-2.5 rounded-xl text-white font-medium shadow-sm transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="hidden sm:inline">Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row (Only visible on small screens) */}
        <div className="md:hidden pb-4 pt-1">
          <SearchBar categories={categories} theme={theme} />
        </div>
      </div>
    </header>
  );
}
