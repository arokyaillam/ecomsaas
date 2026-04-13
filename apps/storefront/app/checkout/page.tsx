'use client';

import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useStore } from '@/components/ThemeProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  ChevronLeft,
  Lock,
  MapPin,
  Check,
  Package,
  Shield,
  ArrowRight
} from 'lucide-react';

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
      fetchCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--cream)' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <ShoppingBag className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
        </div>
        <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--charcoal)' }}>
          Your cart is empty
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Add some items to proceed to checkout
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--coral)', color: 'white' }}
        >
          Browse Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--cream)' }}>
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: '#10b981' }}
        >
          <Check className="w-12 h-12 text-white" />
        </div>
        <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--charcoal)' }}>
          Order Confirmed!
        </h1>
        <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
          Thank you for your purchase
        </p>
        {orderNumber && (
          <p className="text-sm mb-8 font-mono" style={{ color: 'var(--text-muted)' }}>
            Order #{orderNumber}
          </p>
        )}
        <div className="flex gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--coral)', color: 'white' }}
          >
            Continue Shopping
          </Link>
          {isAuthenticated && (
            <Link
              href="/account/orders"
              className="px-6 py-3 rounded-xl font-medium transition-all border"
              style={{ borderColor: 'var(--border)', color: 'var(--charcoal)' }}
            >
              View Orders
            </Link>
          )}
        </div>
      </div>
    );
  }

  const currency = store?.currency || 'USD';
  const shippingCost = shippingMethod === 'express' ? 12.99 : 5.99;
  const totalWithShipping = Number(cart.total) + shippingCost;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-40" style={{
        borderColor: 'var(--border)',
        backgroundColor: 'rgba(250, 248, 245, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl" style={{ color: 'var(--charcoal)' }}>
            {store?.name || 'Store'}
          </Link>
          <div className="flex items-center gap-2">
            {['shipping', 'payment', 'review'].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s ? 'text-white' :
                    ['shipping', 'payment'].indexOf(step) > ['shipping', 'payment'].indexOf(s)
                      ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: step === s ? 'var(--coral)' :
                      ['shipping', 'payment'].indexOf(step) > ['shipping', 'payment'].indexOf(s)
                        ? 'var(--charcoal)' : 'var(--bg-tertiary)',
                    color: ['shipping', 'payment'].indexOf(step) >= ['shipping', 'payment'].indexOf(s) ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {['shipping', 'payment'].indexOf(step) > ['shipping', 'payment'].indexOf(s) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className="hidden sm:block ml-2 text-sm font-medium"
                  style={{
                    color: step === s ? 'var(--charcoal)' : 'var(--text-muted)'
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {idx < 2 && (
                  <div
                    className="w-8 h-px mx-2 hidden sm:block"
                    style={{ backgroundColor: 'var(--border)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-3">
            {step === 'shipping' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <Truck className="w-5 h-5" style={{ color: 'var(--coral)' }} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl" style={{ color: 'var(--charcoal)' }}>
                      Shipping Information
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Enter your delivery details
                    </p>
                  </div>
                </div>

                {/* Saved Addresses */}
                {isAuthenticated && addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--charcoal)' }}>
                      Use Saved Address
                    </label>
                    <div className="grid gap-3">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedAddress === addr.id
                              ? 'border-[var(--coral)]'
                              : 'border-transparent hover:border-[var(--border)]'
                          }`}
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium" style={{ color: 'var(--charcoal)' }}>
                              {addr.name}
                            </span>
                            {addr.isDefault && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: 'var(--coral-10)',
                                  color: 'var(--coral)'
                                }}
                              >
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {addr.addressLine1}, {addr.city}, {addr.country}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleShippingSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                        First Name
                      </label>
                      <input
                        required
                        value={shippingForm.firstName}
                        onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--charcoal)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                        Last Name
                      </label>
                      <input
                        required
                        value={shippingForm.lastName}
                        onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--charcoal)'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--charcoal)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--charcoal)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                      Address
                    </label>
                    <input
                      required
                      value={shippingForm.addressLine1}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                      placeholder="Street address"
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--charcoal)'
                      }}
                    />
                    <input
                      value={shippingForm.addressLine2}
                      onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full mt-3 px-4 py-3 rounded-xl focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--charcoal)'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                        City
                      </label>
                      <input
                        required
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--charcoal)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                        Postal Code
                      </label>
                      <input
                        required
                        value={shippingForm.postalCode}
                        onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--charcoal)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                        State/Province
                      </label>
                      <input
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--charcoal)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--charcoal)' }}>
                        Country
                      </label>
                      <select
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors appearance-none cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--charcoal)'
                        }}
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
                    <label className="block text-sm font-medium mb-4" style={{ color: 'var(--charcoal)' }}>
                      Shipping Method
                    </label>
                    <div className="space-y-3">
                      {[
                        { id: 'standard', label: 'Standard Shipping', time: '5-7 business days', price: 5.99 },
                        { id: 'express', label: 'Express Shipping', time: '2-3 business days', price: 12.99 },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setShippingMethod(method.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            shippingMethod === method.id
                              ? 'border-[var(--coral)]'
                              : 'border-transparent hover:border-[var(--border)]'
                          }`}
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                shippingMethod === method.id
                                  ? 'border-[var(--coral)]'
                                  : 'border-[var(--border)]'
                              }`}
                            >
                              {shippingMethod === method.id && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: 'var(--coral)' }}
                                />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium" style={{ color: 'var(--charcoal)' }}>
                                {method.label}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                {method.time}
                              </p>
                            </div>
                          </div>
                          <span className="font-medium" style={{ color: 'var(--charcoal)' }}>
                            {currency}{method.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 mt-8"
                    style={{ backgroundColor: 'var(--coral)', color: 'white' }}
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <CreditCard className="w-5 h-5" style={{ color: 'var(--coral)' }} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl" style={{ color: 'var(--charcoal)' }}>
                      Payment Method
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Select your preferred payment option
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'cod', label: 'Cash on Delivery', icon: Package },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-[var(--coral)]'
                          : 'border-transparent hover:border-[var(--border)]'
                      }`}
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          paymentMethod === method.id
                            ? 'border-[var(--coral)]'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: 'var(--coral)' }}
                          />
                        )}
                      </div>
                      <method.icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      <span className="font-medium" style={{ color: 'var(--charcoal)' }}>
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div
                    className="p-6 rounded-xl space-y-4"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-4 h-4" style={{ color: '#10b981' }} />
                      <span className="text-sm font-medium" style={{ color: '#10b981' }}>
                        Secure SSL Encryption
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      This is a demo store. No actual payment will be processed.
                      Click "Place Order" to complete your purchase.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    className="p-4 rounded-xl text-sm"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444'
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep('shipping')}
                    className="px-6 py-3.5 rounded-xl font-medium border-2 transition-all hover:bg-[var(--bg-secondary)]"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--charcoal)'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--coral)', color: 'white' }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-6 sticky top-24"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              <h3 className="font-display text-lg mb-6" style={{ color: 'var(--charcoal)' }}>
                Order Summary
              </h3>

              {/* Cart Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div
                      className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
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
                          <ShoppingBag className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--charcoal)' }}
                      >
                        {item.product.titleEn}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
                      {currency}{Number(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 py-6 border-t border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>{currency}{Number(cart.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Shipping</span>
                  <span>{currency}{shippingCost.toFixed(2)}</span>
                </div>
                {Number(cart.couponDiscount) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: 'var(--coral)' }}>
                    <span>Discount</span>
                    <span>-{currency}{Number(cart.couponDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-3">
                  <span style={{ color: 'var(--charcoal)' }}>Total</span>
                  <span style={{ color: 'var(--coral)' }}>
                    {currency}{totalWithShipping.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Package className="w-3.5 h-3.5" />
                  <span>Insured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
