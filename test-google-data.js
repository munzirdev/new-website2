// اختبار بيانات Google
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fctvityawavmuethxxix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGoogleData() {
  try {
    console.log('🔍 اختبار بيانات Google...');
    
    // محاولة الحصول على الجلسة الحالية
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ خطأ في الحصول على الجلسة:', error);
      return;
    }
    
    if (!session) {
      console.log('⚠️ لا توجد جلسة نشطة');
      return;
    }
    
    console.log('✅ تم العثور على جلسة نشطة');
    console.log('📧 البريد الإلكتروني:', session.user.email);
    console.log('🆔 معرف المستخدم:', session.user.id);
    
    // طباعة جميع بيانات user_metadata
    console.log('🔍 بيانات user_metadata الكاملة:');
    console.log(JSON.stringify(session.user.user_metadata, null, 2));
    
    // طباعة جميع بيانات user
    console.log('🔍 بيانات user الكاملة:');
    console.log(JSON.stringify(session.user, null, 2));
    
    // اختبار استخراج الاسم
    const googleData = session.user.user_metadata;
    console.log('\n🔍 اختبار استخراج الاسم:');
    
    if (googleData?.full_name) {
      console.log('✅ full_name:', googleData.full_name);
    }
    if (googleData?.name) {
      console.log('✅ name:', googleData.name);
    }
    if (googleData?.display_name) {
      console.log('✅ display_name:', googleData.display_name);
    }
    if (googleData?.given_name) {
      console.log('✅ given_name:', googleData.given_name);
    }
    if (googleData?.family_name) {
      console.log('✅ family_name:', googleData.family_name);
    }
    if (googleData?.avatar_url) {
      console.log('✅ avatar_url:', googleData.avatar_url);
    }
    
    console.log('\n🔍 جميع المفاتيح المتوفرة في user_metadata:');
    console.log(Object.keys(googleData || {}));
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testGoogleData();
