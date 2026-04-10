-- Add new columns to modifier_groups
ALTER TABLE modifier_groups
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_selections INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_selections INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create modifier_options table
CREATE TABLE IF NOT EXISTS modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  price_adjustment DECIMAL DEFAULT '0',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON modifier_options(modifier_group_id);
CREATE INDEX IF NOT EXISTS idx_modifier_options_store ON modifier_options(store_id);
CREATE INDEX IF NOT EXISTS idx_modifier_groups_product ON modifier_groups(product_id);
