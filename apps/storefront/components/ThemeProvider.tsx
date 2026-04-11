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
    // Apply CSS variables to document
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--background', theme.backgroundColor);
    root.style.setProperty('--surface', theme.surfaceColor);
    root.style.setProperty('--text', theme.textColor);
    root.style.setProperty('--text-secondary', theme.textSecondaryColor);
    root.style.setProperty('--border', theme.borderColor);
    root.style.setProperty('--radius', theme.borderRadius);
    root.style.setProperty('--font-family', theme.fontFamily);

    // Apply body styles
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.textColor;
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
