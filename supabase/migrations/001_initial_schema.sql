-- ============================================================
-- CHRONYX: Create Missing Tables + Apply RLS
-- ============================================================
-- Run this FIRST, then run rls_policies.sql
-- ============================================================

-- 1. SUBSCRIBERS (newsletter signups from popup + auth page)
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  source text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now()
);

-- 2. COUPONS (discount codes managed from admin)
CREATE TABLE IF NOT EXISTS coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_percent integer DEFAULT 10,
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT null,
  times_used integer DEFAULT 0,
  expires_at timestamptz DEFAULT null,
  created_at timestamptz DEFAULT now()
);

-- 3. WAITLIST (product drop waitlist)
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  product_id text DEFAULT null,
  created_at timestamptz DEFAULT now()
);

-- 4. SETTINGS (store config, hero text, policies)
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- 5. ORDERS (if not already created)
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  items jsonb DEFAULT '[]'::jsonb,
  total integer DEFAULT 0,
  status text DEFAULT 'pending',
  shipping_address jsonb DEFAULT '{}'::jsonb,
  payment_method text DEFAULT 'cod',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Now apply Row-Level Security on ALL tables
-- ============================================================

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- PRODUCT_IMAGES
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (true);

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SETTINGS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SUBSCRIBERS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert subscribers"
  ON subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read subscribers"
  ON subscribers FOR SELECT
  TO authenticated
  USING (true);

-- COUPONS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (true);

-- WAITLIST
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read waitlist"
  ON waitlist FOR SELECT
  TO authenticated
  USING (true);

-- ────────────────────────────────────────────────────────────
-- 8. CONTACT_MESSAGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can send a contact message
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read messages (admin panel)
CREATE POLICY "Authenticated users can read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update messages (mark as read)
CREATE POLICY "Authenticated users can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- DONE! All tables created and secured.
-- ============================================================
