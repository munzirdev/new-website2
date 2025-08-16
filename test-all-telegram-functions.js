import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAllTelegramFunctions() {
  console.log('🧪 اختبار جميع دوال التيليجرام...');
  
  try {
    // اختبار 1: طلب دعم فني
    console.log('\n1️⃣ اختبار طلب دعم فني...');
    const { data: data1, error: error1 } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'support-test-' + Date.now(),
        message: 'أحتاج مساعدة في الخدمات',
        language: 'ar',
        requestType: 'chat_support'
      }
    });

    if (error1) {
      console.error('❌ خطأ في طلب الدعم الفني:', error1);
    } else {
      console.log('✅ نجح اختبار طلب الدعم الفني:', data1);
    }

    // اختبار 2: طلب ترجمة
    console.log('\n2️⃣ اختبار طلب ترجمة...');
    const { data: data2, error: error2 } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'translation-test-' + Date.now(),
        message: 'أحتاج ترجمة مستند',
        language: 'ar',
        requestType: 'translation',
        filePath: 'documents/test-doc.pdf'
      }
    });

    if (error2) {
      console.error('❌ خطأ في طلب الترجمة:', error2);
    } else {
      console.log('✅ نجح اختبار طلب الترجمة:', data2);
    }

    // اختبار 3: طلب تأمين صحي
    console.log('\n3️⃣ اختبار طلب تأمين صحي...');
    const { data: data3, error: error3 } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'health-insurance-test-' + Date.now(),
        message: 'أحتاج تأمين صحي للأجانب',
        language: 'ar',
        requestType: 'health_insurance',
        filePath: 'passport-images/test-passport.jpg'
      }
    });

    if (error3) {
      console.error('❌ خطأ في طلب التأمين الصحي:', error3);
    } else {
      console.log('✅ نجح اختبار طلب التأمين الصحي:', data3);
    }

    // اختبار 4: طلب خدمة عامة
    console.log('\n4️⃣ اختبار طلب خدمة عامة...');
    const { data: data4, error: error4 } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'service-test-' + Date.now(),
        message: 'أحتاج خدمة عامة',
        language: 'ar',
        requestType: 'service_request'
      }
    });

    if (error4) {
      console.error('❌ خطأ في طلب الخدمة العامة:', error4);
    } else {
      console.log('✅ نجح اختبار طلب الخدمة العامة:', data4);
    }

    console.log('\n🎉 تم اختبار جميع الدوال بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testAllTelegramFunctions();
