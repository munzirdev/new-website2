/*
  # تحسين النظام للأدمن ورفع الملفات

  1. تحديثات الجداول
    - إضافة حقل `file_url` لجدول `service_requests` لحفظ رابط الملف المرفوع
    - إضافة حقل `file_name` لحفظ اسم الملف الأصلي
    - إضافة حقل `admin_reply_date` لتتبع تاريخ الرد
    
  2. تحسين جدول الأسئلة المتكررة
    - إضافة المزيد من الحقول للتحكم
    
  3. تحسين جدول رسائل الدعم
    - إضافة حقل `admin_reply_date` لتتبع الردود
    
  4. إضافة سياسات جديدة للأدمن
    - السماح للأدمن بإدارة الأسئلة المتكررة
    - السماح للأدمن بالرد على رسائل الدعم
*/

-- إضافة حقول جديدة لجدول طلبات الخدمات
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_requests' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE service_requests ADD COLUMN file_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_requests' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE service_requests ADD COLUMN file_name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_requests' AND column_name = 'admin_reply_date'
  ) THEN
    ALTER TABLE service_requests ADD COLUMN admin_reply_date timestamptz;
  END IF;
END $$;

-- إضافة حقل تاريخ الرد لجدول رسائل الدعم
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_messages' AND column_name = 'admin_reply_date'
  ) THEN
    ALTER TABLE support_messages ADD COLUMN admin_reply_date timestamptz;
  END IF;
END $$;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_service_requests_file_url ON service_requests(file_url);
CREATE INDEX IF NOT EXISTS idx_support_messages_admin_reply_date ON support_messages(admin_reply_date);

-- تحديث سياسات الأدمن للأسئلة المتكررة
DROP POLICY IF EXISTS "Admins can manage FAQs" ON faqs;
CREATE POLICY "Admins can manage FAQs"
  ON faqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email'::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email'::text)
    )
  );

-- تحديث سياسات الأدمن لرسائل الدعم
DROP POLICY IF EXISTS "Admins can update all support messages" ON support_messages;
CREATE POLICY "Admins can update all support messages"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email'::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email'::text)
    )
  );

-- دالة لتحديث تاريخ الرد عند إضافة رد من الأدمن
CREATE OR REPLACE FUNCTION update_admin_reply_date()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم إضافة رد من الأدمن وكان فارغاً من قبل
  IF NEW.admin_reply IS NOT NULL AND OLD.admin_reply IS NULL THEN
    NEW.admin_reply_date = now();
  END IF;
  
  -- إذا تم تحديث الرد
  IF NEW.admin_reply IS NOT NULL AND OLD.admin_reply IS NOT NULL AND NEW.admin_reply != OLD.admin_reply THEN
    NEW.admin_reply_date = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة المحفز لجدول رسائل الدعم
DROP TRIGGER IF EXISTS update_support_admin_reply_date ON support_messages;
CREATE TRIGGER update_support_admin_reply_date
  BEFORE UPDATE ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_reply_date();

-- إضافة المحفز لجدول طلبات الخدمات
DROP TRIGGER IF EXISTS update_service_admin_reply_date ON service_requests;
CREATE TRIGGER update_service_admin_reply_date
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_reply_date();
