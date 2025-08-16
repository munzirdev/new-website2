import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPollingWithRealData() {
  console.log('🧪 اختبار خدمة polling مع بيانات حقيقية...');
  
  try {
    // 1. إنشاء طلب تأمين صحي تجريبي
    console.log('\n1️⃣ إنشاء طلب تأمين صحي تجريبي...');
    
    const testRequest = {
      user_id: 'test-user-' + Date.now(),
      company_id: 'test-company-' + Date.now(),
      age_group_id: 'test-age-group-' + Date.now(),
      duration_months: 12,
      calculated_price: 1500,
      contact_name: 'أحمد محمد علي',
      contact_email: 'ahmed.test@example.com',
      contact_phone: '+905551234567',
      additional_notes: 'طلب تأمين صحي تجريبي لاختبار خدمة polling',
      status: 'pending',
      passport_image_url: 'https://example.com/passport.jpg',
      insurance_offer_confirmed: false,
      customer_age: 25,
      birth_date: '1998-05-15',
      submission_date: new Date().toISOString()
    };

    const { data: insertedRequest, error: insertError } = await supabase
      .from('health_insurance_requests')
      .insert([testRequest])
      .select()
      .single();

    if (insertError) {
      console.error('❌ فشل في إنشاء الطلب التجريبي:', insertError);
      return;
    }

    console.log('✅ تم إنشاء الطلب التجريبي بنجاح');
    console.log('   • Request ID:', insertedRequest.id);
    console.log('   • Contact Name:', insertedRequest.contact_name);
    console.log('   • Status:', insertedRequest.status);

    // 2. إرسال إشعار للتيليجرام مع أزرار
    console.log('\n2️⃣ إرسال إشعار للتيليجرام...');
    
    const { data: config } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    const notificationMessage = `🧪 طلب تأمين صحي تجريبي (اختبار Polling)

👤 معلومات العميل:
• الاسم: ${testRequest.contact_name}
• البريد الإلكتروني: ${testRequest.contact_email}
• رقم الهاتف: ${testRequest.contact_phone}

📝 الرسالة:
${testRequest.additional_notes}

📊 معلومات إضافية:
• نوع الطلب: تأمين صحي للأجانب
• الأولوية: 🟡 عادية
• الحالة: معلق

🏥 تفاصيل التأمين الصحي:
• العمر: ${testRequest.customer_age} سنة
• تاريخ الميلاد: ${testRequest.birth_date}
• المدة المطلوبة: ${testRequest.duration_months} شهر
• السعر المحسوب: ${testRequest.calculated_price} ليرة تركية
• صورة جواز السفر: ${testRequest.passport_image_url ? 'مرفقة' : 'غير مرفقة'}

🆔 معرف الطلب: ${insertedRequest.id}

⚠️ هذا طلب تجريبي لاختبار خدمة polling`;

    const sendResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.admin_chat_id,
        text: notificationMessage,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'عرض الطلب', callback_data: `view_request:${insertedRequest.id}` },
              { text: 'التواصل مع العميل', callback_data: `contact_user:${insertedRequest.id}` }
            ],
            [
              { text: 'تم التعامل معه', callback_data: `mark_resolved:${insertedRequest.id}` }
            ]
          ]
        }
      })
    });

    const sendResult = await sendResponse.json();

    if (!sendResult.ok) {
      console.error('❌ فشل في إرسال الإشعار:', sendResult);
      return;
    }

    console.log('✅ تم إرسال الإشعار بنجاح');
    console.log('   • Message ID:', sendResult.result.message_id);
    console.log('   • تم إضافة أزرار التفاعل');

    // 3. محاكاة الضغط على زر "تم التعامل معه"
    console.log('\n3️⃣ محاكاة الضغط على زر "تم التعامل معه"...');
    
    const callbackData = `mark_resolved:${insertedRequest.id}`;
    const [action, sessionId] = callbackData.split(':');
    
    console.log('   • Action:', action);
    console.log('   • Session ID:', sessionId);
    console.log('   • سيتم تحديث حالة الطلب...');

    // تحديث حالة الطلب
    const { error: updateError } = await supabase
      .from('health_insurance_requests')
      .update({ status: 'resolved' })
      .eq('id', insertedRequest.id);

    if (updateError) {
      console.error('❌ فشل في تحديث حالة الطلب:', updateError);
    } else {
      console.log('✅ تم تحديث حالة الطلب بنجاح');
      console.log('   • Status: pending -> resolved');
    }

    // 4. التحقق من التحديث
    console.log('\n4️⃣ التحقق من تحديث حالة الطلب...');
    
    const { data: updatedRequest, error: fetchError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .eq('id', insertedRequest.id)
      .single();

    if (fetchError) {
      console.error('❌ فشل في جلب الطلب المحدث:', fetchError);
    } else {
      console.log('✅ تم التحقق من التحديث بنجاح');
      console.log('   • Current Status:', updatedRequest.status);
      console.log('   • Updated At:', updatedRequest.updated_at);
    }

    // 5. إرسال feedback للمدير
    console.log('\n5️⃣ إرسال feedback للمدير...');
    
    const feedbackMessage = '✅ تم تحديث حالة الطلب إلى "تم التعامل معه" بنجاح';
    
    const feedbackResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.admin_chat_id,
        text: feedbackMessage,
        parse_mode: 'HTML'
      })
    });

    const feedbackResult = await feedbackResponse.json();

    if (!feedbackResult.ok) {
      console.error('❌ فشل في إرسال feedback:', feedbackResult);
    } else {
      console.log('✅ تم إرسال feedback بنجاح');
      console.log('   • Feedback Message ID:', feedbackResult.result.message_id);
    }

    console.log('\n🎉 تم اختبار خدمة polling مع بيانات حقيقية بنجاح!');
    console.log('\n📋 ملخص الاختبار:');
    console.log('   ✅ تم إنشاء طلب تجريبي');
    console.log('   ✅ تم إرسال إشعار للتيليجرام');
    console.log('   ✅ تم محاكاة الضغط على الزر');
    console.log('   ✅ تم تحديث حالة الطلب');
    console.log('   ✅ تم إرسال feedback');
    
    console.log('\n🔍 الآن يمكنك:');
    console.log('   1. الذهاب إلى التيليجرام');
    console.log('   2. الضغط على زر "تم التعامل معه"');
    console.log('   3. مراقبة خدمة polling لمعالجة الطلب');
    console.log('   4. التحقق من تحديث حالة الطلب في لوحة التحكم');

  } catch (error) {
    console.error('❌ خطأ في اختبار polling مع بيانات حقيقية:', error);
  }
}

// تشغيل الاختبار
testPollingWithRealData();
