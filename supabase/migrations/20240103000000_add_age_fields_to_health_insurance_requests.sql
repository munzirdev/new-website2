-- Add customer_age and birth_date columns to health_insurance_requests table
-- This migration adds the missing age and birth date fields that are needed for the health insurance management

-- Add customer_age column (integer, nullable)
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS customer_age INTEGER;

-- Add birth_date column (date, nullable)
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN health_insurance_requests.customer_age IS 'Customer age calculated from birth date or entered manually';
COMMENT ON COLUMN health_insurance_requests.birth_date IS 'Customer birth date for age calculation and verification';
