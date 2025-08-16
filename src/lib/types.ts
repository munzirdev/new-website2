export interface RefakatEntry {
  id: string;
  name: string;
}

export interface VoluntaryReturnForm {
  id: string;
  user_id: string;
  full_name_tr: string;
  full_name_ar: string;
  kimlik_no: string;
  sinir_kapisi: string;
  gsm?: string;
  request_date: string;
  custom_date?: string;
  refakat_entries: RefakatEntry[];
  created_at: string;
  updated_at: string;
}

export interface CreateVoluntaryReturnFormData {
  full_name_tr: string;
  full_name_ar: string;
  kimlik_no: string;
  sinir_kapisi: string;
  gsm?: string;
  custom_date?: string;
  refakat_entries: RefakatEntry[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  country_code?: string;
  avatar_url?: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Moderator {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
