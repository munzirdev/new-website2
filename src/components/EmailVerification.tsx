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
        console.log('🔍 بدء التحقق من البريد الإلكتروني...');
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setVerificationStatus('error');
          setErrorMessage('خطأ في جلب الجلسة');
          return;
        }

        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        const error = urlParams.get('error');
        
        console.log('📋 معاملات الرابط:', { token, type, access_token, refresh_token, error });
        
        // Handle error parameters
        if (error) {
          console.error('❌ خطأ في الرابط:', error);
          setVerificationStatus('error');
          setErrorMessage('حدث خطأ في التحقق من البريد الإلكتروني');
          return;
        }
        
        // If user is already logged in and email is confirmed
        if (session?.user && session.user.email_confirmed_at) {
          console.log('✅ البريد الإلكتروني مؤكد بالفعل');
          setEmail(session.user.email);
          setVerificationStatus('success');
          return;
        }
        
        // If user is logged in but email is not confirmed
        if (session?.user && !session.user.email_confirmed_at) {
          console.log('⏳ البريد الإلكتروني لم يتم تأكيده بعد');
          setEmail(session.user.email);
          setVerificationStatus('pending');
          return;
        }
        
        // Try to verify with token and type
        if (token && type === 'signup') {
          console.log('🔐 محاولة التحقق باستخدام OTP...');
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });
            
            if (error) {
              console.error('❌ خطأ في التحقق:', error);
              setVerificationStatus('error');
              setErrorMessage('رابط التحقق غير صحيح أو منتهي الصلاحية');
            } else {
              console.log('✅ تم التحقق بنجاح');
              setVerificationStatus('success');
              setEmail(data.user?.email || null);
            }
            return;
          } catch (verifyError) {
            console.error('❌ خطأ في التحقق:', verifyError);
            setVerificationStatus('error');
            setErrorMessage('فشل في التحقق من البريد الإلكتروني');
            return;
          }
        }
        
        // Try to verify with access_token and refresh_token
        if (access_token && refresh_token) {
          console.log('🔐 محاولة التحقق باستخدام الجلسة...');
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            
            if (error) {
              console.error('❌ خطأ في الجلسة:', error);
              setVerificationStatus('error');
              setErrorMessage('رابط التحقق غير صحيح أو منتهي الصلاحية');
            } else {
              console.log('✅ تم التحقق بنجاح');
              setVerificationStatus('success');
              setEmail(data.user?.email || null);
            }
            return;
          } catch (sessionError) {
            console.error('❌ خطأ في الجلسة:', sessionError);
            setVerificationStatus('error');
            setErrorMessage('فشل في التحقق من البريد الإلكتروني');
            return;
          }
        }
        
        // If no parameters and no session, show helpful message
        if (!token && !access_token && !session?.user) {
          console.log('❌ لا توجد معاملات تحقق ولا جلسة نشطة');
          setVerificationStatus('error');
          setErrorMessage('يبدو أنك وصلت إلى صفحة التحقق بدون رابط صحيح. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التحقق.');
          return;
        }
        
        // If we have parameters but verification failed
        if ((token || access_token) && !session?.user) {
          console.log('❌ فشل في التحقق مع وجود معاملات');
          setVerificationStatus('error');
          setErrorMessage('رابط التحقق غير صحيح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
          return;
        }
        
      } catch (error) {
        console.error('💥 خطأ غير متوقع:', error);
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
      // Try using edge function first
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (accessToken) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          setErrorMessage(null);
          setTimeout(() => {
            setErrorMessage('تم إرسال بريد التأكيد بنجاح');
          }, 100);
        } else {
          console.error('Edge function error:', result.error);
          // Fallback to direct resend
          await fallbackResend();
        }
      } else {
        // Fallback to direct resend
        await fallbackResend();
      }
    } catch (error) {
      console.error('Resend error:', error);
      // Fallback to direct resend
      await fallbackResend();
    } finally {
      setResending(false);
    }
  };

  const fallbackResend = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });
      
      if (error) {
        console.error('Fallback resend error:', error);
        setErrorMessage('فشل في إعادة إرسال البريد الإلكتروني');
      } else {
        setErrorMessage(null);
        setTimeout(() => {
          setErrorMessage('تم إرسال بريد التأكيد بنجاح');
        }, 100);
      }
    } catch (error) {
      console.error('Fallback resend error:', error);
      setErrorMessage('فشل في إعادة إرسال البريد الإلكتروني');
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
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300"
              >
                الانتقال إلى الصفحة الرئيسية
              </button>
              <button
                onClick={() => window.location.href = '/account'}
                className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                الانتقال إلى حسابي
              </button>
            </div>
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
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-right">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                كيفية حل المشكلة:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• تأكد من أن الرابط لم ينتهي صلاحيته (24 ساعة)</li>
                <li>• تأكد من أنك لم تفتح الرابط من قبل</li>
                <li>• تحقق من مجلد الرسائل غير المرغوب فيها</li>
                <li>• جرب إعادة إرسال بريد التأكيد</li>
                <li>• تأكد من صحة عنوان البريد الإلكتروني</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/signup'}
                className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300"
              >
                إنشاء حساب جديد
              </button>
              
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-all duration-300"
              >
                تسجيل الدخول
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                الانتقال إلى الصفحة الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {errorMessage && (
          <div className={`mt-4 p-4 rounded-lg flex items-center ${
            errorMessage.includes('تم إرسال') || errorMessage.includes('نجح') || errorMessage.includes('تم تأكيد')
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {errorMessage.includes('تم إرسال') || errorMessage.includes('نجح') || errorMessage.includes('تم تأكيد') ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
            )}
            <span className={`${
              errorMessage.includes('تم إرسال') || errorMessage.includes('نجح') || errorMessage.includes('تم تأكيد')
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {errorMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
