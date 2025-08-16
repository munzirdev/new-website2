-- =====================================================
-- اختبار رفع الملفات
-- =====================================================

-- 1. فحص وجود البكت
SELECT 
    name as bucket_name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'passport-images';

-- 2. فحص السياسات المطبقة
SELECT 
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%'
ORDER BY policyname;

-- 3. فحص RLS (Row Level Security) على جدول storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 4. فحص عدد الملفات الموجودة
SELECT 
    COUNT(*) as total_files
FROM storage.objects 
WHERE bucket_id = 'passport-images';

-- 5. فحص أحدث الملفات
SELECT 
    name,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'passport-images'
ORDER BY created_at DESC
LIMIT 5;
