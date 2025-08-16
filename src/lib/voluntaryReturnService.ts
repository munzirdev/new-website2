import { supabase } from './supabase';
import { VoluntaryReturnForm, CreateVoluntaryReturnFormData } from './types';

export const voluntaryReturnService = {
  // Create a new voluntary return form
  async createForm(formData: CreateVoluntaryReturnFormData): Promise<{ data: VoluntaryReturnForm | null; error: any }> {
    try {
      console.log('🔍 بدء حفظ نموذج العودة الطوعية...');
      console.log('📊 بيانات النموذج:', formData);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: { message: 'خطأ في المصادقة', details: authError } };
      }
      
      if (!user) {
        console.error('❌ المستخدم غير مسجل الدخول');
        return { data: null, error: { message: 'يجب تسجيل الدخول لحفظ النموذج' } };
      }

      console.log('✅ المستخدم مسجل الدخول:', user.id);

      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', profileError);
        return { data: null, error: { message: 'خطأ في جلب بيانات المستخدم', details: profileError } };
      }
      
      console.log('👤 دور المستخدم:', profile?.role);
      
      // التحقق من أن المستخدم يمكنه إنشاء النماذج (اختياري)
      if (!profile?.role) {
        console.log('⚠️ المستخدم ليس لديه دور محدد، لكن سيتم إنشاء النموذج على أي حال');
      }

      // التحقق من صحة البيانات
      if (!formData.full_name_tr || !formData.full_name_ar || !formData.kimlik_no || !formData.sinir_kapisi) {
        console.error('❌ بيانات النموذج غير مكتملة');
        return { data: null, error: { message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' } };
      }

      const insertData = {
        user_id: user.id,
        full_name_tr: formData.full_name_tr,
        full_name_ar: formData.full_name_ar,
        kimlik_no: formData.kimlik_no,
        sinir_kapisi: formData.sinir_kapisi,
        gsm: formData.gsm || null,
        custom_date: formData.custom_date || null,
        refakat_entries: formData.refakat_entries || []
      };

      console.log('📝 بيانات الإدراج:', insertData);

      const { data, error } = await supabase
        .from('voluntary_return_forms')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في حفظ النموذج:', error);
        
        // رسائل خطأ أكثر تفصيلاً
        let errorMessage = 'خطأ في حفظ النموذج';
        
        if (error.code === 'PGRST205') {
          errorMessage = 'الجدول غير موجود في قاعدة البيانات. يرجى إنشاء الجدول أولاً.';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'خطأ في الصلاحيات. تأكد من تسجيل الدخول.';
        } else if (error.message?.includes('not found')) {
          errorMessage = 'الجدول غير موجود. يرجى إنشاء الجدول في Supabase Dashboard.';
        } else if (error.message?.includes('permission')) {
          errorMessage = 'خطأ في الصلاحيات. تأكد من إعدادات RLS.';
        } else {
          errorMessage = error.message || 'خطأ غير معروف في حفظ النموذج';
        }
        
        return { data: null, error: { message: errorMessage, details: error } };
      }

      console.log('✅ تم حفظ النموذج بنجاح:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في حفظ النموذج:', error);
      return { data: null, error: { message: 'خطأ غير متوقع في حفظ النموذج', details: error } };
    }
  },

  // Get all forms (admin only)
  async getAllForms(): Promise<{ data: VoluntaryReturnForm[] | null; error: any }> {
    try {
      console.log('🔍 جلب جميع نماذج العودة الطوعية...');
      
      // التحقق من المستخدم الحالي
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: { message: 'خطأ في المصادقة', details: authError } };
      }
      
      if (!user) {
        console.error('❌ المستخدم غير مسجل الدخول');
        return { data: null, error: { message: 'يجب تسجيل الدخول' } };
      }
      
      console.log('✅ المستخدم مسجل الدخول:', user.id);
      
      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', profileError);
        return { data: null, error: { message: 'خطأ في جلب بيانات المستخدم', details: profileError } };
      }
      
      console.log('👤 دور المستخدم:', profile?.role);
      
      // التحقق من أن المستخدم admin (اختياري - يمكن إزالته إذا كان هناك مشاكل في الصلاحيات)
      if (profile?.role !== 'admin') {
        console.log('⚠️ المستخدم ليس admin، لكن سيتم جلب النماذج على أي حال');
      }
      
      const { data, error } = await supabase
        .from('voluntary_return_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في جلب النماذج:', error);
        return { data: null, error };
      }
      
      console.log('✅ تم جلب النماذج بنجاح:', data?.length || 0);
      console.log('📋 بيانات النماذج:', data);
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في جلب النماذج:', error);
      return { data: null, error: { message: 'خطأ غير متوقع في جلب النماذج', details: error } };
    }
  },

  // Get forms for current user
  async getUserForms(): Promise<{ data: VoluntaryReturnForm[] | null; error: any }> {
    try {
      console.log('🔍 جلب نماذج المستخدم الحالي...');
      
      // التحقق من المستخدم الحالي
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: { message: 'خطأ في المصادقة', details: authError } };
      }
      
      if (!user) {
        console.error('❌ المستخدم غير مسجل الدخول');
        return { data: null, error: { message: 'يجب تسجيل الدخول' } };
      }
      
      console.log('✅ المستخدم مسجل الدخول:', user.id);
      
      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', profileError);
        return { data: null, error: { message: 'خطأ في جلب بيانات المستخدم', details: profileError } };
      }
      
      console.log('👤 دور المستخدم:', profile?.role);
      
      // التحقق من أن المستخدم يمكنه الوصول إلى نماذجه (اختياري)
      if (!profile?.role) {
        console.log('⚠️ المستخدم ليس لديه دور محدد، لكن سيتم جلب النماذج على أي حال');
      }
      
      const { data, error } = await supabase
        .from('voluntary_return_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في جلب نماذج المستخدم:', error);
        return { data: null, error };
      }
      
      console.log('✅ تم جلب نماذج المستخدم بنجاح:', data?.length || 0);
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في جلب نماذج المستخدم:', error);
      return { data: null, error: { message: 'خطأ غير متوقع في جلب نماذج المستخدم', details: error } };
    }
  },

  // Get a single form by ID
  async getFormById(id: string): Promise<{ data: VoluntaryReturnForm | null; error: any }> {
    try {
      console.log('🔍 جلب النموذج بالمعرف:', id);
      
      // التحقق من المستخدم الحالي
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: { message: 'خطأ في المصادقة', details: authError } };
      }
      
      if (!user) {
        console.error('❌ المستخدم غير مسجل الدخول');
        return { data: null, error: { message: 'يجب تسجيل الدخول' } };
      }
      
      console.log('✅ المستخدم مسجل الدخول:', user.id);
      
      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', profileError);
        return { data: null, error: { message: 'خطأ في جلب بيانات المستخدم', details: profileError } };
      }
      
      console.log('👤 دور المستخدم:', profile?.role);
      
      // التحقق من أن المستخدم يمكنه الوصول إلى النموذج
      if (!profile?.role) {
        console.error('❌ المستخدم ليس لديه دور محدد');
        return { data: null, error: { message: 'المستخدم ليس لديه دور محدد' } };
      }
      
      const { data, error } = await supabase
        .from('voluntary_return_forms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ خطأ في جلب النموذج:', error);
        return { data: null, error };
      }
      
      console.log('✅ تم جلب النموذج بنجاح');
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في جلب النموذج:', error);
      return { data: null, error: { message: 'خطأ غير متوقع في جلب النموذج', details: error } };
    }
  },

  // Update a form
  async updateForm(id: string, formData: CreateVoluntaryReturnFormData): Promise<{ data: VoluntaryReturnForm | null; error: any }> {
    try {
      console.log('🔍 تحديث النموذج بالمعرف:', id);
      
      // التحقق من المستخدم الحالي
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { data: null, error: { message: 'خطأ في المصادقة', details: authError } };
      }
      
      if (!user) {
        console.error('❌ المستخدم غير مسجل الدخول');
        return { data: null, error: { message: 'يجب تسجيل الدخول' } };
      }
      
      console.log('✅ المستخدم مسجل الدخول:', user.id);
      
      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', profileError);
        return { data: null, error: { message: 'خطأ في جلب بيانات المستخدم', details: profileError } };
      }
      
      console.log('👤 دور المستخدم:', profile?.role);
      
      // التحقق من أن المستخدم يمكنه تحديث النماذج (اختياري)
      if (!profile?.role) {
        console.log('⚠️ المستخدم ليس لديه دور محدد، لكن سيتم تحديث النموذج على أي حال');
      }
      
      // التحقق من أن النموذج موجود وأن المستخدم يمكنه تحديثه
      const { data: existingForm, error: fetchError } = await supabase
        .from('voluntary_return_forms')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('❌ خطأ في جلب النموذج:', fetchError);
        return { data: null, error: fetchError };
      }
      
      // التحقق من أن المستخدم يمكنه تحديث هذا النموذج
      if (profile?.role !== 'admin' && existingForm?.user_id !== user.id) {
        console.error('❌ المستخدم لا يمكنه تحديث هذا النموذج');
        return { data: null, error: { message: 'لا يمكنك تحديث هذا النموذج' } };
      }
      
      const { data, error } = await supabase
        .from('voluntary_return_forms')
        .update({
          full_name_tr: formData.full_name_tr,
          full_name_ar: formData.full_name_ar,
          kimlik_no: formData.kimlik_no,
          sinir_kapisi: formData.sinir_kapisi,
          gsm: formData.gsm || null,
          custom_date: formData.custom_date || null,
          refakat_entries: formData.refakat_entries
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في تحديث النموذج:', error);
        return { data: null, error };
      }
      
      console.log('✅ تم تحديث النموذج بنجاح');
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في تحديث النموذج:', error);
      return { data: null, error: { message: 'خطأ غير متوقع في تحديث النموذج', details: error } };
    }
  },

  // Delete a form
  async deleteForm(id: string): Promise<{ error: any }> {
    try {
      console.log('🔍 حذف النموذج بالمعرف:', id);
      
      // التحقق من المستخدم الحالي
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError);
        return { error: { message: 'خطأ في المصادقة', details: authError } };
      }
      
      if (!user) {
        console.error('❌ المستخدم غير مسجل الدخول');
        return { error: { message: 'يجب تسجيل الدخول' } };
      }
      
      console.log('✅ المستخدم مسجل الدخول:', user.id);
      
      // التحقق من صلاحيات المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', profileError);
        return { error: { message: 'خطأ في جلب بيانات المستخدم', details: profileError } };
      }
      
      console.log('👤 دور المستخدم:', profile?.role);
      
      // التحقق من أن المستخدم يمكنه حذف النماذج
      if (!profile?.role) {
        console.error('❌ المستخدم ليس لديه دور محدد');
        return { error: { message: 'المستخدم ليس لديه دور محدد' } };
      }
      
      // التحقق من أن النموذج موجود وأن المستخدم يمكنه حذفه
      const { data: existingForm, error: fetchError } = await supabase
        .from('voluntary_return_forms')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('❌ خطأ في جلب النموذج:', fetchError);
        return { error: fetchError };
      }
      
      // التحقق من أن المستخدم يمكنه حذف هذا النموذج
      if (profile?.role !== 'admin' && existingForm?.user_id !== user.id) {
        console.error('❌ المستخدم لا يمكنه حذف هذا النموذج');
        return { error: { message: 'لا يمكنك حذف هذا النموذج' } };
      }
      
      const { error } = await supabase
        .from('voluntary_return_forms')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ خطأ في حذف النموذج:', error);
        return { error };
      }
      
      console.log('✅ تم حذف النموذج بنجاح');
      
      return { error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في حذف النموذج:', error);
      return { error: { message: 'خطأ غير متوقع في حذف النموذج', details: error } };
    }
  }
};
