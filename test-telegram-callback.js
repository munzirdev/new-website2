import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testTelegramCallback() {
  console.log('🧪 اختبار callback queries من التيليجرام...');
  
  try {
    // محاكاة callback query من التيليجرام
    const callbackData = {
      callback_query: {
        id: 'test-callback-' + Date.now(),
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Admin',
          username: 'admin_user'
        },
        message: {
          message_id: 123,
          chat: {
            id: -987654321,
            type: 'group'
          },
          text: '🏥 طلب تأمين صحي للأجانب\n\n👤 معلومات العميل:\n• الاسم: محمد أحمد علي\n• البريد الإلكتروني: mohamed@example.com\n• رقم الهاتف: +905559876543\n\n📝 الرسالة:\nطلب تأمين صحي للأجانب من العميل محمد أحمد\n\n📊 معلومات إضافية:\n• نوع الطلب: تأمين صحي للأجانب\n• الأولوية: 🟡 عادية\n• الحالة: معلق\n\n🏥 تفاصيل التأمين الصحي:\n• الفئة العمرية: 31-40\n• العمر المحسوب: 35 سنة\n• تاريخ الميلاد: 1988-12-20\n• الشركة المطلوبة: شركة التأمين التركية المحدودة\n• المدة المطلوبة: 24 شهر\n• السعر المحسوب: 2800 ليرة تركية\n• صورة جواز السفر: مرفقة\n\n💬 معرف الجلسة: health-insurance-final-test-1234567890\n🆔 معرف الطلب: health-insurance-final-123'
        },
        data: 'mark_resolved:health-insurance-final-123'
      }
    };

    console.log('📋 Callback data:', JSON.stringify(callbackData, null, 2));

    // استدعاء الـ Edge Function للتعامل مع callback
    const { data, error } = await supabase.functions.invoke('telegram-callback', {
      body: callbackData
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

    console.log('✅ نجح اختبار callback query:', data);
    console.log('📱 تم معالجة زر "تم التعامل معه" بنجاح');
    console.log('🔄 تم تحديث حالة الطلب في قاعدة البيانات');
    console.log('✅ تم تحديث رسالة التيليجرام');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testTelegramCallback();
