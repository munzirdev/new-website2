import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Test language detection
function testLanguageDetection() {
  console.log('🧪 اختبار كشف اللغة...\n');

  const testMessages = [
    // Arabic messages
    'مرحبا، كيف حالك؟',
    'أريد معلومات عن التأمين الصحي',
    'كم تكلفة الإقامة؟',
    
    // Turkish messages
    'Merhaba, nasılsın?',
    'Sağlık sigortası hakkında bilgi istiyorum',
    'İkamet izni maliyeti nedir?',
    'Merhaba, teşekkürler',
    
    // English messages
    'Hello, how are you?',
    'I need information about health insurance',
    'What is the cost of residence permit?',
    'Thank you for your help',
    
    // Mixed messages
    'Hello مرحبا',
    'Merhaba hello',
    'شكراً thank you'
  ];

  // Simple language detection function (same as in chatService)
  function detectLanguage(text) {
    const arabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    
    if (arabicChars.test(text)) {
      return 'ar';
    } else if (turkishChars.test(text) || text.toLowerCase().includes('merhaba') || text.toLowerCase().includes('nasılsın')) {
      return 'tr';
    } else {
      return 'en';
    }
  }

  testMessages.forEach((message, index) => {
    const detectedLang = detectLanguage(message);
    const langEmoji = detectedLang === 'ar' ? '🇸🇦' : detectedLang === 'tr' ? '🇹🇷' : '🇺🇸';
    const langName = detectedLang === 'ar' ? 'العربية' : detectedLang === 'tr' ? 'التركية' : 'الإنجليزية';
    
    console.log(`${index + 1}. "${message}"`);
    console.log(`   ${langEmoji} اللغة المكتشفة: ${langName} (${detectedLang})`);
    console.log('');
  });
}

// Test OpenRouter API with different languages
async function testOpenRouterWithLanguages() {
  console.log('🧪 اختبار OpenRouter API مع لغات مختلفة...\n');

  const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ مفتاح OpenRouter API مفقود');
    return;
  }

  const testCases = [
    {
      message: 'مرحبا، كيف حالك؟',
      expectedLang: 'ar',
      description: 'رسالة بالعربية'
    },
    {
      message: 'Merhaba, nasılsın?',
      expectedLang: 'tr',
      description: 'رسالة بالتركية'
    },
    {
      message: 'Hello, how are you?',
      expectedLang: 'en',
      description: 'رسالة بالإنجليزية'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 اختبار: ${testCase.description}`);
    console.log(`💬 الرسالة: "${testCase.message}"`);
    console.log(`🎯 اللغة المتوقعة: ${testCase.expectedLang}`);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:1234',
          'X-Title': 'Tevasul Chat Bot'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: `You are a customer service representative. Respond in the same language as the user's message. If the user writes in Arabic, respond in Arabic. If the user writes in Turkish, respond in Turkish. If the user writes in English, respond in English.`
            },
            {
              role: 'user',
              content: testCase.message
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.error(`❌ خطأ في API: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      console.log(`🤖 رد AI: "${aiResponse}"`);
      console.log(`✅ نجح الاختبار\n`);
      
    } catch (error) {
      console.error(`❌ خطأ: ${error.message}\n`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 بدء اختبار كشف اللغة...\n');
  
  testLanguageDetection();
  
  console.log('='.repeat(50));
  console.log('');
  
  await testOpenRouterWithLanguages();
  
  console.log('🎉 انتهى اختبار كشف اللغة!');
}

runTests().catch(console.error);
