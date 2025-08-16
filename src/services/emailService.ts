import { supabase } from '../lib/supabase';

export interface EmailServiceResponse {
  success: boolean;
  message: string;
  error?: any;
}

export class EmailService {
  /**
   * إرسال بريد تأكيد التسجيل
   */
  static async sendVerificationEmail(email: string, fullName?: string): Promise<EmailServiceResponse> {
    try {
      console.log('📧 إرسال بريد التأكيد عبر Supabase Function...');
      
      // محاولة استخدام Supabase Function أولاً
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email,
          full_name: fullName
        }
      });

      if (error) {
        console.error('❌ خطأ في Supabase Function:', error);
        
        // محاولة بديلة باستخدام auth.resend
        console.log('🔄 محاولة بديلة باستخدام auth.resend...');
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`
          }
        });

        if (resendError) {
          console.error('❌ خطأ في auth.resend:', resendError);
          return {
            success: false,
            message: 'فشل في إرسال بريد التأكيد',
            error: resendError
          };
        }

        return {
          success: true,
          message: 'تم إرسال بريد التأكيد بنجاح'
        };
      }

      return {
        success: true,
        message: data?.message || 'تم إرسال بريد التأكيد بنجاح'
      };

    } catch (error) {
      console.error('💥 خطأ غير متوقع في إرسال البريد:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع في إرسال البريد',
        error
      };
    }
  }

  /**
   * إعادة إرسال بريد التأكيد
   */
  static async resendVerificationEmail(email: string): Promise<EmailServiceResponse> {
    try {
      console.log('🔄 إعادة إرسال بريد التأكيد...');
      
      // محاولة استخدام Supabase Function أولاً
      const { data, error } = await supabase.functions.invoke('resend-verification', {
        body: { email }
      });

      if (error) {
        console.error('❌ خطأ في Supabase Function:', error);
        
        // محاولة بديلة باستخدام auth.resend
        console.log('🔄 محاولة بديلة باستخدام auth.resend...');
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`
          }
        });

        if (resendError) {
          console.error('❌ خطأ في auth.resend:', resendError);
          return {
            success: false,
            message: 'فشل في إعادة إرسال بريد التأكيد',
            error: resendError
          };
        }

        return {
          success: true,
          message: 'تم إعادة إرسال بريد التأكيد بنجاح'
        };
      }

      return {
        success: true,
        message: data?.message || 'تم إعادة إرسال بريد التأكيد بنجاح'
      };

    } catch (error) {
      console.error('💥 خطأ غير متوقع في إعادة إرسال البريد:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع في إعادة إرسال البريد',
        error
      };
    }
  }

  /**
   * إرسال بريد إعادة تعيين كلمة المرور
   */
  static async sendPasswordResetEmail(email: string): Promise<EmailServiceResponse> {
    try {
      console.log('🔐 إرسال بريد إعادة تعيين كلمة المرور...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ خطأ في إرسال بريد إعادة تعيين كلمة المرور:', error);
        return {
          success: false,
          message: 'فشل في إرسال بريد إعادة تعيين كلمة المرور',
          error
        };
      }

      return {
        success: true,
        message: 'تم إرسال بريد إعادة تعيين كلمة المرور بنجاح'
      };

    } catch (error) {
      console.error('💥 خطأ غير متوقع في إرسال بريد إعادة تعيين كلمة المرور:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع في إرسال بريد إعادة تعيين كلمة المرور',
        error
      };
    }
  }

  /**
   * اختبار إرسال البريد الإلكتروني
   */
  static async testEmailSending(): Promise<EmailServiceResponse> {
    try {
      console.log('🧪 اختبار إرسال البريد الإلكتروني...');
      
      const testEmail = 'test@example.com';
      const result = await this.sendVerificationEmail(testEmail, 'Test User');
      
      if (result.success) {
        console.log('✅ اختبار إرسال البريد نجح');
        return {
          success: true,
          message: 'اختبار إرسال البريد نجح'
        };
      } else {
        console.log('❌ اختبار إرسال البريد فشل');
        return {
          success: false,
          message: 'اختبار إرسال البريد فشل',
          error: result.error
        };
      }

    } catch (error) {
      console.error('💥 خطأ في اختبار إرسال البريد:', error);
      return {
        success: false,
        message: 'خطأ في اختبار إرسال البريد',
        error
      };
    }
  }
}

