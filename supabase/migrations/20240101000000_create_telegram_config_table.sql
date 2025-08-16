-- Create telegram_config table
CREATE TABLE IF NOT EXISTS telegram_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bot_token TEXT,
  admin_chat_id TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default record
INSERT INTO telegram_config (id, bot_token, admin_chat_id, is_enabled)
VALUES (1, 'placeholder', 'placeholder', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE telegram_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage telegram config" ON telegram_config;
DROP POLICY IF EXISTS "Authenticated users can read telegram config" ON telegram_config;

-- Create policy for admin access
CREATE POLICY "Admin can manage telegram config" ON telegram_config
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Create policy for reading config
CREATE POLICY "Authenticated users can read telegram config" ON telegram_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_telegram_config_updated_at ON telegram_config;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_telegram_config_updated_at 
  BEFORE UPDATE ON telegram_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
