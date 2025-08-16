import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use the same configuration as the app
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fctvityawavmuethxxix.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is required');
  process.exit(1);
}

console.log('🔧 فحص البكت باستخدام نفس إعدادات التطبيق...');
console.log('URL:', supabaseUrl);
console.log('Anon Key موجود:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBucket() {
  try {
    console.log('🔍 فحص البكتات...');
    
    // Check buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ خطأ في فحص البكتات:', bucketsError);
      return false;
    }
    
    console.log('✅ البكتات الموجودة:', buckets?.map(b => b.name) || []);
    
    // Check if passport-images exists
    const passportBucket = buckets?.find(b => b.name === 'passport-images');
    if (!passportBucket) {
      console.error('❌ بكت passport-images غير موجود!');
      return false;
    }
    
    console.log('✅ بكت passport-images موجود');
    console.log('   - Public:', passportBucket.public);
    console.log('   - File size limit:', passportBucket.file_size_limit);
    
    // Try to list files in the bucket
    console.log('🔍 فحص الملفات في البكت...');
    const { data: files, error: filesError } = await supabase.storage
      .from('passport-images')
      .list();
    
    if (filesError) {
      console.error('❌ خطأ في فحص الملفات:', filesError);
    } else {
      console.log('✅ الملفات الموجودة:', files?.map(f => f.name) || []);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
    return false;
  }
}

// Run the check
checkBucket()
  .then((success) => {
    if (success) {
      console.log('\n✅ البكت يعمل بشكل صحيح!');
    } else {
      console.log('\n❌ هناك مشكلة في البكت');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ فشل في فحص البكت:', error);
    process.exit(1);
  });
