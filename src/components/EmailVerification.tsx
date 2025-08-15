import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import CustomCursor from './CustomCursor';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';

interface EmailVerificationProps {
  isDarkMode: boolean;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ isDarkMode }) => {
  const { t } = useLanguage();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the current session to check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setVerificationStatus('error');
          setErrorMessage('خطأ في جلب الجلسة');
          return;
        }

        if (session?.user) {
          setEmail(session.user.email);
          
          // Check if email is already confirmed
          if (session.user.email_confirmed_at) {
            setVerificationStatus('success');
          } else {
            setVerificationStatus('pending');
          }
        } else {
          // Check URL parameters for email verification
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');
          const type = urlParams.get('type');
          
          if (token && type === 'signup') {
            // Handle email verification from link
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });
            
            if (error) {
              console.error('Verification error:', error);
              setVerificationStatus('error');
              setErrorMessage('فشل في تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى.');
            } else {
              setVerificationStatus('success');
              setEmail(data.user?.email || null);
            }
          } else {
            setVerificationStatus('error');
            setErrorMessage('رابط غير صحيح');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('حدث خطأ غير متوقع');
      }
    };

    handleEmailVerification();
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });
      
      if (error) {
        console.error('Resend error:', error);
        setErrorMessage('فشل في إعادة إرسال البريد الإلكتروني');
      } else {
        setErrorMessage(null);
        // Show success message
        setTimeout(() => {
          setErrorMessage('تم إرسال بريد التأكيد بنجاح');
        }, 100);
      }
    } catch (error) {
      console.error('Resend error:', error);
      setErrorMessage('فشل في إعادة إرسال البريد الإلكتروني');
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-caribbean-50 to-indigo-50 dark:from-jet-900 dark:to-jet-800">
        <CustomCursor isDarkMode={isDarkMode} />
        <div className="bg-white dark:bg-jet-800 rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">
              جاري التحقق...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              يرجى الانتظار بينما نتحقق من بريدك الإلكتروني
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-caribbean-50 to-indigo-50 dark:from-jet-900 dark:to-jet-800">
      <CustomCursor isDarkMode={isDarkMode} />
      <div className="bg-white dark:bg-jet-800 rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        {verificationStatus === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">
              تم تأكيد البريد الإلكتروني بنجاح!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              يمكنك الآن استخدام جميع ميزات التطبيق
            </p>
            <button
              onClick={() => window.location.href = '/home'}
              className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300"
            >
              الانتقال إلى الصفحة الرئيسية
            </button>
          </div>
        )}

        {verificationStatus === 'pending' && (
          <div className="text-center">
            <Mail className="w-16 h-16 text-caribbean-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">
              تحقق من بريدك الإلكتروني
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              لقد أرسلنا رابط تأكيد إلى:
            </p>
            <p className="font-semibold text-caribbean-600 dark:text-caribbean-400 mb-6">
              {email}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              انقر على الرابط في البريد الإلكتروني لتأكيد حسابك
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إعادة إرسال بريد التأكيد'
                )}
              </button>
              
              <button
                onClick={handleGoBack}
                className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </button>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">
              خطأ في التحقق
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {errorMessage || 'حدث خطأ أثناء التحقق من البريد الإلكتروني'}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إعادة إرسال بريد التأكيد'
                )}
              </button>
              
              <button
                onClick={handleGoBack}
                className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </button>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {errorMessage && verificationStatus !== 'error' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
            <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
