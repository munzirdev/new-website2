import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testEdgeFunction() {
  console.log('🧪 اختبار Edge Function للويب هوك التيليجرام...');
  
  try {
    const { data, error } = await supabase.functions.invoke('telegram-webhook', {
      body: {
        sessionId: 'test-session-123',
        message: 'هذا اختبار للويب هوك الجديد بدون سيرفر! 🎉',
        language: 'ar',
        requestType: 'chat_support'
      }
    });

    if (error) {
      console.error('❌ خطأ في اختبار Edge Function:', error);
      return;
    }

    console.log('✅ نجح اختبار Edge Function:', data);
  } catch (error) {
    console.error('❌ خطأ في استدعاء Edge Function:', error);
  }
}

testEdgeFunction();
