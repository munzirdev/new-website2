import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, message, language = 'ar' } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'SessionId and message are required' });
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!telegramToken || !adminChatId) {
      console.warn('Telegram configuration missing');
      return res.status(500).json({ error: 'Telegram configuration missing' });
    }

    // تحديث حالة الجلسة إلى "في انتظار الدعم"
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({ 
        status: 'waiting_support',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
    }

    // إرسال إشعار تلقرام
    const notificationMessage = `
🚨 <b>طلب دعم من العميل</b>

📋 <b>معرف الجلسة:</b> <code>${sessionId}</code>
🌐 <b>اللغة:</b> ${language === 'ar' ? 'العربية' : 'English'}
💬 <b>الرسالة:</b> ${message}

⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}

🔗 <b>رابط لوحة التحكم:</b> <a href="${process.env.ADMIN_URL}/admin/chat-support">إدارة المحادثات</a>

📝 <b>للرد على العميل:</b>
يمكنك الرد من خلال لوحة التحكم أو إرسال رسالة مباشرة عبر تلقرام
    `;

    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: notificationMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📋 عرض المحادثة',
                url: `${process.env.ADMIN_URL}/admin/chat-support?session=${sessionId}`
              }
            ],
            [
              {
                text: '✅ تم الرد على العميل',
                callback_data: `support_handled_${sessionId}`
              }
            ]
          ]
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    res.status(200).json({ 
      success: true, 
      message: 'Support request sent successfully',
      telegram_message_id: result.result?.message_id
    });

  } catch (error) {
    console.error('Telegram notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send Telegram notification',
      details: error.message 
    });
  }
}
