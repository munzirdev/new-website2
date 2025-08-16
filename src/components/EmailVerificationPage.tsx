import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EmailService } from '../services/emailService';
import CustomCursor from './CustomCursor';

interface EmailVerificationPageProps {
  isDarkMode: boolean;
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verifying' | 'success' | 'error' | 'pending'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // التحقق من وجود token في URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (token && type === 'signup') {
          setVerificationStatus('verifying');
          
          // التحقق من البريد الإلكتروني
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });
          
          if (error) {
            console.error('Verification error:', error);
            setVerificationStatus('error');
            setErrorMessage('فشل في تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى.');
          } else {
            setVerificationStatus('verifying');
            setEmail(data.user?.email || null);
            startSuccessAnimation();
          }
        } else {
          // التحقق من الجلسة الحالية
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setVerificationStatus('error');
            setErrorMessage('خطأ في جلب الجلسة');
            return;
          }

          if (session?.user) {
            setEmail(session.user.email);
            
            // التحقق من تأكيد البريد الإلكتروني
            if (session.user.email_confirmed_at) {
              setVerificationStatus('success');
            } else {
              setVerificationStatus('pending');
            }
          } else {
            setVerificationStatus('error');
            setErrorMessage('رابط غير صحيح أو منتهي الصلاحية');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('حدث خطأ غير متوقع');
      }
    };

    handleEmailVerification();
  }, [searchParams]);

  const startSuccessAnimation = () => {
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setVerificationStatus('success');
          // التوجيه بعد النجاح
          setTimeout(() => {
            navigate('/home');
          }, 2000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    setErrorMessage(null);
    
    try {
      const result = await EmailService.resendVerificationEmail(email);
      
      if (result.success) {
        setErrorMessage(null);
        // إظهار رسالة نجاح مؤقتة
        setTimeout(() => {
          setErrorMessage('تم إرسال بريد التأكيد بنجاح');
        }, 100);
      } else {
        setErrorMessage(result.message || 'فشل في إعادة إرسال البريد الإلكتروني');
      }
    } catch (error) {
      setErrorMessage('حدث خطأ غير متوقع');
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
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
        {/* زر العودة */}
        <button
          onClick={handleGoBack}
          className="flex items-center text-caribbean-600 dark:text-caribbean-400 hover:text-caribbean-700 dark:hover:text-caribbean-300 mb-6 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة للصفحة الرئيسية
        </button>

        {/* حالة النجاح */}
        {verificationStatus === 'success' && (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                تم التحقق بنجاح! 🎉
              </h2>
              <p className="text-jet-600 dark:text-platinum-400">
                تم تأكيد بريدك الإلكتروني بنجاح
              </p>
            </div>

            {/* شريط التقدم */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-jet-600 dark:text-platinum-400 mb-2">
                <span>جاري التوجيه...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-jet-200 dark:bg-jet-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-caribbean-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-caribbean-600 dark:text-caribbean-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">جاري التوجيه إلى الصفحة الرئيسية...</span>
              </div>
            </div>
          </>
        )}

        {/* حالة الانتظار */}
        {verificationStatus === 'pending' && (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                تحقق من بريدك الإلكتروني
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3">
                تم إرسال رابط التحقق إلى:
              </p>
              <p className="text-sm text-jet-500 dark:text-platinum-500 font-medium">
                {email}
              </p>
              <p className="text-jet-600 dark:text-platinum-400 mt-3 text-sm">
                يرجى فتح البريد الإلكتروني والنقر على رابط التحقق
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="inline-flex items-center px-4 py-2 bg-caribbean-600 hover:bg-caribbean-700 disabled:bg-caribbean-400 text-white rounded-lg transition-colors duration-300"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 ml-2" />
                    إعادة إرسال البريد
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* حالة التحقق */}
        {verificationStatus === 'verifying' && (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                تم التحقق بنجاح! 🎉
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3">
                تم تأكيد بريدك الإلكتروني بنجاح
              </p>
            </div>

            {/* شريط التقدم */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-jet-600 dark:text-platinum-400 mb-2">
                <span>جاري التوجيه...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-jet-200 dark:bg-jet-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-caribbean-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-caribbean-600 dark:text-caribbean-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">جاري التوجيه إلى الصفحة الرئيسية...</span>
              </div>
            </div>
          </>
        )}

        {/* حالة الخطأ */}
        {verificationStatus === 'error' && (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                خطأ في التحقق
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3">
                {errorMessage || 'حدث خطأ أثناء التحقق من البريد الإلكتروني'}
              </p>
            </div>

            <div className="text-center space-y-3">
              <button
                onClick={() => setVerificationStatus('pending')}
                className="inline-flex items-center px-4 py-2 bg-caribbean-600 hover:bg-caribbean-700 text-white rounded-lg transition-colors duration-300"
              >
                المحاولة مرة أخرى
              </button>
              
              <button
                onClick={handleGoBack}
                className="block w-full px-4 py-2 bg-transparent border border-jet-300 dark:border-jet-600 text-jet-600 dark:text-platinum-400 rounded-lg hover:bg-jet-50 dark:hover:bg-jet-700 transition-colors duration-300"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </>
        )}

        {/* رسائل الخطأ */}
        {errorMessage && verificationStatus === 'pending' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
            <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
          </div>
        )}

        {/* رسائل النجاح */}
        {errorMessage && errorMessage.includes('نجح') && verificationStatus === 'pending' && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
            <span className="text-green-800 dark:text-green-200">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;

