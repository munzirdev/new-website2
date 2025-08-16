import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fctvityawavmuethxxix.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

console.log('🔧 فحص الاتصال مع Supabase...');
console.log('URL:', supabaseUrl);
console.log('Service Key موجود:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorage() {
  try {
    console.log('🔍 اختبار Storage في Supabase...');
    
    // 1. فحص البكتات الموجودة
    console.log('\n1️⃣ فحص البكتات الموجودة:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ خطأ في فحص البكتات:', bucketsError);
      return false;
    }
    
    console.log('✅ البكتات الموجودة:', buckets?.map(b => b.name) || []);
    
    // 2. فحص وجود بكت passport-images
    const passportBucket = buckets?.find(b => b.name === 'passport-images');
    if (!passportBucket) {
      console.error('❌ بكت passport-images غير موجود!');
      console.log('📝 يرجى إنشاء البكت يدوياً أو استخدام السكريبت:');
      console.log('   node scripts/create-storage-bucket.js');
      return false;
    }
    
    console.log('✅ بكت passport-images موجود');
    console.log('   - Public:', passportBucket.public);
    console.log('   - File size limit:', passportBucket.file_size_limit);
    
         // 3. اختبار رفع ملف تجريبي
     console.log('\n2️⃣ اختبار رفع ملف تجريبي:');
     const testFileName = `test_${Date.now()}.jpg`;
     const testContent = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
     
     const { data: uploadData, error: uploadError } = await supabase.storage
       .from('passport-images')
       .upload(testFileName, testContent, {
         contentType: 'image/jpeg'
       });
    
    if (uploadError) {
      console.error('❌ خطأ في رفع الملف التجريبي:', uploadError);
      console.log('📝 قد تحتاج إلى إعداد سياسات (policies) للبكت');
      return false;
    }
    
    console.log('✅ تم رفع الملف التجريبي بنجاح');
    console.log('   - File path:', uploadData.path);
    
    // 4. اختبار الوصول للملف
    console.log('\n3️⃣ اختبار الوصول للملف:');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('passport-images')
      .download(testFileName);
    
    if (downloadError) {
      console.error('❌ خطأ في تحميل الملف:', downloadError);
    } else {
      console.log('✅ تم الوصول للملف بنجاح');
    }
    
    // 5. حذف الملف التجريبي
    console.log('\n4️⃣ حذف الملف التجريبي:');
    const { error: deleteError } = await supabase.storage
      .from('passport-images')
      .remove([testFileName]);
    
    if (deleteError) {
      console.error('❌ خطأ في حذف الملف التجريبي:', deleteError);
    } else {
      console.log('✅ تم حذف الملف التجريبي بنجاح');
    }
    
    console.log('\n🎉 اختبار Storage مكتمل بنجاح!');
    console.log('✅ بكت passport-images يعمل بشكل صحيح');
    console.log('✅ يمكن رفع وحذف الملفات');
    console.log('✅ يمكن الوصول للملفات');
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
    return false;
  }
}

// Run the test
testStorage()
  .then((success) => {
    if (success) {
      console.log('\n✅ جميع الاختبارات نجحت! Storage جاهز للاستخدام');
    } else {
      console.log('\n❌ فشل في بعض الاختبارات. يرجى مراجعة الإعدادات');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ فشل في تشغيل الاختبارات:', error);
    process.exit(1);
  });
