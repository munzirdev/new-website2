-- =====================================================
-- السياسات الأساسية لبكت passport-images
-- =====================================================

-- حذف السياسات الموجودة (إذا كانت موجودة)
DROP POLICY IF EXISTS "Allow public read access to passport images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to passport images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to passport images" ON storage.objects;

-- 1. السماح بالقراءة العامة (مهم جداً)
CREATE POLICY "Allow public read access to passport images" ON storage.objects
FOR SELECT USING (bucket_id = 'passport-images');

-- 2. السماح للمستخدمين المسجلين برفع الملفات
CREATE POLICY "Allow authenticated uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- 3. السماح للضيوف برفع الملفات (مهم للضيوف)
CREATE POLICY "Allow anonymous uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'passport-images');

-- فحص النتيجة
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%'
ORDER BY policyname;
