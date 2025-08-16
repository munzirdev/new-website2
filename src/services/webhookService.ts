import { telegramService, RequestType } from './telegramService';
import { supabase } from '../lib/supabase';

interface WebhookData {
  type: RequestType;
  data: any;
  userId?: string;
  userProfile?: any;
}

class WebhookService {
  private isEnabled: boolean = true;

  constructor() {
    // تأخير تحميل الإعدادات لتجنب مشاكل التزامن
    setTimeout(() => {
      this.loadWebhookConfig();
    }, 100);
  }

  private async loadWebhookConfig() {
    try {
      const { data, error } = await supabase
        .from('telegram_config')
        .select('is_enabled')
        .single();

      if (data && !error) {
        this.isEnabled = data.is_enabled;
      } else {
        console.warn('No telegram_config found, using default enabled state');
        this.isEnabled = true;
      }
    } catch (error) {
      console.error('Error loading webhook config:', error);
      // في حالة الخطأ، نستخدم الحالة الافتراضية
      this.isEnabled = true;
    }
  }

  // إرسال إشعار لطلب ترجمة
  async sendTranslationRequestWebhook(requestData: any) {
    if (!this.isEnabled) return;

    try {
      // جلب معلومات المستخدم
      const userProfile = await this.getUserProfile(requestData.user_id);
      
      const webhookData: WebhookData = {
        type: 'translation',
        data: {
          ...requestData,
          user_name: userProfile?.full_name,
          user_email: userProfile?.email,
          user_phone: userProfile?.phone,
          additionalData: {
            hasFile: !!requestData.file_url,
            fileName: requestData.file_name,
            fileUrl: requestData.file_url
          }
        },
        userId: requestData.user_id,
        userProfile
      };

      await telegramService.sendTranslationRequestNotification(webhookData.data);
      console.log('✅ تم إرسال إشعار طلب الترجمة إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب الترجمة:', error);
    }
  }

  // إرسال إشعار لطلب تأمين
  async sendInsuranceRequestWebhook(requestData: any) {
    if (!this.isEnabled) return;

    try {
      // جلب معلومات المستخدم
      const userProfile = await this.getUserProfile(requestData.user_id);
      
      const webhookData: WebhookData = {
        type: 'insurance',
        data: {
          ...requestData,
          user_name: userProfile?.full_name,
          user_email: userProfile?.email,
          user_phone: userProfile?.phone,
          additionalData: {
            hasFile: !!requestData.file_url,
            fileName: requestData.file_name,
            fileUrl: requestData.file_url
          }
        },
        userId: requestData.user_id,
        userProfile
      };

      await telegramService.sendInsuranceRequestNotification(webhookData.data);
      console.log('✅ تم إرسال إشعار طلب التأمين إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب التأمين:', error);
    }
  }

  // إرسال إشعار لطلب عودة طوعية
  async sendVoluntaryReturnWebhook(formData: any) {
    if (!this.isEnabled) return;

    try {
      await telegramService.sendVoluntaryReturnNotification(formData);
      console.log('✅ تم إرسال إشعار طلب العودة الطوعية إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب العودة الطوعية:', error);
    }
  }

  // إرسال إشعار لطلب تفعيل التأمين الصحي
  async sendHealthInsuranceActivationWebhook(formData: any) {
    if (!this.isEnabled) return;

    try {
      await telegramService.sendHealthInsuranceActivationNotification(formData);
      console.log('✅ تم إرسال إشعار طلب تفعيل التأمين الصحي إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب تفعيل التأمين الصحي:', error);
    }
  }

  // إرسال إشعار لطلب التأمين الصحي للأجانب
  async sendHealthInsuranceRequestNotification(requestData: any) {
    if (!this.isEnabled) return;

    try {
      // جلب معلومات المستخدم إذا كان مسجل دخول
      let userProfile = null;
      if (requestData.userInfo?.email) {
        // محاولة جلب معلومات المستخدم من البريد الإلكتروني
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', requestData.userInfo.email)
          .single();
        
        if (userData && !error) {
          userProfile = userData;
        }
      }

      const webhookData: WebhookData = {
        type: 'health_insurance',
        data: {
          ...requestData,
          user_name: requestData.userInfo?.name || userProfile?.full_name,
          user_email: requestData.userInfo?.email || userProfile?.email,
          user_phone: requestData.userInfo?.phone || userProfile?.phone,
          additionalData: {
            ...requestData.additionalData,
            hasPassportImage: !!requestData.additionalData?.passportImageUrl,
            passportImageUrl: requestData.additionalData?.passportImageUrl
          }
        },
        userId: userProfile?.id,
        userProfile
      };

      await telegramService.sendHealthInsuranceRequestNotification(webhookData.data);
      console.log('✅ تم إرسال إشعار طلب التأمين الصحي للأجانب إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب التأمين الصحي للأجانب:', error);
    }
  }

  // إرسال إشعار لطلب خدمة عام
  async sendServiceRequestWebhook(requestData: any) {
    if (!this.isEnabled) return;

    try {
      // جلب معلومات المستخدم
      const userProfile = await this.getUserProfile(requestData.user_id);
      
      const webhookData: WebhookData = {
        type: 'service_request',
        data: {
          ...requestData,
          user_name: userProfile?.full_name,
          user_email: userProfile?.email,
          user_phone: userProfile?.phone,
          additionalData: {
            hasFile: !!requestData.file_url,
            fileName: requestData.file_name,
            fileUrl: requestData.file_url,
            serviceType: requestData.service_type || requestData.serviceType
          }
        },
        userId: requestData.user_id,
        userProfile
      };

      await telegramService.sendServiceRequestNotification(webhookData.data);
      console.log('✅ تم إرسال إشعار طلب الخدمة إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب الخدمة:', error);
    }
  }

  // إرسال إشعار لطلب دعم فني (محادثة)
  async sendChatSupportWebhook(sessionData: any) {
    if (!this.isEnabled) return;

    try {
      await telegramService.sendSupportRequestNotification(sessionData);
      console.log('✅ تم إرسال إشعار طلب الدعم الفني إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار طلب الدعم الفني:', error);
    }
  }

  // إرسال إشعار لرسالة جديدة في المحادثة
  async sendNewMessageWebhook(sessionData: any, messageContent: string) {
    if (!this.isEnabled) return;

    try {
      await telegramService.sendNewMessageNotification(sessionData, messageContent);
      console.log('✅ تم إرسال إشعار رسالة جديدة إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار رسالة جديدة:', error);
    }
  }

  // إرسال إشعار لرسالة مستعجلة
  async sendUrgentMessageWebhook(sessionData: any, messageContent: string) {
    if (!this.isEnabled) return;

    try {
      await telegramService.sendUrgentMessageNotification(sessionData, messageContent);
      console.log('✅ تم إرسال إشعار رسالة مستعجلة إلى التيليجرام');
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار رسالة مستعجلة:', error);
    }
  }

  // دالة مساعدة لجلب معلومات المستخدم
  private async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // تفعيل/إلغاء تفعيل الـ webhooks
  async setWebhookEnabled(enabled: boolean) {
    try {
      // أولاً، نحاول تحديث السجل الموجود
      let { error } = await supabase
        .from('telegram_config')
        .update({ is_enabled: enabled })
        .eq('id', 2);

      // إذا لم يوجد سجل، نقوم بإنشائه
      if (error && error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('telegram_config')
          .insert({ 
            id: 2,
            bot_token: 'placeholder',
            admin_chat_id: 'placeholder',
            is_enabled: enabled 
          });
        
        if (!insertError) {
          this.isEnabled = enabled;
          console.log(`✅ تم ${enabled ? 'تفعيل' : 'إلغاء تفعيل'} الـ webhooks`);
          return true;
        }
      } else if (!error) {
        this.isEnabled = enabled;
        console.log(`✅ تم ${enabled ? 'تفعيل' : 'إلغاء تفعيل'} الـ webhooks`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating webhook config:', error);
      return false;
    }
  }

  // جلب حالة الـ webhooks
  isWebhookEnabled(): boolean {
    return this.isEnabled;
  }

  // إعادة تحميل الإعدادات
  async reloadConfig() {
    await this.loadWebhookConfig();
  }

  // جلب إعدادات التيليجرام
  async getTelegramConfig() {
    try {
      console.log('🔍 جاري جلب إعدادات التيليجرام...');
      const { data, error } = await supabase
        .from('telegram_config')
        .select('*')
        .eq('id', 2)
        .single();

      if (error) {
        console.error('❌ خطأ في جلب إعدادات التيليجرام:', error);
        return null;
      }

      console.log('📋 إعدادات التيليجرام المحفوظة:', {
        hasBotToken: !!data?.bot_token,
        hasChatId: !!data?.admin_chat_id,
        isEnabled: data?.is_enabled,
        botTokenLength: data?.bot_token?.length || 0
      });

      return data;
    } catch (error) {
      console.error('❌ خطأ في getTelegramConfig:', error);
      return null;
    }
  }

  // تحديث إعدادات التيليجرام
  async updateTelegramConfig(botToken: string, adminChatId: string) {
    try {
      console.log('🔄 جاري حفظ إعدادات التيليجرام...', { 
        botTokenLength: botToken.length, 
        adminChatId: adminChatId 
      });

      // التحقق من صحة البيانات
      if (!botToken || !adminChatId) {
        console.error('❌ البيانات غير صحيحة');
        return false;
      }

      // التحقق من وجود السجل أولاً
      console.log('🔍 جاري التحقق من السجل الموجود...');
      const { data: existingConfig, error: fetchError } = await supabase
        .from('telegram_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ خطأ في جلب الإعدادات الحالية:', fetchError);
        return false;
      }

      console.log('📋 السجل الموجود:', existingConfig);

      let result;
      if (existingConfig) {
        // تحديث السجل الموجود
        console.log('📝 تحديث السجل الموجود...');
        result = await supabase
          .from('telegram_config')
          .update({ 
            bot_token: botToken,
            admin_chat_id: adminChatId,
            is_enabled: true
          })
          .eq('id', 2);
      } else {
        // إنشاء سجل جديد
        console.log('📝 إنشاء سجل جديد...');
        result = await supabase
          .from('telegram_config')
          .insert({ 
            id: 2,
            bot_token: botToken,
            admin_chat_id: adminChatId,
            is_enabled: true
          });
      }

      console.log('📊 نتيجة العملية:', result);

      if (result.error) {
        console.error('❌ خطأ في حفظ الإعدادات:', result.error);
        return false;
      }

      // التحقق من الحفظ
      console.log('🔍 جاري التحقق من الحفظ...');
      const { data: savedConfig, error: verifyError } = await supabase
        .from('telegram_config')
        .select('*')
        .eq('id', 2)
        .single();

      if (verifyError) {
        console.error('❌ خطأ في التحقق من الحفظ:', verifyError);
        return false;
      }

      console.log('📋 السجل المحفوظ:', savedConfig);

      if (savedConfig && savedConfig.bot_token === botToken && savedConfig.admin_chat_id === adminChatId) {
        this.isEnabled = true; // تحديث الحالة المحلية
        
        // تحديث إعدادات التيليجرام في telegramService
        await telegramService.updateConfig({
          botToken: botToken,
          adminChatId: adminChatId,
          isEnabled: true
        });
        
        console.log('✅ تم حفظ إعدادات التيليجرام بنجاح');
        return true;
      } else {
        console.error('❌ فشل في التحقق من الحفظ');
        console.error('المعرفات المتوقعة:', { botToken, adminChatId });
        console.error('المعرفات المحفوظة:', { 
          botToken: savedConfig?.bot_token, 
          adminChatId: savedConfig?.admin_chat_id 
        });
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ إعدادات التيليجرام:', error);
      return false;
    }
  }

  // اختبار اتصال التيليجرام
  async testTelegramConnection(botToken: string, adminChatId: string) {
    try {
      console.log('🔄 جاري اختبار الاتصال بالتيليجرام...', {
        botTokenLength: botToken.length,
        adminChatId: adminChatId
      });

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: '🔔 اختبار الاتصال - تم إرسال هذه الرسالة من نظام الـ webhooks',
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();
      console.log('📊 نتيجة اختبار الاتصال:', result);
      
      if (result.ok) {
        console.log('✅ تم اختبار الاتصال بنجاح');
        return true;
      } else {
        console.error('❌ فشل في اختبار الاتصال:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في اختبار الاتصال:', error);
      return false;
    }
  }

  // التحقق من وجود معرفات التيليجرام
  async hasTelegramCredentials(): Promise<boolean> {
    try {
      console.log('🔍 جاري التحقق من وجود معرفات التيليجرام...');
      const config = await this.getTelegramConfig();
      
      const hasValidCredentials = !!(config?.bot_token && config?.admin_chat_id && 
                config.bot_token !== 'placeholder' && 
                config.admin_chat_id !== 'placeholder');
      
      console.log('📋 نتيجة التحقق من المعرفات:', {
        hasConfig: !!config,
        hasBotToken: !!config?.bot_token,
        hasChatId: !!config?.admin_chat_id,
        botTokenIsPlaceholder: config?.bot_token === 'placeholder',
        chatIdIsPlaceholder: config?.admin_chat_id === 'placeholder',
        hasValidCredentials
      });
      
      return hasValidCredentials;
    } catch (error) {
      console.error('❌ خطأ في التحقق من المعرفات:', error);
      return false;
    }
  }

  // إرسال إشعار تجريبي
  async sendTestWebhook() {
    if (!this.isEnabled) {
      console.log('❌ الـ webhooks معطلة');
      return false;
    }

    try {
      console.log('🔄 جاري إرسال الإشعار التجريبي...');
      
      // إعادة تحميل إعدادات التيليجرام أولاً
      await telegramService.reloadConfig();
      
      // جلب معرفات التيليجرام من قاعدة البيانات
      const config = await this.getTelegramConfig();
      if (!config || !config.bot_token || !config.admin_chat_id) {
        console.error('❌ لا توجد معرفات التيليجرام محفوظة');
        return false;
      }

      // تحديث إعدادات التيليجرام في telegramService
      const updateSuccess = await telegramService.updateConfig({
        botToken: config.bot_token,
        adminChatId: config.admin_chat_id,
        isEnabled: true
      });

      if (!updateSuccess) {
        console.error('❌ فشل في تحديث إعدادات التيليجرام في telegramService');
        return false;
      }

      console.log('📋 المعرفات المستخدمة:', {
        hasBotToken: !!config.bot_token,
        hasChatId: !!config.admin_chat_id,
        botTokenPreview: config.bot_token.substring(0, 10) + '...',
        telegramServiceConfig: telegramService.getConfig()
      });

      // التحقق من أن telegramService تم تحديثه بشكل صحيح
      const telegramConfig = telegramService.getConfig();
      if (!telegramConfig.isEnabled) {
        console.error('❌ telegramService غير مفعل');
        return false;
      }

      // إرسال رسالة تجريبية باستخدام telegramService
      const testData = {
        type: 'service_request' as RequestType,
        title: 'إشعار تجريبي من نظام الـ Webhooks',
        description: `هذا إشعار تجريبي لاختبار نظام الـ webhooks

📋 تفاصيل الإشعار:
• النوع: إشعار تجريبي
• الوقت: ${new Date().toLocaleString('ar-SA')}
• الحالة: تم الإرسال بنجاح

✅ هذا الإشعار يؤكد أن نظام الـ webhooks يعمل بشكل صحيح`,
        userInfo: {
          name: 'مستخدم تجريبي',
          email: 'test@example.com',
          phone: '+966501234567'
        },
        requestId: 'test-' + Date.now(),
        priority: 'medium' as const,
        status: 'pending',
        createdAt: new Date().toISOString(),
        additionalData: {
          serviceType: 'test',
          hasFile: false
        }
      };

      const success = await telegramService.sendRequestNotification(testData);
      
      if (success) {
        console.log('✅ تم إرسال الإشعار التجريبي بنجاح');
        return true;
      } else {
        console.error('❌ فشل في إرسال الإشعار التجريبي');
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار التجريبي:', error);
      return false;
    }
  }
}

export const webhookService = new WebhookService();
export type { WebhookData };
