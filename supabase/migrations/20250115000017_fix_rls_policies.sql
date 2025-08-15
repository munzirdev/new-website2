-- Fix RLS policies for health insurance tables
-- This migration ensures data is visible to all users

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to insurance companies" ON insurance_companies;
DROP POLICY IF EXISTS "Allow read access to age groups" ON age_groups;
DROP POLICY IF EXISTS "Allow read access to health insurance pricing" ON health_insurance_pricing;
DROP POLICY IF EXISTS "Admins can manage all insurance data" ON insurance_companies;
DROP POLICY IF EXISTS "Admins can manage all age groups" ON age_groups;
DROP POLICY IF EXISTS "Admins can manage all pricing" ON health_insurance_pricing;

-- Create new policies that allow all authenticated users to read data
CREATE POLICY "Allow all authenticated to read insurance companies" ON insurance_companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated to read age groups" ON age_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated to read health insurance pricing" ON health_insurance_pricing
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create admin policies for full access
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
