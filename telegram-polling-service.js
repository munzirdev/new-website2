import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// متغير لتخزين آخر update_id تم معالجته
let lastUpdateId = 0;

async function pollTelegramUpdates() {
  try {
    console.log('🔄 جلب تحديثات التيليجرام...');
    
    // جلب إعدادات التيليجرام
    const { data: config, error: configError } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError || !config?.bot_token || !config?.admin_chat_id) {
      console.log('❌ إعدادات التيليجرام غير موجودة أو غير صحيحة');
      return;
    }

    // جلب التحديثات من التيليجرام
    const response = await fetch(`https://api.telegram.org/bot${config.bot_token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    const result = await response.json();

    if (!result.ok) {
      console.log('❌ فشل في جلب التحديثات:', result.description);
      return;
    }

    if (result.result.length === 0) {
      console.log('📭 لا توجد تحديثات جديدة');
      return;
    }

    console.log(`📨 تم جلب ${result.result.length} تحديثات`);

    // معالجة كل تحديث
    for (const update of result.result) {
      await processUpdate(update, config);
      lastUpdateId = update.update_id;
    }

    console.log('✅ تم معالجة جميع التحديثات بنجاح');

  } catch (error) {
    console.error('❌ خطأ في polling:', error);
  }
}

async function processUpdate(update, config) {
  try {
    console.log(`🔍 معالجة update_id: ${update.update_id}`);

    // معالجة callback query (زر "تم التعامل معه")
    if (update.callback_query) {
      await processCallbackQuery(update.callback_query, config);
    }

    // معالجة الرسائل العادية (اختياري)
    if (update.message) {
      console.log('📨 رسالة عادية:', update.message.text);
    }

  } catch (error) {
    console.error('❌ خطأ في معالجة التحديث:', error);
  }
}

async function processCallbackQuery(callbackQuery, config) {
  try {
    const { data, message, id } = callbackQuery;
    console.log(`🔘 معالجة callback query: ${data}`);

    // تقسيم البيانات (action:sessionId)
    const [action, sessionId] = data.split(':');

    let responseMessage = '';
    let success = false;

    switch (action) {
      case 'mark_resolved':
        success = await updateRequestStatus(sessionId, 'resolved');
        responseMessage = success 
          ? '✅ تم تحديث حالة الطلب إلى "تم التعامل معه" بنجاح'
          : '❌ فشل في تحديث حالة الطلب';
        break;

      case 'view_request':
        responseMessage = '📋 عرض تفاصيل الطلب...';
        success = true;
        break;

      case 'contact_user':
        responseMessage = '📞 التواصل مع العميل...';
        success = true;
        break;

      case 'already_resolved':
        responseMessage = '✅ هذا الطلب تم التعامل معه مسبقاً';
        success = true;
        break;

      default:
        responseMessage = '❌ إجراء غير معروف';
        success = false;
    }

    // إرسال feedback للمدير
    await answerCallbackQuery(config.bot_token, id, responseMessage);

    // إذا تم التعامل مع الطلب بنجاح، تحديث رسالة التيليجرام
    if (action === 'mark_resolved' && success) {
      await updateTelegramMessage(config.bot_token, callbackQuery, sessionId);
    }

    console.log(`✅ تم معالجة callback query: ${action}`);

  } catch (error) {
    console.error('❌ خطأ في معالجة callback query:', error);
  }
}

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

async function answerCallbackQuery(botToken, callbackQueryId, text) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: true
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('❌ فشل في إرسال feedback:', result);
    } else {
      console.log('✅ تم إرسال feedback بنجاح');
    }

  } catch (error) {
    console.error('❌ خطأ في إرسال feedback:', error);
  }
}

async function updateTelegramMessage(botToken, callbackQuery, sessionId) {
  try {
    const { message } = callbackQuery;
    const updatedText = message.text + '\n\n✅ <b>تم التعامل مع هذا الطلب</b>';
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        message_id: message.message_id,
        text: updatedText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: '✅ تم التعامل معه', 
                callback_data: `already_resolved:${sessionId}` 
              }
            ]
          ]
        }
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('❌ فشل في تحديث رسالة التيليجرام:', result);
    } else {
      console.log('✅ تم تحديث رسالة التيليجرام بنجاح');
    }

  } catch (error) {
    console.error('❌ خطأ في تحديث رسالة التيليجرام:', error);
  }
}

// تشغيل polling كل 10 ثوان
const POLLING_INTERVAL = 10000; // 10 ثوان

console.log('🚀 بدء خدمة polling للتيليجرام...');
console.log(`⏰ سيتم فحص التحديثات كل ${POLLING_INTERVAL / 1000} ثوان`);

// تشغيل polling فوراً
pollTelegramUpdates();

// تشغيل polling بشكل دوري
setInterval(pollTelegramUpdates, POLLING_INTERVAL);

// معالجة إيقاف البرنامج
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف خدمة polling...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف خدمة polling...');
  process.exit(0);
});
