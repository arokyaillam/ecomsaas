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

export interface Store {
  id: string;
  name: string;
  domain: string;
  currency: string;
  language: string;
  theme: StoreTheme;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getStoreByDomain(domain: string): Promise<Store | null> {
  try {
    const res = await fetch(`${API_URL}/api/store/by-domain/${domain}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch store:', error);
    return null;
  }
}

export async function getStoreProducts(storeId: string) {
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/products`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getStoreCategories(storeId: string) {
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/categories`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
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
