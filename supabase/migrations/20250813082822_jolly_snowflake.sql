/*
  # تحديث جدول المستخدمين لإضافة رمز الدولة وتحسين حقل الهاتف

  1. تعديلات الجدول
    - إضافة حقل `country_code` لرمز الدولة
    - تحديث حقل `phone` ليكون أكثر وضوحاً
    - إضافة حقل `avatar_url` للصورة الشخصية (اختياري)
    
  2. الأمان
    - تحديث سياسات RLS للحقول الجديدة
    - ضمان أن المستخدمين يمكنهم تحديث معلوماتهم الشخصية
    
  3. فهارس
    - إضافة فهرس على البريد الإلكتروني للبحث السريع
*/

-- إضافة الحقول الجديدة إذا لم تكن موجودة
DO $$
BEGIN
  -- إضافة حقل رمز الدولة
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country_code text DEFAULT '+90';
  END IF;

  -- إضافة حقل الصورة الشخصية (اختياري)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;

  -- إضافة حقل البريد الإلكتروني للوصول السريع
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;
END $$;

-- تحديث التعليقات على الحقول
COMMENT ON COLUMN user_profiles.phone IS 'رقم الهاتف بدون رمز الدولة - للتواصل فقط وليس لتسجيل الدخول';
COMMENT ON COLUMN user_profiles.country_code IS 'رمز الدولة للهاتف (مثل +90, +966, +971)';
COMMENT ON COLUMN user_profiles.email IS 'البريد الإلكتروني - نسخة من auth.users للوصول السريع';

-- إنشاء فهرس على البريد الإلكتروني للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- إنشاء فهرس على رقم الهاتف للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- تحديث سياسات RLS للحقول الجديدة
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- إضافة دالة لتحديث البريد الإلكتروني تلقائياً
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث البريد الإلكتروني في الملف الشخصي عند تحديثه في auth.users
  UPDATE user_profiles 
  SET email = NEW.email, updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لمزامنة البريد الإلكتروني
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- دالة لإنشاء ملف شخصي جديد تلقائياً عند إنشاء مستخدم جديد
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لإنشاء الملف الشخصي تلقائياً
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- تحديث البيانات الموجودة لمزامنة البريد الإلكتروني
UPDATE user_profiles 
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE user_profiles.id = auth_users.id
AND user_profiles.email IS NULL;
