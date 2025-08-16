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

console.log('🔧 اختبار رفع ملف مباشرة...');
console.log('URL:', supabaseUrl);
console.log('Anon Key موجود:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  try {
    console.log('🔍 اختبار رفع ملف تجريبي...');
    
    // Create a test file
    const testFileName = `test_${Date.now()}.jpg`;
    const testContent = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
    
    console.log('📁 محاولة رفع الملف:', testFileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('passport-images')
      .upload(testFileName, testContent, {
        contentType: 'image/jpeg'
      });
    
    if (uploadError) {
      console.error('❌ خطأ في رفع الملف:', uploadError);
      console.error('تفاصيل الخطأ:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        details: uploadError.details,
        hint: uploadError.hint
      });
      return false;
    }
    
    console.log('✅ تم رفع الملف بنجاح!');
    console.log('   - File path:', uploadData.path);
    console.log('   - File ID:', uploadData.id);
    
    // Try to get the public URL
    const { data: publicUrl } = supabase.storage
      .from('passport-images')
      .getPublicUrl(testFileName);
    
    console.log('🔗 الرابط العام:', publicUrl.publicUrl);
    
    // List files to confirm
    console.log('🔍 فحص الملفات في البكت...');
    const { data: files, error: filesError } = await supabase.storage
      .from('passport-images')
      .list();
    
    if (filesError) {
      console.error('❌ خطأ في فحص الملفات:', filesError);
    } else {
      console.log('✅ الملفات الموجودة:', files?.map(f => f.name) || []);
    }
    
    // Clean up - delete the test file
    console.log('🧹 حذف الملف التجريبي...');
    const { error: deleteError } = await supabase.storage
      .from('passport-images')
      .remove([testFileName]);
    
    if (deleteError) {
      console.error('❌ خطأ في حذف الملف:', deleteError);
    } else {
      console.log('✅ تم حذف الملف التجريبي بنجاح');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
    return false;
  }
}

// Run the test
testUpload()
  .then((success) => {
    if (success) {
      console.log('\n🎉 اختبار رفع الملف نجح! البكت يعمل بشكل صحيح');
    } else {
      console.log('\n❌ فشل في رفع الملف');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ فشل في تشغيل الاختبار:', error);
    process.exit(1);
  });
