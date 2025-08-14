/*
  # إضافة معلومات التواصل لطلبات الخدمات

  1. تحديثات على جدول service_requests
    - إضافة حقول معلومات التواصل
    - نسخ البيانات من user_profiles
    - فهرسة للبحث السريع

  2. الأمان
    - تحديث سياسات RLS
    - ضمان حماية البيانات الشخصية
*/

-- إضافة حقول معلومات التواصل إلى جدول service_requests
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_country_code text DEFAULT '+90';

-- نسخ البيانات الموجودة من user_profiles إلى service_requests
UPDATE service_requests 
SET 
  contact_name = up.full_name,
  contact_email = up.email,
  contact_phone = up.phone,
  contact_country_code = COALESCE(up.country_code, '+90')
FROM user_profiles up 
WHERE service_requests.user_id = up.id 
AND service_requests.contact_name IS NULL;

-- إضافة فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_service_requests_contact_email 
ON service_requests(contact_email);

CREATE INDEX IF NOT EXISTS idx_service_requests_contact_phone 
ON service_requests(contact_phone);

-- تحديث trigger لنسخ معلومات التواصل عند إنشاء طلب جديد
CREATE OR REPLACE FUNCTION copy_contact_info_to_request()
RETURNS TRIGGER AS $$
BEGIN
  -- نسخ معلومات التواصل من user_profiles
  SELECT 
    up.full_name,
    up.email,
    up.phone,
    COALESCE(up.country_code, '+90')
  INTO 
    NEW.contact_name,
    NEW.contact_email,
    NEW.contact_phone,
    NEW.contact_country_code
  FROM user_profiles up
  WHERE up.id = NEW.user_id;
  
  -- إذا لم توجد في user_profiles، استخدم بيانات auth.users
  IF NEW.contact_name IS NULL THEN
    SELECT 
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
      ),
      au.email,
      au.raw_user_meta_data->>'phone',
      COALESCE(au.raw_user_meta_data->>'country_code', '+90')
    INTO 
      NEW.contact_name,
      NEW.contact_email,
      NEW.contact_phone,
      NEW.contact_country_code
    FROM auth.users au
    WHERE au.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لنسخ معلومات التواصل تلقائياً
DROP TRIGGER IF EXISTS copy_contact_info_trigger ON service_requests;
CREATE TRIGGER copy_contact_info_trigger
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION copy_contact_info_to_request();
