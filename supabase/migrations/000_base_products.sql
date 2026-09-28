-- ============================================================
-- 000_base_products.sql
-- Base schema for products and product_images tables
-- Note: Additional columns are added in migrations 003, 004, and 015
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  category text,
  tags text[],
  stock_quantity integer DEFAULT 0 NOT NULL,
  is_live boolean DEFAULT false NOT NULL,
  is_limited_drop boolean DEFAULT false NOT NULL,
  drop_date timestamp with time zone,
  compare_price integer,
  wood_type text,
  diameter integer,
  images text[] DEFAULT '{}'::text[],
  is_limited boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_hero boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  url text,
  position integer DEFAULT 0
);
