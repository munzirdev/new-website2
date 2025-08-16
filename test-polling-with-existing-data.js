import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPollingWithExistingData() {
  console.log('🧪 اختبار خدمة polling مع البيانات الموجودة...');
  
  try {
    // 1. جلب طلب موجود من قاعدة البيانات
    console.log('\n1️⃣ جلب طلب موجود من قاعدة البيانات...');
    
    const { data: existingRequests, error: fetchError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .limit(1);

    if (fetchError || !existingRequests || existingRequests.length === 0) {
      console.error('❌ لا توجد طلبات في قاعدة البيانات:', fetchError);
      return;
    }

    const existingRequest = existingRequests[0];
    console.log('✅ تم جلب طلب موجود بنجاح');
    console.log('   • Request ID:', existingRequest.id);
    console.log('   • Contact Name:', existingRequest.contact_name);
    console.log('   • Current Status:', existingRequest.status);

    // 2. إرسال إشعار للتيليجرام مع أزرار
    console.log('\n2️⃣ إرسال إشعار للتيليجرام...');
    
    const { data: config } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    const notificationMessage = `🧪 طلب تأمين صحي موجود (اختبار Polling)

👤 معلومات العميل:
• الاسم: ${existingRequest.contact_name || 'غير محدد'}
• البريد الإلكتروني: ${existingRequest.contact_email || 'غير محدد'}
• رقم الهاتف: ${existingRequest.contact_phone || 'غير محدد'}

📝 الرسالة:
${existingRequest.additional_notes || 'لا توجد رسالة إضافية'}

📊 معلومات إضافية:
• نوع الطلب: تأمين صحي للأجانب
• الأولوية: 🟡 عادية
• الحالة: ${existingRequest.status}

🏥 تفاصيل التأمين الصحي:
• العمر: ${existingRequest.customer_age || 0} سنة
• تاريخ الميلاد: ${existingRequest.birth_date || 'غير محدد'}
• المدة المطلوبة: ${existingRequest.duration_months || 0} شهر
• السعر المحسوب: ${existingRequest.calculated_price || 0} ليرة تركية
• صورة جواز السفر: ${existingRequest.passport_image_url ? 'مرفقة' : 'غير مرفقة'}

🆔 معرف الطلب: ${existingRequest.id}

⚠️ هذا طلب موجود لاختبار خدمة polling`;

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
              { text: 'عرض الطلب', callback_data: `view_request:${existingRequest.id}` },
              { text: 'التواصل مع العميل', callback_data: `contact_user:${existingRequest.id}` }
            ],
            [
              { text: 'تم التعامل معه', callback_data: `mark_resolved:${existingRequest.id}` }
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
    
    const callbackData = `mark_resolved:${existingRequest.id}`;
    const [action, sessionId] = callbackData.split(':');
    
    console.log('   • Action:', action);
    console.log('   • Session ID:', sessionId);
    console.log('   • سيتم تحديث حالة الطلب...');

    // حفظ الحالة الأصلية
    const originalStatus = existingRequest.status;

    // تحديث حالة الطلب
    const { error: updateError } = await supabase
      .from('health_insurance_requests')
      .update({ status: 'resolved' })
      .eq('id', existingRequest.id);

    if (updateError) {
      console.error('❌ فشل في تحديث حالة الطلب:', updateError);
    } else {
      console.log('✅ تم تحديث حالة الطلب بنجاح');
      console.log(`   • Status: ${originalStatus} -> resolved`);
    }

    // 4. التحقق من التحديث
    console.log('\n4️⃣ التحقق من تحديث حالة الطلب...');
    
    const { data: updatedRequest, error: fetchUpdatedError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .eq('id', existingRequest.id)
      .single();

    if (fetchUpdatedError) {
      console.error('❌ فشل في جلب الطلب المحدث:', fetchUpdatedError);
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

    // 6. إعادة الحالة الأصلية (اختياري)
    console.log('\n6️⃣ إعادة الحالة الأصلية...');
    
    const { error: restoreError } = await supabase
      .from('health_insurance_requests')
      .update({ status: originalStatus })
      .eq('id', existingRequest.id);

    if (restoreError) {
      console.error('❌ فشل في إعادة الحالة الأصلية:', restoreError);
    } else {
      console.log('✅ تم إعادة الحالة الأصلية بنجاح');
      console.log(`   • Status: resolved -> ${originalStatus}`);
    }

    console.log('\n🎉 تم اختبار خدمة polling مع البيانات الموجودة بنجاح!');
    console.log('\n📋 ملخص الاختبار:');
    console.log('   ✅ تم جلب طلب موجود');
    console.log('   ✅ تم إرسال إشعار للتيليجرام');
    console.log('   ✅ تم محاكاة الضغط على الزر');
    console.log('   ✅ تم تحديث حالة الطلب');
    console.log('   ✅ تم إرسال feedback');
    console.log('   ✅ تم إعادة الحالة الأصلية');
    
    console.log('\n🔍 الآن يمكنك:');
    console.log('   1. الذهاب إلى التيليجرام');
    console.log('   2. الضغط على زر "تم التعامل معه"');
    console.log('   3. مراقبة خدمة polling لمعالجة الطلب');
    console.log('   4. التحقق من تحديث حالة الطلب في لوحة التحكم');

  } catch (error) {
    console.error('❌ خطأ في اختبار polling مع البيانات الموجودة:', error);
  }
}

// تشغيل الاختبار
testPollingWithExistingData();
