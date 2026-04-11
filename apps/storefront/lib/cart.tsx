'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  total: string;
  modifiers?: any[];
  product: {
    id: string;
    titleEn: string;
    titleAr?: string;
    images?: string;
    salePrice: string;
    currentQuantity: number;
    isPublished: boolean;
  };
}

interface Cart {
  id: string;
  storeId: string;
  customerId?: string;
  sessionId?: string;
  couponCode?: string;
  couponDiscount: string;
  subtotal: string;
  total: string;
  itemCount: number;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, modifiers?: any[]) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storeId }: { children: React.ReactNode; storeId: string }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cart?storeId=${storeId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchCart();
    }
  }, [storeId, fetchCart]);

  const addToCart = useCallback(async (productId: string, quantity: number, modifiers?: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ storeId, productId, quantity, modifiers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add to cart');
      }

      await fetchCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeId, fetchCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      await fetchCart();
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await fetchCart();
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const applyCoupon = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/cart/coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ storeId, couponCode: code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid coupon');
      }

      await fetchCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeId, fetchCart]);

  const removeCoupon = useCallback(async () => {
    // Implement coupon removal logic
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/cart?storeId=${storeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await fetchCart();
    } finally {
      setLoading(false);
    }
  }, [storeId, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
