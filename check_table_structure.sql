-- =====================================================
-- فحص هيكل جدول health_insurance_requests
-- =====================================================

-- فحص الأعمدة الموجودة في الجدول
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'health_insurance_requests'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- فحص البيانات الموجودة في الجدول
SELECT 
    id,
    user_id,
    company_id,
    age_group_id,
    duration_months,
    calculated_price,
    contact_name,
    contact_email,
    contact_phone,
    additional_notes,
    passport_image_url,
    insurance_offer_confirmed,
    status,
    created_at,
    updated_at
FROM health_insurance_requests
LIMIT 5;
