import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getStoreByDomain } from '@/lib/store';
import { Header } from '@/components/Header';
import { ProductDetail } from '@/components/ProductDetail';

async function getProduct(storeId: string, productId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${API_URL}/api/store/${storeId}/products/${productId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const headersList = await headers();
  const domain = headersList.get('x-store-domain') || 'localhost';
  const { id } = await params;

  const store = await getStoreByDomain(domain);

  if (!store) {
    return notFound();
  }

  const product = await getProduct(store.id, id);

  if (!product) {
    return notFound();
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: store.theme.backgroundColor }}>
      <Header store={store} categories={[]} />
      <ProductDetail product={product} store={store} />
    </div>
  );
}
