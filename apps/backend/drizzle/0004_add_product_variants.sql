-- Add product variants support and category-level modifiers

-- Product Variants table (e.g., Size, Color)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Product Variant Options table (e.g., Small, Medium, Large)
CREATE TABLE IF NOT EXISTS product_variant_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    price_adjustment DECIMAL DEFAULT 0,
    sku TEXT,
    stock_quantity INTEGER,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Product Variant Combinations table (for inventory tracking)
CREATE TABLE IF NOT EXISTS product_variant_combinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    combination_key TEXT NOT NULL,
    price_adjustment DECIMAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_store ON product_variants(store_id);
CREATE INDEX idx_variant_options_variant ON product_variant_options(variant_id);
CREATE INDEX idx_variant_options_store ON product_variant_options(store_id);
CREATE INDEX idx_variant_combinations_product ON product_variant_combinations(product_id);
CREATE INDEX idx_variant_combinations_store ON product_variant_combinations(store_id);
CREATE INDEX idx_variant_combinations_sku ON product_variant_combinations(sku);

-- Modify modifier_groups to support category-level modifiers
ALTER TABLE modifier_groups
    ALTER COLUMN product_id DROP NOT NULL,
    ADD COLUMN category_id UUID REFERENCES categories(id),
    ADD COLUMN apply_to TEXT DEFAULT 'product' NOT NULL,
    ADD COLUMN name_ar TEXT;

-- Add check constraint to ensure either product_id or category_id is set based on apply_to
CREATE OR REPLACE FUNCTION check_modifier_group_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.apply_to = 'product' AND NEW.product_id IS NULL THEN
        RAISE EXCEPTION 'product_id is required when apply_to is product';
    END IF;
    IF NEW.apply_to = 'category' AND NEW.category_id IS NULL THEN
        RAISE EXCEPTION 'category_id is required when apply_to is category';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modifier_group_reference_check
    BEFORE INSERT OR UPDATE ON modifier_groups
    FOR EACH ROW
    EXECUTE FUNCTION check_modifier_group_reference();

-- Add indexes for modifier_groups
CREATE INDEX idx_modifier_groups_category ON modifier_groups(category_id);
CREATE INDEX idx_modifier_groups_apply_to ON modifier_groups(apply_to);
