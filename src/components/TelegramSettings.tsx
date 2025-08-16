import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bot, 
  MessageCircle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  TestTube,
  Key,
  User,
  Globe,
  Shield,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { telegramService, TelegramConfig } from '../services/telegramService';
import { useNavigate } from 'react-router-dom';

interface TelegramSettingsProps {
  isDarkMode: boolean;
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ isDarkMode }) => {
  console.log('🔧 TelegramSettings component initialized');
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    adminChatId: '',
    isEnabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const currentConfig = telegramService.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await telegramService.updateConfig(config);
      if (success) {
        setTestMessage(language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
        setTestResult('success');
      } else {
        setTestMessage(language === 'ar' ? 'فشل في حفظ الإعدادات' : 'Failed to save settings');
        setTestResult('error');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setTestMessage(language === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error occurred while saving settings');
      setTestResult('error');
    } finally {
      setSaving(false);
      setTimeout(() => {
        setTestResult(null);
        setTestMessage('');
      }, 3000);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const success = await telegramService.testConnection();
      if (success) {
        setTestMessage(language === 'ar' ? 'تم اختبار الاتصال بنجاح' : 'Connection test successful');
        setTestResult('success');
      } else {
        setTestMessage(language === 'ar' ? 'فشل في اختبار الاتصال' : 'Connection test failed');
        setTestResult('error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestMessage(language === 'ar' ? 'حدث خطأ أثناء اختبار الاتصال' : 'Error occurred during connection test');
      setTestResult('error');
    } finally {
      setTesting(false);
      setTimeout(() => {
        setTestResult(null);
        setTestMessage('');
      }, 3000);
    }
  };

  const handleSendTestMessage = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const testSessionData = {
        session_id: 'test-session-001',
        last_message: 'رسالة تجريبية للاختبار',
        message_count: 1,
        priority: 'medium',
        language: 'ar',
        last_message_time: new Date().toISOString(),
        user_info: {
          name: 'مستخدم تجريبي',
          email: 'test@example.com',
          phone: '+966501234567',
          country: 'Saudi Arabia'
        }
      };

      const success = await telegramService.sendSupportRequestNotification(testSessionData);
      if (success) {
        setTestMessage(language === 'ar' ? 'تم إرسال رسالة الاختبار بنجاح' : 'Test message sent successfully');
        setTestResult('success');
      } else {
        setTestMessage(language === 'ar' ? 'فشل في إرسال رسالة الاختبار' : 'Failed to send test message');
        setTestResult('error');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setTestMessage(language === 'ar' ? 'حدث خطأ أثناء إرسال رسالة الاختبار' : 'Error occurred while sending test message');
      setTestResult('error');
    } finally {
      setTesting(false);
      setTimeout(() => {
        setTestResult(null);
        setTestMessage('');
      }, 3000);
    }
  };

  const getInstructions = () => {
    return language === 'ar' ? [
      '1. اذهب إلى @BotFather في تلقرام',
      '2. اكتب /newbot لإنشاء بوت جديد',
      '3. اتبع التعليمات وأعطِ اسماً للبوت',
      '4. احصل على رمز البوت (Bot Token)',
      '5. ابدأ محادثة مع البوت الجديد',
      '6. اذهب إلى @userinfobot لمعرفة معرف المحادثة الخاص بك',
      '7. أدخل الرمز ومعرف المحادثة في الإعدادات أدناه'
    ] : [
      '1. Go to @BotFather on Telegram',
      '2. Type /newbot to create a new bot',
      '3. Follow the instructions and give your bot a name',
      '4. Get the bot token',
      '5. Start a conversation with your new bot',
      '6. Go to @userinfobot to get your chat ID',
      '7. Enter the token and chat ID in the settings below'
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean-600"></div>
      </div>
    );
  }

  // Debug logging
  console.log('🔧 TelegramSettings component rendered, showTelegramSettings should be true');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-jet-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-jet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-caribbean-600 to-blue-600 text-white p-6 rounded-xl">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="p-3 bg-white/20 rounded-lg">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'إعدادات بوت التلقرام' : 'Telegram Bot Settings'}
            </h1>
            <p className="text-white/80 mt-1">
              {language === 'ar' 
                ? 'ربط الشات بوت مع تلقرام لإرسال الإشعارات والرد على العملاء'
                : 'Connect chat bot with Telegram to send notifications and respond to customers'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {language === 'ar' ? 'كيفية إعداد بوت التلقرام' : 'How to Set Up Telegram Bot'}
          </h2>
        </div>
        <div className="space-y-2">
          {getInstructions().map((instruction, index) => (
            <p key={index} className="text-blue-800 dark:text-blue-200 text-sm">
              {instruction}
            </p>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-6">
          <Settings className="w-6 h-6 text-caribbean-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {language === 'ar' ? 'إعدادات البوت' : 'Bot Configuration'}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-jet-700 rounded-lg">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Zap className="w-5 h-5 text-caribbean-600" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {language === 'ar' ? 'تفعيل بوت التلقرام' : 'Enable Telegram Bot'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ar' 
                    ? 'تفعيل إرسال الإشعارات عبر تلقرام'
                    : 'Enable sending notifications via Telegram'
                  }
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-caribbean-300 dark:peer-focus:ring-caribbean-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-caribbean-600"></div>
            </label>
          </div>

          {/* Bot Token */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Key className="w-4 h-4" />
                <span>{language === 'ar' ? 'رمز البوت (Bot Token)' : 'Bot Token'}</span>
              </div>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.botToken}
                onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                placeholder={language === 'ar' ? 'أدخل رمز البوت هنا...' : 'Enter bot token here...'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 dark:bg-jet-700 dark:text-white pr-12"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showToken ? <Shield className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'ar' 
                ? 'رمز البوت الذي حصلت عليه من @BotFather'
                : 'The bot token you received from @BotFather'
              }
            </p>
          </div>

          {/* Admin Chat ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="w-4 h-4" />
                <span>{language === 'ar' ? 'معرف محادثة المشرف' : 'Admin Chat ID'}</span>
              </div>
            </label>
            <input
              type="text"
              value={config.adminChatId}
              onChange={(e) => setConfig(prev => ({ ...prev, adminChatId: e.target.value }))}
              placeholder={language === 'ar' ? 'أدخل معرف المحادثة هنا...' : 'Enter chat ID here...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 dark:bg-jet-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'ar' 
                ? 'معرف المحادثة الخاص بك (يمكن الحصول عليه من @userinfobot)'
                : 'Your chat ID (can be obtained from @userinfobot)'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}</span>
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testing || !config.botToken}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4" />
              <span>{testing ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...') : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')}</span>
            </button>

            <button
              onClick={handleSendTestMessage}
              disabled={testing || !config.isEnabled || !config.botToken || !config.adminChatId}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{testing ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (language === 'ar' ? 'إرسال رسالة اختبار' : 'Send Test Message')}</span>
            </button>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 space-x-reverse ${
              testResult === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {testResult === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${
                testResult === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {testMessage}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-6">
          <Bell className="w-6 h-6 text-caribbean-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {language === 'ar' ? 'المميزات المتاحة' : 'Available Features'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-medium text-orange-900 dark:text-orange-100">
                {language === 'ar' ? 'إشعارات طلبات الدعم' : 'Support Request Notifications'}
              </h3>
            </div>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {language === 'ar' 
                ? 'إشعار فوري عند طلب العميل التحدث مع ممثل'
                : 'Instant notification when customer requests human support'
              }
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {language === 'ar' ? 'رسائل جديدة' : 'New Messages'}
              </h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {language === 'ar' 
                ? 'إشعار عند وصول رسالة جديدة من العميل'
                : 'Notification when new message arrives from customer'
              }
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Zap className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-900 dark:text-red-100">
                {language === 'ar' ? 'رسائل مستعجلة' : 'Urgent Messages'}
              </h3>
            </div>
            <p className="text-sm text-red-800 dark:text-red-200">
              {language === 'ar' 
                ? 'إشعارات خاصة للرسائل المستعجلة'
                : 'Special notifications for urgent messages'
              }
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900 dark:text-green-100">
                {language === 'ar' ? 'أزرار تفاعلية' : 'Interactive Buttons'}
              </h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">
              {language === 'ar' 
                ? 'أزرار للرد السريع وعرض التفاصيل'
                : 'Buttons for quick replies and viewing details'
              }
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-900 dark:text-purple-100">
                {language === 'ar' ? 'إعدادات متقدمة' : 'Advanced Settings'}
              </h3>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {language === 'ar' 
                ? 'تخصيص الإشعارات والرسائل'
                : 'Customize notifications and messages'
              }
            </p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-indigo-900 dark:text-indigo-100">
                {language === 'ar' ? 'أمان عالي' : 'High Security'}
              </h3>
            </div>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              {language === 'ar' 
                ? 'حماية رموز البوت والمحادثات'
                : 'Protection of bot tokens and conversations'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramSettings;
