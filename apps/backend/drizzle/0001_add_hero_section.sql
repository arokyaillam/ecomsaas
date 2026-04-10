-- Add hero section fields to stores table
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "hero_image" text;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "hero_title" text DEFAULT 'Welcome to Our Store';
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "hero_subtitle" text DEFAULT 'Discover amazing products at great prices';
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "hero_enabled" boolean DEFAULT true;
