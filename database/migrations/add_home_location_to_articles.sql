-- Add home_location column to articles table
ALTER TABLE articles ADD COLUMN home_location VARCHAR(20) DEFAULT 'repositorio';

-- Create index for better performance
CREATE INDEX idx_articles_home_location ON articles(home_location);

-- Update existing articles based on their sort_order
UPDATE articles 
SET home_location = CASE 
  WHEN sort_order = 0 THEN 'principal'
  WHEN sort_order >= 1 AND sort_order <= 3 THEN 'destacada'
  WHEN sort_order >= 6 AND sort_order <= 15 THEN 'ultimas'
  ELSE 'repositorio'
END;
