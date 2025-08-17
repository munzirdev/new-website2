import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  UserPlus,
  Shield,
  Search,
  Filter,
  Calendar,
  Mail,
  User,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import { Moderator } from '../lib/types';
import { formatDisplayDate } from '../lib/utils';

interface ModeratorManagementProps {
  isDarkMode: boolean;
}

const ModeratorManagement: React.FC<ModeratorManagementProps> = ({ isDarkMode }) => {
  const { user, profile } = useAuthContext();
  const { t } = useLanguage();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingModerator, setEditingModerator] = useState<Moderator | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    createFullAccount: false
  });
  const [existingUserFound, setExistingUserFound] = useState(false);

  // Check if current user is admin based on profile role
  const isAdmin = profile?.role === 'admin';

  // Function to search for existing user by email
  const searchExistingUser = async (email: string) => {
    if (!email || email.length < 3) return;
    
    try {
      console.log('🔍 Searching for existing user:', email);
      
      // Search in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .single();

      if (profileData && !profileError) {
        console.log('✅ Found existing user profile:', profileData);
        setFormData(prev => ({
          ...prev,
          full_name: profileData.full_name || prev.full_name
        }));
        setExistingUserFound(true);
        return;
      }

      // If not found in profiles, try to search using Edge Function
      try {
        const { data: searchResult, error: searchError } = await supabase.functions.invoke('search-user', {
          body: { email }
        });

        if (searchResult?.found && !searchError) {
          console.log('✅ Found existing user via Edge Function:', searchResult.user);
          setFormData(prev => ({
            ...prev,
            full_name: searchResult.user.full_name || prev.full_name
          }));
          setExistingUserFound(true);
        } else {
          console.log('ℹ️ User not found, will be created on first login');
          setExistingUserFound(false);
        }
      } catch (searchError) {
        console.log('ℹ️ Could not search via Edge Function, user will be created on first login');
        setExistingUserFound(false);
      }
    } catch (error) {
      console.log('ℹ️ No existing user found for:', email);
      setExistingUserFound(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchModerators();
    }
  }, [isAdmin]);

  const fetchModerators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moderators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching moderators:', error);
        setErrorMessage('خطأ في جلب قائمة المشرفين');
        return;
      }

      setModerators(data || []);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      setErrorMessage('خطأ في جلب قائمة المشرفين');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    searchExistingUser(email);
  };

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.functions.invoke('create-moderator', {
        body: {
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          createFullAccount: formData.createFullAccount
        }
      });

      if (error) {
        console.error('Error creating moderator:', error);
        setErrorMessage('خطأ في إنشاء المشرف');
        return;
      }

      setSuccessMessage('تم إنشاء المشرف بنجاح');
      setShowAddForm(false);
      setFormData({ email: '', full_name: '', password: '', createFullAccount: false });
      setExistingUserFound(false);
      fetchModerators();
    } catch (error) {
      console.error('Error creating moderator:', error);
      setErrorMessage('خطأ في إنشاء المشرف');
    }
  };

  const handleEditModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingModerator) return;

    try {
      const { error } = await supabase
        .from('moderators')
        .update({
          email: formData.email,
          full_name: formData.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingModerator.id);

      if (error) {
        console.error('Error updating moderator:', error);
        setErrorMessage('خطأ في تحديث المشرف');
        return;
      }

      setSuccessMessage('تم تحديث المشرف بنجاح');
      setEditingModerator(null);
      setFormData({ email: '', full_name: '', password: '', createFullAccount: false });
      fetchModerators();
    } catch (error) {
      console.error('Error updating moderator:', error);
      setErrorMessage('خطأ في تحديث المشرف');
    }
  };

  const handleDeleteModerator = async (moderatorId: string) => {
    try {
      const { error } = await supabase
        .from('moderators')
        .delete()
        .eq('id', moderatorId);

      if (error) {
        console.error('Error deleting moderator:', error);
        setErrorMessage('خطأ في حذف المشرف');
        return;
      }

      setSuccessMessage('تم حذف المشرف بنجاح');
      setDeleteConfirm(null);
      fetchModerators();
    } catch (error) {
      console.error('Error deleting moderator:', error);
      setErrorMessage('خطأ في حذف المشرف');
    }
  };

  const startEdit = (moderator: Moderator) => {
    setEditingModerator(moderator);
    setFormData({
      email: moderator.email,
      full_name: moderator.full_name,
      password: '',
      createFullAccount: false
    });
  };

  const cancelEdit = () => {
    setEditingModerator(null);
    setFormData({ email: '', full_name: '', password: '', createFullAccount: false });
    setExistingUserFound(false);
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setFormData({ email: '', full_name: '', password: '', createFullAccount: false });
    setExistingUserFound(false);
  };

  // Filter moderators based on search and status
  const filteredModerators = moderators.filter(moderator => {
    const matchesSearch = moderator.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         moderator.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'registered' && moderator.user_id) ||
                         (statusFilter === 'pending' && !moderator.user_id);
    
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20 rounded-lg p-6 flex items-center backdrop-blur-sm">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 ml-3" />
          <span className="text-red-800 dark:text-red-200">ليس لديك صلاحية للوصول إلى إدارة المشرفين</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            إدارة المشرفين
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
        >
          <UserPlus className="w-4 h-4 ml-2" />
          إضافة مشرف جديد
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-200/30 dark:border-green-800/20 rounded-lg p-4 flex items-center backdrop-blur-sm mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20 rounded-lg p-4 flex items-center backdrop-blur-sm mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
          <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
        </div>
      )}

      {/* Enhanced Glass Morphism Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className={`group ${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-5 md:p-6 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl text-right relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 rounded-xl transition-all duration-300 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">إجمالي المشرفين</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{moderators.length}</p>
            </div>
          </div>
        </div>

        <div className={`group ${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-5 md:p-6 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl text-right relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 rounded-xl transition-all duration-300 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">مسجلين</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {moderators.filter(m => m.user_id).length}
              </p>
            </div>
          </div>
        </div>

        <div className={`group ${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-5 md:p-6 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl text-right relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 rounded-xl transition-all duration-300 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">في انتظار التسجيل</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {moderators.filter(m => !m.user_id).length}
              </p>
            </div>
          </div>
        </div>

        <div className={`group ${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-5 md:p-6 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl text-right relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 rounded-xl transition-all duration-300 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">نشطين</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {moderators.filter(m => m.user_id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingModerator) && (
        <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 dark:border-white/20 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
            {editingModerator ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
          </h3>
          
          {!editingModerator && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>ملاحظة:</strong> عند إضافة مشرف جديد، سيتم البحث تلقائياً عن المستخدم في قاعدة البيانات. 
                إذا كان المستخدم مسجل بالفعل، سيتم تعيينه كمشرف فوراً. وإذا لم يكن مسجل، يمكنك إنشاء حساب كامل له مباشرة.
              </p>
            </div>
          )}
        
          <form onSubmit={editingModerator ? handleEditModerator : handleAddModerator} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white ${
                    existingUserFound 
                      ? 'border-green-500 dark:border-green-400' 
                      : 'border-white/30 dark:border-white/10'
                  }`}
                  placeholder="example@tevasul.group"
                  required
                />
                {existingUserFound && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs mr-1">مستخدم موجود</span>
                  </div>
                )}
                
                {existingUserFound && (
                  <div className="mt-2 p-3 bg-green-50/50 dark:bg-green-900/10 border border-green-200/30 dark:border-green-800/20 rounded-lg backdrop-blur-sm">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>مستخدم موجود:</strong> سيتم تعيين هذا المستخدم كمشرف فوراً عند الإضافة.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-2 border border-white/30 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white"
                placeholder="اسم المشرف"
                required
              />
            </div>

            {/* Create Full Account Option */}
            {!editingModerator && !existingUserFound && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    id="createFullAccount"
                    checked={formData.createFullAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, createFullAccount: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-white/50 dark:bg-white/5 border-white/30 dark:border-white/10 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="createFullAccount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    إنشاء حساب كامل للمشرف
                  </label>
                </div>
                
                {formData.createFullAccount && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 border border-white/30 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white"
                      placeholder="كلمة المرور للمشرف"
                      required={formData.createFullAccount}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3 space-x-reverse pt-4">
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                <Save className="w-4 h-4 ml-2" />
                {editingModerator ? 'حفظ التعديلات' : 'إضافة المشرف'}
              </button>
              <button
                type="button"
                onClick={editingModerator ? cancelEdit : cancelAdd}
                className="flex items-center px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Glass Morphism Filters */}
      <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-6 rounded-2xl shadow-xl mb-8 border border-white/20 dark:border-white/10`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />
            <input
              type="text"
              placeholder="البحث في المشرفين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-white/30 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent bg-white/50 dark:bg-white/5 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-white/30 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent bg-white/50 dark:bg-white/5 backdrop-blur-sm text-slate-900 dark:text-white transition-all duration-300 appearance-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="registered">مسجلين</option>
              <option value="pending">في انتظار التسجيل</option>
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Moderators List */}
      <div className="space-y-4 md:space-y-6">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">جاري التحميل...</p>
          </div>
        ) : filteredModerators.length === 0 ? (
          <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-12 text-center">
            <Shield className="w-16 h-16 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">لا توجد مشرفين</h3>
            <p className="text-jet-600 dark:text-platinum-400">لا توجد مشرفين تطابق معايير البحث</p>
          </div>
        ) : (
          filteredModerators.map((moderator) => (
            <div key={moderator.id} className={`group ${isDarkMode ? 'glass-card-dark' : 'glass-card'} rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] relative overflow-hidden`}>
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white ml-4">
                      {moderator.full_name}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20 ${
                      moderator.user_id 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {moderator.user_id ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span>مسجل</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          <span>في انتظار التسجيل</span>
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 space-x-reverse text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 ml-2" />
                      <span>{formatDisplayDate(moderator.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Enhanced Contact Info */}
                  <div className="bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-800/30 dark:to-blue-900/10 p-4 rounded-xl border border-slate-200/30 dark:border-slate-700/20 backdrop-blur-sm mb-4">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                      <User className="w-4 h-4 ml-2" />
                      معلومات المشرف
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                      <p><strong>الاسم:</strong> {moderator.full_name}</p>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 ml-2" />
                        <a 
                          href={`mailto:${moderator.email}?subject=مرحباً ${moderator.full_name}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors duration-300"
                        >
                          {moderator.email}
                        </a>
                      </div>
                      {moderator.user_id && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="w-4 h-4 inline ml-2" />
                          تم إنشاء الحساب بنجاح
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={() => startEdit(moderator)}
                    className="p-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                    title="تعديل المشرف"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(moderator.id)}
                    className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                    title="حذف المشرف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 border border-white/30 dark:border-white/20">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              تأكيد الحذف
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              هل أنت متأكد من حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => deleteConfirm && handleDeleteModerator(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                حذف
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModeratorManagement;
