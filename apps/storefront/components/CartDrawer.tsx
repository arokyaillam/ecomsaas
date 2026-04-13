'use client';

import { useCart } from '@/lib/cart';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateQuantity, removeItem, applyCoupon, loading } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const currency = cart?.currency || 'USD';

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 400);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !applyCoupon) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItem(itemId);
    await new Promise(resolve => setTimeout(resolve, 300));
    await removeItem(itemId);
    setRemovingItem(null);
  };

  const itemCount = cart?.items?.length || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(26, 26, 26, 0.4)' }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--cream)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: 'var(--coral)' }} />
            </div>
            <div>
              <h2 className="font-display text-xl" style={{ color: 'var(--charcoal)' }}>
                Your Cart
              </h2>
              {itemCount > 0 && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-tertiary)]"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <Package className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 className="font-display text-xl mb-2" style={{ color: 'var(--charcoal)' }}>
                Your cart is empty
              </h3>
              <p className="mb-8 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                Discover our curated collection and add something special
              </p>
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--coral)', color: 'white' }}
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-4 p-4 rounded-xl transition-all duration-300 ${
                    removingItem === item.id ? 'opacity-0 translate-x-4' : 'opacity-100'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {/* Product Image */}
                  <div
                    className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    {item.product?.images ? (
                      <Image
                        src={item.product.images.split(',')[0]}
                        alt={item.product.titleEn}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium truncate mb-1"
                      style={{ color: 'var(--charcoal)' }}
                    >
                      {item.product?.titleEn}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--coral)' }}>
                      {currency} {Number(item.price).toFixed(2)}
                    </p>

                    {/* Modifiers */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.modifiers.map((mod: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {mod.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center rounded-lg overflow-hidden"
                        style={{ border: '1px solid var(--border)' }}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[var(--bg-tertiary)]"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className="w-10 text-center text-sm font-medium"
                          style={{ color: 'var(--charcoal)' }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[var(--bg-tertiary)]"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t p-6 space-y-4" style={{ borderColor: 'var(--border)' }}>
            {/* Coupon Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  disabled={couponLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--charcoal)'
                  }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--charcoal)',
                    color: 'white'
                  }}
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="text-xs" style={{ color: '#ef4444' }}>{couponError}</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 py-4 border-t border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>{currency} {Number(cart.subtotal).toFixed(2)}</span>
              </div>
              {Number(cart.couponDiscount) > 0 && (
                <div className="flex justify-between text-sm" style={{ color: 'var(--coral)' }}>
                  <span>Discount</span>
                  <span>-{currency} {Number(cart.couponDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2">
                <span style={{ color: 'var(--charcoal)' }}>Total</span>
                <span style={{ color: 'var(--coral)' }}>
                  {currency} {Number(cart.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Buttons */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--coral)', color: 'white' }}
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-medium text-sm transition-all hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Continue Shopping
              </button>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secure checkout</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
