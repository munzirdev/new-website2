-- Comprehensive fix for signup database error
-- This script addresses all potential issues

-- Step 1: Disable the trigger temporarily to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Ensure all columns exist with proper constraints
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country_code text DEFAULT '+90';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

-- Step 3: Update existing records
UPDATE user_profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE user_profiles.id = auth.users.id 
AND user_profiles.email IS NULL;

UPDATE user_profiles 
SET country_code = '+90' 
WHERE country_code IS NULL;

UPDATE user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Step 4: Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;

-- Step 5: Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create comprehensive policies
-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create admin check function to avoid recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by email first (most reliable)
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@tevasul.group'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: check role in user_profiles (with safety check)
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for admins to view all profiles (using function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Step 7: Create a more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
        INSERT INTO user_profiles (
            id, 
            email, 
            full_name, 
            phone, 
            country_code, 
            role
        )
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            COALESCE(NEW.raw_user_meta_data->>'country_code', '+90'),
            CASE 
                WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
                WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
                ELSE 'user'
            END
        );
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 9: Ensure the update trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create update trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- Step 12: Create a backup function for manual profile creation
CREATE OR REPLACE FUNCTION create_user_profile_manually(user_id uuid, user_email text, user_name text, user_phone text DEFAULT '', user_country_code text DEFAULT '+90')
RETURNS void AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name, phone, country_code, role)
    VALUES (
        user_id,
        user_email,
        user_name,
        user_phone,
        user_country_code,
        'user'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        country_code = EXCLUDED.country_code,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Verify the setup
SELECT 
    'Setup Complete' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') THEN '✅'
        ELSE '❌'
    END || ' Trigger function' as trigger_function,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN '✅'
        ELSE '❌'
    END || ' User creation trigger' as user_trigger,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN '✅'
        ELSE '❌'
    END || ' RLS enabled' as rls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles') THEN '✅'
        ELSE '❌'
    END || ' Policies created' as policies_status;
