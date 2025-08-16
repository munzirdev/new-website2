import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'SessionId and message are required' });
    }

    // حفظ رسالة المشرف في قاعدة البيانات
    const adminMessage = {
      id: uuidv4(),
      content: message,
      sender: 'admin',
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert(adminMessage);

    if (insertError) {
      console.error('Error saving admin message:', insertError);
      return res.status(500).json({ error: 'Failed to save admin message' });
    }

    // تحديث حالة الجلسة إلى "نشط"
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
    }

    // إرسال إشعار تلقرام للمشرفين الآخرين
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (telegramToken && adminChatId) {
      const notificationMessage = `
💬 <b>رسالة مشرف جديدة</b>

📋 <b>معرف الجلسة:</b> <code>${sessionId}</code>
👤 <b>المرسل:</b> المشرف
💬 <b>الرسالة:</b> ${message}

⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}

🔗 <b>رابط لوحة التحكم:</b> <a href="${process.env.ADMIN_URL}/admin/chat-support?session=${sessionId}">عرض المحادثة</a>
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
          console.error('Failed to send Telegram notification for admin message');
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Admin message sent successfully',
      messageId: adminMessage.id
    });

  } catch (error) {
    console.error('Send admin message error:', error);
    res.status(500).json({ 
      error: 'Failed to send admin message',
      details: error.message 
    });
  }
}
