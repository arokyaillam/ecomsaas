'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
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

  // Support both old and new props
  const storeCurrency = currency || store?.currency || 'USD';
  const imageUrl = product.images?.split(',')[0];
  const hasDiscount = Number(product.discount) > 0;
  const isOutOfStock = product.currentQuantity <= 0;
  const isLowStock = product.currentQuantity > 0 && product.currentQuantity <= 5;

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num?.toFixed(2) || '0.00';
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brutalist Frame */}
      <div className="relative border-4 border-[var(--text-primary)] bg-[var(--bg-secondary)] transition-all duration-300 hover:translate-y-[-8px] hover:shadow-[8px_8px_0_var(--text-primary)]">
        {/* Image Container */}
        <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[var(--bg-tertiary)]">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.titleEn}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-6xl font-bold text-[var(--text-muted)] opacity-30">
                ?
              </span>
            </div>
          )}

          {/* Gradient Overlay on Hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-60' : 'opacity-0'}`} />

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-4 left-4 bg-[var(--accent)] text-[var(--bg-primary)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider">
              -{product.discount}{product.discountType === 'Percent' ? '%' : ` ${storeCurrency}`}
            </div>
          )}

          {/* Stock Status Badge */}
          {isOutOfStock && (
            <div className="absolute top-4 right-4 bg-[var(--text-muted)] text-[var(--text-primary)] px-3 py-1 font-mono text-xs font-bold uppercase">
              SOLD OUT
            </div>
          )}
          {isLowStock && (
            <div className="absolute top-4 right-4 bg-[var(--accent)] text-[var(--bg-primary)] px-3 py-1 font-mono text-xs font-bold uppercase">
              LOW STOCK
            </div>
          )}

          {/* Quick Add Button */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <button
              className="w-full btn-brutalist text-sm py-3"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.preventDefault();
                // Quick add functionality
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>
          </div>
        </Link>

        {/* Content */}
        <div className="p-5 border-t-4 border-[var(--text-primary)]">
          {/* Category Tag */}
          {product.categoryName && (
            <span className="text-caption text-[var(--accent)] mb-2 block">
              {product.categoryName}
            </span>
          )}

          {/* Title */}
          <Link href={`/product/${product.id}`}>
            <h3 className="font-mono text-lg font-bold text-[var(--text-primary)] leading-tight mb-2 line-clamp-2 hover:text-[var(--accent)] transition-colors">
              {product.titleEn}
            </h3>
          </Link>

          {/* Arabic Title */}
          {product.titleAr && (
            <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-1" dir="rtl">
              {product.titleAr}
            </p>
          )}

          {/* Price Section */}
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {storeCurrency} {formatPrice(product.salePrice)}
            </span>
            {hasDiscount && (
              <span className="font-mono text-sm text-[var(--text-muted)] line-through">
                {storeCurrency} {formatPrice(product.regularPrice || product.salePrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
