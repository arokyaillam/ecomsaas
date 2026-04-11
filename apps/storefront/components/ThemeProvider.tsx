'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { StoreTheme, getStoreByDomain } from '@/lib/store';

// Store type definition
export interface Store {
  id: string;
  name: string;
  domain: string;
  currency: string;
  language: string;
  theme: StoreTheme;
  hero: {
    image?: string | null;
    title?: string;
    subtitle?: string;
    enabled?: boolean;
  };
}

interface ThemeProviderProps {
  theme: StoreTheme;
  children: React.ReactNode;
}

const defaultTheme: StoreTheme = {
  primaryColor: "#0ea5e9",
  secondaryColor: "#6366f1",
  accentColor: "#8b5cf6",
  backgroundColor: "#0f172a",
  surfaceColor: "#1e293b",
  textColor: "#f8fafc",
  textSecondaryColor: "#94a3b8",
  borderColor: "rgba(255,255,255,0.1)",
  borderRadius: "12px",
  fontFamily: "Inter, sans-serif",
  logoUrl: null,
  faviconUrl: null,
};

// Sanitize CSS values to prevent injection attacks
function sanitizeCssValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const str = value.trim();
  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(str)) return str;
  // rgba/hsla functions with numeric params only
  if (/^(rgba?\(|hsla?\()\s*[\d\s,.%]+\)$/.test(str)) return str;
  // Numeric values with units
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(str)) return str;
  // Font family names: alphanumeric, spaces, hyphens, commas, quotes — no parens or semicolons
  if (/^[a-zA-Z0-9\s,'"\-]+$/.test(str) && !/[;{}()]/.test(str)) return str;
  return fallback;
}

// Store context
const StoreContext = createContext<Store | null>(null);

export function useStore() {
  return useContext(StoreContext);
}

export function ThemeProvider({ theme: initialTheme, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<StoreTheme>(initialTheme || defaultTheme);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch fresh theme from API on client side
    async function loadTheme() {
      try {
        const domain = window.location.hostname;
        const fetchedStore = await getStoreByDomain(domain);
        if (fetchedStore?.theme) {
          setTheme(fetchedStore.theme);
          setStore(fetchedStore);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply CSS variables to document (sanitized)
    const root = document.documentElement;
    root.style.setProperty('--primary', sanitizeCssValue(theme.primaryColor, defaultTheme.primaryColor));
    root.style.setProperty('--secondary', sanitizeCssValue(theme.secondaryColor, defaultTheme.secondaryColor));
    root.style.setProperty('--accent', sanitizeCssValue(theme.accentColor, defaultTheme.accentColor));
    root.style.setProperty('--background', sanitizeCssValue(theme.backgroundColor, defaultTheme.backgroundColor));
    root.style.setProperty('--surface', sanitizeCssValue(theme.surfaceColor, defaultTheme.surfaceColor));
    root.style.setProperty('--text', sanitizeCssValue(theme.textColor, defaultTheme.textColor));
    root.style.setProperty('--text-secondary', sanitizeCssValue(theme.textSecondaryColor, defaultTheme.textSecondaryColor));
    root.style.setProperty('--border', sanitizeCssValue(theme.borderColor, defaultTheme.borderColor));
    root.style.setProperty('--radius', sanitizeCssValue(theme.borderRadius, defaultTheme.borderRadius));
    root.style.setProperty('--font-family', sanitizeCssValue(theme.fontFamily, defaultTheme.fontFamily));

    // Apply body styles (sanitized)
    document.body.style.backgroundColor = sanitizeCssValue(theme.backgroundColor, defaultTheme.backgroundColor);
    document.body.style.color = sanitizeCssValue(theme.textColor, defaultTheme.textColor);
  }, [theme]);

  if (loading && !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}
