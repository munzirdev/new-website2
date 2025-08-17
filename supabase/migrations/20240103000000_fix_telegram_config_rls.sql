-- Fix RLS policies for telegram_config table
-- Allow service role to manage telegram config

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage telegram config" ON telegram_config;
DROP POLICY IF EXISTS "Authenticated users can read telegram config" ON telegram_config;

-- Create policy for service role access (for server-side operations)
CREATE POLICY "Service role can manage telegram config" ON telegram_config
  FOR ALL USING (auth.role() = 'service_role');

-- Create policy for admin access (simplified - will be updated later)
CREATE POLICY "Admin can manage telegram config" ON telegram_config
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy for reading config
CREATE POLICY "Authenticated users can read telegram config" ON telegram_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Update the default record with proper values
UPDATE telegram_config 
SET bot_token = 'YOUR_BOT_TOKEN_HERE',
    admin_chat_id = 'YOUR_CHAT_ID_HERE',
    is_enabled = false,
    updated_at = NOW()
WHERE id = 1;
