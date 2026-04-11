'use client';

import { useCart } from '@/lib/cart';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateQuantity, removeItem, loading } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

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
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-[var(--bg-primary)] z-50 flex flex-col border-l-4 border-[var(--text-primary)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-[var(--text-primary)]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="font-mono text-xl font-bold uppercase tracking-wider">Your Cart</h2>
            {cart && cart.itemCount > 0 && (
              <span className="bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-mono font-bold px-3 py-1">
                {cart.itemCount} ITEMS
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 border-2 border-[var(--border)] hover:border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 border-4 border-[var(--border)] flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <p className="font-mono text-xl font-bold mb-2 uppercase">Cart Empty</p>
              <p className="text-[var(--text-secondary)] mb-8">Add some items to get started</p>
              <button
                onClick={handleClose}
                className="btn-brutalist"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border-2 border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-primary)] transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 border-2 border-[var(--border)] bg-[var(--bg-tertiary)] flex-shrink-0 overflow-hidden">
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
                        <ShoppingBag className="w-8 h-8 text-[var(--text-muted)]" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-bold text-[var(--text-primary)] truncate mb-1">
                      {item.product?.titleEn}
                    </h3>
                    <p className="font-mono text-lg text-[var(--accent)] mb-2">
                      {currencySymbol}{item.price}
                    </p>

                    {/* Modifiers */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.modifiers.map((mod: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-mono"
                          >
                            {mod.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-[var(--border)]">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          disabled={loading}
                          className="p-2 hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-mono font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                          className="p-2 hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={loading}
                        className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
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
          <div className="border-t-4 border-[var(--text-primary)] p-6 space-y-6">
            {/* Coupon Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="COUPON CODE"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-[var(--text-primary)] font-mono text-sm uppercase placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                className="px-6 py-3 bg-[var(--bg-tertiary)] border-2 border-[var(--border)] font-mono text-sm uppercase hover:border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-3 font-mono">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>SUBTOTAL</span>
                <span>{currencySymbol}{cart.subtotal}</span>
              </div>
              {Number(cart.couponDiscount) > 0 && (
                <div className="flex justify-between text-[var(--accent)]">
                  <span>DISCOUNT</span>
                  <span>-{currencySymbol}{cart.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-[var(--text-primary)] pt-3 border-t-2 border-[var(--border)]">
                <span>TOTAL</span>
                <span className="text-[var(--accent)]">{currencySymbol}{cart.total}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={handleClose}
              className="btn-brutalist w-full text-center"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={handleClose}
              className="btn-ghost w-full text-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
