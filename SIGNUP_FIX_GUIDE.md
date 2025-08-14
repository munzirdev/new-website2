# إصلاح مشكلة التسجيل - دليل شامل

## المشكلة
يظهر خطأ "حدث خطأ في قاعدة البيانات يرجى المحاولة مرة أخرى او الاتصال بالدعم الفني" عند محاولة التسجيل.

## السبب
المشكلة ناتجة عن عدم تطابق بين هيكل جدول `user_profiles` في قاعدة البيانات والبيانات التي يحاول التطبيق إدراجها.

## الحلول

### الحل الأول: تشغيل سكريبت إصلاح قاعدة البيانات

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. **أولاً**: انسخ والصق محتوى ملف `diagnose-signup-issue.sql` واضغط "Run" لتشخيص المشكلة بدقة
4. **ثانياً**: انسخ والصق محتوى ملف `comprehensive-signup-fix.sql` واضغط "Run" لتشغيل سكريبت الإصلاح الشامل
5. **ثالثاً**: انسخ والصق محتوى ملف `test-signup.sql` واضغط "Run" لاختبار أن كل شيء يعمل بشكل صحيح
6. **رابعاً**: اختبر التسجيل في التطبيق

### الحل البديل (إذا فشل الحل الأول):
1. انسخ والصق محتوى ملف `simple-signup-fix.sql` واضغط "Run"
2. اختبر التسجيل مرة أخرى

### الحل الثاني: التحقق من هيكل الجدول

```sql
-- التحقق من هيكل جدول user_profiles
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

يجب أن يحتوي الجدول على الأعمدة التالية:
- `id` (uuid, primary key)
- `full_name` (text)
- `phone` (text)
- `email` (text)
- `country_code` (text)
- `role` (varchar(20))
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### الحل الثالث: إنشاء الجدول من جديد

إذا فشلت الحلول السابقة، يمكن إنشاء الجدول من جديد:

```sql
-- حذف الجدول الموجود
DROP TABLE IF EXISTS user_profiles CASCADE;

-- إنشاء الجدول من جديد
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  country_code text DEFAULT '+90',
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إنشاء trigger لإنشاء الملف الشخصي تلقائياً
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name, phone, country_code, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'country_code', '+90'),
        CASE 
            WHEN NEW.email = 'admin@tevasul.group' THEN 'admin'
            WHEN NEW.email LIKE '%moderator%' THEN 'moderator'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### الحل الرابع: اختبار الاتصال

```sql
-- اختبار الاتصال مع Supabase
SELECT version();
SELECT current_database();
SELECT current_user;
```

## خطوات التحقق

### بعد تشغيل سكريبت الإصلاح:

1. **تحقق من نتائج الاختبار**
   - شغل `test-signup.sql` وتأكد من ظهور ✅ لجميع العناصر
   - إذا ظهر ❌ لأي عنصر، أعد تشغيل `simple-signup-fix.sql`

2. **تحقق من متغيرات البيئة**
   - تأكد من وجود `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
   - تأكد من صحة القيم

3. **تحقق من الاتصال**
   - افتح Developer Tools في المتصفح
   - اذهب إلى Console
   - تحقق من رسائل الاتصال مع Supabase

4. **اختبار التسجيل**
   - جرب التسجيل بحساب جديد
   - تحقق من رسائل الخطأ في Console
   - تأكد من إنشاء الملف الشخصي تلقائياً

### مؤشرات النجاح:
- ✅ جميع الاختبارات في `test-signup.sql` تظهر ✅
- ✅ لا تظهر رسائل خطأ في Console
- ✅ يتم إنشاء الحساب بنجاح
- ✅ يتم إنشاء الملف الشخصي تلقائياً

## رسائل الخطأ الشائعة

- **"Database error saving new user"**: مشكلة في هيكل قاعدة البيانات
- **"User already registered"**: البريد الإلكتروني مسجل مسبقاً
- **"Invalid email"**: البريد الإلكتروني غير صحيح
- **"Password too weak"**: كلمة المرور ضعيفة
- **"relation 'user_profiles_id_seq' does not exist"**: خطأ في السكريبت - استخدم `simple-signup-fix.sql` بدلاً من `fix-signup-database-error.sql`

## حلول سريعة للأخطاء

### خطأ: relation "user_profiles_id_seq" does not exist
**الحل**: استخدم ملف `simple-signup-fix.sql` بدلاً من `fix-signup-database-error.sql`

### خطأ: column "email" does not exist
**الحل**: شغل سكريبت `simple-signup-fix.sql` لإضافة الأعمدة المفقودة

### خطأ: permission denied
**الحل**: تأكد من أن المستخدم لديه صلاحيات كافية أو استخدم حساب admin

### خطأ: خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني
**الحل**: 
1. شغل `diagnose-signup-issue.sql` لتشخيص المشكلة
2. شغل `comprehensive-signup-fix.sql` لإصلاح شامل
3. تحقق من رسائل Console في المتصفح
4. تأكد من أن جميع الـ policies تم إنشاؤها بشكل صحيح

### خطأ: infinite recursion detected in policy for relation "user_profiles"
**الحل**: 
1. شغل `remove-duplicate-policies.sql` لإزالة جميع الـ policies المكررة والمشكوك فيها
2. أو شغل `fix-all-recursion-issues.sql` لإصلاح شامل
3. تحقق من أن الـ admin policy يستخدم دالة `is_admin_user_simple()`
4. تأكد من عدم وجود policies مكررة

### مشكلة: الموديريتر لا يظهر له لوحة التحكم
**الحل**: 
1. شغل `check-moderator-access.sql` لفحص حالة الموديريتر
2. شغل `fix-moderator-role.sql` لإصلاح مشكلة التعرف على دور الموديريتر
3. تأكد من أن المستخدم لديه دور 'moderator' في `user_profiles`
4. تحقق من أن دالة `is_moderator_user()` تعمل بشكل صحيح

## الدعم الفني

إذا استمرت المشكلة:
1. التقط لقطة شاشة من رسالة الخطأ
2. انسخ رسائل Console
3. اتصل بالدعم الفني مع هذه المعلومات

## ملاحظات مهمة

- تأكد من تشغيل جميع الـ migrations بالترتيب الصحيح
- تحقق من صلاحيات المستخدم في قاعدة البيانات
- تأكد من تفعيل RLS على الجداول المطلوبة
