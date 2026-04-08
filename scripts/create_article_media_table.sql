-- Create table for article media (images and videos)
CREATE TABLE IF NOT EXISTS article_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_article_media_article_id ON article_media(article_id);
CREATE INDEX IF NOT EXISTS idx_article_media_sort_order ON article_media(article_id, sort_order);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_article_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER article_media_updated_at
  BEFORE UPDATE ON article_media
  FOR EACH ROW
  EXECUTE FUNCTION update_article_media_updated_at();
