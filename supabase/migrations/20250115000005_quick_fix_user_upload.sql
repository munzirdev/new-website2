-- Quick fix for user file upload permissions
-- This will allow normal users to upload files immediately

-- 1. First, let's check if the foreign key constraint exists and fix it
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

-- 2. Add the correct foreign key constraint to auth.users
ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can create own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can delete all requests" ON service_requests;

-- 4. Create simple policies that work for all authenticated users
-- Users can create their own requests
CREATE POLICY "Users can create own requests"
  ON service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY "Users can read own requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
  ON service_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own requests
CREATE POLICY "Users can delete own requests"
  ON service_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all requests (using email check) - سيتم إضافتها لاحقاً بعد إضافة عمود role
-- CREATE POLICY "Admins can read all requests"
--   ON service_requests
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_profiles.id = auth.uid() 
--       AND user_profiles.role = 'admin'
--     )
--   );

-- Admins can update all requests - سيتم إضافتها لاحقاً بعد إضافة عمود role
-- CREATE POLICY "Admins can update all requests"
--   ON service_requests
--   FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_profiles.id = auth.uid() 
--       AND user_profiles.role = 'admin'
--     )
--   );

-- Admins can delete all requests - سيتم إضافتها لاحقاً بعد إضافة عمود role
-- CREATE POLICY "Admins can delete all requests"
--   ON service_requests
--   FOR DELETE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_profiles.id = auth.uid() 
--       AND user_profiles.role = 'admin'
--     )
--   );

-- 5. Fix file_attachments policies
DROP POLICY IF EXISTS "Users can view their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can insert their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can update their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can delete their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Admins can view all file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Admins can manage all file attachments" ON file_attachments;

-- Create simple file_attachments policies
CREATE POLICY "Users can view their own file attachments" ON file_attachments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file attachments" ON file_attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file attachments" ON file_attachments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file attachments" ON file_attachments
    FOR DELETE USING (auth.uid() = user_id);

-- CREATE POLICY "Admins can view all file attachments" ON file_attachments
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles 
--             WHERE user_profiles.id = auth.uid() 
--             AND user_profiles.role = 'admin'
--         )
--     );

-- CREATE POLICY "Admins can manage all file attachments" ON file_attachments
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles 
--             WHERE user_profiles.id = auth.uid() 
--             AND user_profiles.role = 'admin'
--         )
--     );

-- 6. Ensure user_profiles table has the correct foreign key
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Create a function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user profile exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.user_id) THEN
        -- Create profile automatically
        INSERT INTO user_profiles (
            id,
            email,
            full_name,
            phone,
            country_code,
            created_at,
            updated_at
        ) VALUES (
            NEW.user_id,
            (SELECT email FROM auth.users WHERE id = NEW.user_id),
            COALESCE((SELECT user_metadata->>'full_name' FROM auth.users WHERE id = NEW.user_id), 'New User'),
            (SELECT user_metadata->>'phone' FROM auth.users WHERE id = NEW.user_id),
            COALESCE((SELECT user_metadata->>'country_code' FROM auth.users WHERE id = NEW.user_id), '+90'),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers to ensure user profile exists
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON service_requests;
CREATE TRIGGER ensure_user_profile_trigger
    BEFORE INSERT ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();

DROP TRIGGER IF EXISTS ensure_user_profile_file_trigger ON file_attachments;
CREATE TRIGGER ensure_user_profile_file_trigger
    BEFORE INSERT ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id_auth 
ON service_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_file_attachments_user_id 
ON file_attachments(user_id);
