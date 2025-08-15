-- Insert health insurance data
-- This migration ensures data is properly inserted

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

-- Insert default pricing data
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
