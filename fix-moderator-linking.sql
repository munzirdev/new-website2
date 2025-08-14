-- إصلاح ربط المشرفين مع المستخدمين الموجودين
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. ربط المشرفين الموجودين مع المستخدمين
UPDATE moderators 
SET user_id = (
    SELECT id FROM auth.users 
    WHERE email = moderators.email
), 
updated_at = NOW()
WHERE user_id IS NULL 
AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = moderators.email
);

-- 2. تحديث أدوار المستخدمين المرتبطين كمشرفين
UPDATE user_profiles 
SET role = 'moderator', 
    updated_at = NOW()
WHERE email IN (
    SELECT email FROM moderators 
    WHERE user_id IS NOT NULL
)
AND role != 'moderator';

-- 3. إنشاء ملفات شخصية للمشرفين الذين لا يملكون ملفات
INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    m.user_id,
    m.email,
    m.full_name,
    'moderator',
    NOW(),
    NOW()
FROM moderators m
WHERE m.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = m.user_id
);

-- 4. عرض النتائج
SELECT 
    'نتائج ربط المشرفين' as title,
    COUNT(*) as total_moderators,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_moderators,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as unlinked_moderators
FROM moderators;

-- 5. عرض تفاصيل المشرفين المرتبطين
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
