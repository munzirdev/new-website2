import dotenv from 'dotenv';

dotenv.config();

async function testWebhookDirect() {
  console.log('🧪 اختبار webhook URL مباشرة...');
  
  try {
    // محاكاة callback query من التيليجرام (بدون Authorization header)
    const telegramUpdate = {
      update_id: 123456789,
      callback_query: {
        id: 'direct-test-' + Date.now(),
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Admin',
          username: 'admin_user',
          language_code: 'ar'
        },
        message: {
          message_id: 123,
          from: {
            id: 123456789,
            is_bot: true,
            first_name: 'Tevasul Bot',
            username: 'tevasul_bot'
          },
          chat: {
            id: -987654321,
            title: 'Tevasul Support',
            type: 'group'
          },
          date: Math.floor(Date.now() / 1000),
          text: '🏥 طلب تأمين صحي للأجانب\n\n👤 معلومات العميل:\n• الاسم: أحمد محمد علي\n• البريد الإلكتروني: ahmed@example.com\n• رقم الهاتف: +905551234567\n\n📝 الرسالة:\nطلب تأمين صحي للأجانب من العميل أحمد محمد\n\n📊 معلومات إضافية:\n• نوع الطلب: تأمين صحي للأجانب\n• الأولوية: 🟡 عادية\n• الحالة: معلق\n\n🏥 تفاصيل التأمين الصحي:\n• الفئة العمرية: 18-30\n• العمر المحسوب: 25 سنة\n• تاريخ الميلاد: 1998-05-15\n• الشركة المطلوبة: شركة التأمين التركية\n• المدة المطلوبة: 12 شهر\n• السعر المحسوب: 1500 ليرة تركية\n• صورة جواز السفر: مرفقة\n\n💬 معرف الجلسة: test-session-123\n🆔 معرف الطلب: test-request-456',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'عرض الطلب', callback_data: 'view_request:test-request-456' },
                { text: 'التواصل مع العميل', callback_data: 'contact_user:test-request-456' }
              ],
              [
                { text: 'تم التعامل معه', callback_data: 'mark_resolved:test-request-456' }
              ]
            ]
          }
        },
        chat_instance: 'direct-test-chat-instance',
        data: 'mark_resolved:test-request-456'
      }
    };

    console.log('📋 Telegram Update:', JSON.stringify(telegramUpdate, null, 2));

    // إرسال update إلى webhook handler بدون Authorization header (كما يفعل التيليجرام)
    const webhookUrl = 'https://fctvityawavmuethxxix.supabase.co/functions/v1/telegram-webhook-open';
    
    console.log('🔗 إرسال update إلى:', webhookUrl);
    console.log('⚠️ بدون Authorization header (كما يفعل التيليجرام)');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // لا نضع Authorization header هنا لأن التيليجرام لا يرسله
      },
      body: JSON.stringify(telegramUpdate)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ تم معالجة callback query بنجاح:', result);
      console.log('📱 تم إرسال feedback للمدير');
      console.log('🔄 تم تحديث حالة الطلب في قاعدة البيانات');
      console.log('✅ تم تحديث رسالة التيليجرام');
    } else {
      console.error('❌ فشل في معالجة callback query:', result);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testWebhookDirect();
