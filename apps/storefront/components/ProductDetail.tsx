'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ModifierOption {
  id: string;
  nameEn: string;
  nameAr?: string;
  priceAdjustment: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

interface Product {
  id: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  images?: string;
  salePrice: string;
  discount: string;
  discountType: string;
  currentQuantity: number;
  modifierGroups?: ModifierGroup[];
}

interface Store {
  id: string;
  name: string;
  currency: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    textSecondaryColor: string;
    borderColor: string;
    borderRadius: string;
  };
}

interface ProductDetailProps {
  product: Product;
  store: Store;
}

export function ProductDetail({ product, store }: ProductDetailProps) {
  // Filter out base64 images (backwards compatibility - old products may have them)
  const hasBase64Image = product.images?.includes('data:');
  const images = hasBase64Image
    ? []
    : product.images?.split(',').filter((url: string) => url && url.trim() !== '') || [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const theme = store.theme;
  const hasDiscount = Number(product.discount) > 0;

  // Calculate total price with modifiers
  const calculateTotal = () => {
    let total = Number(product.salePrice);

    // Add modifier prices
    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = product.modifierGroups?.find(g => g.id === groupId);
      optionIds.forEach(optionId => {
        const option = group?.options.find(o => o.id === optionId);
        if (option) {
          total += Number(option.priceAdjustment);
        }
      });
    });

    return total * quantity;
  };

  const toggleModifier = (groupId: string, optionId: string, maxSelections: number) => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || [];
      const exists = current.includes(optionId);

      if (exists) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      } else {
        // Check max selections
        if (current.length >= maxSelections) {
          // Remove first selected and add new (FIFO)
          return { ...prev, [groupId]: [...current.slice(1), optionId] };
        }
        return { ...prev, [groupId]: [...current, optionId] };
      }
    });
  };

  const isModifierSelected = (groupId: string, optionId: string) => {
    return selectedModifiers[groupId]?.includes(optionId) || false;
  };

  const canAddToCart = () => {
    // Check required modifiers are selected
    if (product.modifierGroups) {
      for (const group of product.modifierGroups) {
        if (group.isRequired) {
          const selected = selectedModifiers[group.id] || [];
          if (selected.length < group.minSelections) {
            return false;
          }
        }
      }
    }
    return product.currentQuantity > 0;
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/products"
            className="text-sm inline-flex items-center gap-2"
            style={{ color: theme.textSecondaryColor }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Products
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative aspect-square rounded-2xl overflow-hidden"
              style={{ backgroundColor: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
            >
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.titleEn}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
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
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className="relative w-20 h-20 rounded-lg overflow-hidden transition-all"
                    style={{
                      backgroundColor: theme.surfaceColor,
                      border: `2px solid ${selectedImage === idx ? theme.primaryColor : theme.borderColor}`,
                    }}
                  >
                    <Image
                      src={img}
                      alt={`${product.titleEn} ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2" style={{ color: theme.textColor }}>
                {product.titleEn}
              </h1>
              {product.titleAr && (
                <p className="text-lg" style={{ color: theme.textSecondaryColor }} dir="rtl">
                  {product.titleAr}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="font-display text-4xl font-bold" style={{ color: theme.primaryColor }}>
                {store.currency} {calculateTotal().toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl line-through" style={{ color: theme.textSecondaryColor }}>
                  {store.currency} {product.salePrice}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {product.currentQuantity <= 0 ? (
              <div
                className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
              >
                Out of Stock
              </div>
            ) : product.currentQuantity <= 5 ? (
              <div
                className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: theme.accentColor }}
              >
                Only {product.currentQuantity} left in stock
              </div>
            ) : null}

            {/* Description */}
            {product.descriptionEn && (
              <div className="py-4 border-t" style={{ borderColor: theme.borderColor }}>
                <p style={{ color: theme.textSecondaryColor, lineHeight: 1.7 }}>
                  {product.descriptionEn}
                </p>
              </div>
            )}

            {/* Modifier Groups */}
            {product.modifierGroups && product.modifierGroups.length > 0 && (
              <div className="space-y-6 py-4 border-t" style={{ borderColor: theme.borderColor }}>
                {product.modifierGroups.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold" style={{ color: theme.textColor }}>
                        {group.name}
                      </h3>
                      {group.isRequired && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: theme.accentColor }}
                        >
                          Required
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const selected = isModifierSelected(group.id, option.id);
                        const priceAdj = Number(option.priceAdjustment);

                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleModifier(group.id, option.id, group.maxSelections)}
                            disabled={!option.isAvailable}
                            className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              backgroundColor: selected ? theme.primaryColor : theme.surfaceColor,
                              border: `2px solid ${selected ? theme.primaryColor : theme.borderColor}`,
                              color: selected ? '#fff' : theme.textColor,
                              opacity: option.isAvailable ? 1 : 0.5,
                            }}
                          >
                            {option.nameEn}
                            {priceAdj !== 0 && (
                              <span className="ml-1 text-xs opacity-80">
                                {priceAdj > 0 ? `+${priceAdj}` : priceAdj}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selection hint */}
                    <p className="text-xs mt-2" style={{ color: theme.textSecondaryColor }}>
                      Select {group.minSelections === group.maxSelections
                        ? `${group.minSelections}`
                        : `${group.minSelections}-${group.maxSelections}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="pt-4 border-t space-y-4" style={{ borderColor: theme.borderColor }}>
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium" style={{ color: theme.textSecondaryColor }}>
                  Quantity
                </span>
                <div
                  className="flex items-center rounded-lg overflow-hidden"
                  style={{ backgroundColor: theme.surfaceColor, border: `1px solid ${theme.borderColor}` }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:opacity-70 transition-opacity"
                    style={{ color: theme.textColor }}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center" style={{ color: theme.textColor }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.currentQuantity, quantity + 1))}
                    className="px-4 py-2 hover:opacity-70 transition-opacity"
                    style={{ color: theme.textColor }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                disabled={!canAddToCart()}
                className="w-full py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canAddToCart() ? theme.primaryColor : theme.surfaceColor,
                  color: canAddToCart() ? '#fff' : theme.textSecondaryColor,
                }}
              >
                {product.currentQuantity <= 0
                  ? 'Out of Stock'
                  : `Add to Cart - ${store.currency} ${calculateTotal().toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
