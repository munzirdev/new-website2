import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testHealthInsuranceWebhook() {
  console.log('🧪 اختبار طلب التأمين الصحي...');
  
  try {
    // محاكاة بيانات طلب التأمين الصحي
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
        durationMonths: 12,
        calculatedPrice: 1500,
        hasPassportImage: true,
        passportImageUrl: 'passport-images/test-passport.jpg'
      }
    };

    console.log('📋 بيانات الطلب:', requestData);

    // استدعاء الـ Edge Function
    const { data, error } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'health-insurance-test-' + Date.now(),
        message: requestData.description,
        language: 'ar',
        requestType: 'health_insurance',
        filePath: requestData.additionalData.passportImageUrl
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

    console.log('✅ نجح اختبار طلب التأمين الصحي:', data);
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testHealthInsuranceWebhook();
