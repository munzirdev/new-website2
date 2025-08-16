const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// إعداد Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.config = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      console.log('🔧 تهيئة بوت التلقرام...');
      
      // تحميل الإعدادات من قاعدة البيانات
      await this.loadConfig();
      
      if (!this.config || !this.config.botToken || !this.config.isEnabled) {
        console.log('❌ بوت التلقرام غير مفعل أو غير مُعد');
        return false;
      }

      // إنشاء البوت
      this.bot = new TelegramBot(this.config.botToken, { polling: true });
      
      // إعداد معالجات الأحداث
      this.setupEventHandlers();
      
      this.isRunning = true;
      console.log('✅ تم تشغيل بوت التلقرام بنجاح');
      
      // إرسال رسالة تأكيد للمشرف
      await this.sendWelcomeMessage();
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في تهيئة بوت التلقرام:', error);
      return false;
    }
  }

  async loadConfig() {
    try {
      const { data, error } = await supabase
        .from('telegram_config')
        .select('*')
        .single();

      if (error) {
        console.error('خطأ في تحميل إعدادات التلقرام:', error);
        return;
      }

      this.config = {
        botToken: data.bot_token,
        adminChatId: data.admin_chat_id,
        isEnabled: data.is_enabled
      };

      console.log('📋 تم تحميل إعدادات التلقرام');
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
    }
  }

  setupEventHandlers() {
    if (!this.bot) return;

    // معالج الرسائل النصية
    this.bot.on('message', async (msg) => {
      try {
        console.log('📨 رسالة واردة:', msg.text);
        
        // تجاهل الرسائل من المشرف
        if (msg.chat.id.toString() === this.config.adminChatId) {
          await this.handleAdminMessage(msg);
        }
      } catch (error) {
        console.error('خطأ في معالجة الرسالة:', error);
      }
    });

    // معالج استعلامات Callback
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        console.log('🔘 استعلام callback:', callbackQuery.data);
        await this.handleCallbackQuery(callbackQuery);
      } catch (error) {
        console.error('خطأ في معالجة callback query:', error);
      }
    });

    // معالج الأخطاء
    this.bot.on('error', (error) => {
      console.error('❌ خطأ في بوت التلقرام:', error);
    });

    // معالج التوقف
    this.bot.on('polling_error', (error) => {
      console.error('❌ خطأ في polling:', error);
    });
  }

  async handleAdminMessage(msg) {
    const text = msg.text;
    
    // أوامر المشرف
    if (text.startsWith('/')) {
      await this.handleAdminCommand(msg);
      return;
    }

    // الرد على رسائل المشرف
    await this.bot.sendMessage(msg.chat.id, 
      'مرحباً! أنا بوت دعم العملاء. استخدم الأوامر التالية:\n\n' +
      '/status - حالة البوت\n' +
      '/sessions - الجلسات النشطة\n' +
      '/help - المساعدة'
    );
  }

  async handleAdminCommand(msg) {
    const command = msg.text.toLowerCase();
    
    switch (command) {
      case '/status':
        await this.sendBotStatus(msg.chat.id);
        break;
      case '/sessions':
        await this.sendActiveSessions(msg.chat.id);
        break;
      case '/help':
        await this.sendHelpMessage(msg.chat.id);
        break;
      default:
        await this.bot.sendMessage(msg.chat.id, 'أمر غير معروف. اكتب /help للمساعدة.');
    }
  }

  async handleCallbackQuery(callbackQuery) {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    try {
      if (data.startsWith('reply_')) {
        const sessionId = data.replace('reply_', '');
        await this.handleReplyRequest(chatId, sessionId);
      } else if (data.startsWith('details_')) {
        const sessionId = data.replace('details_', '');
        await this.handleDetailsRequest(chatId, sessionId);
      } else if (data.startsWith('quick_reply_')) {
        const sessionId = data.replace('quick_reply_', '');
        await this.handleQuickReplyRequest(chatId, sessionId);
      } else if (data.startsWith('urgent_reply_')) {
        const sessionId = data.replace('urgent_reply_', '');
        await this.handleUrgentReplyRequest(chatId, sessionId);
      } else if (data.startsWith('call_')) {
        const sessionId = data.replace('call_', '');
        await this.handleCallRequest(chatId, sessionId);
      }

      // إجابة على callback query
      await this.bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error('خطأ في معالجة callback query:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'حدث خطأ في معالجة الطلب' });
    }
  }

  async handleReplyRequest(chatId, sessionId) {
    await this.bot.sendMessage(chatId, 
      `للرد على الجلسة ${sessionId}، اذهب إلى لوحة التحكم:\n\n` +
      `${process.env.REACT_APP_ADMIN_URL || 'http://localhost:3000'}/admin/chat-support`
    );
  }

  async handleDetailsRequest(chatId, sessionId) {
    try {
      // جلب تفاصيل الجلسة من قاعدة البيانات
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        await this.bot.sendMessage(chatId, '❌ لم يتم العثور على الجلسة');
        return;
      }

      const details = `
📋 <b>تفاصيل الجلسة</b>

🆔 <b>معرف الجلسة:</b> <code>${session.session_id}</code>
📊 <b>الحالة:</b> ${this.getStatusText(session.status)}
🎯 <b>الأولوية:</b> ${this.getPriorityText(session.priority)}
🌐 <b>اللغة:</b> ${session.language === 'ar' ? 'العربية' : 'English'}
💬 <b>عدد الرسائل:</b> ${session.message_count}

👤 <b>معلومات العميل:</b>
• الاسم: ${session.user_info?.name || 'غير محدد'}
• البريد: ${session.user_info?.email || 'غير محدد'}
• الهاتف: ${session.user_info?.phone || 'غير محدد'}
• البلد: ${session.user_info?.country || 'غير محدد'}

⏰ <b>التواريخ:</b>
• الإنشاء: ${new Date(session.created_at).toLocaleString('ar-SA')}
• آخر تحديث: ${new Date(session.updated_at).toLocaleString('ar-SA')}
• آخر رسالة: ${new Date(session.last_message_time).toLocaleString('ar-SA')}
      `;

      await this.bot.sendMessage(chatId, details, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('خطأ في جلب تفاصيل الجلسة:', error);
      await this.bot.sendMessage(chatId, '❌ خطأ في جلب التفاصيل');
    }
  }

  async handleQuickReplyRequest(chatId, sessionId) {
    await this.bot.sendMessage(chatId, 
      `للرد السريع على الجلسة ${sessionId}:\n\n` +
      `1. اذهب إلى لوحة التحكم\n` +
      `2. اختر الجلسة ${sessionId}\n` +
      `3. اكتب ردك وأرسله`
    );
  }

  async handleUrgentReplyRequest(chatId, sessionId) {
    await this.bot.sendMessage(chatId, 
      `🚨 <b>رد عاجل مطلوب!</b>\n\n` +
      `الجلسة ${sessionId} تحتاج رداً عاجلاً.\n\n` +
      `🔗 <a href="${process.env.REACT_APP_ADMIN_URL || 'http://localhost:3000'}/admin/chat-support">اذهب إلى لوحة التحكم الآن</a>`,
      { parse_mode: 'HTML' }
    );
  }

  async handleCallRequest(chatId, sessionId) {
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('user_info')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        await this.bot.sendMessage(chatId, '❌ لم يتم العثور على معلومات العميل');
        return;
      }

      const phone = session.user_info?.phone;
      if (!phone) {
        await this.bot.sendMessage(chatId, '❌ رقم الهاتف غير متوفر');
        return;
      }

      const whatsappLink = `https://wa.me/${phone.replace(/\D/g, '')}`;
      await this.bot.sendMessage(chatId, 
        `📞 <b>اتصال بالعميل</b>\n\n` +
        `رقم الهاتف: ${phone}\n\n` +
        `🔗 <a href="${whatsappLink}">اتصل عبر واتساب</a>`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('خطأ في معالجة طلب الاتصال:', error);
      await this.bot.sendMessage(chatId, '❌ خطأ في معالجة طلب الاتصال');
    }
  }

  async sendBotStatus(chatId) {
    const status = this.isRunning ? '🟢 يعمل' : '🔴 متوقف';
    const uptime = this.isRunning ? this.getUptime() : 'غير متاح';
    
    const statusMessage = `
🤖 <b>حالة بوت التلقرام</b>

📊 <b>الحالة:</b> ${status}
⏱️ <b>وقت التشغيل:</b> ${uptime}
🔧 <b>الإصدار:</b> 1.0.0
📅 <b>آخر تحديث:</b> ${new Date().toLocaleString('ar-SA')}

✅ <b>جميع الأنظمة تعمل بشكل طبيعي</b>
    `;

    await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'HTML' });
  }

  async sendActiveSessions(chatId) {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .in('status', ['active', 'waiting_support'])
        .order('last_message_time', { ascending: false })
        .limit(10);

      if (error) {
        await this.bot.sendMessage(chatId, '❌ خطأ في جلب الجلسات النشطة');
        return;
      }

      if (!sessions || sessions.length === 0) {
        await this.bot.sendMessage(chatId, '📭 لا توجد جلسات نشطة حالياً');
        return;
      }

      let message = `📊 <b>الجلسات النشطة (${sessions.length})</b>\n\n`;
      
      sessions.forEach((session, index) => {
        const status = this.getStatusText(session.status);
        const priority = this.getPriorityText(session.priority);
        const time = new Date(session.last_message_time).toLocaleString('ar-SA');
        
        message += `${index + 1}. <b>${session.session_id.slice(0, 8)}...</b>\n`;
        message += `   📊 ${status} | ${priority}\n`;
        message += `   👤 ${session.user_info?.name || 'غير محدد'}\n`;
        message += `   ⏰ ${time}\n\n`;
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('خطأ في جلب الجلسات النشطة:', error);
      await this.bot.sendMessage(chatId, '❌ خطأ في جلب الجلسات النشطة');
    }
  }

  async sendHelpMessage(chatId) {
    const helpMessage = `
🤖 <b>مساعدة بوت التلقرام</b>

📋 <b>الأوامر المتاحة:</b>

/status - عرض حالة البوت
/sessions - عرض الجلسات النشطة
/help - عرض هذه الرسالة

🔘 <b>الأزرار التفاعلية:</b>

👨‍💼 الرد على العميل - للرد المباشر
📋 عرض التفاصيل - لعرض تفاصيل الجلسة
💬 الرد السريع - للرد السريع
🚨 رد عاجل - للرد العاجل
📞 الاتصال بالعميل - للاتصال المباشر

📞 <b>للحصول على مساعدة إضافية:</b>
اتصل بفريق الدعم التقني
    `;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
  }

  async sendWelcomeMessage() {
    if (!this.config.adminChatId) return;

    const welcomeMessage = `
🎉 <b>مرحباً بك في بوت دعم العملاء!</b>

✅ تم تشغيل البوت بنجاح
🔔 ستتلقى إشعارات فورية عند:
   • طلب العميل التحدث مع ممثل
   • وصول رسائل جديدة
   • وصول رسائل مستعجلة

📋 <b>الأوامر المتاحة:</b>
/status - حالة البوت
/sessions - الجلسات النشطة
/help - المساعدة

🚀 <b>البوت جاهز للعمل!</b>
    `;

    await this.bot.sendMessage(this.config.adminChatId, welcomeMessage, { parse_mode: 'HTML' });
  }

  getStatusText(status) {
    switch (status) {
      case 'active': return '🟢 نشط';
      case 'waiting_support': return '🟡 في انتظار الدعم';
      case 'closed': return '🔴 مغلق';
      case 'archived': return '🟣 مؤرشف';
      default: return '⚪ غير محدد';
    }
  }

  getPriorityText(priority) {
    switch (priority) {
      case 'urgent': return '🚨 مستعجل';
      case 'high': return '🔴 عالي';
      case 'medium': return '🟡 متوسط';
      case 'low': return '🟢 منخفض';
      default: return '⚪ عادي';
    }
  }

  getUptime() {
    if (!this.startTime) {
      this.startTime = Date.now();
    }
    
    const uptime = Date.now() - this.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} ساعة و ${minutes} دقيقة`;
  }

  async stop() {
    if (this.bot) {
      this.bot.stopPolling();
      this.isRunning = false;
      console.log('🛑 تم إيقاف بوت التلقرام');
    }
  }
}

// إنشاء وتشغيل البوت
const botService = new TelegramBotService();

// معالجة إيقاف التطبيق
process.on('SIGINT', async () => {
  console.log('🛑 إيقاف البوت...');
  await botService.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 إيقاف البوت...');
  await botService.stop();
  process.exit(0);
});

// تشغيل البوت
botService.initialize().catch(error => {
  console.error('❌ فشل في تشغيل البوت:', error);
  process.exit(1);
});

module.exports = botService;
