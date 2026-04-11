// Store Theme Configuration
export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  borderRadius: string;
  fontFamily: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export interface StoreHero {
  image?: string | null;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  enabled?: boolean;
}

export interface Store {
  id: string;
  name: string;
  domain: string;
  currency: string;
  language: string;
  theme: StoreTheme;
  hero: StoreHero;
}

// Server-side fetches need absolute URL; client-side uses Next.js rewrites proxy
const API_URL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : '';

export async function getStoreByDomain(domain: string): Promise<Store | null> {
  console.log('Fetching store for domain:', domain);
  console.log('API URL:', API_URL);
  
  try {
    const url = `${API_URL}/api/store/by-domain/${domain}`;
    console.log('Fetching from URL:', url);
    
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      console.error('Store fetch failed:', res.status, res.statusText);
      const errorText = await res.text();
      console.error('Error body:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('Store data received:', data ? 'yes' : 'no');
    
    if (!data.data) {
      console.error('No data in response');
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Failed to fetch store:', error);
    return null;
  }
}

export async function getStoreProducts(storeId: string) {
  console.log('Fetching products for store:', storeId);
  
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/products`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Products response status:', res.status);
    
    if (!res.ok) {
      console.error('Products fetch failed:', res.status);
      return [];
    }
    
    const data = await res.json();
    const products = data.data || [];
    console.log('Products received:', products.length);
    return products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getStoreCategories(storeId: string) {
  console.log('Fetching categories for store:', storeId);
  
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/categories`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Categories response status:', res.status);
    
    if (!res.ok) {
      console.error('Categories fetch failed:', res.status);
      return [];
    }
    
    const data = await res.json();
    const categories = data.data || [];
    console.log('Categories received:', categories.length);
    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getStoreSubcategories(storeId: string, categoryId: string) {
  console.log(`Fetching subcategories for store: ${storeId}, category: ${categoryId}`);
  
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/categories/${categoryId}/subcategories`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.error('Subcategories fetch failed:', res.status);
      return [];
    }
    
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch subcategories:', error);
    return [];
  }
}

// Sanitize CSS values to prevent injection attacks
function sanitizeCssValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const str = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(str)) return str;
  if (/^(rgba?\(|hsla?\()\s*[\d\s,.%]+\)$/.test(str)) return str;
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(str)) return str;
  if (/^[a-zA-Z0-9\s,'"\-]+$/.test(str) && !/[;{}()]/.test(str)) return str;
  return fallback;
}

const defaultThemeValues: Record<string, string> = {
  primaryColor: '#0ea5e9',
  secondaryColor: '#6366f1',
  accentColor: '#8b5cf6',
  backgroundColor: '#0f172a',
  surfaceColor: '#1e293b',
  textColor: '#f8fafc',
  textSecondaryColor: '#94a3b8',
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontFamily: 'Inter, sans-serif',
};

// Generate CSS variables from theme (sanitized)
export function generateThemeCSS(theme: StoreTheme): string {
  const s = (key: string, value: string | null | undefined, fallback: string) => sanitizeCssValue(value, fallback);
  return `
    :root {
      --primary: ${s('primaryColor', theme.primaryColor, defaultThemeValues.primaryColor)};
      --secondary: ${s('secondaryColor', theme.secondaryColor, defaultThemeValues.secondaryColor)};
      --accent: ${s('accentColor', theme.accentColor, defaultThemeValues.accentColor)};
      --background: ${s('backgroundColor', theme.backgroundColor, defaultThemeValues.backgroundColor)};
      --surface: ${s('surfaceColor', theme.surfaceColor, defaultThemeValues.surfaceColor)};
      --text: ${s('textColor', theme.textColor, defaultThemeValues.textColor)};
      --text-secondary: ${s('textSecondaryColor', theme.textSecondaryColor, defaultThemeValues.textSecondaryColor)};
      --border: ${s('borderColor', theme.borderColor, defaultThemeValues.borderColor)};
      --radius: ${s('borderRadius', theme.borderRadius, defaultThemeValues.borderRadius)};
      --font-family: ${s('fontFamily', theme.fontFamily, defaultThemeValues.fontFamily)};
    }
  `;
}
