// Test Email Verification System
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailVerification() {
  console.log('🧪 بدء اختبار نظام التحقق من البريد الإلكتروني...\n');

  try {
    // 1. Test signup with email confirmation
    console.log('1️⃣ اختبار التسجيل مع تأكيد البريد الإلكتروني...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          phone: '+905551234567',
          country_code: '+90',
        },
        emailRedirectTo: 'https://tevasul.group/auth/verify-email',
        emailConfirm: true
      }
    });

    if (error) {
      console.error('❌ خطأ في التسجيل:', error);
      return;
    }

    console.log('✅ تم التسجيل بنجاح');
    console.log('👤 المستخدم:', data.user?.email);
    console.log('📧 حالة التأكيد:', data.user?.email_confirmed_at ? 'مؤكد' : 'غير مؤكد');
    console.log('📧 تم إرسال البريد:', data.user?.email_confirmed_at ? 'لا' : 'نعم');

    // 2. Test resend verification email
    console.log('\n2️⃣ اختبار إعادة إرسال بريد التأكيد...');
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
      options: {
        emailRedirectTo: 'https://tevasul.group/auth/verify-email'
      }
    });

    if (resendError) {
      console.error('❌ خطأ في إعادة الإرسال:', resendError);
    } else {
      console.log('✅ تم إرسال بريد التأكيد بنجاح');
    }

    // 3. Test edge function
    console.log('\n3️⃣ اختبار Edge Function...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Edge Function يعمل بنجاح:', result);
      } else {
        console.error('❌ خطأ في Edge Function:', result);
      }
    } catch (edgeError) {
      console.error('❌ خطأ في استدعاء Edge Function:', edgeError);
    }

    // 4. Test session handling
    console.log('\n4️⃣ اختبار معالجة الجلسة...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ خطأ في جلب الجلسة:', sessionError);
    } else if (session) {
      console.log('✅ الجلسة موجودة');
      console.log('👤 المستخدم:', session.user?.email);
      console.log('📧 حالة التأكيد:', session.user?.email_confirmed_at ? 'مؤكد' : 'غير مؤكد');
    } else {
      console.log('ℹ️ لا توجد جلسة نشطة');
    }

    console.log('\n🎉 انتهى الاختبار بنجاح!');

  } catch (error) {
    console.error('💥 خطأ غير متوقع:', error);
  }
}

// Run the test
testEmailVerification();
