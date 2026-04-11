'use client';

import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useStore } from '@/components/ThemeProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Truck, CreditCard, ChevronLeft, Lock, MapPin } from 'lucide-react';

// Use relative URL for client-side (proxied via Next.js rewrites)
const API_URL = '';

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { customer, isAuthenticated, addresses } = useCustomerAuth();
  const store = useStore();
  const router = useRouter();

  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'US',
    postalCode: '',
  });

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Pre-fill form with customer data
  useEffect(() => {
    if (customer) {
      setShippingForm((prev) => ({
        ...prev,
        firstName: customer.firstName || prev.firstName,
        lastName: customer.lastName || prev.lastName,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
      }));
    }
  }, [customer]);

  // Pre-fill with saved address
  useEffect(() => {
    if (addresses.length > 0 && selectedAddress) {
      const addr = addresses.find((a) => a.id === selectedAddress);
      if (addr) {
        setShippingForm({
          firstName: addr.firstName,
          lastName: addr.lastName,
          email: shippingForm.email,
          phone: addr.phone || shippingForm.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 || '',
          city: addr.city,
          state: addr.state || '',
          country: addr.country,
          postalCode: addr.postalCode,
        });
      }
    }
  }, [selectedAddress, addresses]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          storeId: store?.id,
          cartId: cart?.id,
          shippingAddress: {
            name: `${shippingForm.firstName} ${shippingForm.lastName}`,
            firstName: shippingForm.firstName,
            lastName: shippingForm.lastName,
            addressLine1: shippingForm.addressLine1,
            addressLine2: shippingForm.addressLine2,
            city: shippingForm.city,
            state: shippingForm.state,
            country: shippingForm.country,
            postalCode: shippingForm.postalCode,
            phone: shippingForm.phone,
          },
          billingAddress: {
            name: `${shippingForm.firstName} ${shippingForm.lastName}`,
            firstName: shippingForm.firstName,
            lastName: shippingForm.lastName,
            addressLine1: shippingForm.addressLine1,
            addressLine2: shippingForm.addressLine2,
            city: shippingForm.city,
            state: shippingForm.state,
            country: shippingForm.country,
            postalCode: shippingForm.postalCode,
            phone: shippingForm.phone,
          },
          paymentMethod,
          shippingMethod,
          email: shippingForm.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderId(data.data.orderId);
      setOrderNumber(data.data.orderNumber);
      setOrderComplete(true);
      fetchCart(); // Clear cart
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="opacity-60 mb-6">Add some items to proceed to checkout</p>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--primary)' }}>
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Placed!</h1>
        <p className="opacity-60 mb-2">Thank you for your purchase</p>
        {orderId && (
          <p className="text-sm opacity-40 mb-6">Order #{orderId.slice(0, 8)}</p>
        )}
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const currencySymbol = store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : store?.currency === 'GBP' ? '£' : store?.currency || '$';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
            {store?.name || 'Store'}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className={step === 'shipping' ? 'font-medium' : 'opacity-60'}>Shipping</span>
            <span className="opacity-30">→</span>
            <span className={step === 'payment' ? 'font-medium' : 'opacity-60'}>Payment</span>
            <span className="opacity-30">→</span>
            <span className={step === 'review' ? 'font-medium' : 'opacity-60'}>Review</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div>
            {step === 'shipping' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <Truck className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-xl font-semibold">Shipping Information</h2>
                </div>

                {/* Saved Addresses */}
                {isAuthenticated && addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Use Saved Address</label>
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedAddress === addr.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{addr.name}</span>
                            {addr.isDefault && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[var(--primary)]/20" style={{ color: 'var(--primary)' }}>
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm opacity-60 mt-1">
                            {addr.addressLine1}, {addr.city}, {addr.country}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">First Name</label>
                      <input
                        required
                        value={shippingForm.firstName}
                        onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Last Name</label>
                      <input
                        required
                        value={shippingForm.lastName}
                        onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Address</label>
                    <input
                      required
                      value={shippingForm.addressLine1}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                      placeholder="Street address"
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                    />
                    <input
                      value={shippingForm.addressLine2}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full mt-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">City</label>
                      <input
                        required
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Postal Code</label>
                      <input
                        required
                        value={shippingForm.postalCode}
                        onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">State/Province</label>
                      <input
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Country</label>
                      <select
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white/5 focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IN">India</option>
                        <option value="JP">Japan</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div className="pt-4">
                    <label className="block text-sm font-medium mb-3">Shipping Method</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShippingMethod('standard')}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                          shippingMethod === 'standard'
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div className="text-left">
                            <p className="font-medium">Standard Shipping</p>
                            <p className="text-sm opacity-60">5-7 business days</p>
                          </div>
                        </div>
                        <span className="font-medium">{currencySymbol}5.99</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingMethod('express')}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                          shippingMethod === 'express'
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div className="text-left">
                            <p className="font-medium">Express Shipping</p>
                            <p className="text-sm opacity-60">2-3 business days</p>
                          </div>
                        </div>
                        <span className="font-medium">{currencySymbol}12.99</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 mt-6"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Credit/Debit Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Cash on Delivery</span>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-lg border border-[var(--border)] bg-white/5 space-y-4">
                    <p className="text-sm opacity-60">This is a demo. No actual payment will be processed.</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Secure SSL Encryption</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep('shipping')}
                    className="px-6 py-3 rounded-xl font-medium border border-[var(--border)] hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="rounded-2xl border border-[var(--border)] p-6 space-y-6">
              <h3 className="text-lg font-semibold">Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
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
                          <ShoppingBag className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.titleEn}</p>
                      <p className="text-xs opacity-60">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {currencySymbol}{item.total}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[var(--border)] pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-60">Subtotal</span>
                  <span>{currencySymbol}{cart.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Shipping</span>
                  <span>{currencySymbol}{shippingMethod === 'express' ? '12.99' : '5.99'}</span>
                </div>
                {Number(cart.couponDiscount) > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-{currencySymbol}{cart.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-[var(--border)]">
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>
                    {currencySymbol}{cart.total}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs opacity-60">
                <Lock className="w-3 h-3" />
                <span>Secure checkout with SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
