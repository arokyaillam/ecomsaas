'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  name: string;
  type: 'category' | 'product';
  href: string;
}

interface FloatingSearchProps {
  categories: any[];
  products?: any[];
  theme: any;
}

export function FloatingSearch({ categories, products = [], theme }: FloatingSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results: SearchResult[] = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.nameEn,
      type: 'category' as const,
      href: `/category/${c.id}`,
    })),
    ...products.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.titleEn,
      type: 'product' as const,
      href: `/product/${p.id}`,
    })),
  ].filter((item) =>
    query.length > 0 && item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-xl">
      {/* Search Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-full text-sm transition-all duration-300 border"
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          color: theme.textSecondaryColor,
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-left">Search products...</span>
        <kbd
          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded"
          style={{
            backgroundColor: theme.surfaceColor,
            color: theme.textSecondaryColor,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          ⌘ K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 animate-fade-in"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-scale-in"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                backgroundColor: theme.surfaceColor,
                border: `1px solid ${theme.borderColor}`,
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: theme.borderColor }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.textSecondaryColor}
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search products, categories..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  style={{ color: theme.textColor }}
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 text-xs rounded hover:opacity-70 transition-opacity"
                  style={{
                    backgroundColor: theme.backgroundColor,
                    color: theme.textSecondaryColor,
                  }}
                >
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {query.length > 0 && results.length > 0 && (
                  <div className="py-3">
                    {results.slice(0, 8).map((result) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-5 py-3 hover:bg-opacity-50 transition-colors"
                        style={{
                          color: theme.textColor,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: theme.backgroundColor,
                              color: theme.textSecondaryColor,
                              border: `1px solid ${theme.borderColor}`,
                            }}
                          >
                            {result.type}
                          </span>
                          <span className="font-medium">{result.name}</span>
                        </div>
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
                      </Link>
                    ))}
                  </div>
                )}

                {query.length > 0 && results.length === 0 && (
                  <div className="px-5 py-8 text-center" style={{ color: theme.textSecondaryColor }}>
                    No results found for &quot;{query}&quot;
                  </div>
                )}

                {query.length === 0 && (
                  <div className="px-5 py-6">
                    <p
                      className="text-xs uppercase tracking-wider mb-4"
                      style={{ color: theme.textSecondaryColor }}
                    >
                      Popular Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categories.slice(0, 6).map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.id}`}
                          onClick={() => setIsOpen(false)}
                          className="px-4 py-2 rounded-full text-sm transition-all hover:scale-105"
                          style={{
                            backgroundColor: theme.backgroundColor,
                            color: theme.textColor,
                            border: `1px solid ${theme.borderColor}`,
                          }}
                        >
                          {cat.nameEn}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
