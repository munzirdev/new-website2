
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenRouter setup
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

console.log('🔧 OpenRouter Configuration:');
console.log('API Key exists:', !!OPENROUTER_API_KEY);
console.log('API Key length:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.length : 0);
console.log('Base URL:', OPENROUTER_BASE_URL);

// System prompt function
function getSystemPrompt(language) {
  if (language === 'ar') {
    return `أنت مساعد ذكي لشركة Tevasul Group (مجموعة تواصل)، وهي شركة خدمات متكاملة في تركيا متخصصة في الإقامة والجنسية والاستثمار العقاري والتأمين الصحي والخدمات القانونية.

مهمتك:
1. مساعدة العملاء في الحصول على معلومات دقيقة عن خدماتنا
2. تقديم إرشادات واضحة حول الإجراءات والمستندات المطلوبة
3. توضيح الأسعار والتكاليف
4. حل المشاكل والاستفسارات
5. توجيه العملاء لطلب خدمة عملاء حقيقي عند الحاجة

يجب أن تكون إجاباتك:
- دقيقة ومفيدة ومختصرة
- باللغة العربية
- مهذبة ومهنية
- تشجع على التواصل مع الشركة
- تتضمن معلومات الاتصال عند الحاجة

معلومات الشركة:
- الهاتف: +90 212 555 0123
- واتساب: +90 532 555 0123
- البريد: info@tevasulgroup.com
- الموقع: tevasul.group

إذا لم تكن متأكداً من إجابة، اطلب من العميل التواصل مع فريق خدمة العملاء للحصول على معلومات محدثة ودقيقة.`;
  } else {
    return `You are an intelligent assistant for Tevasul Group, a comprehensive services company in Turkey specializing in residence, citizenship, real estate investment, health insurance, and legal services.

Your role:
1. Help customers get accurate information about our services
2. Provide clear guidance on procedures and required documents
3. Clarify pricing and costs
4. Help with problems and inquiries
5. Direct customers to request real customer service when needed

Your responses should be:
- Accurate, helpful, and concise
- In English
- Polite and professional
- Encourage contact with the company
- Include contact information when needed

Company information:
- Phone: +90 212 555 0123
- WhatsApp: +90 532 555 0123
- Email: info@tevasulgroup.com
- Website: tevasul.group

If you're unsure about an answer, ask the customer to contact the customer service team for updated and accurate information.`;
  }
}

// Telegram notification function
async function sendTelegramNotification(sessionId, message, language) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!telegramToken || !adminChatId) {
    console.warn('Telegram configuration missing');
    return;
  }

  const notificationMessage = `
🚨 <b>طلب دعم من العميل</b>

📋 <b>معرف الجلسة:</b> <code>${sessionId}</code>
🌐 <b>اللغة:</b> ${language === 'ar' ? 'العربية' : 'English'}
💬 <b>الرسالة:</b> ${message}

⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}

🔗 <b>رابط لوحة التحكم:</b> <a href="${process.env.ADMIN_URL}/admin/chat-support">إدارة المحادثات</a>
  `;

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: notificationMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tevasul Group AI Chat Server</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                background: white;
                border-radius: 15px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 600px;
                width: 100%;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 2.5em;
            }
            .status {
                background: #e8f5e8;
                border: 2px solid #4caf50;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
            }
            .status h2 {
                color: #2e7d32;
                margin: 0 0 10px 0;
            }
            .endpoints {
                background: #f5f5f5;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: left;
            }
            .endpoint {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                margin: 10px 0;
                font-family: monospace;
            }
            .method {
                background: #007bff;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 0.9em;
                margin-right: 10px;
            }
            .url {
                color: #333;
                font-weight: bold;
            }
            .description {
                color: #666;
                margin-top: 5px;
                font-size: 0.9em;
            }
            .footer {
                margin-top: 30px;
                color: #666;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Tevasul Group AI Chat Server</h1>
            
            <div class="status">
                <h2>✅ الخادم يعمل بشكل طبيعي</h2>
                <p>الوقت الحالي: ${new Date().toLocaleString('ar-SA')}</p>
            </div>
            
            <div class="endpoints">
                <h3>📡 نقاط النهاية المتاحة:</h3>
                
                <div class="endpoint">
                    <span class="method">GET</span>
                    <span class="url">/api/health</span>
                    <div class="description">فحص حالة الخادم</div>
                </div>
                
                <div class="endpoint">
                    <span class="method">POST</span>
                    <span class="url">/api/chat</span>
                    <div class="description">محادثة عادية مع الذكاء الاصطناعي</div>
                </div>
                
                <div class="endpoint">
                    <span class="method">POST</span>
                    <span class="url">/api/chat/stream</span>
                    <div class="description">محادثة متدفقة مع الذكاء الاصطناعي</div>
                </div>
                
                <div class="endpoint">
                    <span class="method">POST</span>
                    <span class="url">/api/telegram/notify-support</span>
                    <div class="description">إرسال إشعار تيليجرام لطلب الدعم</div>
                </div>
            </div>
            
            <div class="footer">
                <p>🌐 <strong>Tevasul Group</strong> - مجموعة تواصل</p>
                <p>📞 +90 212 555 0123 | 📱 +90 532 555 0123</p>
                <p>🌍 <a href="https://tevasul.group" target="_blank">tevasul.group</a></p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Regular chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, language = 'ar' } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    console.log('🔧 Chat request received:', { message, sessionId, language });

    // Save user message to database
    const userMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const { error: userError } = await supabase
      .from('chat_messages')
      .insert(userMessage);

    if (userError) {
      console.error('Error saving user message:', userError);
    }

    // Get conversation history
    const { data: conversationHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('content, sender')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    // Prepare messages for OpenRouter
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(language)
      }
    ];

    // Add conversation history
    if (conversationHistory) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('🔧 Sending request to OpenRouter...');
    console.log('Model: qwen/qwen3-235b-a22b:free');
    console.log('Messages count:', messages.length);

    // Call OpenRouter API
    const completion = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tevasul.group',
        'X-Title': 'Tevasul Group Chat Bot'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-235b-a22b:free',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        extra_headers: {
          "HTTP-Referer": "https://tevasul.group",
          "X-Title": "Tevasul Group Chat Bot"
        },
        extra_body: {}
      })
    });

    if (!completion.ok) {
      console.error('OpenRouter API error:', completion.status, completion.statusText);
      throw new Error(`OpenRouter API error: ${completion.status} - ${completion.statusText}`);
    }

    const completionData = await completion.json();
    console.log('✅ OpenRouter response received');

    const aiResponse = completionData.choices[0]?.message?.content || '';

    if (!aiResponse) {
      throw new Error('No response content from OpenRouter');
    }

    // Save bot response to database
    const botMessage = {
      id: crypto.randomUUID(),
      content: aiResponse,
      sender: 'bot',
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const { error: botError } = await supabase
      .from('chat_messages')
      .insert(botMessage);

    if (botError) {
      console.error('Error saving bot message:', botError);
    }

    // Send Telegram notification if it's a support request
    if (message.includes('طلب التحدث مع ممثل') || message.includes('Request to speak with')) {
      try {
        await sendTelegramNotification(sessionId, message, language);
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }
    }

    console.log('✅ Chat response sent successfully');
    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  console.log('🔧 Streaming chat endpoint called');
  
  try {
    const { message, sessionId, language = 'ar' } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    console.log('🔧 Streaming request received:', { message, sessionId, language });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Save user message to database
    const userMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    try {
      const { error: userError } = await supabase
        .from('chat_messages')
        .insert(userMessage);

      if (userError) {
        console.error('Error saving user message:', userError);
      }
    } catch (error) {
      console.error('Database error:', error);
    }

    // Get conversation history
    const { data: conversationHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('content, sender')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    // Prepare messages for OpenRouter
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(language)
      }
    ];

    // Add conversation history
    if (conversationHistory) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('🔧 Sending streaming request to OpenRouter...');
    console.log('Model: qwen/qwen3-235b-a22b:free');
    console.log('Messages count:', messages.length);

    // Call OpenRouter API with streaming
    const completion = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tevasul.group',
        'X-Title': 'Tevasul Group Chat Bot'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-235b-a22b:free',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: true,
        extra_headers: {
          "HTTP-Referer": "https://tevasul.group",
          "X-Title": "Tevasul Group Chat Bot"
        },
        extra_body: {}
      })
    });

    if (!completion.ok) {
      console.error('OpenRouter API error:', completion.status, completion.statusText);
      throw new Error(`OpenRouter API error: ${completion.status} - ${completion.statusText}`);
    }

    console.log('✅ OpenRouter streaming response received');

    const reader = completion.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }

    // Save bot response to database
    const botMessage = {
      id: crypto.randomUUID(),
      content: fullResponse,
      sender: 'bot',
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const { error: botError } = await supabase
      .from('chat_messages')
      .insert(botMessage);

    if (botError) {
      console.error('Error saving bot message:', botError);
    }

    // Send Telegram notification if it's a support request
    if (message.includes('طلب التحدث مع ممثل') || message.includes('Request to speak with')) {
      try {
        await sendTelegramNotification(sessionId, message, language);
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }
    }

    // Send completion signal
    res.write('data: [DONE]\n\n');
    res.end();

    console.log('✅ Streaming response completed successfully');

  } catch (error) {
    console.error('❌ Streaming chat API error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.write(`data: ${JSON.stringify({ 
      error: error.message,
      details: error.stack
    })}\n\n`);
    res.end();
  }
});

// Telegram notification endpoint
app.post('/api/telegram/notify-support', async (req, res) => {
  try {
    const { sessionId, message, language = 'ar' } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'SessionId and message are required' });
    }

    console.log('🔧 Telegram notification request:', { sessionId, message, language });

    // Send notification to Telegram
    await sendTelegramNotification(sessionId, message, language);

    console.log('✅ Telegram notification sent successfully');

    res.status(200).json({ 
      success: true, 
      message: 'Support request sent successfully'
    });

  } catch (error) {
    console.error('❌ Telegram notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send Telegram notification',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🌊 Streaming Chat API: http://localhost:${PORT}/api/chat/stream`);
  console.log(`📱 Telegram API: http://localhost:${PORT}/api/telegram/notify-support`);
  console.log(`🏠 Homepage: http://localhost:${PORT}/`);
});
