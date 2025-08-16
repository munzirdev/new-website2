import React from 'react';
import { useAuthContext } from './AuthProvider';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, getVerificationStatus } = useAuthContext();
  
  // If no user, show children (let other guards handle authentication)
  if (!user) {
    return <>{children}</>;
  }
  
  const { isVerified, needsVerification } = getVerificationStatus();
  
  // If user is verified or doesn't need verification, show children
  if (isVerified || !needsVerification) {
    return <>{children}</>;
  }
  
  // If user needs verification, show verification message
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-indigo-50 dark:from-jet-900 dark:to-jet-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-jet-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-jet-900 dark:text-platinum-100 mb-2">
            تأكيد البريد الإلكتروني مطلوب
          </h2>
          <p className="text-jet-600 dark:text-platinum-400">
            يجب تأكيد بريدك الإلكتروني قبل الوصول لهذه الصفحة
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-right rtl:text-right">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  تحقق من بريدك الإلكتروني
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  تم إرسال رابط التأكيد إلى: {user.email}
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
                  ستتمكن من الوصول لجميع الميزات
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            تحديث الصفحة بعد التأكيد
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationGuard;
