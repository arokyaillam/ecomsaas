import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getStoreByDomain } from '@/lib/store';
import { Header } from '@/components/Header';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductSchema } from '@/components/StructuredData';
import { generateProductMetadata } from '@/lib/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getProduct(storeId: string, productId: string) {
  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/products/${productId}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getProductReviews(productId: string) {
  try {
    const res = await fetch(`${API_URL}/api/reviews/product/${productId}`, {
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  const store = await getStoreByDomain(domain);

  if (!store) {
    return {
      title: 'Product Not Found',
    };
  }

  const product = await getProduct(store.id, id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return generateProductMetadata(store, product);
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  const { id } = await params;

  const store = await getStoreByDomain(domain);

  if (!store) {
    return notFound();
  }

  const [product, reviews] = await Promise.all([
    getProduct(store.id, id),
    getProductReviews(id),
  ]);

  if (!product) {
    return notFound();
  }

  // Modifiers come with the product from the public store endpoint
  const modifiers = product.modifierGroups || [];

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const productImage = product.images ? product.images.split(',')[0] : undefined;

  return (
    <>
      <ProductSchema
        id={product.id}
        name={product.titleEn || product.name}
        description={product.descriptionEn || product.description}
        image={productImage}
        price={Number(product.salePrice || product.price)}
        currency={store.currency}
        availability={product.currentQuantity > 0 ? 'InStock' : 'OutOfStock'}
        rating={averageRating || undefined}
        reviewCount={reviews.length || undefined}
      />
      <div style={{ minHeight: '100vh', backgroundColor: store.theme.backgroundColor }}>
        <Header store={store} categories={[]} />
        <ProductDetail product={product} store={store} reviews={reviews} modifiers={modifiers} />
      </div>
    </>
  );
}
