import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// إعداد Supabase مع service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateTelegramConfig() {
  console.log('🔧 تحديث إعدادات التيليجرام...');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  
  if (!botToken || botToken === 'your-telegram-bot-token-here') {
    console.error('❌ يرجى إعداد TELEGRAM_BOT_TOKEN في ملف .env');
    return;
  }
  
  if (!adminChatId || adminChatId === 'your-admin-chat-id-here') {
    console.error('❌ يرجى إعداد TELEGRAM_ADMIN_CHAT_ID في ملف .env');
    return;
  }
  
  try {
    // تحديث الإعدادات الموجودة
    const { data, error } = await supabase
      .from('telegram_config')
      .update({
        bot_token: botToken,
        admin_chat_id: adminChatId,
        is_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', 2)
      .select()
      .single();
    
    if (error) {
      console.error('❌ خطأ في تحديث الإعدادات:', error);
      return;
    }
    
    console.log('✅ تم تحديث إعدادات التيليجرام بنجاح!');
    console.log('📋 الإعدادات الجديدة:', {
      id: data.id,
      isEnabled: data.is_enabled,
      botToken: data.bot_token.substring(0, 10) + '...',
      adminChatId: data.admin_chat_id
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحديث الإعدادات:', error);
  }
}

updateTelegramConfig().catch(console.error);
