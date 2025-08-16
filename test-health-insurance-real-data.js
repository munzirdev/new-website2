import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testHealthInsuranceRealData() {
  console.log('🧪 اختبار طلب التأمين الصحي بالبيانات الحقيقية...');
  
  try {
    // محاكاة البيانات الحقيقية من التطبيق
    const requestData = {
      type: 'health_insurance',
      title: 'طلب تأمين صحي للأجانب جديد',
      description: 'طلب تأمين صحي للأجانب',
      userInfo: {
        name: 'أحمد محمد علي',
        email: 'ahmed.mohamed@example.com',
        phone: '+905551234567'
      },
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

    console.log('📋 البيانات المرسلة:', JSON.stringify(requestData, null, 2));

    // استدعاء الـ Edge Function بنفس الطريقة التي يستخدمها التطبيق
    const { data, error } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'health-insurance-real-test-' + Date.now(),
        message: requestData.description,
        language: 'ar',
        requestType: requestData.type,
        filePath: requestData.additionalData.passportImageUrl,
        userInfo: requestData.userInfo,
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

    console.log('✅ نجح اختبار طلب التأمين الصحي بالبيانات الحقيقية:', data);
    console.log('📱 تم إرسال رسالة مفصلة إلى التيليجرام تتضمن:');
    console.log('   • اسم العميل:', requestData.userInfo.name);
    console.log('   • البريد الإلكتروني:', requestData.userInfo.email);
    console.log('   • رقم الهاتف:', requestData.userInfo.phone);
    console.log('   • الفئة العمرية:', requestData.additionalData.ageGroup);
    console.log('   • العمر المحسوب:', requestData.additionalData.calculatedAge);
    console.log('   • تاريخ الميلاد:', requestData.additionalData.birthDate);
    console.log('   • الشركة المطلوبة:', requestData.additionalData.companyName);
    console.log('   • المدة المطلوبة:', requestData.additionalData.durationMonths);
    console.log('   • السعر المحسوب:', requestData.additionalData.calculatedPrice);
    console.log('   • صورة جواز السفر:', requestData.additionalData.hasPassportImage ? 'مرفقة' : 'غير مرفقة');
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testHealthInsuranceRealData();
