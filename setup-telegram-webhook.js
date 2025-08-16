import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTelegramWebhook() {
  console.log('🔧 إعداد webhook URL للبوت...');
  
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

    // URL للـ webhook handler
    const webhookUrl = `https://fctvityawavmuethxxix.supabase.co/functions/v1/telegram-webhook-public`;
    
    console.log('🔗 Webhook URL:', webhookUrl);

    // إعداد webhook URL للبوت
    const response = await fetch(`https://api.telegram.org/bot${config.bot_token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['callback_query', 'message']
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ تم إعداد webhook URL بنجاح');
      console.log('📋 تفاصيل الإعداد:');
      console.log('   • Webhook URL:', webhookUrl);
      console.log('   • Allowed Updates: callback_query, message');
      console.log('   • Result:', result.result);
    } else {
      console.error('❌ فشل في إعداد webhook URL:', result);
    }

    // التحقق من حالة webhook
    const infoResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/getWebhookInfo`);
    const infoResult = await infoResponse.json();
    
    if (infoResult.ok) {
      console.log('\n📊 معلومات Webhook:');
      console.log('   • URL:', infoResult.result.url);
      console.log('   • Has Custom Certificate:', infoResult.result.has_custom_certificate);
      console.log('   • Pending Update Count:', infoResult.result.pending_update_count);
      console.log('   • Last Error Date:', infoResult.result.last_error_date);
      console.log('   • Last Error Message:', infoResult.result.last_error_message);
    }

  } catch (error) {
    console.error('❌ خطأ في إعداد webhook:', error);
  }
}

setupTelegramWebhook();
