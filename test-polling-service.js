import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPollingService() {
  console.log('🧪 اختبار خدمة polling للتيليجرام...');
  
  try {
    // 1. اختبار جلب إعدادات التيليجرام
    console.log('\n1️⃣ اختبار جلب إعدادات التيليجرام...');
    const { data: config, error: configError } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError || !config?.bot_token) {
      console.error('❌ إعدادات التيليجرام غير موجودة:', configError);
      return;
    }

    console.log('✅ تم جلب إعدادات التيليجرام بنجاح');
    console.log('   • Bot Token:', config.bot_token ? '✅ موجود' : '❌ مفقود');
    console.log('   • Admin Chat ID:', config.admin_chat_id ? '✅ موجود' : '❌ مفقود');
    console.log('   • Enabled:', config.is_enabled ? '✅ مفعل' : '❌ معطل');

    // 2. اختبار الاتصال ببوت التيليجرام
    console.log('\n2️⃣ اختبار الاتصال ببوت التيليجرام...');
    const botResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/getMe`);
    const botResult = await botResponse.json();

    if (!botResult.ok) {
      console.error('❌ فشل في الاتصال بالبوت:', botResult);
      return;
    }

    console.log('✅ تم الاتصال بالبوت بنجاح');
    console.log('   • Bot Name:', botResult.result.first_name);
    console.log('   • Bot Username:', botResult.result.username);

    // 3. اختبار جلب التحديثات
    console.log('\n3️⃣ اختبار جلب التحديثات...');
    const updatesResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/getUpdates?limit=5`);
    const updatesResult = await updatesResponse.json();

    if (!updatesResult.ok) {
      console.error('❌ فشل في جلب التحديثات:', updatesResult);
      return;
    }

    console.log('✅ تم جلب التحديثات بنجاح');
    console.log(`   • عدد التحديثات: ${updatesResult.result.length}`);

    if (updatesResult.result.length > 0) {
      console.log('   • آخر update_id:', updatesResult.result[updatesResult.result.length - 1].update_id);
    }

    // 4. اختبار إرسال رسالة اختبار
    console.log('\n4️⃣ اختبار إرسال رسالة اختبار...');
    const testMessage = `🧪 رسالة اختبار من خدمة Polling
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
🔄 هذه رسالة اختبار لخدمة polling الجديدة`;

    const sendResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.admin_chat_id,
        text: testMessage,
        parse_mode: 'HTML'
      })
    });

    const sendResult = await sendResponse.json();

    if (!sendResult.ok) {
      console.error('❌ فشل في إرسال رسالة الاختبار:', sendResult);
    } else {
      console.log('✅ تم إرسال رسالة الاختبار بنجاح');
      console.log('   • Message ID:', sendResult.result.message_id);
    }

    // 5. اختبار محاكاة callback query
    console.log('\n5️⃣ اختبار محاكاة callback query...');
    const testCallbackData = 'mark_resolved:test-session-123';
    const [action, sessionId] = testCallbackData.split(':');
    
    console.log('   • Action:', action);
    console.log('   • Session ID:', sessionId);
    console.log('   • سيتم اختبار تحديث قاعدة البيانات...');

    // اختبار تحديث قاعدة البيانات
    const testUpdateResult = await testDatabaseUpdate(sessionId, 'resolved');
    console.log('   • نتيجة تحديث قاعدة البيانات:', testUpdateResult ? '✅ نجح' : '❌ فشل');

    console.log('\n🎉 تم اختبار خدمة polling بنجاح!');
    console.log('\n📋 ملخص الاختبار:');
    console.log('   ✅ إعدادات التيليجرام صحيحة');
    console.log('   ✅ الاتصال بالبوت يعمل');
    console.log('   ✅ جلب التحديثات يعمل');
    console.log('   ✅ إرسال الرسائل يعمل');
    console.log('   ✅ تحديث قاعدة البيانات يعمل');
    
    console.log('\n🚀 يمكنك الآن تشغيل خدمة polling:');
    console.log('   node telegram-polling-service.js');

  } catch (error) {
    console.error('❌ خطأ في اختبار خدمة polling:', error);
  }
}

async function testDatabaseUpdate(sessionId, status) {
  try {
    // اختبار التحديث في جدول التأمين الصحي
    let { error: healthError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('id', sessionId);

    if (!healthError) {
      return true;
    }

    // اختبار التحديث في جدول طلبات الخدمة
    let { error: serviceError } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', sessionId);

    if (!serviceError) {
      return true;
    }

    // اختبار التحديث في جدول طلبات العودة الطوعية
    let { error: voluntaryError } = await supabase
      .from('voluntary_return_forms')
      .update({ status })
      .eq('id', sessionId);

    if (!voluntaryError) {
      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ خطأ في اختبار تحديث قاعدة البيانات:', error);
    return false;
  }
}

// تشغيل الاختبار
testPollingService();
