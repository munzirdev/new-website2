import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Settings, 
  Save, 
  TestTube, 
  Key, 
  User, 
  Shield, 
  Zap, 
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { telegramService, TelegramConfig } from '../services/telegramService';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
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
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {language === 'ar' ? 'إعدادات بوت التلقرام' : 'Telegram Bot Settings'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'ربط الشات بوت مع تلقرام' : 'Connect chat bot with Telegram'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {language === 'ar' ? 'كيفية الإعداد' : 'Setup Instructions'}
                  </h3>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>1. {language === 'ar' ? 'اذهب إلى @BotFather في تلقرام' : 'Go to @BotFather on Telegram'}</p>
                  <p>2. {language === 'ar' ? 'اكتب /newbot لإنشاء بوت جديد' : 'Type /newbot to create a new bot'}</p>
                  <p>3. {language === 'ar' ? 'احصل على رمز البوت' : 'Get the bot token'}</p>
                  <p>4. {language === 'ar' ? 'اذهب إلى @userinfobot لمعرفة معرف المحادثة' : 'Go to @userinfobot to get your chat ID'}</p>
                </div>
              </div>

              {/* Configuration Form */}
              <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? 'تفعيل بوت التلقرام' : 'Enable Telegram Bot'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'تفعيل إرسال الإشعارات' : 'Enable notifications'}
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Bot Token */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Key className="w-4 h-4" />
                      <span>{language === 'ar' ? 'رمز البوت' : 'Bot Token'}</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={config.botToken}
                      onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                      placeholder={language === 'ar' ? 'أدخل رمز البوت...' : 'Enter bot token...'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showToken ? <Shield className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Admin Chat ID */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <User className="w-4 h-4" />
                      <span>{language === 'ar' ? 'معرف المحادثة' : 'Chat ID'}</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={config.adminChatId}
                    onChange={(e) => setConfig(prev => ({ ...prev, adminChatId: e.target.value }))}
                    placeholder={language === 'ar' ? 'أدخل معرف المحادثة...' : 'Enter chat ID...'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={testing || !config.botToken}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testing ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...') : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')}</span>
                </button>

                <button
                  onClick={handleSendTestMessage}
                  disabled={testing || !config.isEnabled || !config.botToken || !config.adminChatId}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{testing ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (language === 'ar' ? 'رسالة اختبار' : 'Test Message')}</span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramSettingsModal;
