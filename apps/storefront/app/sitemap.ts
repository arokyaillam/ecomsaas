import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getStoreByDomain } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getStoreProducts(storeId: string) {
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/products`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getStoreCategories(storeId: string) {
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  const store = await getStoreByDomain(domain);

  if (!store) {
    return [];
  }

  const baseUrl = `https://${store.domain}`;

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Add product pages
  const products = await getStoreProducts(store.id);
  products.forEach((product: any) => {
    routes.push({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  // Add category pages
  const categories = await getStoreCategories(store.id);
  categories.forEach((category: any) => {
    routes.push({
      url: `${baseUrl}/category/${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  return routes;
}
