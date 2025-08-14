/*
  # Fix foreign key relationship between service_requests and user_profiles

  1. Changes
    - Update foreign key constraint in service_requests table to reference user_profiles instead of auth.users
    - This allows proper joins between service_requests and user_profiles tables

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication or authorization
*/

-- Drop the existing foreign key constraint that references auth.users
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

-- Add the correct foreign key constraint that references user_profiles
ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
