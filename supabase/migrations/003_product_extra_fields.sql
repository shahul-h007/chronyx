-- Add the new design-specific fields to the products table
ALTER TABLE "public"."products" 
ADD COLUMN IF NOT EXISTS "tagline" text,
ADD COLUMN IF NOT EXISTS "size" text,
ADD COLUMN IF NOT EXISTS "finish" text,
ADD COLUMN IF NOT EXISTS "material" text,
ADD COLUMN IF NOT EXISTS "movement_type" text,
ADD COLUMN IF NOT EXISTS "summary" text,
ADD COLUMN IF NOT EXISTS "story" text,
ADD COLUMN IF NOT EXISTS "care_instructions" text[],
ADD COLUMN IF NOT EXISTS "features" text[],
ADD COLUMN IF NOT EXISTS "stock" integer DEFAULT 10;
