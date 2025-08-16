-- =====================================================
-- إنشاء بكت passport-images في Supabase Storage
-- =====================================================

-- ملاحظة مهمة: لا يمكن إنشاء البكت عبر SQL مباشرة
-- يجب إنشاؤه عبر لوحة التحكم أو API

-- =====================================================
-- الطريقة الأولى: عبر لوحة التحكم (الأسهل)
-- =====================================================

/*
1. اذهب إلى https://supabase.com
2. سجل دخولك إلى مشروعك
3. انتقل إلى Storage من القائمة الجانبية
4. اضغط على "Create a new bucket"
5. أدخل:
   - Name: passport-images
   - Public bucket: ✓ (مفعل)
6. اضغط "Create bucket"
*/

-- =====================================================
-- الطريقة الثانية: عبر API (تحتاج Service Role Key)
-- =====================================================

/*
POST https://your-project.supabase.co/storage/v1/bucket
Headers:
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json

Body:
{
  "id": "passport-images",
  "public": true,
  "file_size_limit": 52428800,
  "allowed_mime_types": ["image/jpeg", "image/png", "image/jpg", "image/webp"]
}
*/

-- =====================================================
-- بعد إنشاء البكت، نفذ هذه السياسات:
-- =====================================================

-- سياسة القراءة العامة
CREATE POLICY "Allow public read access to passport images" ON storage.objects
FOR SELECT USING (bucket_id = 'passport-images');

-- سياسة الرفع للمستخدمين المسجلين
CREATE POLICY "Allow authenticated uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- سياسة التحديث للمستخدمين المسجلين
CREATE POLICY "Allow authenticated updates to passport images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- سياسة الحذف للمستخدمين المسجلين
CREATE POLICY "Allow authenticated deletes to passport images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- سياسة الرفع للضيوف (اختياري)
CREATE POLICY "Allow anonymous uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'passport-images');

-- =====================================================
-- اختبار البكت
-- =====================================================

-- فحص البكتات الموجودة
SELECT name, public, file_size_limit FROM storage.buckets WHERE name = 'passport-images';

-- فحص السياسات المطبقة
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%passport%';

-- =====================================================
-- ملاحظات مهمة
-- =====================================================

/*
1. تأكد من أن البكت public للوصول العام
2. السياسات ضرورية للعمل الصحيح
3. يمكن اختبار الرفع عبر التطبيق بعد الإنشاء
4. إذا لم تعمل السياسات، جرب إعادة تشغيل التطبيق
*/
