# حل مشكلة رفع الملفات في Health Insurance

## المشكلة
```
HealthInsurancePage.tsx:254 ❌ خطأ في رفع الملف: StorageApiError: Bucket not found
```

## السبب
البكت (bucket) المسمى `passport-images` غير موجود في Supabase Storage.

## الحلول

### الحل الأول: إنشاء البكت يدوياً (الأسهل)

1. **اذهب إلى لوحة تحكم Supabase**
   - افتح [supabase.com](https://supabase.com)
   - سجل دخولك إلى مشروعك

2. **انتقل إلى Storage**
   - من القائمة الجانبية، اختر "Storage"

3. **أنشئ بكت جديد**
   - اضغط على "Create a new bucket"
   - اسم البكت: `passport-images`
   - اختر "Public bucket" (للوصول العام)
   - اضغط "Create bucket"

4. **إعداد السياسات (Policies)**
   - اضغط على البكت `passport-images`
   - انتقل إلى تبويب "Policies"
   - أضف السياسات التالية:

#### سياسة للقراءة العامة:
```sql
-- Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'passport-images');
```

#### سياسة للرفع للمستخدمين المسجلين:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);
```

#### سياسة للضيوف (اختياري):
```sql
-- Allow anonymous uploads (for guests)
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'passport-images');
```

### الحل الثاني: استخدام السكريبت التلقائي

1. **أضف مفتاح Service Role إلى ملف .env**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **شغل السكريبت**
   ```bash
   node scripts/create-storage-bucket.js
   ```

### الحل الثالث: التحقق من الإعدادات

1. **تأكد من متغيرات البيئة**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **اختبر الاتصال**
   ```javascript
   // في console المتصفح
   const { data, error } = await supabase.storage.listBuckets();
   console.log('Buckets:', data);
   ```

## التحسينات المضافة

تم تحسين كود رفع الملفات ليتعامل مع الأخطاء بشكل أفضل:

1. **فحص وجود البكت قبل الرفع**
2. **رسائل خطأ أكثر وضوحاً**
3. **استمرار العمل حتى لو فشل رفع الملف**
4. **تحذيرات للمستخدم بدلاً من إيقاف العملية**

## اختبار الحل

بعد إنشاء البكت:

1. **اختبر رفع ملف صغير**
2. **تحقق من ظهور الملف في Storage**
3. **اختبر الوصول العام للملف**

## ملاحظات مهمة

- تأكد من أن البكت `passport-images` موجود قبل استخدام الميزة
- السياسات مهمة للوصول والرفع
- يمكن للمستخدمين المتابعة حتى لو فشل رفع الملف
- سيتم إرسال الطلب بدون الملف في حالة فشل الرفع

## الدعم

إذا استمرت المشكلة:
1. تحقق من إعدادات Supabase
2. تأكد من صحة مفاتيح API
3. راجع سياسات الأمان في البكت
