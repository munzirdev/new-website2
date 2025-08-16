import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTelegramConfig() {
  console.log('🔧 إعداد بيانات التيليجرام...');
  
  try {
    // التحقق من وجود البيانات
    const { data: existingConfig, error: checkError } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('📝 إنشاء إعدادات التيليجرام الجديدة...');
      
      const { data, error } = await supabase
        .from('telegram_config')
        .insert([
          {
            id: 1,
            bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
            admin_chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
            is_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في إنشاء إعدادات التيليجرام:', error);
        return;
      }

      console.log('✅ تم إنشاء إعدادات التيليجرام:', {
        id: data.id,
        isEnabled: data.is_enabled,
        hasBotToken: !!data.bot_token,
        hasAdminChatId: !!data.admin_chat_id
      });
    } else if (existingConfig) {
      console.log('✅ إعدادات التيليجرام موجودة:', {
        id: existingConfig.id,
        isEnabled: existingConfig.is_enabled,
        hasBotToken: !!existingConfig.bot_token,
        hasAdminChatId: !!existingConfig.admin_chat_id
      });

      // تحديث البيانات إذا كانت مفقودة
      if (!existingConfig.bot_token || !existingConfig.admin_chat_id) {
        console.log('🔄 تحديث إعدادات التيليجرام...');
        
        const { error: updateError } = await supabase
          .from('telegram_config')
          .update({
            bot_token: process.env.TELEGRAM_BOT_TOKEN || existingConfig.bot_token,
            admin_chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID || existingConfig.admin_chat_id,
            is_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1);

        if (updateError) {
          console.error('❌ خطأ في تحديث إعدادات التيليجرام:', updateError);
          return;
        }

        console.log('✅ تم تحديث إعدادات التيليجرام');
      }
    }
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

setupTelegramConfig();
