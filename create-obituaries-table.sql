-- Create obituaries table
CREATE TABLE IF NOT EXISTS obituaries (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  service_info TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_obituaries_date ON obituaries(date DESC);
CREATE INDEX IF NOT EXISTS idx_obituaries_created_at ON obituaries(created_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE obituaries ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage obituaries
CREATE POLICY "Authenticated users can manage obituaries" ON obituaries
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy for public to read obituaries
CREATE POLICY "Public can read obituaries" ON obituaries
  FOR SELECT USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_obituaries_updated_at 
  BEFORE UPDATE ON obituaries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
