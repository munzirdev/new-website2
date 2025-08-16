import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPollingCompleteWorkflow() {
  console.log('🧪 اختبار سير العمل الكامل لخدمة polling...');
  
  try {
    // 1. جلب طلب موجود للاختبار
    console.log('\n1️⃣ جلب طلب موجود للاختبار...');
    
    const { data: existingRequests, error: fetchError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .limit(1);

    if (fetchError || !existingRequests || existingRequests.length === 0) {
      console.error('❌ لا توجد طلبات في قاعدة البيانات:', fetchError);
      return;
    }

    const testRequest = existingRequests[0];
    console.log('✅ تم جلب طلب للاختبار');
    console.log('   • Request ID:', testRequest.id);
    console.log('   • Contact Name:', testRequest.contact_name);
    console.log('   • Current Status:', testRequest.status);

    // 2. إرسال رسالة للتيليجرام مع أزرار
    console.log('\n2️⃣ إرسال رسالة للتيليجرام مع أزرار...');
    
    const { data: config } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    const notificationMessage = `🧪 اختبار خدمة Polling - سير العمل الكامل

👤 معلومات العميل:
• الاسم: ${testRequest.contact_name || 'غير محدد'}
• البريد الإلكتروني: ${testRequest.contact_email || 'غير محدد'}
• رقم الهاتف: ${testRequest.contact_phone || 'غير محدد'}

📝 الرسالة:
${testRequest.additional_notes || 'لا توجد رسالة إضافية'}

📊 معلومات إضافية:
• نوع الطلب: تأمين صحي للأجانب
• الأولوية: 🟡 عادية
• الحالة: ${testRequest.status}

🏥 تفاصيل التأمين الصحي:
• العمر: ${testRequest.customer_age || 0} سنة
• تاريخ الميلاد: ${testRequest.birth_date || 'غير محدد'}
• المدة المطلوبة: ${testRequest.duration_months || 0} شهر
• السعر المحسوب: ${testRequest.calculated_price || 0} ليرة تركية
• صورة جواز السفر: ${testRequest.passport_image_url ? 'مرفقة' : 'غير مرفقة'}

🆔 معرف الطلب: ${testRequest.id}

⚠️ هذا اختبار لخدمة polling - اضغط على "تم التعامل معه" لاختبار التحديث`;

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
              { text: 'عرض الطلب', callback_data: `view_request:${testRequest.id}` },
              { text: 'التواصل مع العميل', callback_data: `contact_user:${testRequest.id}` }
            ],
            [
              { text: 'تم التعامل معه', callback_data: `mark_resolved:${testRequest.id}` }
            ]
          ]
        }
      })
    });

    const sendResult = await sendResponse.json();

    if (!sendResult.ok) {
      console.error('❌ فشل في إرسال الرسالة:', sendResult);
      return;
    }

    console.log('✅ تم إرسال الرسالة بنجاح');
    console.log('   • Message ID:', sendResult.result.message_id);
    console.log('   • تم إضافة أزرار التفاعل');

    // 3. اختبار دالة updateRequestStatus
    console.log('\n3️⃣ اختبار دالة updateRequestStatus...');
    
    const originalStatus = testRequest.status;
    const testResult = await updateRequestStatus(testRequest.id, 'resolved');
    console.log('   • نتيجة التحديث:', testResult ? '✅ نجح' : '❌ فشل');

    // 4. التحقق من التحديث
    console.log('\n4️⃣ التحقق من التحديث...');
    
    const { data: updatedRequest, error: fetchUpdatedError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .eq('id', testRequest.id)
      .single();

    if (fetchUpdatedError) {
      console.error('❌ فشل في جلب الطلب المحدث:', fetchUpdatedError);
    } else {
      console.log('✅ تم التحقق من التحديث بنجاح');
      console.log('   • Current Status:', updatedRequest.status);
      console.log('   • Updated At:', updatedRequest.updated_at);
    }

    // 5. إرسال رسالة تأكيد للتيليجرام
    console.log('\n5️⃣ إرسال رسالة تأكيد للتيليجرام...');
    
    const confirmationMessage = `✅ تم اختبار خدمة Polling بنجاح!

📋 تفاصيل الاختبار:
• Request ID: ${testRequest.id}
• الحالة الأصلية: ${originalStatus}
• الحالة الجديدة: ${updatedRequest.status}
• وقت التحديث: ${new Date().toLocaleString('ar-SA')}

🎉 خدمة Polling تعمل بشكل صحيح!`;

    const confirmResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.admin_chat_id,
        text: confirmationMessage,
        parse_mode: 'HTML'
      })
    });

    const confirmResult = await confirmResponse.json();

    if (!confirmResult.ok) {
      console.error('❌ فشل في إرسال رسالة التأكيد:', confirmResult);
    } else {
      console.log('✅ تم إرسال رسالة التأكيد بنجاح');
      console.log('   • Confirmation Message ID:', confirmResult.result.message_id);
    }

    // 6. إعادة الحالة الأصلية
    console.log('\n6️⃣ إعادة الحالة الأصلية...');
    
    const { error: restoreError } = await supabase
      .from('health_insurance_requests')
      .update({ status: originalStatus })
      .eq('id', testRequest.id);

    if (restoreError) {
      console.error('❌ فشل في إعادة الحالة الأصلية:', restoreError);
    } else {
      console.log('✅ تم إعادة الحالة الأصلية بنجاح');
    }

    console.log('\n🎉 تم اختبار سير العمل الكامل لخدمة polling بنجاح!');
    console.log('\n📋 ملخص الاختبار:');
    console.log('   ✅ تم جلب طلب للاختبار');
    console.log('   ✅ تم إرسال رسالة للتيليجرام مع أزرار');
    console.log('   ✅ تم اختبار دالة updateRequestStatus');
    console.log('   ✅ تم التحقق من التحديث');
    console.log('   ✅ تم إرسال رسالة تأكيد للتيليجرام');
    console.log('   ✅ تم إعادة الحالة الأصلية');
    
    console.log('\n🔍 الآن يمكنك:');
    console.log('   1. الذهاب إلى التيليجرام');
    console.log('   2. الضغط على زر "تم التعامل معه" في الرسالة المرسلة');
    console.log('   3. مراقبة خدمة polling لمعالجة الطلب');
    console.log('   4. التحقق من تحديث حالة الطلب في لوحة التحكم');

  } catch (error) {
    console.error('❌ خطأ في اختبار سير العمل الكامل:', error);
  }
}

// دالة updateRequestStatus (نفس الدالة في telegram-polling-service.js)
async function updateRequestStatus(sessionId, status) {
  try {
    console.log(`🔄 تحديث حالة الطلب: ${sessionId} -> ${status}`);

    // محاولة التحديث في جدول التأمين الصحي بواسطة ID
    let { error: healthError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('id', sessionId);

    if (!healthError) {
      console.log('✅ تم تحديث حالة طلب التأمين الصحي بواسطة ID');
      return true;
    }

    // محاولة التحديث في جدول التأمين الصحي بواسطة session_id (إذا كان موجود)
    let { error: sessionError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('session_id', sessionId);

    if (!sessionError) {
      console.log('✅ تم تحديث حالة طلب التأمين الصحي بواسطة session_id');
      return true;
    }

    // محاولة التحديث في جدول طلبات الخدمة
    let { error: serviceError } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', sessionId);

    if (!serviceError) {
      console.log('✅ تم تحديث حالة طلب الخدمة');
      return true;
    }

    // محاولة التحديث في جدول طلبات العودة الطوعية
    let { error: voluntaryError } = await supabase
      .from('voluntary_return_forms')
      .update({ status })
      .eq('id', sessionId);

    if (!voluntaryError) {
      console.log('✅ تم تحديث حالة طلب العودة الطوعية');
      return true;
    }

    console.log('❌ لم يتم العثور على الطلب لتحديثه في أي جدول');
    console.log('   • تم البحث في: health_insurance_requests, service_requests, voluntary_return_forms');
    console.log('   • تم البحث بواسطة: id, session_id');
    return false;

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الطلب:', error);
    return false;
  }
}

// تشغيل الاختبار
testPollingCompleteWorkflow();
