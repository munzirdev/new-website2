import { supabase } from '../lib/supabase';

interface TelegramConfig {
  botToken: string;
  adminChatId: string;
  isEnabled: boolean;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: any;
}

class TelegramService {
  private config: TelegramConfig = {
    botToken: '',
    adminChatId: '',
    isEnabled: false
  };

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const { data, error } = await supabase
        .from('telegram_config')
        .select('*')
        .single();

      if (data && !error) {
        this.config = {
          botToken: data.bot_token || '',
          adminChatId: data.admin_chat_id || '',
          isEnabled: data.is_enabled || false
        };
      }
    } catch (error) {
      console.error('Error loading Telegram config:', error);
    }
  }

  async updateConfig(config: Partial<TelegramConfig>) {
    try {
      const { error } = await supabase
        .from('telegram_config')
        .upsert({
          bot_token: config.botToken || this.config.botToken,
          admin_chat_id: config.adminChatId || this.config.adminChatId,
          is_enabled: config.isEnabled !== undefined ? config.isEnabled : this.config.isEnabled,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        this.config = { ...this.config, ...config };
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating Telegram config:', error);
      return false;
    }
  }

  async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.config.isEnabled || !this.config.botToken) {
      console.log('Telegram bot is disabled or not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendSupportRequestNotification(sessionData: any) {
    const message = {
      chat_id: this.config.adminChatId,
      text: this.formatSupportRequestMessage(sessionData),
      parse_mode: 'HTML' as const,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '👨‍💼 الرد على العميل',
              callback_data: `reply_${sessionData.session_id}`
            }
          ],
          [
            {
              text: '📋 عرض التفاصيل',
              callback_data: `details_${sessionData.session_id}`
            }
          ]
        ]
      }
    };

    return this.sendMessage(message);
  }

  async sendNewMessageNotification(sessionData: any, messageContent: string) {
    const message = {
      chat_id: this.config.adminChatId,
      text: this.formatNewMessageNotification(sessionData, messageContent),
      parse_mode: 'HTML' as const,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💬 الرد السريع',
              callback_data: `quick_reply_${sessionData.session_id}`
            }
          ]
        ]
      }
    };

    return this.sendMessage(message);
  }

  async sendUrgentMessageNotification(sessionData: any, messageContent: string) {
    const message = {
      chat_id: this.config.adminChatId,
      text: this.formatUrgentMessageNotification(sessionData, messageContent),
      parse_mode: 'HTML' as const,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚨 رد عاجل',
              callback_data: `urgent_reply_${sessionData.session_id}`
            }
          ],
          [
            {
              text: '📞 الاتصال بالعميل',
              callback_data: `call_${sessionData.session_id}`
            }
          ]
        ]
      }
    };

    return this.sendMessage(message);
  }

  private formatSupportRequestMessage(sessionData: any): string {
    return `
🚨 <b>طلب ممثل خدمة عملاء جديد</b>

👤 <b>معلومات العميل:</b>
• الاسم: ${sessionData.user_info?.name || 'غير محدد'}
• البريد الإلكتروني: ${sessionData.user_info?.email || 'غير محدد'}
• رقم الهاتف: ${sessionData.user_info?.phone || 'غير محدد'}
• البلد: ${sessionData.user_info?.country || 'غير محدد'}

💬 <b>آخر رسالة:</b>
${sessionData.last_message}

📊 <b>تفاصيل الجلسة:</b>
• معرف الجلسة: <code>${sessionData.session_id}</code>
• عدد الرسائل: ${sessionData.message_count}
• الأولوية: ${this.getPriorityText(sessionData.priority)}
• اللغة: ${sessionData.language === 'ar' ? 'العربية' : 'English'}

⏰ <b>التوقيت:</b>
${new Date(sessionData.last_message_time).toLocaleString('ar-SA')}
    `.trim();
  }

  private formatNewMessageNotification(sessionData: any, messageContent: string): string {
    return `
💬 <b>رسالة جديدة من العميل</b>

👤 <b>العميل:</b> ${sessionData.user_info?.name || 'غير محدد'}

💬 <b>الرسالة:</b>
${messageContent}

📊 <b>تفاصيل الجلسة:</b>
• معرف الجلسة: <code>${sessionData.session_id}</code>
• عدد الرسائل: ${sessionData.message_count}

⏰ <b>التوقيت:</b>
${new Date().toLocaleString('ar-SA')}
    `.trim();
  }

  private formatUrgentMessageNotification(sessionData: any, messageContent: string): string {
    return `
🚨 <b>رسالة مستعجلة!</b>

👤 <b>العميل:</b> ${sessionData.user_info?.name || 'غير محدد'}

💬 <b>الرسالة المستعجلة:</b>
${messageContent}

📊 <b>تفاصيل الجلسة:</b>
• معرف الجلسة: <code>${sessionData.session_id}</code>
• الأولوية: ${this.getPriorityText(sessionData.priority)}
• عدد الرسائل: ${sessionData.message_count}

⏰ <b>التوقيت:</b>
${new Date().toLocaleString('ar-SA')}

⚠️ <b>هذه رسالة مستعجلة تتطلب رداً فورياً!</b>
    `.trim();
  }

  private getPriorityText(priority: string): string {
    switch (priority) {
      case 'urgent': return '🚨 مستعجل';
      case 'high': return '🔴 عالي';
      case 'medium': return '🟡 متوسط';
      case 'low': return '🟢 منخفض';
      default: return '⚪ عادي';
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.botToken) {
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`);
      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      return false;
    }
  }

  getConfig(): TelegramConfig {
    return { ...this.config };
  }
}

export const telegramService = new TelegramService();
export type { TelegramConfig, TelegramMessage };
