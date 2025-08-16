-- =====================================================
-- سياسات بكت passport-images
-- =====================================================
-- نفذ هذه السياسات بعد إنشاء البكت عبر لوحة التحكم

-- 1. السماح بالقراءة العامة
CREATE POLICY "Allow public read access to passport images" ON storage.objects
FOR SELECT USING (bucket_id = 'passport-images');

-- 2. السماح للمستخدمين المسجلين برفع الملفات
CREATE POLICY "Allow authenticated uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- 3. السماح للمستخدمين المسجلين بتحديث ملفاتهم
CREATE POLICY "Allow authenticated updates to passport images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- 4. السماح للمستخدمين المسجلين بحذف ملفاتهم
CREATE POLICY "Allow authenticated deletes to passport images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- 5. السماح للضيوف برفع الملفات (اختياري)
CREATE POLICY "Allow anonymous uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'passport-images');
