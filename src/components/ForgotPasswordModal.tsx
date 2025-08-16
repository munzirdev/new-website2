import React, { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  isDarkMode: boolean;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  isDarkMode
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(isArabic ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      setError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Error sending reset email:', error);
        setError(
          isArabic 
            ? 'حدث خطأ في إرسال رابط إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.'
            : 'An error occurred while sending the password reset link. Please try again.'
        );
      } else {
        setSuccess(true);
        setEmailSent(true);
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(
        isArabic 
          ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    setEmailSent(false);
    onSwitchToLogin();
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    setEmailSent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-jet-800 p-8 text-left align-middle shadow-xl transition-all">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="flex-shrink-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-caribbean-100 dark:bg-caribbean-900/20">
                  <Mail className="h-6 w-6 text-caribbean-600 dark:text-caribbean-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-jet-900 dark:text-white">
                  {isArabic ? 'استعادة كلمة المرور' : 'Reset Password'}
                </h3>
                <p className="text-sm text-jet-600 dark:text-jet-400 mt-1">
                  {isArabic ? 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور' : 'Enter your email to reset your password'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-jet-400 hover:text-jet-600 dark:hover:text-jet-300 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!success ? (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
                    {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-jet-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white placeholder-jet-400 dark:placeholder-jet-500"
                      placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-caribbean-600 to-indigo-700 hover:from-caribbean-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-caribbean-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                    </>
                  ) : (
                    isArabic ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="inline-flex items-center text-sm text-caribbean-600 dark:text-caribbean-400 hover:text-caribbean-700 dark:hover:text-caribbean-300 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 ml-1" />
                  {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-jet-900 dark:text-white mb-2">
                    {isArabic ? 'تم إرسال الرابط بنجاح!' : 'Link Sent Successfully!'}
                  </h3>
                  <p className="text-sm text-jet-600 dark:text-jet-400">
                    {isArabic 
                      ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.'
                      : 'A password reset link has been sent to your email. Please check your inbox.'
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 pt-4">
                  <button
                    onClick={handleBackToLogin}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-caribbean-600 to-indigo-700 hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-200 shadow-sm"
                  >
                    {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </button>
                  
                  <button
                    onClick={handleClose}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-platinum-300 dark:border-jet-600 text-sm font-medium rounded-lg text-jet-700 dark:text-jet-300 bg-white dark:bg-jet-700 hover:bg-platinum-50 dark:hover:bg-jet-600 transition-all duration-200"
                  >
                    {isArabic ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
