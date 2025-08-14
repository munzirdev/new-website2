/*
  # إنشاء جدول ملفات المستخدمين

  1. جداول جديدة
    - `user_profiles`
      - `id` (uuid, primary key, مرتبط بـ auth.users)
      - `full_name` (text, الاسم الكامل)
      - `phone` (text, رقم الهاتف)
      - `created_at` (timestamp, تاريخ الإنشاء)
      - `updated_at` (timestamp, تاريخ التحديث)

  2. الأمان
    - تفعيل RLS على جدول `user_profiles`
    - إضافة سياسات للمستخدمين المصادق عليهم لقراءة وتحديث بياناتهم الخاصة
*/

-- إنشاء جدول ملفات المستخدمين
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للمستخدمين بقراءة ملفهم الشخصي
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- سياسة للسماح للمستخدمين بإدراج ملفهم الشخصي
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- سياسة للسماح للمستخدمين بتحديث ملفهم الشخصي
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
