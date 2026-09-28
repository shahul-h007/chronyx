-- CHRONYX Journal / Blog table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  content text NOT NULL,
  cover_image text DEFAULT '',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  published_at timestamptz DEFAULT null,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published blog posts" ON blog_posts;
CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON blog_posts;
CREATE POLICY "Authenticated users can manage blog posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
