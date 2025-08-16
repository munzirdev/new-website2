-- Update health_insurance_requests table to include new fields
-- This migration adds passport_image_url and insurance_offer_confirmed fields

-- Add new columns to health_insurance_requests table
ALTER TABLE health_insurance_requests 
ADD COLUMN IF NOT EXISTS passport_image_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_offer_confirmed BOOLEAN DEFAULT false;

-- Create storage bucket for passport images if it doesn't exist
-- Note: This needs to be done manually in Supabase dashboard
-- Go to Storage > Create bucket named 'passport-images'

-- Update existing records to have default values
UPDATE health_insurance_requests 
SET insurance_offer_confirmed = false 
WHERE insurance_offer_confirmed IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN health_insurance_requests.passport_image_url IS 'URL to uploaded passport or residence image';
COMMENT ON COLUMN health_insurance_requests.insurance_offer_confirmed IS 'Whether the customer confirmed the insurance offer';

-- Create index for faster queries on insurance_offer_confirmed
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_offer_confirmed 
ON health_insurance_requests(insurance_offer_confirmed);

-- Create index for faster queries on passport_image_url
CREATE INDEX IF NOT EXISTS idx_health_insurance_requests_passport_image 
ON health_insurance_requests(passport_image_url) 
WHERE passport_image_url IS NOT NULL;
