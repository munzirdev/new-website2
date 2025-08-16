import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Printer
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthContext } from './AuthProvider';
import { healthInsuranceActivationService, HealthInsuranceActivationForm } from '../lib/healthInsuranceActivationService';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface HealthInsuranceFormsListProps {
  isDarkMode: boolean;
}

const HealthInsuranceFormsList: React.FC<HealthInsuranceFormsListProps> = ({ isDarkMode }) => {
  const { language } = useLanguage();
  const { user, profile } = useAuthContext();
  const [forms, setForms] = useState<HealthInsuranceActivationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'recent' | 'old'>('all');
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    formId: string | null;
    formName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    formId: null,
    formName: '',
    isLoading: false
  });

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (profile?.role === 'admin' || profile?.role === 'moderator') {
        result = await healthInsuranceActivationService.getAllForms();
      } else {
        result = await healthInsuranceActivationService.getUserForms();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      setForms(result.data || []);
    } catch (err: any) {
      console.error('Error loading forms:', err);
      setError(err.message || 'خطأ في تحميل النماذج');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (formId: string, formName: string) => {
    setDeleteModal({
      isOpen: true,
      formId,
      formName,
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.formId) return;

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));

      const result = await healthInsuranceActivationService.deleteForm(deleteModal.formId);
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Reload forms after deletion
      await loadForms();
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        formId: null,
        formName: '',
        isLoading: false
      });
    } catch (err: any) {
      console.error('Error deleting form:', err);
      alert(err.message || 'خطأ في حذف النموذج');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      formId: null,
      formName: '',
      isLoading: false
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      form.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.kimlik_no.includes(searchTerm) ||
      form.phone.includes(searchTerm) ||
      form.address.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    
    const formDate = new Date(form.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - formDate.getTime()) / (1000 * 3600 * 24);
    
    if (filterStatus === 'recent') return matchesSearch && daysDiff <= 7;
    if (filterStatus === 'old') return matchesSearch && daysDiff > 7;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean-600"></div>
          <span className="mr-3 text-jet-600 dark:text-jet-400">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-2">
              {language === 'ar' ? 'قائمة النماذج المنشأة' : 'Health Insurance Activation Forms'}
            </h3>
            <p className="text-jet-600 dark:text-jet-400">
              {language === 'ar' 
                ? `إجمالي النماذج: ${forms.length}` 
                : `Total forms: ${forms.length}`
              }
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-jet-800 rounded-lg border border-platinum-200 dark:border-jet-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-jet-400" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث في النماذج...' : 'Search forms...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'recent' | 'old')}
                className="w-full px-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
              >
                <option value="all">{language === 'ar' ? 'جميع النماذج' : 'All forms'}</option>
                <option value="recent">{language === 'ar' ? 'الأسبوع الماضي' : 'Last week'}</option>
                <option value="old">{language === 'ar' ? 'أقدم من أسبوع' : 'Older than week'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Forms List */}
        {filteredForms.length === 0 ? (
          <div className="bg-white dark:bg-jet-800 rounded-lg border border-platinum-200 dark:border-jet-700 p-8 text-center">
            <FileText className="w-12 h-12 text-jet-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-jet-800 dark:text-white mb-2">
              {language === 'ar' ? 'لا توجد نماذج' : 'No forms found'}
            </h3>
            <p className="text-jet-600 dark:text-jet-400">
              {language === 'ar' 
                ? 'لم يتم إنشاء أي نماذج تفعيل تأمين صحي بعد' 
                : 'No health insurance activation forms have been created yet'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-jet-800 rounded-lg border border-platinum-200 dark:border-jet-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-platinum-50 dark:bg-jet-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {language === 'ar' ? 'المعلومات' : 'Information'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-platinum-200 dark:divide-jet-700">
                  {filteredForms.map((form) => (
                    <tr key={form.id} className="hover:bg-platinum-50 dark:hover:bg-jet-700/50">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-jet-400 ml-2" />
                            <span className="font-medium text-jet-900 dark:text-white">
                              {form.full_name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-jet-400 ml-2" />
                            <span className="text-jet-600 dark:text-jet-400">
                              {language === 'ar' ? 'رقم الهوية:' : 'ID:'} {form.kimlik_no}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-jet-400 ml-2" />
                            <span className="text-jet-600 dark:text-jet-400">
                              {form.phone}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 text-jet-400 ml-2 mt-1 flex-shrink-0" />
                            <span className="text-jet-600 dark:text-jet-400 text-sm">
                              {form.address}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-jet-400 ml-2" />
                          <span className="text-jet-600 dark:text-jet-400 text-sm">
                            {formatDate(form.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              // TODO: Implement view form
                              alert(language === 'ar' ? 'عرض النموذج' : 'View form');
                            }}
                            className="p-2 text-caribbean-600 hover:text-caribbean-700 dark:text-caribbean-400 dark:hover:text-caribbean-300"
                            title={language === 'ar' ? 'عرض' : 'View'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement print form
                              alert(language === 'ar' ? 'طباعة النموذج' : 'Print form');
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title={language === 'ar' ? 'طباعة' : 'Print'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement download form
                              alert(language === 'ar' ? 'تحميل النموذج' : 'Download form');
                            }}
                            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title={language === 'ar' ? 'تحميل' : 'Download'}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {(profile?.role === 'admin' || profile?.role === 'moderator' || form.user_id === user?.id) && (
                            <button
                              onClick={() => handleDeleteClick(form.id, form.full_name)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
        message={language === 'ar' 
          ? 'هل أنت متأكد من أنك تريد حذف نموذج تفعيل التأمين الصحي'
          : 'Are you sure you want to delete the health insurance activation form'
        }
        itemName={deleteModal.formName}
        isLoading={deleteModal.isLoading}
      />
    </>
  );
};

export default HealthInsuranceFormsList;
