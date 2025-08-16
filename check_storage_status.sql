-- =====================================================
-- فحص حالة Storage في Supabase
-- =====================================================

-- 1. فحص البكتات الموجودة
SELECT 
    name as bucket_name,
    public,
    file_size_limit,
    created_at,
    updated_at
FROM storage.buckets 
WHERE name = 'passport-images';

-- 2. فحص السياسات المطبقة على بكت passport-images
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_qual,
    CASE 
        WHEN with_check IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%'
ORDER BY policyname;

-- 3. فحص عدد الملفات في البكت
SELECT 
    COUNT(*) as total_files
FROM storage.objects 
WHERE bucket_id = 'passport-images';

-- 4. فحص أحدث الملفات المرفوعة
SELECT 
    name,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'passport-images'
ORDER BY created_at DESC
LIMIT 10;

-- 5. فحص إعدادات RLS (Row Level Security)
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
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;
