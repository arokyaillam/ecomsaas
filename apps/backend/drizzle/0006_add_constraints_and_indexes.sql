-- Add unique constraint on customers(email, store_id) to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_store_unique ON customers(email, store_id);

-- Add foreign key on orders.coupon_id referencing coupons.id
ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon_id FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

-- Add updated_at column to store_analytics
ALTER TABLE store_analytics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Add indexes for frequently queried columns that are missing
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_is_approved ON stores(is_approved);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);