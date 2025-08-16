// إعدادات بوت التلقرام
export const TELEGRAM_CONFIG = {
  // أنواع الإشعارات
  NOTIFICATION_TYPES: {
    SUPPORT_REQUEST: 'support_request',
    NEW_MESSAGE: 'new_message',
    URGENT_MESSAGE: 'urgent_message',
    SESSION_STATUS: 'session_status',
    SATISFACTION_RATING: 'satisfaction_rating'
  },

  // أولويات الرسائل
  PRIORITIES: {
    URGENT: 'urgent',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },

  // حالات الجلسات
  SESSION_STATUS: {
    ACTIVE: 'active',
    WAITING_SUPPORT: 'waiting_support',
    CLOSED: 'closed',
    ARCHIVED: 'archived'
  },

  // الكلمات المفتاحية لطلب الدعم
  SUPPORT_KEYWORDS: {
    ARABIC: ['ممثل', 'إنسان', 'حقيقي', 'مشرف', 'عامل', 'موظف'],
    ENGLISH: ['representative', 'human', 'real', 'agent', 'staff', 'employee']
  },

  // الكلمات المفتاحية للرسائل المستعجلة
  URGENT_KEYWORDS: {
    ARABIC: ['مستعجل', 'عاجل', 'مهم', 'ضروري', 'فوري'],
    ENGLISH: ['urgent', 'emergency', 'important', 'critical', 'immediate']
  },

  // قوالب الرسائل الافتراضية
  MESSAGE_TEMPLATES: {
    SUPPORT_REQUEST: {
      AR: '🚨 طلب ممثل خدمة عملاء جديد',
      EN: '🚨 New Customer Service Representative Request'
    },
    NEW_MESSAGE: {
      AR: '💬 رسالة جديدة من العميل',
      EN: '💬 New message from customer'
    },
    URGENT_MESSAGE: {
      AR: '🚨 رسالة مستعجلة!',
      EN: '🚨 Urgent message!'
    }
  },

  // إعدادات الاتصال
  CONNECTION: {
    TIMEOUT: 10000, // 10 ثانية
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 5000 // 5 ثانية
  },

  // إعدادات الإشعارات
  NOTIFICATIONS: {
    ENABLE_SOUND: true,
    AUTO_REFRESH_INTERVAL: 30000, // 30 ثانية
    MAX_NOTIFICATIONS: 50
  },

  // إعدادات الأمان
  SECURITY: {
    TOKEN_ENCRYPTION: true,
    RATE_LIMITING: true,
    MAX_REQUESTS_PER_MINUTE: 60
  }
};

// أنواع الأزرار التفاعلية
export const INTERACTIVE_BUTTONS = {
  REPLY: 'reply',
  DETAILS: 'details',
  QUICK_REPLY: 'quick_reply',
  URGENT_REPLY: 'urgent_reply',
  CALL: 'call'
};

// أوامر البوت
export const BOT_COMMANDS = {
  STATUS: '/status',
  SESSIONS: '/sessions',
  HELP: '/help'
};

// رسائل الخطأ
export const ERROR_MESSAGES = {
  BOT_NOT_CONFIGURED: 'البوت غير مُعد أو غير مفعل',
  INVALID_TOKEN: 'رمز البوت غير صحيح',
  CHAT_NOT_FOUND: 'معرف المحادثة غير صحيح',
  CONNECTION_FAILED: 'فشل في الاتصال',
  MESSAGE_SEND_FAILED: 'فشل في إرسال الرسالة'
};
