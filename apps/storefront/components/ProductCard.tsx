'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart';

interface ProductCardProps {
  product: any;
  currency?: string;
}

export function ProductCard({ product, currency = 'USD' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'adding' | 'added'>('idle');
  const cart = useCart();

  const imageUrl = product.images?.split(',')[0];
  const hasDiscount = Number(product.discount) > 0;
  const isOutOfStock = product.currentQuantity <= 0;

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num?.toFixed(2) || '0.00';
  };

  const originalPrice = Number(product.salePrice);
  const discountedPrice = hasDiscount
    ? product.discountType === 'Percent'
      ? originalPrice * (1 - Number(product.discount) / 100)
      : originalPrice - Number(product.discount)
    : originalPrice;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || !cart) return;

    setAddState('adding');
    try {
      await cart.addToCart(product.id, 1);
      setAddState('added');
      setTimeout(() => setAddState('idle'), 1500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setAddState('idle');
    }
  };

  const displayPrice = hasDiscount ? discountedPrice : originalPrice;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          {/* Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <span className="badge badge-accent">
                -{product.discount}{product.discountType === 'Percent' ? '%' : ''}
              </span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute top-3 left-3 z-10">
              <span className="badge">Out of Stock</span>
            </div>
          )}

          {/* Image */}
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.titleEn}
              fill
              className={`object-cover transition-transform duration-500 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="text-4xl" style={{ color: 'var(--border)' }}>?</span>
            </div>
          )}

          {/* Quick Add Button */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={addState !== 'idle'}
              className="quick-add absolute bottom-3 left-3 right-3 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-white text-[var(--text-primary)] shadow-md hover:shadow-lg transition-all"
            >
              {addState === 'idle' && (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Quick Add
                </>
              )}
              {addState === 'adding' && <span>Adding...</span>}
              {addState === 'added' && (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Added!
                </>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.categoryName && (
            <span className="text-small mb-1 block" style={{ color: 'var(--text-muted)' }}>
              {product.categoryName}
            </span>
          )}

          <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
            {product.titleEn}
          </h3>

          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currency} {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                {currency} {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
