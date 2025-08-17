import dotenv from 'dotenv';

dotenv.config();

async function testApiKey() {
  console.log('🔍 اختبار مفتاح OpenRouter API...\n');

  const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  
  console.log('📋 معلومات المفتاح:');
  console.log('- موجود:', !!apiKey);
  console.log('- الطول:', apiKey ? apiKey.length : 0);
  console.log('- البداية:', apiKey ? apiKey.substring(0, 15) + '...' : 'none');
  console.log('- النهاية:', apiKey ? '...' + apiKey.substring(apiKey.length - 10) : 'none');
  console.log('');

  if (!apiKey) {
    console.error('❌ مفتاح API مفقود!');
    console.log('📝 يرجى إضافة VITE_OPENROUTER_API_KEY=your-key إلى ملف .env');
    return;
  }

  // Test simple API call
  try {
    console.log('🧪 اختبار اتصال API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:1234',
        'X-Title': 'Tevasul Chat Bot Test'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10,
        temperature: 0.7
      })
    });

    console.log('📡 حالة الاستجابة:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ نجح الاتصال!');
      console.log('📝 الرد:', data.choices[0]?.message?.content);
    } else {
      const errorText = await response.text();
      console.error('❌ فشل الاتصال:');
      console.error('الخطأ:', errorText);
      
      if (response.status === 401) {
        console.log('\n🔧 حلول محتملة:');
        console.log('1. تحقق من صحة مفتاح API');
        console.log('2. تأكد من أن المفتاح نشط في OpenRouter');
        console.log('3. تحقق من حدود الاستخدام');
        console.log('4. جرب إنشاء مفتاح جديد من https://openrouter.ai/');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
  }
}

testApiKey().catch(console.error);
