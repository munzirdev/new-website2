// اختبار الشات بوت مع OpenRouter
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// إعداد Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fctvityawavmuethxxix.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0';

const supabase = createClient(supabaseUrl, supabaseKey);

// اختبار OpenRouter API مباشرة
async function testOpenRouterAPI() {
  console.log('🧪 اختبار OpenRouter API...');
  
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ مفتاح OpenRouter API مفقود في ملف .env');
    console.log('📝 يرجى إضافة VITE_OPENROUTER_API_KEY=your-key-here إلى ملف .env');
    return false;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tevasul.group',
        'X-Title': 'Tevasul Chat Bot Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي لشركة تواصل، وهي شركة خدمات متكاملة في تركيا. أجب باللغة العربية.'
          },
          {
            role: 'user',
            content: 'مرحباً، كيف يمكنني الحصول على الإقامة في تركيا؟'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ خطأ في OpenRouter API:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ OpenRouter API يعمل بشكل صحيح');
    console.log('📝 الرد:', data.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار OpenRouter:', error.message);
    return false;
  }
}

// اختبار قاعدة البيانات
async function testDatabase() {
  console.log('\n🧪 اختبار قاعدة البيانات...');
  
  try {
    // اختبار الاتصال
    const { data, error } = await supabase
      .from('chat_messages')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
      return false;
    }

    console.log('✅ الاتصال بقاعدة البيانات يعمل بشكل صحيح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار قاعدة البيانات:', error.message);
    return false;
  }
}

// اختبار جدول الرسائل
async function testChatMessagesTable() {
  console.log('\n🧪 اختبار جدول chat_messages...');
  
  try {
    // محاولة إدراج رسالة اختبار
    const testMessage = {
      id: uuidv4(),
      content: 'رسالة اختبار',
      sender: 'user',
      session_id: 'test-session',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('chat_messages')
      .insert(testMessage);

    if (error) {
      console.error('❌ خطأ في إدراج رسالة اختبار:', error.message);
      
      // إذا كان الجدول غير موجود، اقترح إنشاؤه
      if (error.code === '42P01') {
        console.log('📝 يبدو أن جدول chat_messages غير موجود');
        console.log('🔧 قم بإنشاء الجدول باستخدام:');
        console.log(`
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot', 'admin')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
        `);
      }
      return false;
    }

    console.log('✅ جدول chat_messages يعمل بشكل صحيح');
    
    // حذف رسالة الاختبار
    await supabase
      .from('chat_messages')
      .delete()
      .eq('id', testMessage.id);
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار جدول chat_messages:', error.message);
    return false;
  }
}

// اختبار شامل
async function runFullTest() {
  console.log('🚀 بدء اختبار الشات بوت الشامل...\n');
  
  const results = {
    openRouter: false,
    database: false,
    chatMessages: false
  };

  // اختبار OpenRouter
  results.openRouter = await testOpenRouterAPI();
  
  // اختبار قاعدة البيانات
  results.database = await testDatabase();
  
  // اختبار جدول الرسائل
  if (results.database) {
    results.chatMessages = await testChatMessagesTable();
  }

  // عرض النتائج
  console.log('\n📊 نتائج الاختبار:');
  console.log('OpenRouter API:', results.openRouter ? '✅' : '❌');
  console.log('قاعدة البيانات:', results.database ? '✅' : '❌');
  console.log('جدول chat_messages:', results.chatMessages ? '✅' : '❌');

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 جميع الاختبارات نجحت! الشات بوت جاهز للاستخدام.');
    console.log('\n📝 الخطوات التالية:');
    console.log('1. تأكد من وجود مفتاح OpenRouter API في ملف .env');
    console.log('2. شغل المشروع: npm run dev');
    console.log('3. افتح الموقع واختبر الشات بوت');
  } else {
    console.log('\n⚠️ بعض الاختبارات فشلت. يرجى إصلاح المشاكل قبل استخدام الشات بوت.');
    
    if (!results.openRouter) {
      console.log('\n🔧 لإصلاح OpenRouter:');
      console.log('1. احصل على مفتاح API من https://openrouter.ai/');
      console.log('2. أضفه إلى ملف .env: VITE_OPENROUTER_API_KEY=your-key');
    }
    
    if (!results.database) {
      console.log('\n🔧 لإصلاح قاعدة البيانات:');
      console.log('1. تحقق من إعدادات Supabase');
      console.log('2. تأكد من صحة URL والمفتاح');
    }
    
    if (!results.chatMessages) {
      console.log('\n🔧 لإصلاح جدول chat_messages:');
      console.log('1. أنشئ الجدول في Supabase SQL Editor');
      console.log('2. استخدم الكود المقدم أعلاه');
    }
  }
}

// تشغيل الاختبار
runFullTest().catch(console.error);
