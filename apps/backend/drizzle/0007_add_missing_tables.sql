-- Migration 0007: Add missing tables for customers, orders, coupons, wishlists, carts, reviews, email_templates, activity_logs, store_analytics
-- Tables defined in schema.ts that were missing from migrations

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false,
	"marketing_emails" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text,
	"country" text NOT NULL,
	"postal_code" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Unique constraint on customers(email, store_id) to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_store_unique" ON "customers"("email", "store_id");
--> statement-breakpoint

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"fulfillment_status" text DEFAULT 'unfulfilled' NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"currency" text NOT NULL,
	"subtotal" numeric NOT NULL,
	"tax" numeric DEFAULT '0',
	"shipping" numeric DEFAULT '0',
	"discount" numeric DEFAULT '0',
	"total" numeric NOT NULL,
	"billing_name" text,
	"billing_first_name" text,
	"billing_last_name" text,
	"billing_address_line_1" text,
	"billing_address_line_2" text,
	"billing_city" text,
	"billing_state" text,
	"billing_country" text,
	"billing_postal_code" text,
	"shipping_name" text,
	"shipping_first_name" text,
	"shipping_last_name" text,
	"shipping_address_line_1" text,
	"shipping_address_line_2" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_country" text,
	"shipping_postal_code" text,
	"payment_method" text,
	"payment_intent_id" text,
	"shipping_method" text,
	"shipping_carrier" text,
	"tracking_number" text,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"coupon_code" text,
	"coupon_id" uuid,
	"notes" text,
	"admin_notes" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid,
	"product_title" text NOT NULL,
	"product_image" text,
	"variant_name" text,
	"quantity" integer NOT NULL,
	"price" numeric NOT NULL,
	"total" numeric NOT NULL,
	"modifiers" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" numeric NOT NULL,
	"min_order_amount" numeric,
	"max_discount_amount" numeric,
	"free_shipping" boolean DEFAULT false,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"usage_limit_per_customer" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"applies_to" text DEFAULT 'all',
	"product_ids" text,
	"category_ids" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"images" text,
	"is_verified" boolean DEFAULT false,
	"is_approved" boolean DEFAULT true,
	"helpful_count" integer DEFAULT 0,
	"response" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- WISHLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- CARTS
-- ============================================
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_id" text NOT NULL,
	"coupon_code" text,
	"coupon_discount" numeric DEFAULT '0',
	"subtotal" numeric DEFAULT '0',
	"total" numeric DEFAULT '0',
	"item_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL DEFAULT 1,
	"price" numeric NOT NULL,
	"total" numeric NOT NULL,
	"modifiers" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Unique constraint to prevent duplicate cart items for same product
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cart_product_unique" ON "cart_items"("cart_id", "product_id");
--> statement-breakpoint

-- ============================================
-- EMAIL TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid,
	"customer_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"metadata" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- STORE ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS "store_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"visitors" integer DEFAULT 0,
	"page_views" integer DEFAULT 0,
	"orders" integer DEFAULT 0,
	"revenue" numeric DEFAULT '0',
	"average_order_value" numeric DEFAULT '0',
	"conversion_rate" numeric DEFAULT '0',
	"products_viewed" integer DEFAULT 0,
	"add_to_carts" integer DEFAULT 0,
	"checkouts_started" integer DEFAULT 0,
	"checkouts_completed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================
-- UNIQUE CONSTRAINTS ON EXISTING TABLES
-- ============================================

-- Add unique constraint on stores.owner_email
-- NOTE: Before applying this migration, verify that no duplicate owner_email values exist:
--   SELECT owner_email, COUNT(*) FROM stores GROUP BY owner_email HAVING COUNT(*) > 1;
-- If duplicates exist, they must be resolved first or this migration will fail.
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_email_unique" UNIQUE("owner_email");
--> statement-breakpoint

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- Customers FKs
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Customer Addresses FKs
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Orders FKs
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Order Items FKs
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Coupons FKs
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Reviews FKs
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Wishlists FKs
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Carts FKs
ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Cart Items FKs
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Email Templates FKs
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Activity Logs FKs
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Store Analytics FKs
ALTER TABLE "store_analytics" ADD CONSTRAINT "store_analytics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_customers_store_id" ON "customers"("store_id");
CREATE INDEX IF NOT EXISTS "idx_customers_email" ON "customers"("email");
CREATE INDEX IF NOT EXISTS "idx_customer_addresses_customer_id" ON "customer_addresses"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_store_id" ON "orders"("store_id");
CREATE INDEX IF NOT EXISTS "idx_orders_customer_id" ON "orders"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_orders_payment_status" ON "orders"("payment_status");
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders"("created_at");
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS "idx_coupons_store_id" ON "coupons"("store_id");
CREATE INDEX IF NOT EXISTS "idx_coupons_code" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "idx_reviews_store_id" ON "reviews"("store_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_product_id" ON "reviews"("product_id");
CREATE INDEX IF NOT EXISTS "idx_wishlists_customer_id" ON "wishlists"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_wishlists_product_id" ON "wishlists"("product_id");
CREATE INDEX IF NOT EXISTS "idx_carts_customer_id" ON "carts"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_carts_session_id" ON "carts"("session_id");
CREATE INDEX IF NOT EXISTS "idx_cart_items_cart_id" ON "cart_items"("cart_id");
CREATE INDEX IF NOT EXISTS "idx_email_templates_store_id" ON "email_templates"("store_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_store_id" ON "activity_logs"("store_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON "activity_logs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_store_analytics_store_id" ON "store_analytics"("store_id");
CREATE INDEX IF NOT EXISTS "idx_store_analytics_date" ON "store_analytics"("date");
