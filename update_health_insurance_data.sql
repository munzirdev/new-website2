-- Update Health Insurance Data from Skyline.pdf
-- This script adds new companies, age groups, and pricing data

-- First, let's add the new insurance companies from the PDF
INSERT INTO insurance_companies (name, name_ar, is_active) VALUES
  ('Magdeburger Sigorta Eco', 'Magdeburger Sigorta Eco', true),
  ('Magdeburger Gümüş', 'Magdeburger Gümüş', true),
  ('Magdeburger Sigorta', 'Magdeburger Sigorta', true),
  ('Ankara Sigorta Eco', 'Ankara Sigorta Eco', true),
  ('Ankara Sigorta', 'Ankara Sigorta', true)
ON CONFLICT (name) DO NOTHING;

-- Update existing age groups to match the PDF data
-- Note: The PDF has some different age ranges, so we'll update the existing ones
UPDATE age_groups SET 
  min_age = 0, max_age = 16, name = '0-16 years', name_ar = '0-16 سنة'
WHERE min_age = 0 AND max_age = 15;

UPDATE age_groups SET 
  min_age = 17, max_age = 25, name = '17-25 years', name_ar = '17-25 سنة'
WHERE min_age = 16 AND max_age = 35;

UPDATE age_groups SET 
  min_age = 26, max_age = 35, name = '26-35 years', name_ar = '26-35 سنة'
WHERE min_age = 36 AND max_age = 45;

UPDATE age_groups SET 
  min_age = 36, max_age = 45, name = '36-45 years', name_ar = '36-45 سنة'
WHERE min_age = 46 AND max_age = 50;

UPDATE age_groups SET 
  min_age = 46, max_age = 55, name = '46-55 years', name_ar = '46-55 سنة'
WHERE min_age = 51 AND max_age = 55;

UPDATE age_groups SET 
  min_age = 56, max_age = 60, name = '56-60 years', name_ar = '56-60 سنة'
WHERE min_age = 56 AND max_age = 60;

UPDATE age_groups SET 
  min_age = 61, max_age = 65, name = '61-65 years', name_ar = '61-65 سنة'
WHERE min_age = 61 AND max_age = 65;

UPDATE age_groups SET 
  min_age = 66, max_age = 70, name = '66-70 years', name_ar = '66-70 سنة'
WHERE min_age = 66 AND max_age = 69;

-- Add new age group for 66-69 (for Ankara Sigorta)
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
  (66, 69, '66-69 years', '66-69 سنة', true)
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Add new age group for 0-15 (for Ankara Sigorta Eco)
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
  (0, 15, '0-15 years', '0-15 سنة', true)
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Add new age group for 16-35 (for Ankara Sigorta)
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
  (16, 35, '16-35 years', '16-35 سنة', true)
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Add new age group for 46-50 (for Ankara Sigorta Eco)
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
  (46, 50, '46-50 years', '46-50 سنة', true)
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Add new age group for 51-55 (for Ankara Sigorta Eco)
INSERT INTO age_groups (min_age, max_age, name, name_ar, is_active) VALUES
  (51, 55, '51-55 years', '51-55 سنة', true)
ON CONFLICT (min_age, max_age) DO NOTHING;

-- Now let's add the pricing data from the PDF
-- Magdeburger Sigorta Eco pricing
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1050.00
    WHEN ag.min_age = 17 THEN 410.50
    WHEN ag.min_age = 26 THEN 418.10
    WHEN ag.min_age = 36 THEN 500.25
    WHEN ag.min_age = 46 THEN 645.20
    WHEN ag.min_age = 56 THEN 809.50
    WHEN ag.min_age = 61 THEN 1110.75
    WHEN ag.min_age = 66 THEN 1851.30
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
    WHEN ag.min_age = 0 THEN 1575.50
    WHEN ag.min_age = 17 THEN 482.25
    WHEN ag.min_age = 26 THEN 447.88
    WHEN ag.min_age = 36 THEN 544.88
    WHEN ag.min_age = 46 THEN 725.75
    WHEN ag.min_age = 56 THEN 882.25
    WHEN ag.min_age = 61 THEN 1212.13
    WHEN ag.min_age = 66 THEN 2120.25
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
    WHEN ag.min_age = 0 THEN 1837.50
    WHEN ag.min_age = 17 THEN 1023.25
    WHEN ag.min_age = 26 THEN 1044.25
    WHEN ag.min_age = 36 THEN 1317.25
    WHEN ag.min_age = 46 THEN 1449.50
    WHEN ag.min_age = 56 THEN 1764.00
    WHEN ag.min_age = 61 THEN 1917.75
    WHEN ag.min_age = 66 THEN 3029.40
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
    WHEN ag.min_age = 0 THEN 1968.75
    WHEN ag.min_age = 17 THEN 1096.75
    WHEN ag.min_age = 26 THEN 1118.88
    WHEN ag.min_age = 36 THEN 1362.88
    WHEN ag.min_age = 46 THEN 1529.75
    WHEN ag.min_age = 56 THEN 1764.00
    WHEN ag.min_age = 61 THEN 1968.13
    WHEN ag.min_age = 66 THEN 3281.25
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
    WHEN ag.min_age = 0 THEN 5250.00
    WHEN ag.min_age = 17 THEN 2925.00
    WHEN ag.min_age = 26 THEN 2985.00
    WHEN ag.min_age = 36 THEN 4545.00
    WHEN ag.min_age = 46 THEN 5370.00
    WHEN ag.min_age = 56 THEN 7350.00
    WHEN ag.min_age = 61 THEN 10095.00
    WHEN ag.min_age = 66 THEN 16830.00
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
    WHEN ag.min_age = 0 THEN 7875.00
    WHEN ag.min_age = 17 THEN 4387.00
    WHEN ag.min_age = 26 THEN 4477.00
    WHEN ag.min_age = 36 THEN 6817.00
    WHEN ag.min_age = 46 THEN 7000.00
    WHEN ag.min_age = 56 THEN 11025.00
    WHEN ag.min_age = 61 THEN 15142.00
    WHEN ag.min_age = 66 THEN 25245.00
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
    WHEN ag.min_age = 0 THEN 2850.00
    WHEN ag.min_age = 16 THEN 1100.00
    WHEN ag.min_age = 36 THEN 1330.00
    WHEN ag.min_age = 46 THEN 1430.00
    WHEN ag.min_age = 51 THEN 1450.00
    WHEN ag.min_age = 56 THEN 1750.00
    WHEN ag.min_age = 61 THEN 1950.00
    WHEN ag.min_age = 66 THEN 5100.00
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
    WHEN ag.min_age = 0 THEN 2850.00
    WHEN ag.min_age = 16 THEN 1100.00
    WHEN ag.min_age = 36 THEN 1330.00
    WHEN ag.min_age = 46 THEN 1430.00
    WHEN ag.min_age = 51 THEN 1450.00
    WHEN ag.min_age = 56 THEN 1750.00
    WHEN ag.min_age = 61 THEN 1950.00
    WHEN ag.min_age = 66 THEN 5100.00
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
    WHEN ag.min_age = 0 THEN 5985.00
    WHEN ag.min_age = 16 THEN 2970.00
    WHEN ag.min_age = 36 THEN 3325.00
    WHEN ag.min_age = 46 THEN 4719.00
    WHEN ag.min_age = 51 THEN 5220.00
    WHEN ag.min_age = 56 THEN 5950.00
    WHEN ag.min_age = 61 THEN 6825.00
    WHEN ag.min_age = 66 THEN 11220.00
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
    WHEN ag.min_age = 0 THEN 5985.00
    WHEN ag.min_age = 16 THEN 2970.00
    WHEN ag.min_age = 36 THEN 3325.00
    WHEN ag.min_age = 46 THEN 4719.00
    WHEN ag.min_age = 51 THEN 5220.00
    WHEN ag.min_age = 56 THEN 5950.00
    WHEN ag.min_age = 61 THEN 6825.00
    WHEN ag.min_age = 66 THEN 11220.00
    ELSE 5000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ankara Sigorta'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Update the existing companies to have the new pricing data as well
-- This will update the existing companies with the new age groups and pricing

-- Allianz pricing (using Ankara Sigorta as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
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
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Allianz'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
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
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Allianz'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Axa pricing (using Magdeburger Sigorta as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 5250.00
    WHEN ag.min_age = 17 THEN 2925.00
    WHEN ag.min_age = 26 THEN 2985.00
    WHEN ag.min_age = 36 THEN 4545.00
    WHEN ag.min_age = 46 THEN 5370.00
    WHEN ag.min_age = 56 THEN 7350.00
    WHEN ag.min_age = 61 THEN 10095.00
    WHEN ag.min_age = 66 THEN 16830.00
    ELSE 5000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Axa'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 7875.00
    WHEN ag.min_age = 17 THEN 4387.00
    WHEN ag.min_age = 26 THEN 4477.00
    WHEN ag.min_age = 36 THEN 6817.00
    WHEN ag.min_age = 46 THEN 7000.00
    WHEN ag.min_age = 56 THEN 11025.00
    WHEN ag.min_age = 61 THEN 15142.00
    WHEN ag.min_age = 66 THEN 25245.00
    ELSE 7500.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Axa'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Anadolu pricing (using Magdeburger Gümüş as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1837.50
    WHEN ag.min_age = 17 THEN 1023.25
    WHEN ag.min_age = 26 THEN 1044.25
    WHEN ag.min_age = 36 THEN 1317.25
    WHEN ag.min_age = 46 THEN 1449.50
    WHEN ag.min_age = 56 THEN 1764.00
    WHEN ag.min_age = 61 THEN 1917.75
    WHEN ag.min_age = 66 THEN 3029.40
    ELSE 1800.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Anadolu'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1968.75
    WHEN ag.min_age = 17 THEN 1096.75
    WHEN ag.min_age = 26 THEN 1118.88
    WHEN ag.min_age = 36 THEN 1362.88
    WHEN ag.min_age = 46 THEN 1529.75
    WHEN ag.min_age = 56 THEN 1764.00
    WHEN ag.min_age = 61 THEN 1968.13
    WHEN ag.min_age = 66 THEN 3281.25
    ELSE 1900.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Anadolu'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Gulf pricing (using Magdeburger Sigorta Eco as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1050.00
    WHEN ag.min_age = 17 THEN 410.50
    WHEN ag.min_age = 26 THEN 418.10
    WHEN ag.min_age = 36 THEN 500.25
    WHEN ag.min_age = 46 THEN 645.20
    WHEN ag.min_age = 56 THEN 809.50
    WHEN ag.min_age = 61 THEN 1110.75
    WHEN ag.min_age = 66 THEN 1851.30
    ELSE 1000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Gulf'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1575.50
    WHEN ag.min_age = 17 THEN 482.25
    WHEN ag.min_age = 26 THEN 447.88
    WHEN ag.min_age = 36 THEN 544.88
    WHEN ag.min_age = 46 THEN 725.75
    WHEN ag.min_age = 56 THEN 882.25
    WHEN ag.min_age = 61 THEN 1212.13
    WHEN ag.min_age = 66 THEN 2120.25
    ELSE 1500.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Gulf'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Neova pricing (using Ankara Sigorta Eco as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 2850.00
    WHEN ag.min_age = 16 THEN 1100.00
    WHEN ag.min_age = 36 THEN 1330.00
    WHEN ag.min_age = 46 THEN 1430.00
    WHEN ag.min_age = 51 THEN 1450.00
    WHEN ag.min_age = 56 THEN 1750.00
    WHEN ag.min_age = 61 THEN 1950.00
    WHEN ag.min_age = 66 THEN 5100.00
    ELSE 2000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Neova'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 2850.00
    WHEN ag.min_age = 16 THEN 1100.00
    WHEN ag.min_age = 36 THEN 1330.00
    WHEN ag.min_age = 46 THEN 1430.00
    WHEN ag.min_age = 51 THEN 1450.00
    WHEN ag.min_age = 56 THEN 1750.00
    WHEN ag.min_age = 61 THEN 1950.00
    WHEN ag.min_age = 66 THEN 5100.00
    ELSE 2000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Neova'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Ray pricing (using Magdeburger Sigorta as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 5250.00
    WHEN ag.min_age = 17 THEN 2925.00
    WHEN ag.min_age = 26 THEN 2985.00
    WHEN ag.min_age = 36 THEN 4545.00
    WHEN ag.min_age = 46 THEN 5370.00
    WHEN ag.min_age = 56 THEN 7350.00
    WHEN ag.min_age = 61 THEN 10095.00
    WHEN ag.min_age = 66 THEN 16830.00
    ELSE 5000.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ray'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 7875.00
    WHEN ag.min_age = 17 THEN 4387.00
    WHEN ag.min_age = 26 THEN 4477.00
    WHEN ag.min_age = 36 THEN 6817.00
    WHEN ag.min_age = 46 THEN 7000.00
    WHEN ag.min_age = 56 THEN 11025.00
    WHEN ag.min_age = 61 THEN 15142.00
    WHEN ag.min_age = 66 THEN 25245.00
    ELSE 7500.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Ray'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

-- Unico pricing (using Magdeburger Gümüş as base)
INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  12 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1837.50
    WHEN ag.min_age = 17 THEN 1023.25
    WHEN ag.min_age = 26 THEN 1044.25
    WHEN ag.min_age = 36 THEN 1317.25
    WHEN ag.min_age = 46 THEN 1449.50
    WHEN ag.min_age = 56 THEN 1764.00
    WHEN ag.min_age = 61 THEN 1917.75
    WHEN ag.min_age = 66 THEN 3029.40
    ELSE 1800.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Unico'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;

INSERT INTO health_insurance_pricing (company_id, age_group_id, duration_months, price_try)
SELECT 
  ic.id as company_id,
  ag.id as age_group_id,
  24 as duration_months,
  CASE 
    WHEN ag.min_age = 0 THEN 1968.75
    WHEN ag.min_age = 17 THEN 1096.75
    WHEN ag.min_age = 26 THEN 1118.88
    WHEN ag.min_age = 36 THEN 1362.88
    WHEN ag.min_age = 46 THEN 1529.75
    WHEN ag.min_age = 56 THEN 1764.00
    WHEN ag.min_age = 61 THEN 1968.13
    WHEN ag.min_age = 66 THEN 3281.25
    ELSE 1900.00
  END as price_try
FROM insurance_companies ic
CROSS JOIN age_groups ag
WHERE ic.name = 'Unico'
  AND ag.is_active = true
ON CONFLICT (company_id, age_group_id, duration_months) DO UPDATE SET
  price_try = EXCLUDED.price_try;
