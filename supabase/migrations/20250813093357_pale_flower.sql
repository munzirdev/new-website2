/*
  # Fix infinite recursion in admin policies

  1. Security Changes
    - Remove recursive policy from admin_users table
    - Simplify admin check in service_requests policies
    - Use direct email comparison instead of recursive admin_users lookup

  2. Policy Updates
    - admin_users: Allow authenticated users to read (no admin check needed)
    - service_requests: Direct email check against admin_users table
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can read all requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON service_requests;

-- Create non-recursive policy for admin_users table
-- Allow authenticated users to read admin_users (needed for admin checks)
CREATE POLICY "Allow authenticated users to read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified admin policies for service_requests
-- Check if current user's email exists in admin_users table directly
CREATE POLICY "Admins can read all requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') IN (
      SELECT email FROM admin_users
    )
  );

CREATE POLICY "Admins can update all requests"
  ON service_requests
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') IN (
      SELECT email FROM admin_users
    )
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'email') IN (
      SELECT email FROM admin_users
    )
  );
