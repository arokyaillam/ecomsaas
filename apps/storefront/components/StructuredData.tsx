'use client';

interface OrganizationData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock';
  rating?: number;
  reviewCount?: number;
}

// Sanitize JSON to prevent XSS in JSON-LD
function sanitizeJson(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

export function OrganizationSchema({ name, url, logo, description }: OrganizationData) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJson(schema) }}
    />
  );
}

export function ProductSchema({
  id,
  name,
  description,
  image,
  price,
  currency,
  availability,
  rating,
  reviewCount,
}: ProductData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://localhost/product/${id}`,
    name,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
    },
  };

  if (description) schema.description = description;
  if (image) schema.image = image;
  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJson(schema) }}
    />
  );
}

export function WebsiteSchema({ name, url }: { name: string; url: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJson(schema) }}
    />
  );
}

export function LocalBusinessSchema({
  name,
  description,
  url,
  telephone,
  address,
  image,
}: {
  name: string;
  description?: string;
  url: string;
  telephone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  image?: string;
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url,
  };

  if (description) schema.description = description;
  if (telephone) schema.telephone = telephone;
  if (image) schema.image = image;
  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postalCode,
      addressCountry: address.country,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJson(schema) }}
    />
  );
}
