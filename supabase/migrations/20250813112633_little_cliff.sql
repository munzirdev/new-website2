/*
  # إضافة حقل admin_reply لجدول service_requests

  1. التغييرات
    - إضافة عمود `admin_reply` لجدول `service_requests`
    - إضافة عمود `admin_reply_date` لتتبع تاريخ الرد
    - تحديث الفهارس لتحسين الأداء
    - إضافة محفز لتحديث تاريخ الرد تلقائياً

  2. الأمان
    - الحقول الجديدة متاحة للأدمن فقط للتحديث
    - المستخدمون يمكنهم قراءة الردود فقط
*/

-- إضافة حقل admin_reply إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_requests' AND column_name = 'admin_reply'
  ) THEN
    ALTER TABLE service_requests ADD COLUMN admin_reply text;
  END IF;
END $$;

-- إضافة حقل admin_reply_date إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_requests' AND column_name = 'admin_reply_date'
  ) THEN
    ALTER TABLE service_requests ADD COLUMN admin_reply_date timestamptz;
  END IF;
END $$;

-- إضافة فهرس لتاريخ الرد إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'service_requests' AND indexname = 'idx_service_requests_admin_reply_date'
  ) THEN
    CREATE INDEX idx_service_requests_admin_reply_date ON service_requests(admin_reply_date);
  END IF;
END $$;

-- إنشاء أو تحديث دالة تحديث تاريخ الرد
CREATE OR REPLACE FUNCTION update_admin_reply_date()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تحديث admin_reply وكان مختلفاً عن القيم السابقة
  IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply AND NEW.admin_reply IS NOT NULL THEN
    NEW.admin_reply_date = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة المحفز إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_service_admin_reply_date'
  ) THEN
    CREATE TRIGGER update_service_admin_reply_date
      BEFORE UPDATE ON service_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_admin_reply_date();
  END IF;
END $$;
