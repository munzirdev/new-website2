import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteWebhook() {
  console.log('🗑️ حذف webhook الحالي من التيليجرام...');
  
  try {
    // جلب إعدادات التيليجرام
    const { data: config, error: configError } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError || !config?.bot_token) {
      console.error('❌ إعدادات التيليجرام غير موجودة:', configError);
      return;
    }

    console.log('✅ تم جلب إعدادات التيليجرام');

    // حذف webhook
    const response = await fetch(`https://api.telegram.org/bot${config.bot_token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drop_pending_updates: true
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ تم حذف webhook بنجاح');
      console.log('📋 تفاصيل الحذف:');
      console.log('   • Result:', result.result);
      console.log('   • Drop Pending Updates: true');
    } else {
      console.error('❌ فشل في حذف webhook:', result);
    }

    // التحقق من حالة webhook
    const infoResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/getWebhookInfo`);
    const infoResult = await infoResponse.json();
    
    if (infoResult.ok) {
      console.log('\n📊 معلومات Webhook بعد الحذف:');
      console.log('   • URL:', infoResult.result.url || 'لا يوجد');
      console.log('   • Has Custom Certificate:', infoResult.result.has_custom_certificate);
      console.log('   • Pending Update Count:', infoResult.result.pending_update_count);
    }

    console.log('\n🎉 الآن يمكنك استخدام خدمة polling!');
    console.log('🚀 شغل: node telegram-polling-service.js');

  } catch (error) {
    console.error('❌ خطأ في حذف webhook:', error);
  }
}

deleteWebhook();
