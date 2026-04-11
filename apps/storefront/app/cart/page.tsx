'use client';

import { useCart } from '@/lib/cart';
import { useStore } from '@/components/ThemeProvider';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, loading } = useCart();
  const store = useStore();

  const currencySymbol = store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : store?.currency === 'GBP' ? '£' : store?.currency || '$';

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-6 opacity-30" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-lg opacity-60 mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-2xl border border-[var(--border)] bg-white/5"
              >
                {/* Product Image */}
                <Link
                  href={`/product/${item.product.id}`}
                  className="relative w-28 h-28 rounded-xl overflow-hidden bg-white/5 flex-shrink-0"
                >
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
                    <h3 className="font-semibold text-lg truncate hover:opacity-80">
                      {item.product.titleEn}
                    </h3>
                  </Link>
                  <p className="text-lg mt-1" style={{ color: 'var(--primary)' }}>
                    {currencySymbol}{item.price}
                  </p>

                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.modifiers.map((mod: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded bg-white/10"
                        >
                          {mod.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        disabled={loading}
                        className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading}
                        className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {currencySymbol}{item.total}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-[var(--border)] p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-60">Subtotal ({cart.itemCount} items)</span>
                  <span>{currencySymbol}{cart.subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span className="opacity-60">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                {Number(cart.couponDiscount) > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-{currencySymbol}{cart.couponDiscount}</span>
                  </div>
                )}

                <div className="border-t border-[var(--border)] pt-3 mt-3">
                  <div className="flex justify-between text-xl font-semibold">
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>
                      {currencySymbol}{cart.total}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full mt-6 py-4 rounded-xl font-semibold text-center transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full mt-3 py-3 rounded-xl font-medium text-center border border-[var(--border)] hover:bg-white/5 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
