'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Use relative URL for client-side (proxied via Next.js rewrites)
const API_URL = '';

// Extract store domain from hostname (e.g., "arokyastore.localhost" -> "arokyastore")
function extractStoreDomain(hostname: string): string {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];

  // Extract subdomain part (before the first dot)
  if (hostWithoutPort.includes('.')) {
    const parts = hostWithoutPort.split('.');
    // If first part is "www", skip it
    if (parts[0] === 'www' && parts.length > 2) {
      return parts[1];
    } else if (parts.length >= 2) {
      // Take the first part as the store domain
      return parts[0];
    }
  }

  return hostWithoutPort;
}

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

interface Address {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  addresses: Address[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  addAddress: (data: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children, storeId }: { children: React.ReactNode; storeId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('customer_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('customer_token', token);
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/customers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.data);
        setAddresses(data.data.addresses || []);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/customers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-domain': extractStoreDomain(window.location.hostname),
        },
        body: JSON.stringify({ storeId, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.data.token);
      setCustomer(data.data.customer);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-domain': extractStoreDomain(window.location.hostname),
        },
        body: JSON.stringify({ ...data, storeId }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }

      setToken(responseData.data.token);
      setCustomer(responseData.data.customer);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
    setAddresses([]);
    localStorage.removeItem('customer_token');
  }, []);

  const updateProfile = useCallback(async (data: Partial<Customer>) => {
    if (!token) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/api/customers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const addAddress = useCallback(async (data: Omit<Address, 'id'>) => {
    if (!token) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/api/customers/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const updateAddress = useCallback(async (id: string, data: Partial<Address>) => {
    if (!token) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/api/customers/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const deleteAddress = useCallback(async (id: string) => {
    if (!token) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/api/customers/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        addresses,
        loading,
        error,
        isAuthenticated: !!customer,
        login,
        register,
        logout,
        fetchProfile,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
