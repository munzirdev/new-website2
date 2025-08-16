import React from 'react';
import { X, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface PendingVerificationModalProps {
  email: string;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onResendEmail?: () => void;
}

const PendingVerificationModal: React.FC<PendingVerificationModalProps> = ({
  email,
  onClose,
  onSwitchToLogin,
  onResendEmail
}) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-jet-400 dark:text-platinum-400 hover:text-jet-600 dark:hover:text-platinum-200 transition-colors duration-300"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-jet-900 dark:text-platinum-100 mb-2">
            حسابك في انتظار التأكيد
          </h2>
          <p className="text-jet-600 dark:text-platinum-400">
            هذا البريد الإلكتروني مسجل مسبقاً ويحتاج إلى تأكيد
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-right rtl:text-right">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  تحقق من بريدك الإلكتروني
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  تم إرسال رابط التأكيد إلى: {email}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-jet-700 border border-gray-200 dark:border-jet-600 rounded-lg p-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-right rtl:text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-platinum-100">
                  بعد التأكيد
                </p>
                <p className="text-sm text-gray-600 dark:text-platinum-400 mt-1">
                  ستتمكن من تسجيل الدخول والوصول لجميع الميزات
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {onResendEmail && (
            <button
              onClick={onResendEmail}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة إرسال رابط التأكيد</span>
            </button>
          )}

          <button
            onClick={onSwitchToLogin}
            className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            تسجيل الدخول
          </button>

          <button
            onClick={onClose}
            className="w-full bg-transparent border border-jet-300 dark:border-jet-600 text-jet-600 dark:text-platinum-400 py-2 px-6 rounded-lg font-medium hover:bg-jet-50 dark:hover:bg-jet-700 transition-all duration-300"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingVerificationModal;
