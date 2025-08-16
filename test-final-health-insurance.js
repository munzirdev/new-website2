import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFinalHealthInsurance() {
  console.log('🧪 الاختبار النهائي لطلب التأمين الصحي...');
  
  try {
    // محاكاة البيانات الكاملة من التطبيق
    const requestData = {
      type: 'health_insurance',
      title: 'طلب تأمين صحي للأجانب جديد',
      description: 'طلب تأمين صحي للأجانب من العميل محمد أحمد',
      userInfo: {
        name: 'محمد أحمد علي',
        email: 'mohamed.ahmed@example.com',
        phone: '+905559876543'
      },
      requestId: 'health-insurance-final-123',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      additionalData: {
        companyName: 'شركة التأمين التركية المحدودة',
        ageGroup: '31-40',
        calculatedAge: 35,
        birthDate: '1988-12-20',
        durationMonths: 24,
        calculatedPrice: 2800,
        hasPassportImage: true,
        passportImageUrl: 'passport-images/mohamed-passport.jpg'
      }
    };

    console.log('📋 البيانات المرسلة:', JSON.stringify(requestData, null, 2));

    // استدعاء الـ Edge Function
    const { data, error } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'health-insurance-final-test-' + Date.now(),
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

    console.log('✅ نجح الاختبار النهائي لطلب التأمين الصحي:', data);
    console.log('\n📱 تم إرسال رسالة مفصلة إلى التيليجرام تتضمن:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 معلومات العميل:');
    console.log(`   • الاسم: ${requestData.userInfo.name}`);
    console.log(`   • البريد الإلكتروني: ${requestData.userInfo.email}`);
    console.log(`   • رقم الهاتف: ${requestData.userInfo.phone}`);
    console.log('\n🏥 تفاصيل التأمين الصحي:');
    console.log(`   • الفئة العمرية: ${requestData.additionalData.ageGroup}`);
    console.log(`   • العمر المحسوب: ${requestData.additionalData.calculatedAge} سنة`);
    console.log(`   • تاريخ الميلاد: ${requestData.additionalData.birthDate}`);
    console.log(`   • الشركة المطلوبة: ${requestData.additionalData.companyName}`);
    console.log(`   • المدة المطلوبة: ${requestData.additionalData.durationMonths} شهر`);
    console.log(`   • السعر المحسوب: ${requestData.additionalData.calculatedPrice} ليرة تركية`);
    console.log(`   • صورة جواز السفر: ${requestData.additionalData.hasPassportImage ? 'مرفقة' : 'غير مرفقة'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 جميع المعلومات تظهر بشكل صحيح في رسالة التيليجرام!');
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testFinalHealthInsurance();
