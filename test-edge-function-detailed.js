import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testEdgeFunctionDetailed() {
  console.log('🧪 اختبار مفصل للـ Edge Function...');
  console.log('🔧 الإعدادات:', {
    url: process.env.SUPABASE_URL,
    hasAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY
  });
  
  try {
    // أولاً، دعنا نتحقق من إعدادات التيليجرام في قاعدة البيانات
    console.log('📋 جاري التحقق من إعدادات التيليجرام...');
    const { data: config, error: configError } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError) {
      console.error('❌ خطأ في جلب إعدادات التيليجرام:', configError);
      return;
    }

    console.log('✅ إعدادات التيليجرام:', {
      id: config.id,
      isEnabled: config.is_enabled,
      hasBotToken: !!config.bot_token,
      hasAdminChatId: !!config.admin_chat_id
    });

    // الآن دعنا نختبر الـ Edge Function
    console.log('🚀 جاري استدعاء Edge Function...');
    const { data, error } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'test-session-123',
        message: 'هذا اختبار مفصل للويب هوك الجديد! 🎉',
        language: 'ar',
        requestType: 'chat_support'
      }
    });

    if (error) {
      console.error('❌ خطأ في استدعاء Edge Function:', error);
      console.error('تفاصيل الخطأ:', {
        message: error.message,
        status: error.status,
        context: error.context
      });
      return;
    }

    console.log('✅ نجح اختبار Edge Function:', data);
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testEdgeFunctionDetailed();
