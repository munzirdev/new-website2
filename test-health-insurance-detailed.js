import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testHealthInsuranceDetailed() {
  console.log('🧪 اختبار طلب التأمين الصحي المفصل...');
  
  try {
    // محاكاة بيانات طلب التأمين الصحي مع جميع المعلومات
    const requestData = {
      title: 'طلب تأمين صحي للأجانب جديد',
      description: 'طلب تأمين صحي للأجانب من العميل أحمد محمد',
      user_name: 'أحمد محمد',
      user_email: 'ahmed@example.com',
      user_phone: '+905551234567',
      requestId: 'health-insurance-123',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      additionalData: {
        companyName: 'شركة التأمين التركية',
        ageGroup: '18-30',
        calculatedAge: 25,
        birthDate: '1998-05-15',
        durationMonths: 12,
        calculatedPrice: 1500,
        hasPassportImage: true,
        passportImageUrl: 'passport-images/test-passport.jpg'
      }
    };

    console.log('📋 بيانات الطلب المفصلة:', requestData);

    // استدعاء الـ Edge Function مع جميع المعلومات
    const { data, error } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'health-insurance-detailed-test-' + Date.now(),
        message: requestData.description,
        language: 'ar',
        requestType: 'health_insurance',
        filePath: requestData.additionalData.passportImageUrl,
        userInfo: {
          name: requestData.user_name,
          email: requestData.user_email,
          phone: requestData.user_phone
        },
        additionalData: requestData.additionalData
      }
    });

    if (error) {
      console.error('❌ خطأ في استدعاء Edge Function:', error);
      console.error('تفاصيل الخطأ:', {
        message: error.message,
        status: error.status,
        context: error.context
      });
      return;
    }

    console.log('✅ نجح اختبار طلب التأمين الصحي المفصل:', data);
    console.log('📱 تم إرسال رسالة مفصلة إلى التيليجرام تتضمن:');
    console.log('   • اسم العميل');
    console.log('   • البريد الإلكتروني');
    console.log('   • رقم الهاتف');
    console.log('   • الفئة العمرية');
    console.log('   • العمر المحسوب');
    console.log('   • تاريخ الميلاد');
    console.log('   • الشركة المطلوبة');
    console.log('   • المدة المطلوبة');
    console.log('   • السعر المحسوب');
    console.log('   • صورة جواز السفر');
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testHealthInsuranceDetailed();
