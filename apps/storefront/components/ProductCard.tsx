'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: any;
  theme: any;
  currency: string;
}

export function ProductCard({ product, theme, currency }: ProductCardProps) {
  // Handle base64 images - if images contains data: URL, ignore it (backwards compatibility)
  const hasBase64Image = product.images?.includes('data:');
  const imageUrl = hasBase64Image ? null : product.images?.split(',')[0];
  const hasDiscount = product.discount > 0;

  return (
    <div
      className="group relative card-editorial rounded-2xl overflow-hidden"
      style={{
        backgroundColor: theme.surfaceColor,
        border: `1px solid ${theme.borderColor}`,
      }}
    >
      {/* Image Container */}
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.titleEn}
            fill
            className="object-cover image-editorial"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.textSecondaryColor}
              strokeWidth="1"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white animate-fade-in"
            style={{ backgroundColor: theme.accentColor }}
          >
            -{product.discount}{product.discountType === 'Percent' ? '%' : ` ${currency}`}
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div
          className="absolute inset-x-4 bottom-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 flex gap-2"
        >
          <button
            className="flex-1 py-3 text-sm font-medium text-white rounded-xl shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: `${theme.primaryColor}ee` }}
          >
            Quick View
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Category Tag */}
        {product.categoryName && (
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: theme.textSecondaryColor }}
          >
            {product.categoryName}
          </p>
        )}

        {/* Title */}
        <Link href={`/product/${product.id}`}>
          <h3
            className="font-display text-xl leading-tight mb-2 line-reveal line-clamp-2"
            style={{ color: theme.textColor }}
          >
            {product.titleEn}
          </h3>
        </Link>

        {/* Arabic Title */}
        {product.titleAr && (
          <p
            className="text-sm mb-3 line-clamp-1"
            style={{ color: theme.textSecondaryColor }}
            dir="rtl"
          >
            {product.titleAr}
          </p>
        )}

        {/* Price Section */}
        <div className="flex items-baseline gap-3 mt-3">
          <span
            className="font-display text-2xl font-semibold"
            style={{ color: theme.primaryColor }}
          >
            {currency} {product.salePrice}
          </span>
          {hasDiscount && product.price !== product.salePrice && (
            <span
              className="text-sm line-through"
              style={{ color: theme.textSecondaryColor }}
            >
              {currency} {product.price}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.currentQuantity <= 0 ? (
          <p className="mt-3 text-xs font-medium" style={{ color: theme.textSecondaryColor }}>
            Out of Stock
          </p>
        ) : product.currentQuantity <= 5 ? (
          <p className="mt-3 text-xs font-medium" style={{ color: theme.accentColor }}>
            Only {product.currentQuantity} left
          </p>
        ) : null}
      </div>
    </div>
  );
}
