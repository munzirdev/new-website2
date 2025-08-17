-- Fix Health Insurance Request Submission Issues
-- Run this SQL in Supabase Dashboard > SQL Editor

-- 1. Fix the foreign key constraint to allow NULL user_id
ALTER TABLE health_insurance_requests 
DROP CONSTRAINT IF EXISTS health_insurance_requests_user_id_fkey;

ALTER TABLE health_insurance_requests 
ADD CONSTRAINT health_insurance_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE SET NULL;

-- 2. Update RLS policies to use correct table name
DROP POLICY IF EXISTS "Admin can view all health insurance requests" ON health_insurance_requests;

CREATE POLICY "Admin can view all health insurance requests" ON health_insurance_requests
FOR SELECT
USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 3. Ensure the profiles table has the correct structure
-- Add any missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+90',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

-- 4. Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'مستخدم جديد'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
            WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
            ELSE 'user'
        END,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Insert existing users into profiles table (if any)
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'مستخدم جديد'),
    CASE 
        WHEN au.email = 'admin@tevasul.group' THEN 'admin'
        WHEN au.email LIKE '%moderator%' THEN 'moderator'
        ELSE 'user'
    END,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- 7. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.health_insurance_requests TO authenticated;
GRANT ALL ON public.health_insurance_requests TO service_role;

-- 8. Verify the fixes
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Health insurance requests table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'health_insurance_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Current RLS policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('health_insurance_requests', 'profiles');

-- 9. Test data insertion (optional - uncomment to test)
/*
INSERT INTO health_insurance_requests (
    company_id,
    age_group_id,
    duration_months,
    calculated_price,
    contact_name,
    contact_email,
    contact_phone,
    status
) VALUES (
    'test-company-id',
    'test-age-group-id',
    12,
    1500.00,
    'Test User',
    'test@example.com',
    '+905349627241',
    'pending'
);
*/
