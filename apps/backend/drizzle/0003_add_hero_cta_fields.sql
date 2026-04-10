-- Add hero CTA fields to stores table
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT 'Explore Collection',
    ADD COLUMN IF NOT EXISTS hero_cta_link TEXT DEFAULT '#products';
