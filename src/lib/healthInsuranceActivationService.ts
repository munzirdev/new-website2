import { supabase } from './supabase';

export interface HealthInsuranceActivationForm {
  id: string;
  user_id: string;
  full_name: string;
  kimlik_no: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHealthInsuranceFormData {
  full_name: string;
  kimlik_no: string;
  phone: string;
  address: string;
}

class HealthInsuranceActivationService {
  async createForm(formData: CreateHealthInsuranceFormData): Promise<{ data: HealthInsuranceActivationForm | null; error: any }> {
    try {
      console.log('🔍 إنشاء نموذج تفعيل التأمين الصحي...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      // التحقق من البيانات المطلوبة
      if (!formData.full_name || !formData.kimlik_no || !formData.phone || !formData.address) {
        console.error('❌ البيانات غير مكتملة');
        return { data: null, error: new Error('جميع الحقول مطلوبة') };
      }

      const formDataToInsert = {
        user_id: user.id,
        full_name: formData.full_name,
        kimlik_no: formData.kimlik_no,
        phone: formData.phone,
        address: formData.address
      };

      console.log('💾 إدراج البيانات:', formDataToInsert);

      const { data, error } = await supabase
        .from('health_insurance_activation_forms')
        .insert([formDataToInsert])
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { data: null, error };
      }

      console.log('✅ تم إنشاء النموذج بنجاح:', data);
      return { data, error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { data: null, error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }

  async getUserForms(): Promise<{ data: HealthInsuranceActivationForm[] | null; error: any }> {
    try {
      console.log('🔍 جلب نماذج المستخدم...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      const { data, error } = await supabase
        .from('health_insurance_activation_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { data: null, error };
      }

      console.log('✅ تم جلب النماذج بنجاح:', data?.length || 0);
      return { data, error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { data: null, error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }

  async getAllForms(): Promise<{ data: HealthInsuranceActivationForm[] | null; error: any }> {
    try {
      console.log('🔍 جلب جميع النماذج (للأدمن والمشرفين)...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ خطأ في جلب ملف المستخدم:', profileError);
        return { data: null, error: new Error('خطأ في جلب معلومات المستخدم') };
      }

      if (profile.role !== 'admin' && profile.role !== 'moderator') {
        console.error('❌ صلاحيات غير كافية');
        return { data: null, error: new Error('صلاحيات غير كافية - يتطلب أدمن أو مشرف') };
      }

      const { data, error } = await supabase
        .from('health_insurance_activation_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { data: null, error };
      }

      console.log('✅ تم جلب جميع النماذج بنجاح:', data?.length || 0);
      return { data, error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { data: null, error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }

  async getFormById(id: string): Promise<{ data: HealthInsuranceActivationForm | null; error: any }> {
    try {
      console.log('🔍 جلب النموذج بالمعرف:', id);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      const { data, error } = await supabase
        .from('health_insurance_activation_forms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { data: null, error };
      }

      // التحقق من الصلاحيات
      if (data.user_id !== user.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
          console.error('❌ صلاحيات غير كافية');
          return { data: null, error: new Error('صلاحيات غير كافية') };
        }
      }

      console.log('✅ تم جلب النموذج بنجاح:', data);
      return { data, error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { data: null, error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }

  async updateForm(id: string, formData: Partial<CreateHealthInsuranceFormData>): Promise<{ data: HealthInsuranceActivationForm | null; error: any }> {
    try {
      console.log('🔍 تحديث النموذج:', id);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      // التحقق من وجود النموذج والصلاحيات
      const { data: existingForm, error: fetchError } = await supabase
        .from('health_insurance_activation_forms')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingForm) {
        console.error('❌ النموذج غير موجود:', fetchError);
        return { data: null, error: new Error('النموذج غير موجود') };
      }

      // التحقق من الصلاحيات
      if (existingForm.user_id !== user.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
          console.error('❌ صلاحيات غير كافية');
          return { data: null, error: new Error('صلاحيات غير كافية') };
        }
      }

      const { data, error } = await supabase
        .from('health_insurance_activation_forms')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { data: null, error };
      }

      console.log('✅ تم تحديث النموذج بنجاح:', data);
      return { data, error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { data: null, error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }

  async deleteForm(id: string): Promise<{ error: any }> {
    try {
      console.log('🔍 حذف النموذج:', id);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      // التحقق من وجود النموذج والصلاحيات
      const { data: existingForm, error: fetchError } = await supabase
        .from('health_insurance_activation_forms')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingForm) {
        console.error('❌ النموذج غير موجود:', fetchError);
        return { error: new Error('النموذج غير موجود') };
      }

      // التحقق من الصلاحيات
      if (existingForm.user_id !== user.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
          console.error('❌ صلاحيات غير كافية');
          return { error: new Error('صلاحيات غير كافية') };
        }
      }

      const { error } = await supabase
        .from('health_insurance_activation_forms')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { error };
      }

      console.log('✅ تم حذف النموذج بنجاح');
      return { error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }

  async getFormsCount(): Promise<{ data: number | null; error: any }> {
    try {
      console.log('🔍 جلب عدد النماذج...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: new Error('خطأ في المصادقة - يرجى إعادة تسجيل الدخول') };
      }

      const { count, error } = await supabase
        .from('health_insurance_activation_forms')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ خطأ من قاعدة البيانات:', error);
        return { data: null, error };
      }

      console.log('✅ عدد النماذج:', count);
      return { data: count, error: null };

    } catch (error: any) {
      console.error('💥 خطأ غير متوقع:', error);
      return { data: null, error: new Error('خطأ غير متوقع - يرجى المحاولة مرة أخرى') };
    }
  }
}

export const healthInsuranceActivationService = new HealthInsuranceActivationService();
