import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationComplete: () => void;
  isDarkMode: boolean;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerificationComplete,
  isDarkMode
}) => {
  const { t } = useLanguage();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resending, setResending] = useState(false);

  // Check verification status periodically
  useEffect(() => {
    if (!isOpen || verificationStatus === 'success') return;

    const checkVerificationStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          return;
        }

        if (session?.user?.email_confirmed_at) {
          setVerificationStatus('verifying');
          // Start success animation
          startSuccessAnimation();
        }
      } catch (error) {
        console.error('Verification check error:', error);
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Check every 3 seconds
    const interval = setInterval(checkVerificationStatus, 3000);

    return () => clearInterval(interval);
  }, [isOpen, verificationStatus]);

  // Handle URL parameters for email verification
  useEffect(() => {
    if (!isOpen) return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const type = urlParams.get('type');
    
    if (token && type === 'signup') {
      handleEmailVerification(token);
    }
  }, [isOpen]);

  const handleEmailVerification = async (token: string) => {
    setVerificationStatus('verifying');
    
    try {
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
        startSuccessAnimation();
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage('حدث خطأ غير متوقع');
    }
  };

  const startSuccessAnimation = () => {
    setProgress(0);
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setVerificationStatus('success');
          // Trigger completion after showing success
          setTimeout(() => {
            onVerificationComplete();
          }, 1000);
          return 100;
        }
        return prev + 5; // Increase by 5% every 100ms (2 seconds total)
      });
    }, 100);
  };

  const handleResendEmail = async () => {
    setResending(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        setErrorMessage('فشل في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.');
      } else {
        // Show success message temporarily
        setErrorMessage(null);
      }
    } catch (error) {
      setErrorMessage('حدث خطأ غير متوقع');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        
        {/* Pending State */}
        {verificationStatus === 'pending' && (
          <>
            {/* Email Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mail className="w-12 h-12 text-white" />
                </div>
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-blue-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                تحقق من بريدك الإلكتروني
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3 text-sm leading-relaxed">
                تم إرسال رابط التحقق إلى:
              </p>
              <p className="text-sm text-jet-500 dark:text-platinum-500 font-medium">
                {email}
              </p>
              <p className="text-jet-600 dark:text-platinum-400 mt-3 text-sm">
                يرجى فتح البريد الإلكتروني والنقر على رابط التحقق
              </p>
            </div>

            {/* Resend Button */}
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

        {/* Verifying State */}
        {verificationStatus === 'verifying' && (
          <>
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-green-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                تم التحقق بنجاح! 🎉
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3 text-sm leading-relaxed">
                تم تأكيد بريدك الإلكتروني بنجاح
              </p>
            </div>

            {/* Loading Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-jet-600 dark:text-platinum-400 mb-2">
                <span>جاري التوجيه...</span>
                <span>{progress}%</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="w-full bg-jet-200 dark:bg-jet-700 rounded-full h-3 overflow-hidden">
                {/* Animated Progress Bar */}
                <div 
                  className="h-full bg-gradient-to-r from-caribbean-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-caribbean-400 to-emerald-400 blur-sm opacity-50" />
                </div>
              </div>
            </div>

            {/* Loading Message */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-caribbean-600 dark:text-caribbean-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">جاري التوجيه إلى الموقع...</span>
              </div>
            </div>
          </>
        )}

        {/* Success State */}
        {verificationStatus === 'success' && (
          <>
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-green-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                تم التحقق بنجاح! 🎉
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3 text-sm leading-relaxed">
                تم تأكيد بريدك الإلكتروني بنجاح
              </p>
            </div>
          </>
        )}

        {/* Error State */}
        {verificationStatus === 'error' && (
          <>
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                خطأ في التحقق
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-3 text-sm leading-relaxed">
                {errorMessage || 'حدث خطأ أثناء التحقق من البريد الإلكتروني'}
              </p>
            </div>

            {/* Retry Button */}
            <div className="text-center">
              <button
                onClick={() => setVerificationStatus('pending')}
                className="inline-flex items-center px-4 py-2 bg-caribbean-600 hover:bg-caribbean-700 text-white rounded-lg transition-colors duration-300"
              >
                المحاولة مرة أخرى
              </button>
            </div>
          </>
        )}

        {/* Error Messages */}
        {errorMessage && verificationStatus === 'pending' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
            <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
        </div>
        <div className="absolute top-6 right-6">
          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
