import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// إعداد Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId, language = 'ar' } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    // حفظ رسالة المستخدم في قاعدة البيانات
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
      return res.status(500).json({ error: 'Failed to save user message' });
    }

    // الحصول على تاريخ المحادثة
    const { data: conversationHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('content, sender')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    // إعداد الرسائل لـ Groq
    const messages = [
      {
        role: 'system',
        content: getSystemPrompt(language)
      }
    ];

    // إضافة تاريخ المحادثة
    if (conversationHistory) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // إضافة الرسالة الحالية
    messages.push({
      role: 'user',
      content: message
    });

    // الحصول على رد من Groq
    const completion = await groq.chat.completions.create({
      model: 'qwen3-110b-instruct',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // حفظ رد البوت في قاعدة البيانات
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

    // إرسال إشعار تلقرام إذا كان طلب دعم
    if (message.includes('طلب التحدث مع ممثل') || message.includes('Request to speak with')) {
      try {
        await sendTelegramNotification(sessionId, message, language);
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }
    }

    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: language === 'ar' 
        ? 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.'
        : 'Sorry, there was an error processing your request. Please try again.'
    });
  }
}

function getSystemPrompt(language) {
  if (language === 'ar') {
    return `أنت مساعد ذكي لشركة تواصل، وهي شركة خدمات متكاملة في تركيا. مهمتك مساعدة العملاء في:

1. معلومات عن الخدمات المقدمة (الإقامة، الجنسية، الاستثمار، التأمين الصحي، إلخ)
2. إرشادات حول الإجراءات والمستندات المطلوبة
3. أسعار الخدمات والتوضيحات
4. المساعدة في حل المشاكل والاستفسارات
5. توجيه العملاء لطلب خدمة عملاء حقيقي عند الحاجة

يجب أن تكون إجاباتك:
- دقيقة ومفيدة
- باللغة العربية
- مهذبة ومهنية
- تشجع على التواصل مع الشركة للحصول على خدمات مخصصة

إذا لم تكن متأكداً من إجابة، اطلب من العميل التواصل مع فريق خدمة العملاء للحصول على معلومات محدثة ودقيقة.`;
  } else {
    return `You are an intelligent assistant for Tevasul Group, a comprehensive services company in Turkey. Your role is to help customers with:

1. Information about services offered (residence, citizenship, investment, health insurance, etc.)
2. Guidance on procedures and required documents
3. Service pricing and clarifications
4. Help with problems and inquiries
5. Directing customers to request real customer service when needed

Your responses should be:
- Accurate and helpful
- In English
- Polite and professional
- Encourage contact with the company for personalized services

If you're unsure about an answer, ask the customer to contact the customer service team for updated and accurate information.`;
  }
}

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
