-- =====================================================
-- فحص بسيط لبكت passport-images
-- =====================================================

-- 1. فحص وجود البكت
SELECT 
    name as bucket_name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets 
WHERE name = 'passport-images';

-- 2. فحص السياسات المطبقة
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%'
ORDER BY policyname;

-- 3. فحص عدد الملفات (إذا كان البكت موجود)
SELECT 
    COUNT(*) as total_files
FROM storage.objects 
WHERE bucket_id = 'passport-images';
