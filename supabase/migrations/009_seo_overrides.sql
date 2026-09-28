CREATE TABLE IF NOT EXISTS seo_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seo_overrides ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read SEO Overrides" ON seo_overrides FOR SELECT USING (true);
CREATE POLICY "Admin All SEO Overrides" ON seo_overrides FOR ALL USING (auth.role() = 'authenticated');
