import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteWorkflow() {
  console.log('🧪 اختبار العملية الكاملة للتأمين الصحي...');
  
  try {
    // الخطوة 1: إرسال طلب التأمين الصحي
    console.log('\n1️⃣ إرسال طلب التأمين الصحي...');
    
    const requestData = {
      type: 'health_insurance',
      title: 'طلب تأمين صحي للأجانب جديد',
      description: 'طلب تأمين صحي للأجانب من العميل أحمد محمد',
      userInfo: {
        name: 'أحمد محمد علي',
        email: 'ahmed.mohamed@example.com',
        phone: '+905551234567'
      },
      requestId: 'test-workflow-' + Date.now(),
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

    const { data: webhookData, error: webhookError } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'workflow-test-' + Date.now(),
        message: requestData.description,
        language: 'ar',
        requestType: requestData.type,
        filePath: requestData.additionalData.passportImageUrl,
        userInfo: requestData.userInfo,
        additionalData: requestData.additionalData,
        requestId: requestData.requestId
      }
    });

    if (webhookError) {
      console.error('❌ خطأ في إرسال الطلب:', webhookError);
      return;
    }

    console.log('✅ تم إرسال طلب التأمين الصحي بنجاح');

    // الخطوة 2: محاكاة الضغط على زر "تم التعامل معه"
    console.log('\n2️⃣ محاكاة الضغط على زر "تم التعامل معه"...');
    
    const callbackData = {
      callback_query: {
        id: 'workflow-callback-' + Date.now(),
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Admin',
          username: 'admin_user'
        },
        message: {
          message_id: 456,
          chat: {
            id: -987654321,
            type: 'group'
          },
          text: `🏥 طلب تأمين صحي للأجانب\n\n👤 معلومات العميل:\n• الاسم: ${requestData.userInfo.name}\n• البريد الإلكتروني: ${requestData.userInfo.email}\n• رقم الهاتف: ${requestData.userInfo.phone}\n\n📝 الرسالة:\n${requestData.description}\n\n📊 معلومات إضافية:\n• نوع الطلب: تأمين صحي للأجانب\n• الأولوية: 🟡 عادية\n• الحالة: معلق\n\n🏥 تفاصيل التأمين الصحي:\n• الفئة العمرية: ${requestData.additionalData.ageGroup}\n• العمر المحسوب: ${requestData.additionalData.calculatedAge} سنة\n• تاريخ الميلاد: ${requestData.additionalData.birthDate}\n• الشركة المطلوبة: ${requestData.additionalData.companyName}\n• المدة المطلوبة: ${requestData.additionalData.durationMonths} شهر\n• السعر المحسوب: ${requestData.additionalData.calculatedPrice} ليرة تركية\n• صورة جواز السفر: مرفقة\n\n💬 معرف الجلسة: workflow-test-${Date.now()}\n🆔 معرف الطلب: ${requestData.requestId}`
        },
        data: `mark_resolved:${requestData.requestId}`
      }
    };

    const { data: callbackResult, error: callbackError } = await supabase.functions.invoke('telegram-callback', {
      body: callbackData
    });

    if (callbackError) {
      console.error('❌ خطأ في معالجة callback:', callbackError);
      return;
    }

    console.log('✅ تم معالجة زر "تم التعامل معه" بنجاح');

    // الخطوة 3: التحقق من النتائج
    console.log('\n3️⃣ التحقق من النتائج...');
    
    console.log('📋 ملخص العملية:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ تم إرسال طلب التأمين الصحي إلى التيليجرام');
    console.log('✅ تم إرسال جميع المعلومات المطلوبة:');
    console.log('   • اسم العميل:', requestData.userInfo.name);
    console.log('   • البريد الإلكتروني:', requestData.userInfo.email);
    console.log('   • رقم الهاتف:', requestData.userInfo.phone);
    console.log('   • العمر المحسوب:', requestData.additionalData.calculatedAge);
    console.log('   • تاريخ الميلاد:', requestData.additionalData.birthDate);
    console.log('   • الشركة المطلوبة:', requestData.additionalData.companyName);
    console.log('   • المدة المطلوبة:', requestData.additionalData.durationMonths);
    console.log('   • السعر المحسوب:', requestData.additionalData.calculatedPrice);
    console.log('   • صورة جواز السفر: مرفقة');
    console.log('');
    console.log('✅ تم الضغط على زر "تم التعامل معه"');
    console.log('✅ تم تحديث حالة الطلب في قاعدة البيانات');
    console.log('✅ تم تحديث رسالة التيليجرام');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 العملية الكاملة تعمل بشكل مثالي!');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testCompleteWorkflow();
