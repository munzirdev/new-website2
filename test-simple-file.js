import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

// إعداد Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// دالة لجلب إعدادات التيليجرام
async function getTelegramConfig() {
  try {
    const { data, error } = await supabase
      .from('telegram_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching Telegram config:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getTelegramConfig:', error);
    return null;
  }
}

// دالة لإرسال ملف بسيط إلى التيليجرام
async function sendSimpleFile() {
  console.log('🧪 بدء اختبار إرسال ملف بسيط...');
  
  // جلب إعدادات التيليجرام
  const config = await getTelegramConfig();
  if (!config) {
    console.error('❌ لم يتم العثور على إعدادات التيليجرام');
    return;
  }
  
  console.log('📋 إعدادات التيليجرام:', {
    hasBotToken: !!config.bot_token,
    hasChatId: !!config.admin_chat_id,
    isEnabled: config.is_enabled
  });

  try {
    // إنشاء ملف نصي بسيط للاختبار
    const testContent = `اختبار إرسال ملف
التاريخ: ${new Date().toLocaleString('ar-SA')}
هذا ملف اختبار لإرسال المرفقات إلى التيليجرام`;

    // حفظ الملف مؤقتاً
    const fileName = `test-file-${Date.now()}.txt`;
    fs.writeFileSync(fileName, testContent, 'utf8');

    console.log('📝 تم إنشاء ملف اختبار:', fileName);

    // قراءة الملف
    const fileBuffer = fs.readFileSync(fileName);
    
    // إنشاء FormData
    const form = new FormData();
    form.append('chat_id', config.admin_chat_id);
    form.append('caption', '🧪 اختبار إرسال ملف\n\nهذا ملف اختبار لإرسال المرفقات إلى التيليجرام');
    form.append('parse_mode', 'HTML');
    form.append('document', fileBuffer, {
      filename: fileName,
      contentType: 'text/plain'
    });

    console.log('📤 إرسال الملف إلى التيليجرام...');

    const response = await fetch(`https://api.telegram.org/bot${config.bot_token}/sendDocument`, {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ تم إرسال الملف بنجاح!');
      console.log('📊 تفاصيل الاستجابة:', result);
    } else {
      console.error('❌ فشل في إرسال الملف:', result);
    }

    // حذف الملف المؤقت
    fs.unlinkSync(fileName);
    console.log('🗑️ تم حذف الملف المؤقت');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار
sendSimpleFile().catch(console.error);
