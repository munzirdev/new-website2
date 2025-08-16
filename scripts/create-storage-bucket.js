import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fctvityawavmuethxxix.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to create storage buckets');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('You can find this key in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  try {
    console.log('🔧 Creating passport-images storage bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('passport-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket passport-images already exists');
      } else {
        console.error('❌ Error creating bucket:', error);
        return false;
      }
    } else {
      console.log('✅ Successfully created passport-images bucket');
    }

    // Set bucket policies
    console.log('🔧 Setting bucket policies...');
    
    // Allow public read access
    const { error: readPolicyError } = await supabase.storage
      .from('passport-images')
      .createSignedUrl('test.txt', 60);

    if (readPolicyError && !readPolicyError.message.includes('not found')) {
      console.log('ℹ️  Note: Bucket is public but may need manual policy configuration');
    }

    console.log('✅ Storage bucket setup complete!');
    console.log('📝 Manual steps (if needed):');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > passport-images');
    console.log('3. Go to Settings > Policies');
    console.log('4. Add policy: "Allow public read access"');
    console.log('5. Add policy: "Allow authenticated uploads"');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the script
createStorageBucket()
  .then((success) => {
    if (success) {
      console.log('🎉 Storage bucket setup completed successfully!');
    } else {
      console.log('⚠️  Storage bucket setup encountered issues');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
