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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getStoreByDomain(domain: string): Promise<Store | null> {
  console.log('Fetching store for domain:', domain);
  console.log('API URL:', API_URL);
  
  try {
    const url = `${API_URL}/api/store/by-domain/${domain}`;
    console.log('Fetching from URL:', url);
    
    const res = await fetch(url, {
      cache: 'no-store', // Disable caching for debugging
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
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
      cache: 'no-store',
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
      cache: 'no-store',
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
      cache: 'no-store',
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

// Generate CSS variables from theme
export function generateThemeCSS(theme: StoreTheme): string {
  return `
    :root {
      --primary: ${theme.primaryColor};
      --secondary: ${theme.secondaryColor};
      --accent: ${theme.accentColor};
      --background: ${theme.backgroundColor};
      --surface: ${theme.surfaceColor};
      --text: ${theme.textColor};
      --text-secondary: ${theme.textSecondaryColor};
      --border: ${theme.borderColor};
      --radius: ${theme.borderRadius};
      --font-family: ${theme.fontFamily};
    }
  `;
}
