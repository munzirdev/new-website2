-- إنشاء جدول شركات التأمين
CREATE TABLE IF NOT EXISTS insurance_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الفئات العمرية
CREATE TABLE IF NOT EXISTS age_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول أسعار التأمين الصحي
CREATE TABLE IF NOT EXISTS health_insurance_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    age_group_id UUID REFERENCES age_groups(id) ON DELETE CASCADE,
    duration_months INTEGER NOT NULL DEFAULT 12,
    price_try DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, age_group_id, duration_months)
);

-- إنشاء جدول طلبات التأمين الصحي
CREATE TABLE IF NOT EXISTS health_insurance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES insurance_companies(id) ON DELETE CASCADE,
    age_group_id UUID REFERENCES age_groups(id) ON DELETE CASCADE,
    duration_months INTEGER NOT NULL DEFAULT 12,
    calculated_price DECIMAL(10,2) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    additional_notes TEXT,
    passport_image_url TEXT,
    insurance_offer_confirmed BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    customer_age INTEGER,
    birth_date DATE,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_insurance_companies_active ON insurance_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_age_groups_active ON age_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_health_insurance_pricing_active ON health_insurance_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_health_insurance_pricing_company ON health_insurance_pricing(company_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_pricing_age_group ON health_insurance_pricing(age_group_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_user ON health_insurance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_company ON health_insurance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_status ON health_insurance_requests(status);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_created_at ON health_insurance_requests(created_at);

-- إدراج بيانات تجريبية لشركات التأمين
INSERT INTO insurance_companies (name, name_ar, is_active) VALUES
('Allianz', 'أليانز', true),
('Axa', 'أكسا', true),
('Generali', 'جنرالي', true),
('Mapfre', 'مابفري', true),
('Uniqa', 'يونيكا', true)
ON CONFLICT DO NOTHING;

-- إدراج بيانات تجريبية للفئات العمرية
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
(0, 18, 'Children (0-18)', 'الأطفال (0-18)', true),
(19, 30, 'Young Adults (19-30)', 'الشباب (19-30)', true),
(31, 45, 'Adults (31-45)', 'البالغون (31-45)', true),
(46, 60, 'Middle Age (46-60)', 'منتصف العمر (46-60)', true),
(61, 75, 'Seniors (61-75)', 'كبار السن (61-75)', true),
(76, 100, 'Elderly (76+)', 'المسنون (76+)', true)
ON CONFLICT DO NOTHING;

-- إدراج بيانات تجريبية للأسعار
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try, is_active)
SELECT 
    ic.id as company_id,
    ag.id as age_group_id,
    12 as duration_months,
    CASE 
        WHEN ag.min_age <= 18 THEN 1500.00
        WHEN ag.min_age <= 30 THEN 2000.00
        WHEN ag.min_age <= 45 THEN 2500.00
        WHEN ag.min_age <= 60 THEN 3000.00
        WHEN ag.min_age <= 75 THEN 4000.00
        ELSE 5000.00
    END as price_try,
    true as is_active
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.is_active = true AND ag.is_active = true
ON CONFLICT DO NOTHING;

-- إنشاء RLS (Row Level Security) للجداول
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_requests ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للشركات
CREATE POLICY "Allow public read access to active insurance companies" ON insurance_companies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access to insurance companies" ON insurance_companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- سياسات الأمان للفئات العمرية
CREATE POLICY "Allow public read access to active age groups" ON age_groups
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access to age groups" ON age_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- سياسات الأمان لأسعار التأمين
CREATE POLICY "Allow public read access to active pricing" ON health_insurance_pricing
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access to pricing" ON health_insurance_pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- سياسات الأمان لطلبات التأمين
CREATE POLICY "Allow users to read their own requests" ON health_insurance_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own requests" ON health_insurance_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own requests" ON health_insurance_requests
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow admin full access to requests" ON health_insurance_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insurance_companies_updated_at BEFORE UPDATE ON insurance_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_age_groups_updated_at BEFORE UPDATE ON age_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_insurance_pricing_updated_at BEFORE UPDATE ON health_insurance_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_insurance_requests_updated_at BEFORE UPDATE ON health_insurance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
