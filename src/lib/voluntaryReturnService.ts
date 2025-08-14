import { supabase } from './supabase';
import { VoluntaryReturnForm, CreateVoluntaryReturnFormData } from './types';

export const voluntaryReturnService = {
  // Create a new voluntary return form
  async createForm(formData: CreateVoluntaryReturnFormData): Promise<{ data: VoluntaryReturnForm | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('voluntary_return_forms')
      .insert({
        user_id: user.id,
        full_name_tr: formData.full_name_tr,
        full_name_ar: formData.full_name_ar,
        kimlik_no: formData.kimlik_no,
        sinir_kapisi: formData.sinir_kapisi,
        gsm: formData.gsm || null,
        custom_date: formData.custom_date || null,
        refakat_entries: formData.refakat_entries
      })
      .select()
      .single();

    return { data, error };
  },

  // Get all forms (admin only)
  async getAllForms(): Promise<{ data: VoluntaryReturnForm[] | null; error: any }> {
    const { data, error } = await supabase
      .from('voluntary_return_forms')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get forms for current user
  async getUserForms(): Promise<{ data: VoluntaryReturnForm[] | null; error: any }> {
    const { data, error } = await supabase
      .from('voluntary_return_forms')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get a single form by ID
  async getFormById(id: string): Promise<{ data: VoluntaryReturnForm | null; error: any }> {
    const { data, error } = await supabase
      .from('voluntary_return_forms')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Update a form
  async updateForm(id: string, formData: CreateVoluntaryReturnFormData): Promise<{ data: VoluntaryReturnForm | null; error: any }> {
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

    return { data, error };
  },

  // Delete a form
  async deleteForm(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('voluntary_return_forms')
      .delete()
      .eq('id', id);

    return { error };
  }
};
