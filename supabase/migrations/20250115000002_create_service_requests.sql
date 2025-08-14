/*
  # إنشاء داشبورد الأدمن

  1. جداول جديدة
    - `service_requests` - طلبات الخدمات من المستخدمين
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `service_type` (text) - نوع الخدمة
      - `title` (text) - عنوان الطلب
      - `description` (text) - وصف الطلب
      - `status` (text) - حالة الطلب
      - `priority` (text) - أولوية الطلب
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `admin_users` - المستخدمين الأدمن
      - `id` (uuid, primary key)
      - `email` (text) - البريد الإلكتروني للأدمن
      - `created_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات للأدمن فقط
    - سياسات للمستخدمين لطلباتهم فقط

  3. فهارس
    - فهرس على user_id في service_requests
    - فهرس على status في service_requests
    - فهرس على created_at في service_requests
*/

-- إنشاء جدول طلبات الخدمات
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء جدول المستخدمين الأدمن
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- إضافة الأدمن الافتراضي
INSERT INTO admin_users (email) VALUES ('admin@tevasul.group') ON CONFLICT (email) DO NOTHING;

-- تفعيل RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- سياسات service_requests
-- المستخدمون يمكنهم إنشاء طلبات جديدة
CREATE POLICY "Users can create own requests"
  ON service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم قراءة طلباتهم فقط
CREATE POLICY "Users can read own requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- الأدمن يمكنهم قراءة جميع الطلبات
CREATE POLICY "Admins can read all requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- الأدمن يمكنهم تحديث جميع الطلبات
CREATE POLICY "Admins can update all requests"
  ON service_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- سياسات admin_users
-- الأدمن فقط يمكنهم قراءة جدول الأدمن
CREATE POLICY "Admins can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_type ON service_requests(service_type);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_service_requests_updated_at();
