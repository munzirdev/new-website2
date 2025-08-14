-- Simple moderator linking fix without raw_user_meta_data
-- This migration fixes the syntax error and provides a simpler solution

-- Step 1: Update handle_new_user function with simpler logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is already a moderator
    IF EXISTS (SELECT 1 FROM moderators WHERE email = NEW.email) THEN
        -- User is a moderator, create profile with moderator role
        INSERT INTO user_profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.email, 'مشرف جديد'),
            'moderator'
        );
        
        -- Link the moderator record with the user
        UPDATE moderators 
        SET user_id = NEW.id, updated_at = NOW()
        WHERE email = NEW.email AND user_id IS NULL;
        
        RAISE NOTICE 'Created moderator profile for user: %', NEW.email;
    ELSE
        -- Regular user, create profile with default role
        INSERT INTO user_profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.email, 'مستخدم جديد'),
            CASE 
                WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
                WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
                ELSE 'user'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create simple function to link existing moderators
CREATE OR REPLACE FUNCTION link_existing_moderators()
RETURNS void AS $$
DECLARE
    moderator_record RECORD;
    found_user_id UUID;
BEGIN
    -- Loop through all moderators that don't have user_id set
    FOR moderator_record IN 
        SELECT id, email, full_name 
        FROM moderators 
        WHERE user_id IS NULL
    LOOP
        -- Find the user by email in auth.users
        SELECT id INTO found_user_id 
        FROM auth.users 
        WHERE email = moderator_record.email;
        
        -- If user exists, link them and update their role
        IF found_user_id IS NOT NULL THEN
            -- Link moderator record
            UPDATE moderators 
            SET user_id = found_user_id, updated_at = NOW()
            WHERE id = moderator_record.id;
            
            -- Update or create user profile with moderator role
            INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
            VALUES (
                found_user_id,
                moderator_record.email,
                moderator_record.full_name,
                'moderator',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                role = 'moderator',
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                updated_at = NOW();
            
            RAISE NOTICE 'Linked moderator % with user % and updated role', moderator_record.email, found_user_id;
        ELSE
            RAISE NOTICE 'No user found for moderator email: %', moderator_record.email;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Run the link function
SELECT link_existing_moderators();

-- Step 4: Show results
SELECT 
    'Moderator Linking Results' as title,
    COUNT(*) as total_moderators,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_moderators,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as unlinked_moderators
FROM moderators;

-- Step 5: Show detailed status
SELECT 
    m.email,
    m.full_name,
    CASE 
        WHEN m.user_id IS NOT NULL THEN '✅ مرتبط'
        ELSE '❌ غير مرتبط'
    END as link_status,
    CASE 
        WHEN up.role = 'moderator' THEN '✅ دور صحيح'
        WHEN up.role IS NULL THEN '⚠️ لا يوجد ملف شخصي'
        ELSE '❌ دور خاطئ'
    END as role_status
FROM moderators m
LEFT JOIN user_profiles up ON m.user_id = up.id
ORDER BY m.created_at DESC;
