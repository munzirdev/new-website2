-- Update telegram config policies to properly reference profiles table
-- This migration runs after the profiles table is created

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage telegram config" ON telegram_config;

-- Create updated policy for admin access
CREATE POLICY "Admin can manage telegram config" ON telegram_config
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

