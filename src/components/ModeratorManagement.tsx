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
  Shield
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

  const [formData, setFormData] = useState({
    email: '',
    full_name: ''
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
      console.log('🔍 Fetching moderators...');
      
      const { data, error } = await supabase
        .from('moderators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching moderators:', error);
        setErrorMessage(`فشل في جلب قائمة المشرفين: ${error.message}`);
        return;
      }

      console.log('✅ Moderators fetched successfully:', data);
      setModerators(data || []);
    } catch (error) {
      console.error('❌ Error fetching moderators:', error);
      setErrorMessage('فشل في جلب قائمة المشرفين');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Adding moderator:', formData);
      
      // First, check if user already exists by searching in profiles
      console.log('🔍 Searching for existing user in profiles table...');
      let { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', formData.email)
        .single();

      console.log('🔍 Search result:', { existingUser, userError });

      let userId = null;
      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Found existing user in profiles:', existingUser);
      } else {
        // If not found in profiles, try Edge Function
        try {
          const { data: searchResult, error: searchError } = await supabase.functions.invoke('search-user', {
            body: { email: formData.email }
          });

          if (searchResult?.found && !searchError) {
            userId = searchResult.user.id;
            console.log('✅ Found existing user via Edge Function:', searchResult.user);
          }
        } catch (searchError) {
          console.log('ℹ️ Could not search via Edge Function');
        }
      }

      // Add to moderators table
      console.log('🔍 Attempting to insert into moderators table with data:', {
        email: formData.email,
        full_name: formData.full_name,
        created_by: user?.id,
        user_id: userId
      });
      
      // Only include created_by if user is authenticated and exists
      const moderatorData: any = {
        email: formData.email,
        full_name: formData.full_name
      };
      
      // Add user_id only if we found a valid user ID from auth.users
      if (userId) {
        moderatorData.user_id = userId;
      }
      
      // Add created_by only if user exists and is authenticated
      if (user?.id) {
        moderatorData.created_by = user.id;
      }
      
      const { data: moderatorResult, error: moderatorError } = await supabase
        .from('moderators')
        .insert(moderatorData)
        .select()
        .single();

      if (moderatorError) {
        console.error('❌ Error adding moderator:', moderatorError);
        console.error('❌ Error details:', {
          message: moderatorError.message,
          details: moderatorError.details,
          hint: moderatorError.hint,
          code: moderatorError.code
        });
        setErrorMessage(`فشل في إضافة المشرف: ${moderatorError.message}`);
        return;
      }

      console.log('✅ Moderator added successfully:', moderatorResult);

      // If user exists, update their role to moderator
      if (userId) {
        console.log('🔄 Updating existing user role to moderator...');
        
        // Update user profile role - use update instead of upsert to avoid foreign key issues
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'moderator',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileError) {
          console.error('⚠️ Warning: Could not update user profile:', profileError);
        } else {
          console.log('✅ User profile updated to moderator role');
        }
      }

      setModerators(prev => [moderatorResult, ...prev]);
      setFormData({ email: '', full_name: '' });
      setShowAddForm(false);
      
      if (userId) {
        setSuccessMessage(`تم إضافة المشرف بنجاح! المستخدم ${formData.email} مسجل بالفعل وتم تعيينه كمشرف فوراً.`);
      } else {
        setSuccessMessage(`تم إضافة المشرف بنجاح! عندما يسجل ${formData.email} دخوله لأول مرة، سيتم تعيينه تلقائياً كـ "مشرف" في النظام.`);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('❌ Error adding moderator:', error);
      setErrorMessage('فشل في إضافة المشرف');
    } finally {
      setLoading(false);
    }
  };

  const handleEditModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingModerator || !formData.email || !formData.full_name) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      
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
        setErrorMessage('فشل في تحديث المشرف');
        return;
      }

      setModerators(prev => 
        prev.map(mod => 
          mod.id === editingModerator.id 
            ? { ...mod, email: formData.email, full_name: formData.full_name }
            : mod
        )
      );
      
      setEditingModerator(null);
      setFormData({ email: '', full_name: '' });
      setSuccessMessage('تم تحديث المشرف بنجاح');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating moderator:', error);
      setErrorMessage('فشل في تحديث المشرف');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModerator = async (moderatorId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('moderators')
        .delete()
        .eq('id', moderatorId);

      if (error) {
        console.error('Error deleting moderator:', error);
        setErrorMessage('فشل في حذف المشرف');
        return;
      }

      setModerators(prev => prev.filter(mod => mod.id !== moderatorId));
      setDeleteConfirm(null);
      setSuccessMessage('تم حذف المشرف بنجاح');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting moderator:', error);
      setErrorMessage('فشل في حذف المشرف');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (moderator: Moderator) => {
    setEditingModerator(moderator);
    setFormData({
      email: moderator.email,
      full_name: moderator.full_name
    });
  };

  const cancelEdit = () => {
    setEditingModerator(null);
    setFormData({ email: '', full_name: '' });
    setExistingUserFound(false);
  };

  // Handle email input change with auto-search
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    setExistingUserFound(false);
    
    // Search for existing user after a short delay
    if (email && email.includes('@')) {
      setTimeout(() => searchExistingUser(email), 500);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
          غير مصرح
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          فقط المشرفون يمكنهم الوصول إلى هذه الصفحة
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Shield className="w-8 h-8 text-caribbean-600 dark:text-caribbean-400" />
          <h2 className="text-2xl font-bold text-jet-800 dark:text-white">
            إدارة المشرفين
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300"
        >
          <UserPlus className="w-4 h-4 ml-2" />
          إضافة مشرف جديد
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
          <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingModerator) && (
        <div className="bg-white dark:bg-jet-800 rounded-xl shadow-lg border border-platinum-200 dark:border-jet-700 p-6">
                     <h3 className="text-lg font-semibold mb-4 text-jet-800 dark:text-white">
             {editingModerator ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
           </h3>
           
                       {!editingModerator && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ملاحظة:</strong> عند إضافة مشرف جديد، سيتم البحث تلقائياً عن المستخدم في قاعدة البيانات. 
                  إذا كان المستخدم مسجل بالفعل، سيتم تعيينه كمشرف فوراً. وإذا لم يكن مسجل، سيتم تعيينه كمشرف عند أول تسجيل دخول.
                </p>
              </div>
            )}
          
                     <form onSubmit={editingModerator ? handleEditModerator : handleAddModerator} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                 البريد الإلكتروني
               </label>
               <div className="relative">
                 <input
                   type="email"
                   value={formData.email}
                   onChange={handleEmailChange}
                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-800 dark:text-white ${
                     existingUserFound 
                       ? 'border-green-500 dark:border-green-400' 
                       : 'border-platinum-300 dark:border-jet-600'
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
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                 الاسم الكامل
               </label>
               <input
                 type="text"
                 value={formData.full_name}
                 onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                 className="w-full px-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-800 dark:text-white"
                 placeholder="اسم المشرف"
                 required
               />
             </div>
             
             
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-caribbean-600 to-indigo-600 text-white rounded-lg hover:from-caribbean-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50"
              >
                <Save className="w-4 h-4 ml-2" />
                {editingModerator ? 'تحديث' : 'إضافة'}
              </button>
              
              <button
                type="button"
                onClick={editingModerator ? cancelEdit : () => setShowAddForm(false)}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Moderators List */}
      <div className="bg-white dark:bg-jet-800 rounded-xl shadow-lg border border-platinum-200 dark:border-jet-700">
        <div className="p-6 border-b border-platinum-200 dark:border-jet-700">
          <h3 className="text-lg font-semibold text-jet-800 dark:text-white">
            قائمة المشرفين ({moderators.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
          </div>
        ) : moderators.length === 0 ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">
            لا توجد مشرفين حالياً
          </div>
        ) : (
          <div className="divide-y divide-platinum-200 dark:divide-jet-700">
            {moderators.map((moderator) => (
              <div key={moderator.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-r from-caribbean-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                                     <div>
                     <h4 className="font-semibold text-jet-800 dark:text-white">
                       {moderator.full_name}
                     </h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400">
                       {moderator.email}
                     </p>
                     <div className="flex items-center space-x-2 space-x-reverse mt-1">
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                         moderator.user_id 
                           ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                           : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                       }`}>
                         {moderator.user_id ? 'مسجل' : 'في انتظار التسجيل'}
                       </span>
                       <span className="text-xs text-gray-500 dark:text-gray-500">
                                                     {formatDisplayDate(moderator.created_at)}
                       </span>
                     </div>
                   </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => startEdit(moderator)}
                    className="p-2 text-caribbean-600 hover:text-caribbean-700 dark:text-caribbean-400 dark:hover:text-caribbean-300 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors duration-200"
                    title="تعديل المشرف"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setDeleteConfirm(moderator.id)}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                    title="حذف المشرف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-jet-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-4">
              تأكيد الحذف
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              هل أنت متأكد من حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => handleDeleteModerator(deleteConfirm)}
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
    </div>
  );
};

export default ModeratorManagement;
