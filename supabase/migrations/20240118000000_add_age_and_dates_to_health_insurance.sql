-- Add age, birth date, and submission date to health_insurance_requests table
-- This migration adds customer age, birth date, and submission date fields

-- Add new columns to health_insurance_requests table
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS customer_age INTEGER,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments to document the new fields
COMMENT ON COLUMN health_insurance_requests.customer_age IS 'Age of the customer at the time of request';
COMMENT ON COLUMN health_insurance_requests.birth_date IS 'Customer birth date in Gregorian calendar';
COMMENT ON COLUMN health_insurance_requests.submission_date IS 'Date and time when the request was submitted';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_customer_age 
ON health_insurance_requests(customer_age);

CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_birth_date 
ON health_insurance_requests(birth_date);

CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_submission_date 
ON health_insurance_requests(submission_date);

-- Update existing records to set submission_date to created_at if not set
UPDATE health_insurance_requests 
SET submission_date = created_at 
WHERE submission_date IS NULL;
