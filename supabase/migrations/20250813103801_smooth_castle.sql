/*
  # إضافة صلاحيات الحذف لطلبات الخدمات

  1. Security
    - إضافة policy للمستخدمين لحذف طلباتهم الخاصة
    - إضافة policy للأدمن لحذف جميع الطلبات
    - الحفاظ على الأمان مع RLS

  2. Changes
    - إضافة DELETE policies للجدول service_requests
*/

-- إضافة policy للمستخدمين لحذف طلباتهم الخاصة
CREATE POLICY "Users can delete own requests"
  ON service_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- إضافة policy للأدمن لحذف جميع الطلبات
CREATE POLICY "Admins can delete all requests"
  ON service_requests
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') IN (
      SELECT email FROM admin_users
    )
  );
