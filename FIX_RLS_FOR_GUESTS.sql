-- Fix RLS policies for health_insurance_requests table to allow guests to submit requests
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE health_insurance_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own health insurance requests" ON health_insurance_requests;
DROP POLICY IF EXISTS "Users can insert their own health insurance requests" ON health_insurance_requests;
DROP POLICY IF EXISTS "Users can update their own health insurance requests" ON health_insurance_requests;
DROP POLICY IF EXISTS "Users can delete their own health insurance requests" ON health_insurance_requests;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON health_insurance_requests;
DROP POLICY IF EXISTS "Allow insert for all users" ON health_insurance_requests;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON health_insurance_requests;

-- Create new policies that allow both authenticated users and guests

-- Policy 1: Allow anyone to insert health insurance requests (for guests and authenticated users)
CREATE POLICY "Allow insert for all users" ON health_insurance_requests
FOR INSERT
WITH CHECK (true);

-- Policy 2: Allow authenticated users to view their own requests
CREATE POLICY "Users can view their own health insurance requests" ON health_insurance_requests
FOR SELECT
USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL)
);

-- Policy 3: Allow authenticated users to update their own requests
CREATE POLICY "Users can update their own health insurance requests" ON health_insurance_requests
FOR UPDATE
USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
);

-- Policy 4: Allow authenticated users to delete their own requests
CREATE POLICY "Users can delete their own health insurance requests" ON health_insurance_requests
FOR DELETE
USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
);

-- Policy 5: Allow admin users to view all requests (optional - for admin panel)
CREATE POLICY "Admin can view all health insurance requests" ON health_insurance_requests
FOR SELECT
USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Add comments to explain the policies
COMMENT ON POLICY "Allow insert for all users" ON health_insurance_requests IS 'Allows both guests and authenticated users to submit health insurance requests';
COMMENT ON POLICY "Users can view their own health insurance requests" ON health_insurance_requests IS 'Allows authenticated users to view their own requests or requests without user_id';
COMMENT ON POLICY "Users can update their own health insurance requests" ON health_insurance_requests IS 'Allows authenticated users to update only their own requests';
COMMENT ON POLICY "Users can delete their own health insurance requests" ON health_insurance_requests IS 'Allows authenticated users to delete only their own requests';
COMMENT ON POLICY "Admin can view all health insurance requests" ON health_insurance_requests IS 'Allows admin users to view all health insurance requests for management purposes';

-- Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'health_insurance_requests';
