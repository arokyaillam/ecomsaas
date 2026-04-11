-- Add indexes on storeId columns for multi-tenant query performance
-- These indexes are critical for filtering by store in a multi-tenant SaaS

-- Products table
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON products(is_published);

-- Categories table
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Subcategories table
CREATE INDEX IF NOT EXISTS idx_subcategories_store_id ON subcategories(store_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Modifier groups table
CREATE INDEX IF NOT EXISTS idx_modifier_groups_store_id ON modifier_groups(store_id);
CREATE INDEX IF NOT EXISTS idx_modifier_groups_product_id ON modifier_groups(product_id);

-- Modifier options table
CREATE INDEX IF NOT EXISTS idx_modifier_options_store_id ON modifier_options(store_id);
CREATE INDEX IF NOT EXISTS idx_modifier_options_group_id ON modifier_options(modifier_group_id);

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

-- Stores table
CREATE INDEX IF NOT EXISTS idx_stores_domain ON stores(domain);

-- Customers table
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);

-- Orders table
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Coupons table
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);

-- Carts table
CREATE INDEX IF NOT EXISTS idx_carts_store_id ON carts(store_id);
CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

-- Cart items table
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
