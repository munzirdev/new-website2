/*
  # إنشاء الملفات الشخصية المفقودة

  1. المشكلة
    - يوجد طلبات خدمة مرتبطة بمستخدمين في auth.users
    - لكن هؤلاء المستخدمين لا يملكون ملفات شخصية في user_profiles
    - هذا يسبب عدم ظهور أسماء العملاء في داشبورد الأدمن

  2. الحل
    - إنشاء ملفات شخصية للمستخدمين المفقودين
    - استخدام بيانات من auth.users لملء الملف الشخصي
    - ربط الطلبات الموجودة بالملفات الشخصية الجديدة

  3. الأمان
    - التحقق من عدم وجود ملف شخصي قبل الإنشاء
    - استخدام بيانات آمنة من auth.users فقط
*/

-- إنشاء ملفات شخصية للمستخدمين الذين لديهم طلبات خدمة ولكن لا يملكون ملفات شخصية
INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
SELECT DISTINCT 
    sr.user_id,
    COALESCE(au.email, 'غير محدد'),
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name', 
        split_part(au.email, '@', 1),
        'مستخدم'
    ) as full_name,
    now() as created_at,
    now() as updated_at
FROM service_requests sr
LEFT JOIN auth.users au ON sr.user_id = au.id
LEFT JOIN user_profiles up ON sr.user_id = up.id
WHERE up.id IS NULL  -- فقط المستخدمين الذين لا يملكون ملفات شخصية
AND au.id IS NOT NULL; -- والموجودين في auth.users

-- إضافة phone و country_code إذا كانت متوفرة في metadata
UPDATE user_profiles 
SET 
    phone = au.raw_user_meta_data->>'phone',
    country_code = COALESCE(au.raw_user_meta_data->>'country_code', '+90')
FROM auth.users au
WHERE user_profiles.id = au.id
AND user_profiles.phone IS NULL
AND au.raw_user_meta_data->>'phone' IS NOT NULL;
