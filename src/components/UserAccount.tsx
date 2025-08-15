import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Search,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Save,
  X,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import CustomCursor from './CustomCursor';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import { formatDisplayDate } from '../lib/utils';

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
}

interface UserAccountProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const UserAccount: React.FC<UserAccountProps> = ({ 
  onBack, 
  isDarkMode
}) => {
  const { user, profile } = useAuthContext();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Utility function to format phone number with RTL support for Arabic
  const formatPhoneNumber = (phoneNumber: string, isArabic: boolean) => {
    if (!phoneNumber) return '';
    
    if (isArabic) {
      // For Arabic, format with RTL direction but keep original format
      return (
        <span className="phone-number" style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'bidi-override' }}>
          {phoneNumber}
        </span>
      );
    } else {
      // For English, return original format
      return phoneNumber;
    }
  };
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // دوال عرض وتحميل الملفات
  const handleFileView = async (fileUrl: string, fileName: string, requestId?: string) => {
    try {
      console.log('محاولة عرض الملف:', fileUrl);
      
      let fileData = null;
      let fileType = 'application/octet-stream';
      
      // التحقق من نوع الملف (Base64 أم URL عادي)
      if (fileUrl.startsWith('base64://')) {
        // استخراج ID من الرابط
        const fileId = fileUrl.replace('base64://', '');
        
        // محاولة جلب الملف من file_attachments أولاً
        let { data: attachmentData, error } = await supabase
          .from('file_attachments')
          .select('file_data, file_type')
          .eq('id', fileId)
          .single();
        
        if (error || !attachmentData) {
          console.log('الملف غير موجود في file_attachments، محاولة جلب من service_requests...');
          
          // إذا لم يوجد في file_attachments، جرب جلب من service_requests
          if (requestId) {
            const { data: requestData, error: requestError } = await supabase
              .from('service_requests')
              .select('file_data, file_name')
              .eq('id', requestId)
              .single();
            
            if (requestError || !requestData || !requestData.file_data) {
              throw new Error('فشل في جلب الملف من قاعدة البيانات');
            }
            
            fileData = requestData.file_data;
            // تحديد نوع الملف من اسم الملف
            const fileNameLower = requestData.file_name?.toLowerCase() || '';
            if (fileNameLower.endsWith('.pdf')) {
              fileType = 'application/pdf';
            } else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
              fileType = 'image/jpeg';
            } else if (fileNameLower.endsWith('.png')) {
              fileType = 'image/png';
            } else if (fileNameLower.endsWith('.gif')) {
              fileType = 'image/gif';
            } else if (fileNameLower.endsWith('.txt')) {
              fileType = 'text/plain';
            } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
              fileType = 'application/msword';
            }
          } else {
            throw new Error('فشل في جلب الملف من قاعدة البيانات');
          }
        } else {
          fileData = attachmentData.file_data;
          fileType = attachmentData.file_type;
        }
      } else {
        // تحميل الملف من URL عادي
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*'
          }
        });
        
        if (!response.ok) {
          console.error('فشل في تحميل الملف:', response.status, response.statusText);
          throw new Error(`فشل في تحميل الملف: ${response.status}`);
        }
        
        const blob = await response.blob();
        const reader = new FileReader();
        
        return new Promise((resolve) => {
          reader.onload = () => {
            const base64Data = reader.result as string;
            fileData = base64Data.split(',')[1];
            fileType = blob.type;
            
            // فتح الملف في نافذة جديدة
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            
            if (!newWindow) {
              alert('يرجى السماح بفتح النوافذ المنبثقة لعرض الملف');
            }
            
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 5000);
          };
          
          reader.readAsDataURL(blob);
        });
      }
      
      // فتح الملف في نافذة جديدة
      const blob = new Blob([Uint8Array.from(atob(fileData), c => c.charCodeAt(0))], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        alert('يرجى السماح بفتح النوافذ المنبثقة لعرض الملف');
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
      
    } catch (error) {
      console.error('خطأ في عرض الملف:', error);
      alert('فشل في عرض الملف. يرجى المحاولة مرة أخرى أو تحميل الملف مباشرة.');
    }
  };

  const handleFileDownload = async (fileUrl: string, fileName: string, requestId?: string) => {
    try {
      console.log('محاولة تحميل الملف:', fileUrl);
      
      let blob: Blob;
      
      // التحقق من نوع الملف (Base64 أم URL عادي)
      if (fileUrl.startsWith('base64://')) {
        // استخراج ID من الرابط
        const fileId = fileUrl.replace('base64://', '');
        
        // محاولة جلب الملف من file_attachments أولاً
        let { data: fileData, error } = await supabase
          .from('file_attachments')
          .select('file_data, file_type')
          .eq('id', fileId)
          .single();
        
        if (error || !fileData) {
          console.log('الملف غير موجود في file_attachments، محاولة جلب من service_requests...');
          
          // إذا لم يوجد في file_attachments، جرب جلب من service_requests
          if (requestId) {
            const { data: requestData, error: requestError } = await supabase
              .from('service_requests')
              .select('file_data, file_name')
              .eq('id', requestId)
              .single();
            
            if (requestError || !requestData || !requestData.file_data) {
              throw new Error('فشل في جلب الملف من قاعدة البيانات');
            }
            
            // تحويل Base64 إلى Blob
            const byteCharacters = atob(requestData.file_data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            // تحديد نوع الملف من اسم الملف
            const fileNameLower = requestData.file_name?.toLowerCase() || '';
            let fileType = 'application/octet-stream';
            if (fileNameLower.endsWith('.pdf')) {
              fileType = 'application/pdf';
            } else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
              fileType = 'image/jpeg';
            } else if (fileNameLower.endsWith('.png')) {
              fileType = 'image/png';
            } else if (fileNameLower.endsWith('.gif')) {
              fileType = 'image/gif';
            } else if (fileNameLower.endsWith('.txt')) {
              fileType = 'text/plain';
            } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
              fileType = 'application/msword';
            }
            
            blob = new Blob([byteArray], { type: fileType });
          } else {
            throw new Error('فشل في جلب الملف من قاعدة البيانات');
          }
        } else {
          // تحويل Base64 إلى Blob
          const byteCharacters = atob(fileData.file_data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: fileData.file_type });
        }
      } else {
        // تحميل الملف من URL عادي
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*'
          }
        });
        
        if (!response.ok) {
          console.error('فشل في تحميل الملف:', response.status, response.statusText);
          throw new Error(`فشل في تحميل الملف: ${response.status}`);
        }
        
        blob = await response.blob();
      }
      
      console.log('تم تحميل الملف بنجاح:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'file';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      alert('فشل في تحميل الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  // إضافة useEffect لمراقبة profile
  useEffect(() => {
    console.log('🔄 تحديث profile في UserAccount:', profile);
    if (profile) {
      console.log('📋 بيانات الملف الشخصي في UserAccount:');
      console.log('- الاسم:', profile.full_name);
      console.log('- البريد الإلكتروني:', profile.email);
      console.log('- الهاتف:', profile.phone);
      console.log('- رمز البلد:', profile.country_code);
    }
  }, [profile]);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 جلب طلبات المستخدم:', user?.id);
      
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        return;
      }

      console.log('📋 طلبات المستخدم:', data?.length || 0);
      setRequests(data || []);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: ServiceRequest) => {
    setEditingRequest(request);
    setEditForm({
      title: request.title,
      description: request.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          title: editForm.title,
          description: editForm.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRequest.id);

      if (error) {
        console.error('خطأ في تحديث الطلب:', error);
        return;
      }

      await fetchUserRequests();
      setEditingRequest(null);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('خطأ في حذف الطلب:', error);
        return;
      }

      await fetchUserRequests();
      setDeleteConfirm(null);
      
      // عرض رسالة النجاح
      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getServiceTypeArabic = (serviceType: string) => {
    const serviceTypes: { [key: string]: string } = {
      'translation': 'خدمات الترجمة المحلفة',
      'travel': 'خدمات السفر والسياحة',
      'legal': 'الاستشارات القانونية',
      'government': 'الخدمات الحكومية',
      'insurance': 'خدمات التأمين'
    };
    return serviceTypes[serviceType] || serviceType;
  };

  const getStatusArabic = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  const getPriorityArabic = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-jet-800 flex items-center justify-center">
        <CustomCursor isDarkMode={isDarkMode} />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean-600 mx-auto mb-4"></div>
          <p className="text-jet-600 dark:text-platinum-400">جاري تحميل طلباتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-platinum-50 dark:bg-jet-900 pt-16"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <CustomCursor isDarkMode={isDarkMode} />
      {/* Header */}
      <div className="bg-white dark:bg-jet-800 shadow-sm border-b border-platinum-200 dark:border-jet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-jet-800 dark:text-white">
              حسابي
            </h1>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-sm text-jet-600 dark:text-platinum-400">
                مرحباً، {profile?.full_name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
          <div className="flex items-center">
            <div className="p-3 bg-caribbean-100 dark:bg-caribbean-900/20 rounded-lg ml-4">
              <User className="w-8 h-8 text-caribbean-600 dark:text-caribbean-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-jet-800 dark:text-white mb-2">معلومات الحساب</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-jet-600 dark:text-platinum-400">الاسم</p>
                  <p className="font-medium text-jet-800 dark:text-white">{profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-jet-600 dark:text-platinum-400">البريد الإلكتروني</p>
                  <p className="font-medium text-jet-800 dark:text-white email-address">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-jet-600 dark:text-platinum-400">رقم الهاتف</p>
                  <p className="font-medium text-jet-800 dark:text-white font-mono">
                    {profile?.phone ? 
                      formatPhoneNumber(`${profile.country_code}${profile.phone}`, isArabic) : 
                      'غير محدد'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            <div className="flex items-center">
              <div className="p-3 bg-caribbean-100 dark:bg-caribbean-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-caribbean-600 dark:text-caribbean-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-jet-600 dark:text-platinum-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-jet-800 dark:text-white stat-number">{requests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-jet-600 dark:text-platinum-400">قيد الانتظار</p>
                <p className="text-2xl font-bold text-jet-800 dark:text-white stat-number">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-jet-600 dark:text-platinum-400">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-jet-800 dark:text-white stat-number">
                  {requests.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-jet-600 dark:text-platinum-400">مكتملة</p>
                <p className="text-2xl font-bold text-jet-800 dark:text-white stat-number">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-500 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث في طلباتك..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-12 text-center">
              <FileText className="w-16 h-16 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">لا توجد طلبات</h3>
              <p className="text-jet-600 dark:text-platinum-400">لم تقم بإنشاء أي طلبات بعد</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-jet-800 dark:text-white ml-3">
                        {request.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="mr-1">{getStatusArabic(request.status)}</span>
                      </span>
                    </div>
                    <p className="font-medium text-jet-800 dark:text-white font-mono" dir="ltr">
                      {new Date(request.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </p>
                    {request.description && (
                      <p className="text-jet-700 dark:text-platinum-300 mb-3">
                        {request.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-jet-500 dark:text-platinum-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 ml-1" />
                        <span className="font-mono" dir="ltr">
                          {formatDisplayDate(request.created_at)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {getPriorityArabic(request.priority)}
                      </span>
                    </div>
                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-lg border border-emerald-200 dark:border-emerald-700/30">
                        <p className="text-sm text-emerald-800 dark:text-emerald-300">
                          <strong>ملاحظات الإدارة:</strong> {request.admin_notes}
                        </p>
                      </div>
                    )}
                    
                    {/* File Display */}
                    {request.file_url && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-700/30">
                        <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                          <strong>الملف المرفق:</strong> {request.file_name || 'ملف مرفق'}
                          {request.file_url.startsWith('base64://') && (
                            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                              (محفوظ في قاعدة البيانات)
                            </span>
                          )}
                        </p>
                        <div className="flex space-x-3 space-x-reverse">
                          <button
                            onClick={() => handleFileView(request.file_url!, request.file_name || 'file', request.id)}
                            className="group flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                          >
                            <Eye className="w-4 h-4 ml-2 group-hover:animate-pulse" />
                            <span className="font-semibold">عرض</span>
                          </button>
                          <button
                            onClick={() => handleFileDownload(request.file_url!, request.file_name || 'file', request.id)}
                            className="group flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                          >
                            <Download className="w-4 h-4 ml-2 group-hover:animate-bounce" />
                            <span className="font-semibold">تحميل</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {(request.status === 'pending' || request.status === 'in_progress') && (
                      <button
                        onClick={() => handleEdit(request)}
                        className="p-2 text-caribbean-600 hover:text-caribbean-700 dark:text-caribbean-400 dark:hover:text-caribbean-300 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors duration-200"
                        title="تعديل الطلب"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {request.status === 'pending' && (
                      <button
                        onClick={() => setDeleteConfirm(request.id)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        title="حذف الطلب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingRequest(null)}></div>
          <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white">تعديل الطلب</h2>
              <button
                onClick={() => setEditingRequest(null)}
                className="text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  عنوان الطلب
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  وصف الطلب
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                />
              </div>



              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => setEditingRequest(null)}
                  className="flex-1 bg-gray-200 dark:bg-jet-600 text-jet-800 dark:text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-jet-500 transition-colors duration-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">
                تأكيد الحذف
              </h2>
              <p className="text-jet-600 dark:text-platinum-400 mb-6">
                هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300"
                >
                  حذف الطلب
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 dark:bg-jet-600 text-jet-800 dark:text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-jet-500 transition-colors duration-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Message */}
      {deleteSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/20 dark:bg-jet-800/20 backdrop-blur-md border border-white/30 dark:border-jet-600/30 rounded-2xl shadow-2xl p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-jet-800 dark:text-white mb-2">
              تم الحذف بنجاح! ✨
            </h3>
            <p className="text-jet-600 dark:text-platinum-400 text-sm">
              تم حذف طلبك من النظام
            </p>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-white/20 dark:bg-jet-700/20 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-green-500/60 rounded-full animate-expand-width"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccount;
