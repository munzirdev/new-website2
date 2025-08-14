/*
  # إصلاح العلاقة بين service_requests و user_profiles

  1. إصلاح المشكلة
    - تحديث العلاقة الخارجية لتشير إلى auth.users بدلاً من user_profiles
    - إضافة فهرس لتحسين الأداء
    
  2. الأمان
    - التأكد من أن السياسات تعمل بشكل صحيح
*/

-- حذف العلاقة الخارجية القديمة
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

-- إضافة العلاقة الخارجية الصحيحة
ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id_auth 
ON service_requests(user_id);

-- التأكد من أن user_profiles مرتبط بـ auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
