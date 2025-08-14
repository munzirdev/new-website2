-- Create health insurance pricing tables
-- This migration adds support for health insurance pricing management

-- Create insurance companies table
CREATE TABLE IF NOT EXISTS insurance_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create age groups table
CREATE TABLE IF NOT EXISTS age_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_age integer NOT NULL,
  max_age integer NOT NULL,
  name text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(min_age, max_age)
);

-- Create health insurance pricing table
CREATE TABLE IF NOT EXISTS health_insurance_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
  age_group_id uuid NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  duration_months integer NOT NULL, -- 12 for 1 year, 24 for 2 years
  price_try decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, age_group_id, duration_months)
);

-- Create health insurance requests table
CREATE TABLE IF NOT EXISTS health_insurance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES insurance_companies(id) ON DELETE SET NULL,
  age_group_id uuid REFERENCES age_groups(id) ON DELETE SET NULL,
  duration_months integer NOT NULL,
  calculated_price decimal(10,2),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  additional_notes text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default age groups
INSERT INTO age_groups (min_age, max_age, name, name_ar) VALUES
  (0, 15, '0-15 years', '0-15 سنة'),
  (16, 35, '16-35 years', '16-35 سنة'),
  (36, 45, '36-45 years', '36-45 سنة'),
  (46, 50, '46-50 years', '46-50 سنة'),
  (51, 55, '51-55 years', '51-55 سنة'),
  (56, 60, '56-60 years', '56-60 سنة'),
  (61, 65, '61-65 years', '61-65 سنة'),
  (66, 69, '66-69 years', '66-69 سنة')
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Insert default insurance companies
INSERT INTO insurance_companies (name, name_ar) VALUES
  ('Allianz', 'أليانز'),
  ('Axa', 'أكسا'),
  ('Anadolu', 'أنادولو'),
  ('Gulf', 'خليج'),
  ('Neova', 'نيوفا'),
  ('Ray', 'راي'),
  ('Unico', 'يونيكو')
ON CONFLICT (name) DO NOTHING;

-- Insert default pricing data (example prices - admin can modify)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try) 
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  duration,
  CASE 
    WHEN ag.min_age = 0 THEN 5985.00
    WHEN ag.min_age = 16 THEN 2970.00
    WHEN ag.min_age = 36 THEN 3325.00
    WHEN ag.min_age = 46 THEN 4719.00
    WHEN ag.min_age = 51 THEN 5220.00
    WHEN ag.min_age = 56 THEN 5950.00
    WHEN ag.min_age = 61 THEN 6825.00
    WHEN ag.min_age = 66 THEN 11220.00
    ELSE 5000.00
  END * CASE WHEN duration = 24 THEN 1.8 ELSE 1.0 END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
CROSS JOIN (VALUES (12), (24)) as durations(duration)
WHERE ic.is_active = true AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO NOTHING;

-- Enable RLS
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for insurance companies (read-only for all users)
CREATE POLICY "Allow read access to insurance companies" ON insurance_companies
  FOR SELECT USING (true);

-- Create policies for age groups (read-only for all users)
CREATE POLICY "Allow read access to age groups" ON age_groups
  FOR SELECT USING (true);

-- Create policies for health insurance pricing (read-only for all users)
CREATE POLICY "Allow read access to health insurance pricing" ON health_insurance_pricing
  FOR SELECT USING (true);

-- Create policies for health insurance requests
CREATE POLICY "Users can view their own requests" ON health_insurance_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests" ON health_insurance_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" ON health_insurance_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (for moderators and admins)
CREATE POLICY "Admins can manage all insurance data" ON insurance_companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage all age groups" ON age_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage all pricing" ON health_insurance_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can view all requests" ON health_insurance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update all requests" ON health_insurance_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'moderator')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_insurance_pricing_company ON health_insurance_pricing(company_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_pricing_age_group ON health_insurance_pricing(age_group_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_pricing_active ON health_insurance_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_user ON health_insurance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_status ON health_insurance_requests(status);
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_created ON health_insurance_requests(created_at);

-- Create function to get health insurance pricing
CREATE OR REPLACE FUNCTION get_health_insurance_pricing(
  p_company_id uuid DEFAULT NULL,
  p_age_group_id uuid DEFAULT NULL
)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  company_name_ar text,
  age_group_id uuid,
  age_group_name text,
  age_group_name_ar text,
  min_age integer,
  max_age integer,
  duration_months integer,
  price_try decimal(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.id as company_id,
    ic.name as company_name,
    ic.name_ar as company_name_ar,
    ag.id as age_group_id,
    ag.name as age_group_name,
    ag.name_ar as age_group_name_ar,
    ag.min_age,
    ag.max_age,
    hip.duration_months,
    hip.price_try
  FROM health_insurance_pricing hip
  JOIN insurance_companies ic ON hip.company_id = ic.id
  JOIN age_groups ag ON hip.age_group_id = ag.id
  WHERE hip.is_active = true 
    AND ic.is_active = true 
    AND ag.is_active = true
    AND (p_company_id IS NULL OR ic.id = p_company_id)
    AND (p_age_group_id IS NULL OR ag.id = p_age_group_id)
  ORDER BY ag.min_age, ic.name, hip.duration_months;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
