/*
  # إنشاء جدول رسائل دعم العملاء

  1. الجداول الجديدة
    - `support_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `email` (text)
      - `subject` (text, required)
      - `message` (text, required)
      - `status` (text, default 'pending')
      - `admin_reply` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جدول `support_messages`
    - سياسة للمستخدمين لإنشاء رسائلهم الخاصة
    - سياسة للمستخدمين لقراءة رسائلهم الخاصة
    - سياسة للأدمن لقراءة وتحديث جميع الرسائل

  3. الفهارس
    - فهرس على `user_id` للأداء
    - فهرس على `status` للفلترة
    - فهرس على `created_at` للترتيب
*/

-- إنشاء جدول رسائل دعم العملاء
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_reply text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- سياسات رسائل الدعم
CREATE POLICY "Users can create own support messages"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can update all support messages"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_support_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_messages_updated_at
    BEFORE UPDATE ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_support_messages_updated_at();
