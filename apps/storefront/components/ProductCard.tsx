'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowUpRight, Check } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: any;
  theme?: any;
  currency?: string;
  store?: any;
}

export function ProductCard({ product, theme, currency, store }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'adding' | 'added'>('idle');

  const storeCurrency = currency || store?.currency || 'USD';
  const imageUrl = product.images?.split(',')[0];
  const hasDiscount = Number(product.discount) > 0;
  const isOutOfStock = product.currentQuantity <= 0;
  const isLowStock = product.currentQuantity > 0 && product.currentQuantity <= 5;

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    setAddState('adding');
    setTimeout(() => {
      setAddState('added');
      setTimeout(() => setAddState('idle'), 1500);
    }, 800);
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative border-[3px] border-[var(--text-primary)] bg-[var(--bg-secondary)] transition-all duration-300 hover:translate-y-[-6px] hover:shadow-[8px_8px_0_var(--text-primary)]">
        <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[var(--bg-tertiary)]">
          {!imageLoaded && !imageError && imageUrl && (
            <div className="absolute inset-0 skeleton" />
          )}

          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.titleEn}
              fill
              className={`object-cover transition-all duration-700 ${
                isHovered ? 'scale-105' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-6xl font-bold text-[var(--text-muted)] opacity-30">?</span>
            </div>
          )}

          <div className={`absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent transition-opacity duration-500 ${
            isHovered ? 'opacity-80' : 'opacity-0'
          }`} />

          {hasDiscount && (
            <div className="absolute top-4 left-4 bg-[var(--accent)] text-[var(--bg-primary)] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider shadow-lg">
              -{product.discount}{product.discountType === 'Percent' ? '%' : ` ${storeCurrency}`}
            </div>
          )}

          {isOutOfStock ? (
            <div className="absolute top-4 right-4 bg-[var(--text-muted)] text-[var(--text-primary)] px-3 py-1.5 font-mono text-xs font-bold uppercase">
              Sold Out
            </div>
          ) : isLowStock ? (
            <div className="absolute top-4 right-4 bg-[var(--accent)] text-[var(--bg-primary)] px-3 py-1.5 font-mono text-xs font-bold uppercase animate-pulse">
              Only {product.currentQuantity} Left
            </div>
          ) : null}

          <div className={`absolute inset-0 flex flex-col justify-end p-4 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              className="w-full btn-brutalist text-sm py-3.5 flex items-center justify-center gap-2"
              disabled={isOutOfStock || addState !== 'idle'}
              onClick={handleAddToCart}
            >
              {addState === 'adding' && <span className="animate-pulse">Adding...</span>}
              {addState === 'added' && (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added!</span>
                </>
              )}
              {addState === 'idle' && (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          </div>

          <div className={`absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-primary)]/90 backdrop-blur-sm text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider border border-[var(--text-primary)]">
              View Details
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <div className="p-5 border-t-[3px] border-[var(--text-primary)]">
          {product.categoryName && (
            <span className="text-caption text-[var(--accent)] mb-2 block tracking-widest">
              {product.categoryName}
            </span>
          )}

          <Link href={`/product/${product.id}`}>
            <h3 className="font-mono text-base font-bold text-[var(--text-primary)] leading-snug mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-[var(--accent)]">
              {product.titleEn}
            </h3>
          </Link>

          {product.titleAr && (
            <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-1 opacity-80" dir="rtl">
              {product.titleAr}
            </p>
          )}

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-mono text-xl font-bold text-[var(--text-primary)]">
              {storeCurrency} {formatPrice(hasDiscount ? discountedPrice : product.salePrice)}
            </span>
            {hasDiscount && (
              <span className="font-mono text-sm text-[var(--text-muted)] line-through">
                {storeCurrency} {formatPrice(product.salePrice)}
              </span>
            )}
          </div>

          {product.rating && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex text-[var(--accent)]">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'opacity-100' : 'opacity-30'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
