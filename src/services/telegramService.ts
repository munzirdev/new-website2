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

// إضافة واجهة لإرسال الملفات
interface TelegramFileMessage {
  chat_id: string;
  document?: string; // Base64 encoded file
  photo?: string; // Base64 encoded image
  caption?: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: any;
}

// أنواع الطلبات المختلفة
export type RequestType = 
  | 'chat_support'
  | 'translation'
  | 'insurance'
  | 'voluntary_return'
  | 'health_insurance_activation'
  | 'health_insurance'
  | 'service_request'
  | 'general_inquiry';

interface RequestData {
  type: RequestType;
  title?: string;
  description?: string;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  sessionId?: string;
  formId?: string;
  requestId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  createdAt?: string;
  additionalData?: any;
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
      console.log('🔄 جاري تحميل إعدادات التيليجرام في telegramService...');
      const { data, error } = await supabase
        .from('telegram_config')
        .select('*')
        .eq('id', 2)
        .single();

      if (data && !error) {
        this.config = {
          botToken: data.bot_token || '',
          adminChatId: data.admin_chat_id || '',
          isEnabled: data.is_enabled || false
        };
        console.log('✅ تم تحميل إعدادات التيليجرام:', {
          hasBotToken: !!this.config.botToken,
          hasChatId: !!this.config.adminChatId,
          isEnabled: this.config.isEnabled
        });
      } else {
        console.log('⚠️ لم يتم العثور على إعدادات التيليجرام');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل إعدادات التيليجرام:', error);
    }
  }

  async updateConfig(config: Partial<TelegramConfig>) {
    try {
      console.log('🔄 جاري تحديث إعدادات التيليجرام في telegramService...', config);
      
      const { error } = await supabase
        .from('telegram_config')
        .upsert({
          id: 2,
          bot_token: config.botToken || this.config.botToken,
          admin_chat_id: config.adminChatId || this.config.adminChatId,
          is_enabled: config.isEnabled !== undefined ? config.isEnabled : this.config.isEnabled,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        this.config = { ...this.config, ...config };
        console.log('✅ تم تحديث إعدادات التيليجرام في telegramService:', this.config);
        return true;
      }
      
      console.error('❌ خطأ في تحديث إعدادات التيليجرام:', error);
      return false;
    } catch (error) {
      console.error('❌ خطأ في تحديث إعدادات التيليجرام:', error);
      return false;
    }
  }

  async sendMessage(message: TelegramMessage): Promise<boolean> {
    console.log('🔄 جاري إرسال رسالة التيليجرام عبر Edge Function...', {
      chatId: message.chat_id,
      textLength: message.text.length
    });

    try {
      // استخدام Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-webhook', {
        body: {
          sessionId: 'message-' + Date.now(),
          message: message.text,
          language: 'ar',
          requestType: 'general_inquiry'
        }
      });

      if (error) {
        console.error('❌ خطأ في إرسال رسالة التيليجرام:', error);
        return false;
      }

      console.log('✅ تم إرسال رسالة التيليجرام بنجاح عبر Edge Function');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال رسالة التيليجرام:', error);
      return false;
    }
  }

  // دالة جديدة لإرسال الملفات
  async sendFile(fileMessage: TelegramFileMessage): Promise<boolean> {
    console.log('🔄 جاري إرسال ملف إلى التيليجرام عبر Edge Function...', {
      chatId: fileMessage.chat_id,
      hasDocument: !!fileMessage.document,
      hasPhoto: !!fileMessage.photo
    });

    try {
      // استخدام Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-webhook', {
        body: {
          sessionId: 'file-' + Date.now(),
          message: fileMessage.caption || 'ملف مرفق',
          language: 'ar',
          requestType: 'general_inquiry',
          filePath: fileMessage.document || fileMessage.photo
        }
      });

      if (error) {
        console.error('❌ خطأ في إرسال الملف إلى التيليجرام:', error);
        return false;
      }

      console.log('✅ تم إرسال الملف إلى التيليجرام بنجاح عبر Edge Function');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال الملف إلى التيليجرام:', error);
      return false;
    }
  }

  // دالة جديدة لإرسال ملف فعلي إلى التيليجرام
  async sendActualFile(chatId: string, fileData: { data: string; type: string; name: string }, caption: string, replyMarkup?: any): Promise<boolean> {
    console.log('🔄 إرسال ملف فعلي إلى التيليجرام عبر Edge Function:', {
      fileName: fileData.name,
      fileType: fileData.type,
      bufferSize: fileData.data.length
    });

    try {
      // استخدام Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-webhook', {
        body: {
          sessionId: 'file-' + Date.now(),
          message: caption,
          language: 'ar',
          requestType: 'general_inquiry',
          filePath: `temp/${fileData.name}` // سيتم التعامل مع الملف في الـ Edge Function
        }
      });

      if (error) {
        console.error('❌ خطأ في إرسال الملف الفعلي إلى التيليجرام:', error);
        return false;
      }

      console.log('✅ تم إرسال الملف الفعلي إلى التيليجرام بنجاح عبر Edge Function');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال الملف الفعلي إلى التيليجرام:', error);
      return false;
    }
  }

  // دالة لجلب الملف من قاعدة البيانات
  private async getFileFromDatabase(fileUrl: string): Promise<{ data: string; type: string; name: string } | null> {
    try {
      if (fileUrl.startsWith('base64://')) {
        const fileId = fileUrl.replace('base64://', '');
        
        // محاولة جلب الملف من file_attachments أولاً
        let { data: attachmentData, error } = await supabase
          .from('file_attachments')
          .select('file_data, file_type, file_name')
          .eq('id', fileId)
          .single();
        
        if (error || !attachmentData) {
          // محاولة جلب الملف من service_requests
          const { data: requestData, error: requestError } = await supabase
            .from('service_requests')
            .select('file_data, file_name')
            .eq('id', fileId)
            .single();
          
          if (requestError || !requestData || !requestData.file_data) {
            console.error('❌ لم يتم العثور على الملف في قاعدة البيانات');
            return null;
          }
          
          return {
            data: requestData.file_data,
            type: this.getFileTypeFromName(requestData.file_name),
            name: requestData.file_name
          };
        }
        
        return {
          data: attachmentData.file_data,
          type: attachmentData.file_type,
          name: attachmentData.file_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ خطأ في جلب الملف من قاعدة البيانات:', error);
      return null;
    }
  }

  // دالة لتحديد نوع الملف من اسمه
  private getFileTypeFromName(fileName: string): string {
    const fileNameLower = fileName.toLowerCase();
    if (fileNameLower.endsWith('.pdf')) {
      return 'application/pdf';
    } else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
      return 'image/jpeg';
    } else if (fileNameLower.endsWith('.png')) {
      return 'image/png';
    } else if (fileNameLower.endsWith('.gif')) {
      return 'image/gif';
    } else if (fileNameLower.endsWith('.txt')) {
      return 'text/plain';
    } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
      return 'application/msword';
    }
    return 'application/octet-stream';
  }

  // دالة محسنة لإرسال إشعارات مع المرفقات
  async sendRequestNotificationWithFile(requestData: RequestData): Promise<boolean> {
    console.log('🔄 بدء إرسال إشعار طلب مع ملف عبر Edge Function...', {
      type: requestData.type,
      title: requestData.title,
      hasFile: !!requestData.additionalData?.fileUrl,
      fileName: requestData.additionalData?.fileName,
      serviceType: requestData.additionalData?.serviceType
    });
    
    try {
      // استخدام Supabase Edge Function بدلاً من السيرفر
      const { data, error } = await supabase.functions.invoke('telegram-webhook', {
        body: {
          sessionId: requestData.sessionId,
          message: requestData.description || '',
          language: 'ar',
          requestType: requestData.type,
          filePath: requestData.additionalData?.fileUrl || requestData.additionalData?.passportImageUrl,
          userInfo: requestData.userInfo,
          additionalData: requestData.additionalData,
          requestId: requestData.requestId
        }
      });

      if (error) {
        console.error('❌ خطأ في استدعاء Edge Function:', error);
        return false;
      }

      console.log('✅ تم إرسال إشعار الطلب مع الملف بنجاح عبر Edge Function');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار الطلب مع الملف:', error);
      return false;
    }
  }

  // دالة عامة لإرسال إشعارات لجميع أنواع الطلبات
  async sendRequestNotification(requestData: RequestData): Promise<boolean> {
    console.log('🔄 بدء إرسال إشعار طلب عبر Edge Function...', requestData);
    
    try {
      // استخدام Supabase Edge Function بدلاً من السيرفر
      const { data, error } = await supabase.functions.invoke('telegram-webhook', {
        body: {
          sessionId: requestData.sessionId,
          message: requestData.description || '',
          language: 'ar',
          requestType: requestData.type,
          filePath: requestData.additionalData?.fileUrl, // إرسال مسار الملف إذا وجد
          userInfo: requestData.userInfo,
          additionalData: requestData.additionalData,
          requestId: requestData.requestId
        }
      });

      if (error) {
        console.error('❌ خطأ في استدعاء Edge Function:', error);
        return false;
      }

      console.log('✅ تم إرسال إشعار الطلب بنجاح عبر Edge Function');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار الطلب:', error);
      return false;
    }
  }

  // إشعارات الدعم الفني (المحادثات)
  async sendSupportRequestNotification(sessionData: any) {
    return this.sendRequestNotification({
      type: 'chat_support',
      title: 'طلب ممثل خدمة عملاء',
      description: sessionData.last_message,
      userInfo: sessionData.user_info,
      sessionId: sessionData.session_id,
      priority: sessionData.priority,
      status: sessionData.status,
      createdAt: sessionData.last_message_time,
      additionalData: {
        messageCount: sessionData.message_count,
        language: sessionData.language
      }
    });
  }

  async sendNewMessageNotification(sessionData: any, messageContent: string) {
    return this.sendRequestNotification({
      type: 'chat_support',
      title: 'رسالة جديدة من العميل',
      description: messageContent,
      userInfo: sessionData.user_info,
      sessionId: sessionData.session_id,
      priority: sessionData.priority,
      status: sessionData.status,
      createdAt: new Date().toISOString(),
      additionalData: {
        messageCount: sessionData.message_count,
        language: sessionData.language
      }
    });
  }

  async sendUrgentMessageNotification(sessionData: any, messageContent: string) {
    return this.sendRequestNotification({
      type: 'chat_support',
      title: 'رسالة مستعجلة!',
      description: messageContent,
      userInfo: sessionData.user_info,
      sessionId: sessionData.session_id,
      priority: 'urgent',
      status: sessionData.status,
      createdAt: new Date().toISOString(),
      additionalData: {
        messageCount: sessionData.message_count,
        language: sessionData.language,
        isUrgent: true
      }
    });
  }

  // إشعارات طلبات الترجمة
  async sendTranslationRequestNotification(requestData: any) {
    return this.sendRequestNotificationWithFile({
      type: 'translation',
      title: requestData.title || 'طلب ترجمة جديد',
      description: requestData.description,
      userInfo: {
        name: requestData.user_name,
        email: requestData.user_email,
        phone: requestData.user_phone
      },
      requestId: requestData.id,
      priority: requestData.priority || 'medium',
      status: requestData.status,
      createdAt: requestData.created_at,
      additionalData: {
        hasFile: !!requestData.file_url,
        fileName: requestData.file_name,
        fileUrl: requestData.file_url
      }
    });
  }

  // إشعارات طلبات التأمين
  async sendInsuranceRequestNotification(requestData: any) {
    return this.sendRequestNotificationWithFile({
      type: 'insurance',
      title: requestData.title || 'طلب تأمين جديد',
      description: requestData.description,
      userInfo: {
        name: requestData.user_name,
        email: requestData.user_email,
        phone: requestData.user_phone
      },
      requestId: requestData.id,
      priority: requestData.priority || 'medium',
      status: requestData.status,
      createdAt: requestData.created_at,
      additionalData: {
        hasFile: !!requestData.file_url,
        fileName: requestData.file_name,
        fileUrl: requestData.file_url
      }
    });
  }

  // إشعارات طلبات العودة الطوعية
  async sendVoluntaryReturnNotification(formData: any) {
    return this.sendRequestNotification({
      type: 'voluntary_return',
      title: 'طلب عودة طوعية جديد',
      description: `طلب عودة طوعية من ${formData.full_name_tr}`,
      userInfo: {
        name: formData.full_name_tr,
        phone: formData.gsm
      },
      formId: formData.id,
      priority: 'high',
      status: 'pending',
      createdAt: formData.created_at,
      additionalData: {
        kimlikNo: formData.kimlik_no,
        sinirKapisi: formData.sinir_kapisi,
        refakatCount: formData.refakat_entries?.length || 0,
        customDate: formData.custom_date
      }
    });
  }

  // إشعارات طلبات تفعيل التأمين الصحي
  async sendHealthInsuranceActivationNotification(formData: any) {
    return this.sendRequestNotification({
      type: 'health_insurance_activation',
      title: 'طلب تفعيل تأمين صحي جديد',
      description: `طلب تفعيل تأمين صحي من ${formData.full_name}`,
      userInfo: {
        name: formData.full_name,
        phone: formData.phone
      },
      formId: formData.id,
      priority: 'high',
      status: 'pending',
      createdAt: formData.created_at,
      additionalData: {
        kimlikNo: formData.kimlik_no,
        address: formData.address
      }
    });
  }

  // إشعارات طلبات التأمين الصحي للأجانب
  async sendHealthInsuranceRequestNotification(requestData: any) {
    return this.sendRequestNotificationWithFile({
      type: 'health_insurance',
      title: requestData.title || 'طلب تأمين صحي للأجانب جديد',
      description: requestData.description || 'طلب تأمين صحي للأجانب',
      userInfo: {
        name: requestData.user_name,
        email: requestData.user_email,
        phone: requestData.user_phone
      },
      requestId: requestData.requestId,
      priority: requestData.priority || 'medium',
      status: requestData.status || 'pending',
      createdAt: requestData.createdAt,
      additionalData: {
        companyName: requestData.additionalData?.companyName,
        ageGroup: requestData.additionalData?.ageGroup,
        calculatedAge: requestData.additionalData?.calculatedAge,
        durationMonths: requestData.additionalData?.durationMonths,
        calculatedPrice: requestData.additionalData?.calculatedPrice,
        hasPassportImage: requestData.additionalData?.hasPassportImage,
        passportImageUrl: requestData.additionalData?.passportImageUrl
      }
    });
  }

  // إشعارات طلبات الخدمات العامة
  async sendServiceRequestNotification(requestData: any) {
    console.log('🔄 sendServiceRequestNotification called with:', {
      title: requestData.title,
      serviceType: requestData.service_type || requestData.additionalData?.serviceType,
      hasFile: !!requestData.file_url,
      fileName: requestData.file_name
    });
    
    return this.sendRequestNotificationWithFile({
      type: 'service_request',
      title: requestData.title || 'طلب خدمة جديد',
      description: requestData.description,
      userInfo: {
        name: requestData.user_name,
        email: requestData.user_email,
        phone: requestData.user_phone
      },
      requestId: requestData.id,
      priority: requestData.priority || 'medium',
      status: requestData.status,
      createdAt: requestData.created_at,
      additionalData: {
        serviceType: requestData.service_type || requestData.additionalData?.serviceType,
        hasFile: !!requestData.file_url,
        fileName: requestData.file_name,
        fileUrl: requestData.file_url
      }
    });
  }

  private formatRequestNotification(requestData: RequestData): string {
    const emoji = this.getRequestTypeEmoji(requestData.type);
    const priorityEmoji = this.getPriorityEmoji(requestData.priority);
    
    let message = `
${emoji} <b>${requestData.title}</b>

👤 <b>معلومات العميل:</b>
• الاسم: ${requestData.userInfo?.name || 'غير محدد'}
• البريد الإلكتروني: ${requestData.userInfo?.email || 'غير محدد'}
• رقم الهاتف: ${requestData.userInfo?.phone || 'غير محدد'}
${requestData.userInfo?.country ? `• البلد: ${requestData.userInfo.country}` : ''}

📝 <b>تفاصيل الطلب:</b>
${requestData.description || 'لا يوجد وصف'}

📊 <b>معلومات إضافية:</b>
• نوع الطلب: ${this.getRequestTypeText(requestData.type)}
• الأولوية: ${priorityEmoji} ${this.getPriorityText(requestData.priority)}
• الحالة: ${requestData.status || 'معلق'}
`;

    // إضافة معلومات خاصة بكل نوع طلب
    if (requestData.additionalData) {
      message += this.getAdditionalDataText(requestData.type, requestData.additionalData);
    }

    // إضافة معرفات
    if (requestData.sessionId) {
      message += `\n💬 <b>معرف الجلسة:</b> <code>${requestData.sessionId}</code>`;
    }
    if (requestData.formId) {
      message += `\n📋 <b>معرف النموذج:</b> <code>${requestData.formId}</code>`;
    }
    if (requestData.requestId) {
      message += `\n🆔 <b>معرف الطلب:</b> <code>${requestData.requestId}</code>`;
    }

    const date = new Date(requestData.createdAt || Date.now());
   const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
   message += `\n\n⏰ <b>التوقيت:</b>
${dateStr}`;

    return message.trim();
  }

  private getRequestTypeEmoji(type: RequestType): string {
    switch (type) {
      case 'chat_support': return '💬';
      case 'translation': return '🌐';
      case 'insurance': return '🛡️';
      case 'voluntary_return': return '🛂';
      case 'health_insurance_activation': return '🏥';
      case 'health_insurance': return '🏥';
      case 'service_request': return '📋';
      case 'general_inquiry': return '❓';
      default: return '📝';
    }
  }

  private getRequestTypeText(type: RequestType): string {
    switch (type) {
      case 'chat_support': return 'دعم فني / محادثة';
      case 'translation': return 'ترجمة';
      case 'insurance': return 'تأمين';
      case 'voluntary_return': return 'عودة طوعية';
      case 'health_insurance_activation': return 'تفعيل تأمين صحي';
      case 'health_insurance': return 'تأمين صحي للأجانب';
      case 'service_request': return 'طلب خدمة';
      case 'general_inquiry': return 'استفسار عام';
      default: return 'طلب عام';
    }
  }

  private getPriorityEmoji(priority?: string): string {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private getPriorityText(priority?: string): string {
    switch (priority) {
      case 'urgent': return 'مستعجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'عادي';
    }
  }

  private getAdditionalDataText(type: RequestType, additionalData: any): string {
    let text = '';
    
    switch (type) {
      case 'chat_support':
        if (additionalData.messageCount) {
          text += `• عدد الرسائل: ${additionalData.messageCount}\n`;
        }
        if (additionalData.language) {
          text += `• اللغة: ${additionalData.language === 'ar' ? 'العربية' : 'English'}\n`;
        }
        if (additionalData.isUrgent) {
          text += `• ⚠️ هذه رسالة مستعجلة تتطلب رداً فورياً!\n`;
        }
        break;
        
      case 'translation':
      case 'insurance':
      case 'service_request':
        if (additionalData.hasFile) {
          text += `• 📎 مرفق ملف: ${additionalData.fileName || 'ملف مرفق'}\n`;
        }
        if (additionalData.serviceType) {
          text += `• نوع الخدمة: ${this.getRequestTypeText(additionalData.serviceType)}\n`;
        }
        break;
        
      case 'voluntary_return':
        if (additionalData.kimlikNo) {
          text += `• رقم الهوية: ${additionalData.kimlikNo}\n`;
        }
        if (additionalData.sinirKapisi) {
          text += `• نقطة الحدود: ${additionalData.sinirKapisi}\n`;
        }
        if (additionalData.refakatCount > 0) {
          text += `• عدد المرافقين: ${additionalData.refakatCount}\n`;
        }
        if (additionalData.customDate) {
          text += `• تاريخ مخصص: ${additionalData.customDate}\n`;
        }
        break;
        
      case 'health_insurance_activation':
        if (additionalData.kimlikNo) {
          text += `• رقم الهوية: ${additionalData.kimlikNo}\n`;
        }
        if (additionalData.address) {
          text += `• العنوان: ${additionalData.address}\n`;
        }
        break;
        
      case 'health_insurance':
        if (additionalData.companyName) {
          text += `• شركة التأمين: ${additionalData.companyName}\n`;
        }
        if (additionalData.ageGroup) {
          text += `• الفئة العمرية: ${additionalData.ageGroup}\n`;
        }
        if (additionalData.calculatedAge) {
          text += `• العمر المحسوب: ${additionalData.calculatedAge} سنة\n`;
        }
        if (additionalData.durationMonths) {
          text += `• مدة التأمين: ${additionalData.durationMonths} شهر\n`;
        }
        if (additionalData.calculatedPrice) {
          text += `• السعر المحسوب: ${additionalData.calculatedPrice} ليرة تركية\n`;
        }
        if (additionalData.hasPassportImage) {
          text += `• 📎 مرفق صورة جواز السفر\n`;
        }
        break;
    }
    
    return text;
  }

  private getRequestReplyMarkup(requestData: RequestData): any {
    const buttons = [];
    
    switch (requestData.type) {
      case 'chat_support':
        buttons.push([
          {
            text: '💬 الرد على العميل',
            callback_data: `reply_${requestData.sessionId}`
          }
        ]);
        buttons.push([
          {
            text: '📋 عرض التفاصيل',
            callback_data: `details_${requestData.sessionId}`
          }
        ]);
        break;
        
      case 'translation':
      case 'insurance':
      case 'service_request':
        buttons.push([
          {
            text: '📞 التواصل مع العميل',
            callback_data: `contact_${requestData.requestId}`
          }
        ]);
        buttons.push([
          {
            text: '📋 عرض الطلب',
            callback_data: `view_${requestData.requestId}`
          }
        ]);
        break;
        
      case 'voluntary_return':
      case 'health_insurance_activation':
        buttons.push([
          {
            text: '📋 عرض النموذج',
            callback_data: `view_form_${requestData.formId}`
          }
        ]);
        buttons.push([
          {
            text: '📞 التواصل مع العميل',
            callback_data: `contact_form_${requestData.formId}`
          }
        ]);
        break;
        
      case 'health_insurance':
        buttons.push([
          {
            text: '📋 عرض الطلب',
            callback_data: `view_${requestData.requestId}`
          }
        ]);
        buttons.push([
          {
            text: '📞 التواصل مع العميل',
            callback_data: `contact_${requestData.requestId}`
          }
        ]);
        break;
    }
    
    // إضافة زر إغلاق للجميع
    buttons.push([
      {
        text: '✅ تم التعامل معه',
        callback_data: `close_${requestData.type}_${requestData.sessionId || requestData.formId || requestData.requestId}`
      }
    ]);
    
    return {
      inline_keyboard: buttons
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 جاري اختبار الاتصال بالتيليجرام عبر Edge Function...');
      
      // استخدام Supabase Edge Function لاختبار الاتصال
      const { data, error } = await supabase.functions.invoke('telegram-webhook', {
        body: {
          sessionId: 'test-connection-' + Date.now(),
          message: '🔔 اختبار الاتصال - تم إرسال هذه الرسالة من نظام الـ webhooks الجديد',
          language: 'ar',
          requestType: 'general_inquiry'
        }
      });

      if (error) {
        console.error('❌ خطأ في اختبار الاتصال:', error);
        return false;
      }

      console.log('✅ تم اختبار الاتصال بنجاح عبر Edge Function');
      return true;
    } catch (error) {
      console.error('❌ خطأ في اختبار الاتصال:', error);
      return false;
    }
  }

  getConfig(): TelegramConfig {
    return { 
      botToken: this.config.botToken ? `${this.config.botToken.substring(0, 10)}...` : '',
      adminChatId: this.config.adminChatId,
      isEnabled: this.config.isEnabled
    };
  }



  async reloadConfig() {
    await this.loadConfig();
  }
}

export const telegramService = new TelegramService();
export type { TelegramConfig, TelegramMessage, RequestData };
