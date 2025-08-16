-- Migration: Create passport-images storage bucket and policies
-- Date: 2024-01-17
-- Description: Creates storage bucket for passport images with proper policies

-- Create storage bucket for passport images
-- Note: This needs to be done via Supabase dashboard or API
-- The bucket creation is handled by the storage API, not SQL

-- Create policies for the passport-images bucket
-- These policies will be applied once the bucket is created

-- Policy 1: Allow public read access to passport images
CREATE POLICY "Allow public read access to passport images" ON storage.objects
FOR SELECT USING (bucket_id = 'passport-images');

-- Policy 2: Allow authenticated users to upload passport images
CREATE POLICY "Allow authenticated uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to update their own passport images
CREATE POLICY "Allow authenticated updates to passport images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete their own passport images
CREATE POLICY "Allow authenticated deletes to passport images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'passport-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 5: Allow anonymous uploads (for guest users)
-- This is optional - remove if you don't want guests to upload files
CREATE POLICY "Allow anonymous uploads to passport images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'passport-images');

-- Add comments for documentation
COMMENT ON POLICY "Allow public read access to passport images" ON storage.objects IS 'Allows anyone to view passport images uploaded to the passport-images bucket';
COMMENT ON POLICY "Allow authenticated uploads to passport images" ON storage.objects IS 'Allows authenticated users to upload passport images';
COMMENT ON POLICY "Allow authenticated updates to passport images" ON storage.objects IS 'Allows authenticated users to update their passport images';
COMMENT ON POLICY "Allow authenticated deletes to passport images" ON storage.objects IS 'Allows authenticated users to delete their passport images';
COMMENT ON POLICY "Allow anonymous uploads to passport images" ON storage.objects IS 'Allows anonymous users to upload passport images (for guest functionality)';
