import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getStoreByDomain } from '@/lib/store';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  const store = await getStoreByDomain(domain);

  const baseUrl = store ? `https://${store.domain}` : 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/checkout/', '/api/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
