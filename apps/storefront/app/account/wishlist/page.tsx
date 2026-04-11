'use client';

import { useState, useEffect } from 'react';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useCart } from '@/lib/cart';
import { useStore } from '@/components/ThemeProvider';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface WishlistItem {
  id: string;
  notes: string;
  addedAt: string;
  product: {
    id: string;
    titleEn: string;
    titleAr?: string;
    images?: string;
    salePrice: string;
    currentQuantity: number;
    isPublished: boolean;
  };
}

export default function WishlistPage() {
  const { customer } = useCustomerAuth();
  const { addToCart } = useCart();
  const store = useStore();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const res = await fetch(`${API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setWishlist(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      const token = localStorage.getItem('customer_token');
      await fetch(`${API_URL}/api/wishlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const handleAddToCart = async (productId: string, wishlistId: string) => {
    setAddingToCart(productId);
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(wishlistId);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(null);
    }
  };

  const currencySymbol = store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : store?.currency === 'GBP' ? '£' : store?.currency || '$';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
        <p className="opacity-60 mb-6">Save items you love for later</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Wishlist</h2>
          <p className="text-sm opacity-60">{wishlist.length} items</p>
        </div>
      </div>

      <div className="grid gap-4">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors"
          >
            {/* Product Image */}
            <Link href={`/product/${item.product.id}`} className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              {item.product.images ? (
                <Image
                  src={item.product.images.split(',')[0]}
                  alt={item.product.titleEn}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 opacity-30" />
                </div>
              )}
            </Link>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.product.id}`}>
                <h3 className="font-medium truncate">{item.product.titleEn}</h3>
              </Link>
              <p className="text-lg font-semibold mt-1" style={{ color: 'var(--primary)' }}>
                {currencySymbol}{item.product.salePrice}
              </p>
              {!item.product.isPublished && (
                <p className="text-xs text-red-400 mt-1">Currently unavailable</p>
              )}
              {item.notes && (
                <p className="text-sm opacity-60 mt-1 line-clamp-2">{item.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAddToCart(item.product.id, item.id)}
                disabled={!item.product.isPublished || item.product.currentQuantity === 0 || addingToCart === item.product.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                <ShoppingBag className="w-4 h-4" />
                {addingToCart === item.product.id ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
