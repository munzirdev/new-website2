-- Apply Health Insurance Data from Skyline.pdf
-- This script can be run directly in the Supabase SQL editor
-- It adds new companies, age groups, and pricing data from the PDF

-- Add new insurance companies from the PDF
INSERT INTO insurance_companies (name, name_ar, is_active) VALUES
  ('Magdeburger Sigorta Eco', 'Magdeburger Sigorta Eco', true),
  ('Magdeburger Gümüş', 'Magdeburger Gümüş', true),
  ('Magdeburger Sigorta', 'Magdeburger Sigorta', true),
  ('Ankara Sigorta Eco', 'Ankara Sigorta Eco', true),
  ('Ankara Sigorta', 'Ankara Sigorta', true)
ON CONFLICT (name) DO NOTHING;

-- Add new age groups to match the PDF data
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
  (0, 16, '0-16 years', '0-16 سنة', true),
  (17, 25, '17-25 years', '17-25 سنة', true),
  (26, 35, '26-35 years', '26-35 سنة', true),
  (36, 45, '36-45 years', '36-45 سنة', true),
  (46, 55, '46-55 years', '46-55 سنة', true),
  (56, 60, '56-60 years', '56-60 سنة', true),
  (61, 65, '61-65 years', '61-65 سنة', true),
  (66, 70, '66-70 years', '66-70 سنة', true),
  (0, 15, '0-15 years', '0-15 سنة', true),
  (16, 35, '16-35 years', '16-35 سنة', true),
  (46, 50, '46-50 years', '46-50 سنة', true),
  (51, 55, '51-55 years', '51-55 سنة', true),
  (66, 69, '66-69 years', '66-69 سنة', true)
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Add pricing data from the PDF
-- Magdeburger Sigorta Eco pricing
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 16 THEN 1050.00
    WHEN ag.min_age = 17 AND ag.max_age = 25 THEN 410.50
    WHEN ag.min_age = 26 AND ag.max_age = 35 THEN 418.10
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 500.25
    WHEN ag.min_age = 46 AND ag.max_age = 55 THEN 645.20
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 809.50
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 1110.75
    WHEN ag.min_age = 66 AND ag.max_age = 70 THEN 1851.30
    ELSE 1000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Magdeburger Sigorta Eco'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 16 THEN 1575.50
    WHEN ag.min_age = 17 AND ag.max_age = 25 THEN 482.25
    WHEN ag.min_age = 26 AND ag.max_age = 35 THEN 447.88
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 544.88
    WHEN ag.min_age = 46 AND ag.max_age = 55 THEN 725.75
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 882.25
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 1212.13
    WHEN ag.min_age = 66 AND ag.max_age = 70 THEN 2120.25
    ELSE 1500.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Magdeburger Sigorta Eco'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Magdeburger Gümüş pricing
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 16 THEN 1837.50
    WHEN ag.min_age = 17 AND ag.max_age = 25 THEN 1023.25
    WHEN ag.min_age = 26 AND ag.max_age = 35 THEN 1044.25
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 1317.25
    WHEN ag.min_age = 46 AND ag.max_age = 55 THEN 1449.50
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 1764.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 1917.75
    WHEN ag.min_age = 66 AND ag.max_age = 70 THEN 3029.40
    ELSE 1800.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Magdeburger Gümüş'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 16 THEN 1968.75
    WHEN ag.min_age = 17 AND ag.max_age = 25 THEN 1096.75
    WHEN ag.min_age = 26 AND ag.max_age = 35 THEN 1118.88
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 1362.88
    WHEN ag.min_age = 46 AND ag.max_age = 55 THEN 1529.75
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 1764.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 1968.13
    WHEN ag.min_age = 66 AND ag.max_age = 70 THEN 3281.25
    ELSE 1900.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Magdeburger Gümüş'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Magdeburger Sigorta pricing
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 16 THEN 5250.00
    WHEN ag.min_age = 17 AND ag.max_age = 25 THEN 2925.00
    WHEN ag.min_age = 26 AND ag.max_age = 35 THEN 2985.00
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 4545.00
    WHEN ag.min_age = 46 AND ag.max_age = 55 THEN 5370.00
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 7350.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 10095.00
    WHEN ag.min_age = 66 AND ag.max_age = 69 THEN 16830.00
    ELSE 5000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Magdeburger Sigorta'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 16 THEN 7875.00
    WHEN ag.min_age = 17 AND ag.max_age = 25 THEN 4387.00
    WHEN ag.min_age = 26 AND ag.max_age = 35 THEN 4477.00
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 6817.00
    WHEN ag.min_age = 46 AND ag.max_age = 55 THEN 7000.00
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 11025.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 15142.00
    WHEN ag.min_age = 66 AND ag.max_age = 69 THEN 25245.00
    ELSE 7500.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Magdeburger Sigorta'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Ankara Sigorta Eco pricing
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 15 THEN 2850.00
    WHEN ag.min_age = 16 AND ag.max_age = 35 THEN 1100.00
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 1330.00
    WHEN ag.min_age = 46 AND ag.max_age = 50 THEN 1430.00
    WHEN ag.min_age = 51 AND ag.max_age = 55 THEN 1450.00
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 1750.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 1950.00
    WHEN ag.min_age = 66 AND ag.max_age = 69 THEN 5100.00
    ELSE 2000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ankara Sigorta Eco'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 15 THEN 2850.00
    WHEN ag.min_age = 16 AND ag.max_age = 35 THEN 1100.00
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 1330.00
    WHEN ag.min_age = 46 AND ag.max_age = 50 THEN 1430.00
    WHEN ag.min_age = 51 AND ag.max_age = 55 THEN 1450.00
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 1750.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 1950.00
    WHEN ag.min_age = 66 AND ag.max_age = 69 THEN 5100.00
    ELSE 2000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ankara Sigorta Eco'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Ankara Sigorta pricing
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 15 THEN 5985.00
    WHEN ag.min_age = 16 AND ag.max_age = 35 THEN 2970.00
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 3325.00
    WHEN ag.min_age = 46 AND ag.max_age = 50 THEN 4719.00
    WHEN ag.min_age = 51 AND ag.max_age = 55 THEN 5220.00
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 5950.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 6825.00
    WHEN ag.min_age = 66 AND ag.max_age = 69 THEN 11220.00
    ELSE 5000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ankara Sigorta'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 AND ag.max_age = 15 THEN 5985.00
    WHEN ag.min_age = 16 AND ag.max_age = 35 THEN 2970.00
    WHEN ag.min_age = 36 AND ag.max_age = 45 THEN 3325.00
    WHEN ag.min_age = 46 AND ag.max_age = 50 THEN 4719.00
    WHEN ag.min_age = 51 AND ag.max_age = 55 THEN 5220.00
    WHEN ag.min_age = 56 AND ag.max_age = 60 THEN 5950.00
    WHEN ag.min_age = 61 AND ag.max_age = 65 THEN 6825.00
    WHEN ag.min_age = 66 AND ag.max_age = 69 THEN 11220.00
    ELSE 5000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ankara Sigorta'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Show summary of what was added
SELECT 'Companies added:' as summary;
SELECT name, name_ar FROM insurance_companies WHERE name IN (
  'Magdeburger Sigorta Eco',
  'Magdeburger Gümüş',
  'Magdeburger Sigorta',
  'Ankara Sigorta Eco',
  'Ankara Sigorta'
);

SELECT 'Age groups added:' as summary;
SELECT name, name_ar, min_age, max_age FROM age_groups WHERE name IN (
  '0-16 years', '17-25 years', '26-35 years', '36-45 years', '46-55 years',
  '56-60 years', '61-65 years', '66-70 years', '0-15 years', '16-35 years',
  '46-50 years', '51-55 years', '66-69 years'
);

SELECT 'Pricing records added:' as summary;
SELECT COUNT(*) as total_pricing_records FROM health_insurance_pricing;
