-- Fix telegram_config table if it exists
-- This migration ensures the table has the correct structure and policies

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_telegram_config_updated_at ON telegram_config;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage telegram config" ON telegram_config;
DROP POLICY IF EXISTS "Authenticated users can read telegram config" ON telegram_config;

-- Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS telegram_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bot_token TEXT,
  admin_chat_id TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default record if it doesn't exist
INSERT INTO telegram_config (id, bot_token, admin_chat_id, is_enabled)
VALUES (1, 'placeholder', 'placeholder', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE telegram_config ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_telegram_config_updated_at 
  BEFORE UPDATE ON telegram_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create policy for admin access (simplified - will be updated later)
CREATE POLICY "Admin can manage telegram config" ON telegram_config
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy for reading config
CREATE POLICY "Authenticated users can read telegram config" ON telegram_config
  FOR SELECT USING (auth.role() = 'authenticated');
