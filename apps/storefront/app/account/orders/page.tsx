'use client';

import { useCustomerAuth } from '@/lib/customer-auth';
import { useStore } from '@/components/ThemeProvider';
import { useState, useEffect } from 'react';
import { Package, ChevronRight, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Use relative URL for client-side (proxied via Next.js rewrites)
const API_URL = '';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    total: string;
    product: {
      id: string;
      titleEn: string;
      images?: string;
    };
  }>;
}

export default function AccountOrdersPage() {
  const { customer } = useCustomerAuth();
  const store = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Package className="w-5 h-5 opacity-60" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-400 bg-green-400/10';
      case 'shipped':
        return 'text-blue-400 bg-blue-400/10';
      case 'processing':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const currencySymbol = store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : store?.currency === 'GBP' ? '£' : store?.currency || '$';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
        <p className="opacity-60 mb-6">Start shopping to see your orders here</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-sm opacity-60 hover:opacity-100 flex items-center gap-1"
          >
            ← Back to Orders
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-60">Order #{selectedOrder.orderNumber}</p>
                <p className="text-sm opacity-60">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {selectedOrder.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
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
                      <Package className="w-8 h-8 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product.titleEn}</p>
                  <p className="text-sm opacity-60">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium mt-1">
                    {currencySymbol}{item.total}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-[var(--border)] bg-white/5">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>
                {currencySymbol}{selectedOrder.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="rounded-2xl border border-[var(--border)] p-4 cursor-pointer hover:border-[var(--primary)]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-sm opacity-60">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="font-semibold">
                  {currencySymbol}{order.total}
                </span>
                <ChevronRight className="w-5 h-5 opacity-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
