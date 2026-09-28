ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;
