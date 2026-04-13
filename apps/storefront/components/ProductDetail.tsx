'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/lib/customer-auth';
import { ReviewForm } from '@/components/ReviewForm';
import { ShoppingBag, Heart, Star, Check, Minus, Plus, ThumbsUp, ChevronRight, Truck, Shield } from 'lucide-react';

interface ProductDetailProps {
  product: any;
  store: any;
  reviews: any[];
  modifiers: any[];
}

const API_URL = '';

export function ProductDetail({ product, store, reviews, modifiers }: ProductDetailProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [productReviews, setProductReviews] = useState(reviews);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const images = product.images ? product.images.split(',') : [];
  const currency = store?.currency || 'USD';

  const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + Number(mod.priceAdjustment || mod.price || 0), 0);
  const basePrice = Number(product.salePrice || product.regularPrice);
  const totalPrice = basePrice + modifierTotal;

  const hasDiscount = product.salePrice && product.regularPrice && product.salePrice !== product.regularPrice;

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
      }
    } catch (err) {
      console.error('Failed to check wishlist:', err);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) return;
      const res = await fetch(`${API_URL}/api/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsInWishlist(data.data.isInWishlist);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

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

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:text-[var(--text-primary)]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/products" className="hover:text-[var(--text-primary)]">Products</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{product.titleEn}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[var(--bg-tertiary)]">
              {images.length > 0 ? (
                <Image
                  src={images[activeImage]}
                  alt={product.titleEn}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl" style={{ color: 'var(--border)' }}>?</span>
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-4 left-4">
                  <span className="badge badge-accent">Sale</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImage === idx ? 'border-[var(--accent)]' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <h1 className="font-display text-3xl lg:text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>
                  {product.titleEn}
                </h1>
                {product.titleAr && (
                  <p className="text-lg" dir="rtl" style={{ color: 'var(--text-secondary)' }}>{product.titleAr}</p>
                )}

                {productReviews.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--border)]'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {averageRating.toFixed(1)} ({productReviews.length} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {currency} {totalPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xl line-through" style={{ color: 'var(--text-muted)' }}>
                    {currency} {product.regularPrice}
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.descriptionEn && (
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {product.descriptionEn.slice(0, 200)}{product.descriptionEn.length > 200 && '...'}
                </p>
              )}

              {/* Modifiers */}
              {modifiers.length > 0 && (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Options</h3>
                  <div className="flex flex-wrap gap-2">
                    {modifiers.map((modifier) => (
                      <button
                        key={modifier.id}
                        onClick={() => toggleModifier(modifier)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          selectedModifiers.find(m => m.id === modifier.id)
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                            : 'border-[var(--border)] hover:border-[var(--text-primary)]'
                        }`}
                      >
                        <span>{modifier.name}</span>
                        {modifier.price > 0 && (
                          <span className="ml-2 opacity-70">+{currency}{modifier.price}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Quantity</span>
                  <div className="flex items-center border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {product.currentQuantity} available
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.currentQuantity === 0}
                    className="flex-1 btn-primary py-4"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {addingToCart ? 'Adding...' : product.currentQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className={`p-4 rounded-lg border transition-all ${
                      isInWishlist
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border)] hover:border-[var(--text-primary)]'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Truck className="w-4 h-4" />
                  <span>Free shipping over $50</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16 pt-16 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-8 border-b mb-8" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-4 font-medium transition-colors ${activeTab === 'description' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 font-medium transition-colors ${activeTab === 'reviews' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              Reviews ({productReviews.length})
            </button>
          </div>

          {activeTab === 'description' && (
            <div className="max-w-3xl">
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {product.descriptionEn || 'No description available.'}
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>Customer Reviews</h2>
                {isAuthenticated && (
                  <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn-primary">
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <ReviewForm productId={product.id} onSubmit={handleReviewSubmitted} onCancel={() => setShowReviewForm(false)} />
                </div>
              )}

              {productReviews.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {productReviews.map((review) => (
                    <div key={review.id} className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <span className="font-medium text-sm" style={{ color: 'var(--accent)' }}>
                            {review.customer?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{review.customer?.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--border)]'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{review.title}</h4>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{review.content}</p>
                      {review.isVerified && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'green' }}>
                          <Check className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
