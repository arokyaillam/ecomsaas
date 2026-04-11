import { Metadata } from 'next';
import { Store } from '@/components/ThemeProvider';

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonical?: string;
}

export function generateSeoMetadata(
  store: Store | null,
  options: SeoOptions
): Metadata {
  const siteName = store?.name || 'EcomSaaS Store';
  const fullTitle = `${options.title} | ${siteName}`;
  const description = options.description || 'Discover amazing products at great prices.';
  const image = options.image || store?.theme?.logoUrl;
  const canonical = options.canonical;

  return {
    title: fullTitle,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title: options.title,
      description,
      siteName,
      type: options.type || 'website',
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description,
      ...(image && { images: [image] }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateProductMetadata(
  store: Store | null,
  product: any
): Metadata {
  const title = product.titleEn || product.name || 'Product';
  const description = product.descriptionEn || product.description || '';
  const image = product.images ? product.images.split(',')[0] : undefined;

  const metadata = generateSeoMetadata(store, {
    title,
    description,
    image,
    type: 'website', // Next.js 16 doesn't support 'product' og:type
    canonical: `https://${store?.domain || 'localhost'}/product/${product.id}`,
  });

  // Add product-specific metadata
  return {
    ...metadata,
    other: {
      'og:availability': product.currentQuantity > 0 ? 'instock' : 'outofstock',
      'og:price:amount': product.salePrice?.toString() || '0',
      'og:price:currency': store?.currency || 'USD',
    },
  };
}

export function generateCategoryMetadata(
  store: Store | null,
  category: any
): Metadata {
  const title = category.nameEn || category.name || 'Category';
  const description = `Browse ${title} - ${store?.name || 'Our Store'}`;

  return generateSeoMetadata(store, {
    title,
    description,
    type: 'website',
    canonical: `https://${store?.domain || 'localhost'}/category/${category.id}`,
  });
}
