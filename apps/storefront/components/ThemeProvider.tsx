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

// Warm Minimalist Design System Colors
const warmTheme = {
  primaryColor: '#e85d4c',
  secondaryColor: '#6366f1',
  accentColor: '#e85d4c',
  backgroundColor: '#faf8f5',
  surfaceColor: '#ffffff',
  textColor: '#1a1a1a',
  textSecondaryColor: '#4a4a4a',
  borderColor: '#e8e4dc',
  borderRadius: '12px',
  fontFamily: 'Satoshi, Inter, system-ui, sans-serif',
};

// Store context
const StoreContext = createContext<Store | null>(null);

export function useStore() {
  return useContext(StoreContext);
}

export function ThemeProvider({ theme: initialTheme, children }: ThemeProviderProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract store domain from hostname (e.g., "arokyastore.localhost" -> "arokyastore")
    function extractStoreDomain(hostname: string): string {
      // Remove port if present
      const hostWithoutPort = hostname.split(':')[0];

      // Extract subdomain part (before the first dot)
      if (hostWithoutPort.includes('.')) {
        const parts = hostWithoutPort.split('.');
        // If first part is "www", skip it
        if (parts[0] === 'www' && parts.length > 2) {
          return parts[1];
        } else if (parts.length >= 2) {
          // Take the first part as the store domain
          return parts[0];
        }
      }

      return hostWithoutPort;
    }

    // Try to fetch store data on client side (but don't use its theme)
    async function loadStore() {
      try {
        const domain = extractStoreDomain(window.location.hostname);
        const fetchedStore = await getStoreByDomain(domain);
        if (fetchedStore) {
          setStore(fetchedStore);
        }
      } catch (error) {
        console.error('Failed to load store:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  useEffect(() => {
    // Apply warm minimalist CSS variables to document
    const root = document.documentElement;
    root.style.setProperty('--primary', warmTheme.primaryColor);
    root.style.setProperty('--secondary', warmTheme.secondaryColor);
    root.style.setProperty('--accent', warmTheme.accentColor);
    root.style.setProperty('--background', warmTheme.backgroundColor);
    root.style.setProperty('--surface', warmTheme.surfaceColor);
    root.style.setProperty('--text', warmTheme.textColor);
    root.style.setProperty('--text-secondary', warmTheme.textSecondaryColor);
    root.style.setProperty('--border', warmTheme.borderColor);
    root.style.setProperty('--radius', warmTheme.borderRadius);
    root.style.setProperty('--font-family', warmTheme.fontFamily);

    // Apply body styles
    document.body.style.backgroundColor = warmTheme.backgroundColor;
    document.body.style.color = warmTheme.textColor;
  }, []);

  if (loading) {
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
