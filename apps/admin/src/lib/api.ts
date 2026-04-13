// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const STOREFRONT_BASE_URL = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  storeName: string;
  domain: string;
}

export interface AuthResponse {
  token: string;
  storeId: string;
}
