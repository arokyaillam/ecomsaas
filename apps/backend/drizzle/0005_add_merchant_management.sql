-- Add merchant management system tables

-- Super Admins table
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Merchant Plans table
CREATE TABLE IF NOT EXISTS merchant_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    interval TEXT DEFAULT 'month',
    features JSONB,
    max_products INTEGER DEFAULT 100,
    max_storage INTEGER DEFAULT 1024,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add merchant management columns to stores
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES super_admins(id),
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES merchant_plans(id),
    ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS owner_email TEXT,
    ADD COLUMN IF NOT EXISTS owner_name TEXT,
    ADD COLUMN IF NOT EXISTS owner_phone TEXT,
    ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_revenue DECIMAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_customers INTEGER DEFAULT 0;

-- Update existing stores to have owner_email from users
UPDATE stores
SET owner_email = (
    SELECT email FROM users
    WHERE users.store_id = stores.id
    AND users.role = 'OWNER'
    LIMIT 1
)
WHERE owner_email IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_is_approved ON stores(is_approved);
CREATE INDEX IF NOT EXISTS idx_stores_plan_id ON stores(plan_id);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at);

-- Insert default super admin (password: superadmin123)
INSERT INTO super_admins (email, password, name, is_active)
VALUES (
    'superadmin@ecomsaas.com',
    '$2b$10$YourHashedPasswordHere',
    'Super Admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Insert default merchant plans
INSERT INTO merchant_plans (name, description, price, currency, interval, features, max_products, max_storage, is_active)
VALUES
    (
        'Free',
        'Perfect for getting started',
        0, 'USD', 'month',
        '["Up to 25 products", "Basic analytics", "Community support"]',
        25, 100, TRUE
    ),
    (
        'Starter',
        'For small businesses',
        29, 'USD', 'month',
        '["Up to 100 products", "Advanced analytics", "Priority support", "Custom domain"]',
        100, 1024, TRUE
    ),
    (
        'Professional',
        'For growing businesses',
        79, 'USD', 'month',
        '["Up to 500 products", "Premium analytics", "24/7 support", "Custom domain", "API access"]',
        500, 5120, TRUE
    ),
    (
        'Enterprise',
        'For large scale operations',
        199, 'USD', 'month',
        '["Unlimited products", "Enterprise analytics", "Dedicated support", "Custom integrations"]',
        999999, 102400, TRUE
    )
ON CONFLICT DO NOTHING;
