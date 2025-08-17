import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  RefreshCw,
  Zap,
  MessageSquare,
  Globe,
  Shield,
  Building,
  FileText,
  Key,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { webhookService } from '../services/webhookService';
import { telegramService } from '../services/telegramService';

interface WebhookSettingsProps {
  isDarkMode: boolean;
}

const WebhookSettings: React.FC<WebhookSettingsProps> = ({ isDarkMode }) => {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [webhookStatus, setWebhookStatus] = useState({
    isEnabled: false,
    telegramConnected: false,
    lastTest: null as Date | null
  });
  const [hasError, setHasError] = useState(false);
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '',
    adminChatId: ''
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWebhookStatus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const loadWebhookStatus = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      await webhookService.reloadConfig();
      const isEnabled = webhookService.isWebhookEnabled();
      let telegramConnected = false;
      
      const hasCredentials = await webhookService.hasTelegramCredentials();
      if (hasCredentials) {
        await telegramService.reloadConfig();
        const telegramConfig = telegramService.getConfig();
        telegramConnected = telegramConfig.isEnabled && !!telegramConfig.botToken && !!telegramConfig.adminChatId;
      }
      
      setWebhookStatus({
        isEnabled,
        telegramConnected,
        lastTest: null
      });
    } catch (error) {
      console.error('Error loading webhook status:', error);
      setHasError(true);
      setWebhookStatus({
        isEnabled: false,
        telegramConnected: false,
        lastTest: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTelegramConfig = async () => {
    try {
      const config = await webhookService.getTelegramConfig();
      if (config) {
        setTelegramConfig({
          botToken: config.bot_token || '',
          adminChatId: config.admin_chat_id || ''
        });
      }
    } catch (error) {
      console.error('Error loading Telegram config:', error);
    }
  };

  const saveTelegramConfig = async () => {
    if (!telegramConfig.botToken || !telegramConfig.adminChatId) {
      showMessage(
        language === 'ar' 
          ? 'يرجى إدخال معرف البوت ومعرف المحادثة'
          : 'Please enter bot token and chat ID',
        'error'
      );
      return;
    }

    setIsSavingConfig(true);
    try {
      const success = await webhookService.updateTelegramConfig(
        telegramConfig.botToken,
        telegramConfig.adminChatId
      );
      
      if (success) {
        await telegramService.reloadConfig();
        showMessage(
          language === 'ar' 
            ? 'تم حفظ إعدادات التيليجرام بنجاح'
            : 'Telegram settings saved successfully',
          'success'
        );
        setShowTelegramConfig(false);
        await loadWebhookStatus();
      } else {
        showMessage(
          language === 'ar' 
            ? 'خطأ في حفظ إعدادات التيليجرام'
            : 'Error saving Telegram settings',
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving Telegram config:', error);
      showMessage(
        language === 'ar' 
          ? 'خطأ في حفظ إعدادات التيليجرام'
          : 'Error saving Telegram settings',
        'error'
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  const testTelegramConnection = async () => {
    if (!telegramConfig.botToken || !telegramConfig.adminChatId) {
      showMessage(
        language === 'ar' 
          ? 'يرجى إدخال معرف البوت ومعرف المحادثة أولاً'
          : 'Please enter bot token and chat ID first',
        'error'
      );
      return;
    }

    setIsTesting(true);
    try {
      const success = await webhookService.testTelegramConnection(
        telegramConfig.botToken,
        telegramConfig.adminChatId
      );
      
      if (success) {
        showMessage(
          language === 'ar' 
            ? 'تم اختبار الاتصال بنجاح! تحقق من التيليجرام'
            : 'Connection test successful! Check Telegram',
          'success'
        );
      } else {
        showMessage(
          language === 'ar' 
            ? 'فشل في اختبار الاتصال - تأكد من صحة المعرفات'
            : 'Connection test failed - Check your credentials',
          'error'
        );
      }
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      showMessage(
        language === 'ar' 
          ? 'خطأ في اختبار الاتصال'
          : 'Error testing connection',
        'error'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const openTelegramConfig = async () => {
    setShowTelegramConfig(true);
    setShowBotToken(false);
    await loadTelegramConfig();
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    const duration = type === 'error' ? 8000 : 5000;
    setTimeout(() => setMessage(''), duration);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? 
      (language === 'ar' ? 'مفعل' : 'Enabled') : 
      (language === 'ar' ? 'معطل' : 'Disabled');
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="relative max-w-7xl mx-auto z-10">
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {language === 'ar' 
                  ? 'جاري تحميل إعدادات الـ webhooks'
                  : 'Loading webhook settings'
                }
              </p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {language === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {language === 'ar' 
                  ? 'حدث خطأ أثناء تحميل إعدادات الـ webhooks'
                  : 'An error occurred while loading webhook settings'
                }
              </p>
              <button
                onClick={() => {
                  setHasError(false);
                  loadWebhookStatus();
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {!isLoading && !hasError && (
          <div>
            <div className="mb-8">
              <div className="flex items-center space-x-4 space-x-reverse mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {language === 'ar' ? 'إعدادات الـ Webhooks' : 'Webhook Settings'}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300">
                    {language === 'ar' 
                      ? 'إدارة إشعارات التيليجرام لجميع الطلبات'
                      : 'Manage Telegram notifications for all requests'
                    }
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-2xl border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-500/30 dark:text-green-200'
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-200'
                  : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-200'
              }`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  {messageType === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : messageType === 'error' ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{message}</span>
                </div>
              </div>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'حالة الـ Webhooks' : 'Webhook Status'}
                    </h3>
                  </div>
                  {getStatusIcon(webhookStatus.isEnabled)}
                </div>
                <p className={`text-lg font-bold ${getStatusColor(webhookStatus.isEnabled)}`}>
                  {getStatusText(webhookStatus.isEnabled)}
                </p>
              </div>

              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'اتصال التيليجرام' : 'Telegram Connection'}
                    </h3>
                  </div>
                  {getStatusIcon(webhookStatus.telegramConnected)}
                </div>
                <p className={`text-lg font-bold ${getStatusColor(webhookStatus.telegramConnected)}`}>
                  {getStatusText(webhookStatus.telegramConnected)}
                </p>
              </div>

              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'آخر اختبار' : 'Last Test'}
                    </h3>
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  {webhookStatus.lastTest 
                    ? webhookStatus.lastTest.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
                    : (language === 'ar' ? 'لم يتم الاختبار' : 'Not tested')
                  }
                </p>
              </div>
            </div>

            {/* Controls Section */}
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-white/20 shadow-xl mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                {language === 'ar' ? 'التحكم في النظام' : 'System Controls'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {language === 'ar' ? 'إعدادات التيليجرام' : 'Telegram Settings'}
                  </h3>
                  <button
                    onClick={openTelegramConfig}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <Key className="w-5 h-5" />
                      <span>{language === 'ar' ? 'إدارة المعرفات' : 'Manage Credentials'}</span>
                    </div>
                  </button>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {language === 'ar' 
                      ? 'إدارة معرف البوت ومعرف المحادثة'
                      : 'Manage bot token and chat ID'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {language === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                  </h3>
                  <button
                    onClick={async () => {
                      try {
                        await telegramService.reloadConfig();
                        const success = await telegramService.testConnection();
                        if (success) {
                          showMessage(
                            language === 'ar' 
                              ? '✅ تم اختبار الاتصال بنجاح'
                              : '✅ Connection test successful',
                            'success'
                          );
                        } else {
                          showMessage(
                            language === 'ar' 
                              ? '❌ فشل في اختبار الاتصال'
                              : '❌ Connection test failed',
                            'error'
                          );
                        }
                      } catch (error) {
                        console.error('Error testing connection:', error);
                        showMessage(
                          language === 'ar' 
                            ? '❌ خطأ في اختبار الاتصال'
                            : '❌ Error testing connection',
                          'error'
                        );
                      }
                    }}
                    disabled={!webhookStatus.telegramConnected}
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <TestTube className="w-5 h-5" />
                      <span>{language === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}</span>
                    </div>
                  </button>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {language === 'ar' 
                      ? 'اختبار الاتصال بالتيليجرام'
                      : 'Test Telegram connection'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Supported Request Types */}
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/30 dark:border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                {language === 'ar' ? 'أنواع الطلبات المدعومة' : 'Supported Request Types'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200/30 dark:border-blue-700/20 backdrop-blur-sm">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'الدعم الفني' : 'Chat Support'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'طلبات المحادثة والرسائل' : 'Chat requests and messages'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-200/30 dark:border-green-700/20 backdrop-blur-sm">
                  <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'الترجمة' : 'Translation'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'طلبات ترجمة الوثائق' : 'Document translation requests'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200/30 dark:border-purple-700/20 backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'التأمين' : 'Insurance'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'طلبات التأمين الصحي' : 'Health insurance requests'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-700">
                  <Building className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {language === 'ar' ? 'العودة الطوعية' : 'Voluntary Return'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'طلبات العودة الطوعية' : 'Voluntary return requests'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-700">
                  <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {language === 'ar' ? 'تفعيل التأمين الصحي' : 'Health Insurance Activation'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'طلبات تفعيل التأمين الصحي' : 'Health insurance activation requests'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-700">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {language === 'ar' ? 'طلبات الخدمات' : 'Service Requests'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'طلبات الخدمات العامة' : 'General service requests'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Telegram Configuration Modal */}
        {showTelegramConfig && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {language === 'ar' ? 'إعدادات التيليجرام' : 'Telegram Settings'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {language === 'ar' 
                        ? 'إدارة معرف البوت ومعرف المحادثة'
                        : 'Manage bot token and chat ID'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTelegramConfig(false)}
                  className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Bot Token */}
                <div>
                  <label className="block text-gray-900 dark:text-white font-semibold mb-3">
                    {language === 'ar' ? 'معرف البوت (Bot Token)' : 'Bot Token'}
                  </label>
                  <div className="relative">
                    <input
                      type={showBotToken ? 'text' : 'password'}
                      value={telegramConfig.botToken}
                      onChange={(e) => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
                      placeholder={language === 'ar' ? 'أدخل معرف البوت هنا...' : 'Enter bot token here...'}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBotToken(!showBotToken)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showBotToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {language === 'ar' 
                      ? 'احصل على معرف البوت من @BotFather على التيليجرام'
                      : 'Get bot token from @BotFather on Telegram'
                    }
                  </p>
                </div>

                {/* Admin Chat ID */}
                <div>
                  <label className="block text-gray-900 dark:text-white font-semibold mb-3">
                    {language === 'ar' ? 'معرف المحادثة (Chat ID)' : 'Chat ID'}
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.adminChatId}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, adminChatId: e.target.value }))}
                    placeholder={language === 'ar' ? 'أدخل معرف المحادثة هنا...' : 'Enter chat ID here...'}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {language === 'ar' 
                      ? 'معرف المحادثة التي سيتم إرسال الإشعارات إليها'
                      : 'Chat ID where notifications will be sent'
                    }
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {language === 'ar' ? 'كيفية الحصول على المعرفات:' : 'How to get credentials:'}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">1.</span> {language === 'ar' 
                        ? 'اذهب إلى @BotFather على التيليجرام'
                        : 'Go to @BotFather on Telegram'
                      }
                    </p>
                    <p>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">2.</span> {language === 'ar' 
                        ? 'أرسل /newbot لإنشاء بوت جديد'
                        : 'Send /newbot to create a new bot'
                      }
                    </p>
                    <p>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">3.</span> {language === 'ar' 
                        ? 'احفظ معرف البوت (Bot Token)'
                        : 'Save the bot token'
                      }
                    </p>
                    <p>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">4.</span> {language === 'ar' 
                        ? 'ابدأ محادثة مع البوت واحصل على معرف المحادثة'
                        : 'Start a chat with the bot and get the chat ID'
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={testTelegramConnection}
                      disabled={isTesting || !telegramConfig.botToken || !telegramConfig.adminChatId}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTesting ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>{language === 'ar' ? 'جاري الاختبار...' : 'Testing...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <TestTube className="w-5 h-5" />
                          <span>{language === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}</span>
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={saveTelegramConfig}
                      disabled={isSavingConfig || !telegramConfig.botToken || !telegramConfig.adminChatId}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingConfig ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <Save className="w-5 h-5" />
                          <span>{language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookSettings;
