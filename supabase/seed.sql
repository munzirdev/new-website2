-- Seed data for health insurance
-- This file will be run after migrations

-- Insert default age groups if they don't exist
INSERT INTO age_groups (min_age, max_age, name, name_ar) VALUES
  (0, 15, '0-15 years', '0-15 ط³ظ†ط©'),
  (16, 35, '16-35 years', '16-35 ط³ظ†ط©'),
  (36, 45, '36-45 years', '36-45 ط³ظ†ط©'),
  (46, 50, '46-50 years', '46-50 ط³ظ†ط©'),
  (51, 55, '51-55 years', '51-55 ط³ظ†ط©'),
  (56, 60, '56-60 years', '56-60 ط³ظ†ط©'),
  (61, 65, '61-65 years', '61-65 ط³ظ†ط©'),
  (66, 69, '66-69 years', '66-69 ط³ظ†ط©')
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Insert default insurance companies if they don't exist
INSERT INTO insurance_companies (name, name_ar) VALUES
  ('Allianz', 'ط£ظ„ظٹط§ظ†ط²'),
  ('Axa', 'ط£ظƒط³ط§'),
  ('Anadolu', 'ط£ظ†ط§ط¯ظˆظ„ظˆ'),
  ('Gulf', 'ط®ظ„ظٹط¬'),
  ('Neova', 'ظ†ظٹظˆظپط§'),
  ('Ray', 'ط±ط§ظٹ'),
  ('Unico', 'ظٹظˆظ†ظٹظƒظˆ')
ON CONFLICT (name) DO NOTHING;

-- Insert default pricing data if it doesn't exist
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

-- Create storage bucket for passport images
-- Note: This needs to be done manually in Supabase dashboard
-- Go to Storage > Create bucket named 'passport-images' with public access

-- Update existing health_insurance_requests to have default values for new fields
UPDATE health_insurance_requests 
SET 
  passport_image_url = NULL,
  insurance_offer_confirmed = false
WHERE passport_image_url IS NULL OR insurance_offer_confirmed IS NULL;
