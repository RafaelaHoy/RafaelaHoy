-- Create table for pharmacies on duty
CREATE TABLE IF NOT EXISTS pharmacies_on_duty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_pharmacies_on_duty_date ON pharmacies_on_duty(date);

-- Create index for unique date constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_pharmacies_on_duty_date_unique ON pharmacies_on_duty(date);

-- Enable RLS
ALTER TABLE pharmacies_on_duty ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Enable read access for all users" ON pharmacies_on_duty
  FOR SELECT USING (true);

-- Create policy for insert/update access (for service role only)
CREATE POLICY "Enable insert/update for service role" ON pharmacies_on_duty
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON pharmacies_on_duty
  FOR UPDATE USING (true);

-- Create policy for delete access (for service role only)
CREATE POLICY "Enable delete for service role" ON pharmacies_on_duty
  FOR DELETE USING (true);
