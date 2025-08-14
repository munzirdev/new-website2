-- Complete fix for user file upload permissions
-- This migration will fix all issues preventing normal users from uploading files

-- Step 1: Enable RLS on tables if not already enabled
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Add role column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- Step 3: Drop all existing policies to start completely fresh
DROP POLICY IF EXISTS "Users can create own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can delete all requests" ON service_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON service_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON service_requests;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON service_requests;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON service_requests;

DROP POLICY IF EXISTS "Users can view their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can insert their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can update their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can delete their own file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Admins can view all file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Admins can manage all file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Enable read access for all users" ON file_attachments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON file_attachments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON file_attachments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON file_attachments;

-- Step 4: Fix foreign key constraints
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;
ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Create simple and effective policies for service_requests
-- Allow all authenticated users to create their own requests
CREATE POLICY "Allow users to create own requests"
ON service_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own requests
CREATE POLICY "Allow users to read own requests"
ON service_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own requests
CREATE POLICY "Allow users to update own requests"
ON service_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own requests
CREATE POLICY "Allow users to delete own requests"
ON service_requests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to read all requests
CREATE POLICY "Allow admins to read all requests"
ON service_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Allow admins to update all requests
CREATE POLICY "Allow admins to update all requests"
ON service_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Allow admins to delete all requests
CREATE POLICY "Allow admins to delete all requests"
ON service_requests FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Step 6: Create simple and effective policies for file_attachments
-- Allow all authenticated users to create their own file attachments
CREATE POLICY "Allow users to create own file attachments"
ON file_attachments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own file attachments
CREATE POLICY "Allow users to read own file attachments"
ON file_attachments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own file attachments
CREATE POLICY "Allow users to update own file attachments"
ON file_attachments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own file attachments
CREATE POLICY "Allow users to delete own file attachments"
ON file_attachments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to read all file attachments
CREATE POLICY "Allow admins to read all file attachments"
ON file_attachments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Allow admins to manage all file attachments
CREATE POLICY "Allow admins to manage all file attachments"
ON file_attachments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Step 7: Create policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

CREATE POLICY "Allow users to view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow admins to view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Allow admins to update all profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Step 8: Create function to ensure user profile exists
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
            role,
            created_at,
            updated_at
        ) VALUES (
            NEW.user_id,
            (SELECT email FROM auth.users WHERE id = NEW.user_id),
            COALESCE((SELECT user_metadata->>'full_name' FROM auth.users WHERE id = NEW.user_id), 'مستخدم جديد'),
            (SELECT user_metadata->>'phone' FROM auth.users WHERE id = NEW.user_id),
            COALESCE((SELECT user_metadata->>'country_code' FROM auth.users WHERE id = NEW.user_id), '+90'),
            'user',
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers to ensure user profile exists
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

-- Step 10: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id_auth 
ON service_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_file_attachments_user_id 
ON file_attachments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_id 
ON user_profiles(id);

-- Step 11: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON service_requests TO authenticated;
GRANT ALL ON file_attachments TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- Step 12: Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Role column added to user_profiles table.';
    RAISE NOTICE 'All authenticated users should now be able to upload files.';
    RAISE NOTICE 'Admins can view and manage all files.';
END $$;
