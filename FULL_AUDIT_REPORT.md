# E-Commerce SaaS — Full Project Audit Report

## Priority Legend
- **P0** — Must fix before any production use (security/data loss)
- **P1** — Should fix soon (functionality bugs, auth gaps)
- **P2** — Should fix before launch (quality, performance)
- **P3** — Nice to have (code quality, DX)

---

## P0 — CRITICAL (Fix Immediately)

### 1. Unauthenticated Checkout — Anyone Can Create Orders
**File:** `apps/backend/src/routes/checkout.ts`
`POST /create` has no auth. Attackers can create orders with arbitrary storeId, cartId, amounts. Payment confirmation is also unauthenticated.

### 2. Fake Payment System — No Real Payment Integration
**File:** `apps/backend/src/routes/checkout.ts:194-252`
`POST /payment-intent` generates a fake `clientSecret`. `POST /confirm-payment` marks orders as "paid" with zero verification. An attacker can call `confirm-payment` with any orderId to get free orders.

### 3. Password Hashes Leaked in API Responses
**Files:** `super-admin.ts:222-228`, `customers.ts:427-429`
- `GET /super-admin/merchants/:id` returns `owner` with the bcrypt password hash
- `GET /customers/admin` returns `...customer` including the password hash
- **Fix:** Add `.select()` field exclusions or transform responses to strip `password`

### 4. SQL Injection Risk via `sql.raw()`
**File:** `apps/backend/src/routes/orders.ts:430-453`
Date filter string injected via `sql.raw()`. While currently safe (ISO date), this pattern is dangerous. Should use parameterized queries.

### 5. XSS via Theme CSS Injection
**File:** `apps/storefront/app/layout.tsx:68-86`
Store theme values (`primaryColor`, `backgroundColor`, etc.) are interpolated directly into a `<style>` tag. A malicious store owner could inject `</style><script>alert(1)</script>`.

---

## P1 — HIGH (Fix Before Launch)

### 6. Cart Item Operations Lack Authorization
**File:** `apps/backend/src/routes/cart.ts:224-258`
`PUT /items/:itemId` and `DELETE /items/:itemId` don't verify the item belongs to the current user's cart. Any authenticated user can modify others' carts.

### 7. No Rate Limiting on Customer Auth
**File:** `apps/backend/src/routes/customers.ts:9-65`
Merchant login has 5/5min rate limit, but customer login/register has only the global 100/min. Brute force is feasible.

### 8. Cart Race Condition — Duplicate Items
**File:** `apps/backend/src/routes/cart.ts:104-221`
Add-to-cart does read-then-write without database locking or unique constraint. Concurrent requests create duplicate items.

### 9. Coupon Discount Wiped by `updateCartTotals`
**File:** `apps/backend/src/routes/cart.ts:439-455`
After adding/removing items, `updateCartTotals` recalculates `total = subtotal`, destroying any applied coupon discount.

### 10. No Transaction on Checkout + Stock Decrement
**File:** `apps/backend/src/routes/checkout.ts:126-130`
Stock is decremented in a loop without a DB transaction. If order creation succeeds but stock update fails, data is inconsistent.

### 11. Unvalidated Order Status Values
**File:** `apps/backend/src/routes/orders.ts:301-367`
`PUT /admin/:orderId/status` accepts arbitrary strings for `status`, `paymentStatus`, `fulfillmentStatus`. Should validate against allowed enum values.

### 12. Hardcoded Cookie Secret Fallback
**File:** `apps/backend/src/index.ts:98`
`process.env.COOKIE_SECRET || 'my-secret-cookie-key-change-in-production'` — if env var isn't set, sessions can be forged.

### 13. Unvalidated Body Spreads (Mass Assignment)
**Files:** `customers.ts:305-309, 343-347`, `coupons.ts:208-213, 244-249`
`...addressData` and `...couponData` spreads allow arbitrary field injection, potentially overwriting `usageCount`, `isActive`, `id`, etc.

### 14. Customer Registration Accepts Arbitrary storeId
**File:** `apps/backend/src/routes/customers.ts:9-65`
`storeId` comes from request body — users can register under any store.

### 15. Wrong Token Key in Coupons Pages
**Files:** `apps/admin/src/routes/dashboard/coupons/new/+page.svelte:47`, `coupons/[id]/edit/+page.svelte:33`
Uses `localStorage.getItem('token')` instead of `'merchant_token'` — auth will fail.

### 16. Broken Navigation Links — Missing Detail Pages
- `/dashboard/customers/[id]` — linked but no route file exists
- `/dashboard/orders/[id]` — linked but no route file exists

### 17. Missing Database Migrations
Tables defined in schema but with no migration files: `customers`, `customer_addresses`, `orders`, `order_items`, `reviews`, `coupons`, `wishlists`, `carts`, `cart_items`, `email_templates`, `activity_logs`, `store_analytics`. **These tables don't exist in the database.**

---

## P2 — MEDIUM (Fix Before Scale)

### 18. Inconsistent Auth Middleware Pattern
30+ routes repeat the same `preHandler` auth block. Extract to a shared Fastify hook.

### 19. No Server-Side Auth Guards in Admin
All admin pages use `localStorage.getItem('merchant_token')` in `onMount`. Pages briefly render before redirecting. Use SvelteKit `+layout.server.ts` with `redirect()`.

### 20. No Error Boundaries in Storefront
Zero React Error Boundaries. Any component crash = white screen. Wrap root layout and key sections.

### 21. No Loading States (loading.tsx)
No Next.js `loading.tsx` files. Users see blank pages until data resolves.

### 22. All Product Data Exposed in Search
**File:** `apps/storefront/app/search/page.tsx`
Loads ALL products then filters client-side. Exposes `purchasePrice`, `barcode`, `sku` to the client. Should use server-side search/filter.

### 23. Non-Functional UI Elements
- Storefront CartDrawer "Apply Coupon" button — calls nothing
- Storefront sort dropdowns — no `onChange` handlers
- Storefront "Cmd+K" search shortcut — displayed but not functional
- Admin dashboard "Export" button — no click handler
- Admin sidebar "System" metrics (CPU 42%, MEM 68%) — hardcoded fake values

### 24. No Pagination on Product/Category Listing
`GET /api/products` and `GET /api/categories` return ALL records. Unscalable.

### 25. Missing Database Indexes
No indexes on: `stores(status)`, `stores(is_approved)`, `customers(email + store_id)`, `orders(created_at)`, `orders(payment_status)`, `reviews(is_approved)`, `coupons(code + store_id)`, `products(title_en)`, `products(barcode)`.

### 26. Review "Helpful" Counter — No Rate Limit or Dedup
**File:** `apps/backend/src/routes/reviews.ts:90-105`
Anyone can increment `helpfulCount` infinitely with no auth or duplicate check.

### 27. Hardcoded Currency in Checkout
**File:** `apps/backend/src/routes/checkout.ts:72`
`currency: 'USD'` hardcoded with a TODO comment "Get from store settings".

### 28. Analytics Tracking is a No-Op
**File:** `apps/backend/src/routes/analytics.ts:399-410`
`POST /track` returns `{ success: true }` but records nothing. The entire analytics pipeline is broken.

### 29. N+1 Query in Orders Admin
**File:** `apps/backend/src/routes/orders.ts:152-166`
Fetches all orders, then queries customer table individually per order. Should use JOIN.

### 30. Inconsistent Plan Data Between Seed and Migration
Migration 0005 creates plans: Free($0), Starter($29), Professional($79), Enterprise($199).
Seed file creates: Starter($0), Professional($29.99), Enterprise($99.99).
These are inconsistent — running both creates duplicate plans.

### 31. Hardcoded `https://localhost` in Structured Data
**File:** `apps/storefront/components/StructuredData.tsx:62`
`@id` is `https://localhost/product/${id}` instead of the actual store domain.

### 32. All Footer Links Are `href="#"`
**File:** `apps/storefront/app/page.tsx:313-335`
"Shop All", "Categories", "Contact Us", etc. — all dead links.

### 33. Duplicate CSS Across 10+ Admin Pages
`.icon-btn`, `.status-badge`, `.modal-backdrop`, `.filters-bar`, `.spinner` are copy-pasted across product, order, customer, inventory, review, coupon pages. Extract to shared CSS or components.

### 34. Inconsistent API URL Sourcing
5 admin files define their own `API_URL` instead of importing from `$lib/api`:
- `analytics/+page.svelte`, `coupons/+page.svelte`, `coupons/new/+page.svelte`, `coupons/[id]/edit/+page.svelte`, `reviews/+page.svelte`

### 35. Svelte 4 Syntax in Coupon Pages
`coupons/new/+page.svelte` and `coupons/[id]/edit/+page.svelte` use `on:click` and `on:submit|preventDefault` (Svelte 4) while all other files use Svelte 5 runes syntax.

### 36. ThemeProvider Double-Fetches Store Data
**File:** `apps/storefront/components/ThemeProvider.tsx:58-63`
Client-side re-fetches store theme even though it was already passed from the server layout.

### 37. Missing Per-Page SEO Metadata
Only `product/[id]/page.tsx` and root layout export `generateMetadata`. All other 10+ routes lack metadata.

---

## P3 — LOW (Nice to Have)

### 38. Pervasive `any` Type Usage
Nearly every backend route and storefront component uses `any`. No TypeScript interfaces for API responses.

### 39. Duplicated Currency Formatting Logic
Same `currencySymbol` resolution block repeated in 6+ storefront files. Extract to utility.

### 40. Duplicated "Store Not Found" UI
Identical error UI copy-pasted across 5+ server pages. Extract to shared component.

### 41. Duplicated Footer HTML
Same footer structure across 5+ storefront pages. Extract to `<Footer>` component.

### 42. No 404 Page
No catch-all route in admin or storefront for invalid URLs.

### 43. `alert()` and `confirm()` Used for Feedback
Admin category edit, inventory, and reviews pages use native `alert()`/`confirm()` instead of styled modals.

### 44. Missing Keyboard Handlers
Clickable `<tr>` rows in orders/customers tables have no `onkeydown` or `tabindex`. Modal backdrops don't handle Escape key.

### 45. Missing ARIA Labels
Interactive elements throughout admin and storefront lack `aria-label`, `role`, or `aria-modal` attributes.

### 46. No Soft Delete Support
No `deletedAt`/`isDeleted` columns on any table. Deleting is permanent with cascading removal.

### 47. Comma-Separated Fields in Schema
`products.images`, `products.tags`, `coupons.productIds`, `coupons.categoryIds`, `reviews.images` — all use comma-separated text instead of JSON arrays. This violates first normal form and makes querying individual values impossible.

### 48. No Password Reset / Forgot Password
No endpoint exists for merchants or customers to reset passwords.

### 49. No Email Verification
Customer `isVerified` is set to `false` but never checked or toggled.

### 50. No Webhook/Notification for Order Status
When order status changes, no email/push notification is sent to the customer.

### 51. Tax Calculation is a Placeholder
Flat 8% for US, 0% elsewhere. Real tax rates vary by state/locality.

### 52. No File Deletion Endpoint
Uploads go to `public/uploads/` but there's no API to delete them. Orphaned files accumulate.

### 53. Missing Foreign Key on `orders.couponId`
Schema defines `couponId` as UUID but no `.references(() => coupons.id)`.

### 54. `stores.ownerEmail` Unique Constraint Missing
A single email can create unlimited stores. Should be `unique` or composite unique on `(domain)`.