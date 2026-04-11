'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/lib/customer-auth';
import { ReviewForm } from '@/components/ReviewForm';
import { ShoppingBag, Heart, Star, Check, Minus, Plus, ThumbsUp } from 'lucide-react';

interface ProductDetailProps {
  product: any;
  store: any;
  reviews: any[];
  modifiers: any[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function ProductDetail({ product, store, reviews, modifiers }: ProductDetailProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [productReviews, setProductReviews] = useState(reviews);
  const [markingHelpful, setMarkingHelpful] = useState<string | null>(null);

  // Check if product is in wishlist
  useEffect(() => {
    if (isAuthenticated && product.id) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, product.id]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/wishlist/check/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsInWishlist(data.data.isInWishlist);
        setWishlistId(data.data.wishlistId);
      }
    } catch (err) {
      console.error('Failed to check wishlist status:', err);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your wishlist');
      return;
    }

    setTogglingWishlist(true);
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsInWishlist(data.data.isInWishlist);
        if (data.data.id) {
          setWishlistId(data.data.id);
        } else {
          setWishlistId(null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setTogglingWishlist(false);
    }
  };

  const images = product.images ? product.images.split(',') : [];
  const currencySymbol = store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : store?.currency === 'GBP' ? '£' : store?.currency || '$';

  const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + Number(mod.priceAdjustment || mod.price || 0), 0);
  const totalPrice = Number(product.salePrice || product.regularPrice) + modifierTotal;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity, selectedModifiers.map(m => ({
        groupId: m.groupId || m.modifierGroupId || m.id,
        groupName: m.groupName || m.nameEn || m.name || '',
        optionId: m.optionId || m.id,
        optionName: m.optionName || m.nameEn || m.name || '',
        priceAdjustment: Number(m.priceAdjustment || m.price || 0),
      })));
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleModifier = (modifier: any) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === modifier.id);
      if (exists) {
        return prev.filter(m => m.id !== modifier.id);
      }
      return [...prev, modifier];
    });
  };

  const averageRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : 0;

  const handleReviewSubmitted = (newReview: any) => {
    setProductReviews([newReview, ...productReviews]);
    setShowReviewForm(false);
  };

  const markHelpful = async (reviewId: string) => {
    setMarkingHelpful(reviewId);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });

      if (res.ok) {
        setProductReviews(productReviews.map(r =>
          r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
        ));
      }
    } catch (err) {
      console.error('Failed to mark helpful:', err);
    } finally {
      setMarkingHelpful(null);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm opacity-60 mb-6">
          <Link href="/" className="hover:opacity-100">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:opacity-100">Products</Link>
          <span>/</span>
          <span className="truncate max-w-xs">{product.titleEn}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
              {images.length > 0 ? (
                <Image
                  src={images[activeImage]}
                  alt={product.titleEn}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 opacity-30" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      activeImage === idx ? 'border-[var(--primary)]' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.titleEn} - ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.titleEn}</h1>
              {product.titleAr && (
                <p className="text-lg opacity-60" dir="rtl">{product.titleAr}</p>
              )}

              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'opacity-30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm opacity-60">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                {currencySymbol}{product.salePrice || product.regularPrice}
              </span>
              {product.salePrice && product.regularPrice && product.salePrice !== product.regularPrice && (
                <span className="text-xl opacity-50 line-through">
                  {currencySymbol}{product.regularPrice}
                </span>
              )}
              {modifierTotal > 0 && (
                <span className="text-sm opacity-60">
                  + {currencySymbol}{modifierTotal} modifiers
                </span>
              )}
            </div>

            {product.descriptionEn && (
              <p className="opacity-80 leading-relaxed">{product.descriptionEn}</p>
            )}

            {modifiers.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Options & Add-ons</h3>
                <div className="flex flex-wrap gap-2">
                  {modifiers.map((modifier) => (
                    <button
                      key={modifier.id}
                      onClick={() => toggleModifier(modifier)}
                      className={`px-4 py-2 rounded-lg border transition-all text-sm ${
                        selectedModifiers.find(m => m.id === modifier.id)
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <span>{modifier.name}</span>
                      {modifier.price > 0 && (
                        <span className="ml-2 text-xs opacity-60">+{currencySymbol}{modifier.price}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm opacity-60">
                  {product.currentQuantity} available
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.currentQuantity === 0}
                  className="flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {addingToCart ? 'Adding...' : product.currentQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={toggleWishlist}
                  disabled={togglingWishlist}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isInWishlist
                      ? 'border-red-400 text-red-400 bg-red-400/10'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {product.currentQuantity > 0 ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">In Stock</span>
                </>
              ) : (
                <span className="text-red-400">Out of Stock</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                Write a Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <ReviewForm
              productId={product.id}
              onSubmit={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          {productReviews.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {productReviews.map((review) => (
                <div key={review.id} className="p-6 rounded-2xl border border-[var(--border)] bg-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                      <span className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>
                        {review.customer?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {review.customer?.name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'opacity-30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <h4 className="font-medium mb-2">{review.title}</h4>
                  <p className="opacity-80 text-sm mb-3">{review.content}</p>
                  {review.images && review.images.split(',').length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.split(',').map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review image ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    {review.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <Check className="w-3 h-3" />
                        <span>Verified Purchase</span>
                      </div>
                    )}
                    <button
                      onClick={() => markHelpful(review.id)}
                      disabled={markingHelpful === review.id}
                      className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <ThumbsUp className={`w-3 h-3 ${markingHelpful === review.id ? 'animate-pulse' : ''}`} />
                      <span>Helpful ({review.helpfulCount || 0})</span>
                    </button>
                  </div>
                  {review.response && (
                    <div className="mt-3 p-3 rounded-lg bg-white/5 border-l-2 border-[var(--primary)]">
                      <p className="text-xs font-medium mb-1">Store Response</p>
                      <p className="text-sm opacity-80">{review.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
