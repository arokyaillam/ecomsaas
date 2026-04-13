// Storefront TypeScript Types

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  domain: string;
  currency: string;
  language: string;
  theme: StoreTheme;
  hero?: {
    image?: string | null;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    enabled?: boolean;
  };
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  borderRadius: string;
  fontFamily: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

// Product Types
export interface Product {
  id: string;
  storeId: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  titleEn: string;
  titleAr?: string | null;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  purchasePrice?: string | null;
  salePrice: string;
  basePrice: string;
  currentQuantity: number;
  minStockLevel: number;
  images?: string | null;
  isPublished: boolean;
  discount?: string | null;
  discountType?: 'Percent' | 'Fixed' | null;
  rating?: number | null;
  reviewCount?: number | null;
  categoryName?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductWithModifiers extends Product {
  modifierGroups?: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: string;
  isAvailable: boolean;
  sortOrder: number;
}

// Category Types
export interface Category {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

// Cart Types
export interface CartItemModifier {
  groupId?: string;
  groupName?: string;
  optionId?: string;
  optionName?: string;
  priceAdjustment?: number;
}

export interface CartItemProduct {
  id: string;
  titleEn: string;
  titleAr?: string | null;
  images?: string | null;
  salePrice: string;
  currentQuantity: number;
  isPublished: boolean;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: string;
  total: string;
  modifiers?: CartItemModifier[];
  product: CartItemProduct;
}

export interface Cart {
  id: string;
  storeId: string;
  customerId?: string | null;
  sessionId?: string | null;
  couponCode?: string | null;
  couponDiscount: string;
  subtotal: string;
  total: string;
  itemCount: number;
  items: CartItem[];
  currency?: string;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  storeId?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface CustomerAddress {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode: string;
  phone?: string | null;
  isDefault: boolean;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerId?: string | null;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  total: string;
  currency: string;
  shippingAddress: CustomerAddress;
  billingAddress: CustomerAddress;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  price: string;
  total: string;
  modifiers?: CartItemModifier[];
  image?: string | null;
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName?: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
}

// Coupon Types
export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: string;
  minOrderAmount?: string | null;
  maxDiscountAmount?: string | null;
  usageLimit?: number | null;
  usageCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
}

// Pagination Types
export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Search Types
export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  minRating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
}
