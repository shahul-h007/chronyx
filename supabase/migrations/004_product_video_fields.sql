ALTER TABLE products
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_embed_url text,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS video_title text,
  ADD COLUMN IF NOT EXISTS video_description text,
  ADD COLUMN IF NOT EXISTS video_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS video_upload_date timestamptz,
  ADD COLUMN IF NOT EXISTS video_view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_transcript text,
  ADD COLUMN IF NOT EXISTS video_srt_url text;
