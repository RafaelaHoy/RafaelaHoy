-- Migration: Add sort_order column to articles table
-- This migration adds a sort_order column to allow manual ordering of articles in the home page

-- Add the sort_order column to the articles table
ALTER TABLE articles 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create an index on sort_order for better performance
CREATE INDEX idx_articles_sort_order ON articles(sort_order);

-- Update existing articles to have sequential sort_order values based on creation date
-- This ensures existing articles have proper ordering
UPDATE articles 
SET sort_order = (
  SELECT row_number - 1
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at DESC)
    FROM articles
  ) ranked_articles
  WHERE ranked_articles.id = articles.id
);

-- Add a comment to explain the purpose of the column
COMMENT ON COLUMN articles.sort_order IS 'Manual order for displaying articles in home page. Lower numbers appear first.';
