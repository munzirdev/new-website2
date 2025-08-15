import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomCursor from './CustomCursor';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Save,
  X,
  Plus,
  Download,
  Eye,
  Reply,
  HelpCircle,
  ExternalLink,
  Globe,
  BarChart3,
  Sun,
  Moon,
  Home,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import VoluntaryReturnFormsList from './VoluntaryReturnFormsList';
import VoluntaryReturnForm from './VoluntaryReturnForm';
import VoluntaryReturnChart from './VoluntaryReturnChart';
import ModeratorManagement from './ModeratorManagement';
import HealthInsuranceManagement from './HealthInsuranceManagement';
import { formatDisplayDate } from '../lib/utils';


interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_country_code: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  file_url?: string;
  file_name?: string;
  admin_reply_date?: string;
}

interface SupportMessage {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  admin_reply: string;
  created_at: string;
  updated_at: string;
  admin_reply_date?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminDashboardProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

// دالة لتنسيق رقم الهاتف للواتساب
const formatPhoneForWhatsApp = (phone: string): string => {
  // إزالة جميع الأحرف غير الرقمية
  let cleanPhone = phone.replace(/\D/g, '');
  
  // إذا كان الرقم يبدأ بـ 0، نزيله ونضيف 90
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '90' + cleanPhone.substring(1);
  }
  
  // إذا كان الرقم لا يبدأ بـ 90، نضيفه
  if (!cleanPhone.startsWith('90')) {
    cleanPhone = '90' + cleanPhone;
  }
  
  // إذا كان الرقم أقل من 12 رقم، نضيف أصفار في البداية
  while (cleanPhone.length < 12) {
    cleanPhone = '90' + cleanPhone;
  }
  
  // نأخذ أول 12 رقم فقط (90 + 10 أرقام)
  return cleanPhone.substring(0, 12);
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, isDarkMode, onToggleDarkMode }) => {
  const { user, profile } = useAuthContext();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);


  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'requests' | 'support' | 'faqs' | 'voluntary-return' | 'moderators' | 'health-insurance'>('requests');
  const [voluntaryReturnView, setVoluntaryReturnView] = useState<'list' | 'create' | 'chart'>('list');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);


  const [editingSupport, setEditingSupport] = useState<SupportMessage | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: 'عام',
    order_index: 0,
    is_active: true
  });
  const [editForm, setEditForm] = useState({
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    admin_notes: ''
  });
  const [supportReplyForm, setSupportReplyForm] = useState({
    admin_reply: '',
    status: 'pending' as 'pending' | 'in_progress' | 'resolved' | 'closed'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [fileViewModal, setFileViewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileData: string | null;
  }>({
    isOpen: false,
    fileUrl: '',
    fileName: '',
    fileData: null
  });

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
      fetchSupportMessages();
      fetchFAQs();
    }
  }, [user]);

  // Handle permalink navigation based on URL
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    
    // Map URL paths to dashboard sections
    if (path === '/admin' || path === '/admin/dashboard') {
      setActiveTab('requests');
      setVoluntaryReturnView('list');
    } else if (path === '/admin/service-requests') {
      setActiveTab('requests');
      setVoluntaryReturnView('list');
    } else if (path === '/admin/support-messages') {
      setActiveTab('support');
      setVoluntaryReturnView('list');
    } else if (path === '/admin/voluntary-returns') {
      setActiveTab('voluntary-return');
      // Check for view parameter
      if (viewParam === 'create') {
        setVoluntaryReturnView('create');
      } else {
        setVoluntaryReturnView('list');
      }
    } else if (path === '/admin/faq') {
      setActiveTab('faqs');
      setVoluntaryReturnView('list');
    } else if (path === '/admin/moderators') {
      setActiveTab('moderators');
      setVoluntaryReturnView('list');
    } else if (path === '/admin/analytics') {
      setActiveTab('voluntary-return');
      setVoluntaryReturnView('chart');
    }
  }, [location.pathname, location.search]);

  // Navigation functions for permalinks
  const navigateToTab = (tab: 'requests' | 'support' | 'faqs' | 'voluntary-return' | 'moderators' | 'health-insurance') => {
    setActiveTab(tab);
    switch (tab) {
      case 'requests':
        navigate('/admin/service-requests');
        break;
      case 'support':
        navigate('/admin/support-messages');
        break;
      case 'faqs':
        navigate('/admin/faq');
        break;
      case 'voluntary-return':
        navigate('/admin/voluntary-returns');
        break;
      case 'moderators':
        navigate('/admin/moderators');
        break;
      case 'health-insurance':
        navigate('/admin/health-insurance');
        break;
    }
  };

  const navigateToVoluntaryReturnView = (view: 'list' | 'create' | 'chart') => {
    setVoluntaryReturnView(view);
    switch (view) {
      case 'list':
        navigate('/admin/voluntary-returns');
        break;
      case 'create':
        navigate('/admin/voluntary-returns?view=create');
        break;
      case 'chart':
        navigate('/admin/analytics');
        break;
    }
  };



  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 جلب طلبات الخدمات...');
      
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        return;
      }

      console.log('📋 طلبات الخدمات:', data?.length || 0);
      setRequests(data || []);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportMessages = async () => {
    try {
      console.log('🔍 جلب رسائل الدعم...');
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب رسائل الدعم:', error);
        return;
      }

      console.log('📋 رسائل الدعم:', data?.length || 0);
      setSupportMessages(data || []);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const fetchFAQs = async () => {
    try {
      console.log('🔍 جلب الأسئلة المتكررة...');
      
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('خطأ في جلب الأسئلة المتكررة:', error);
        return;
      }

      console.log('📋 الأسئلة المتكررة:', data?.length || 0);
      setFaqs(data || []);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const handleEdit = (request: ServiceRequest) => {
    setEditingRequest(request);
    setEditForm({
      status: request.status,
      priority: request.priority,
      admin_notes: request.admin_notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: editForm.status,
          priority: editForm.priority,
          admin_notes: editForm.admin_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRequest.id);

      if (error) {
        console.error('خطأ في تحديث الطلب:', error);
        return;
      }

      await fetchServiceRequests();
      setEditingRequest(null);
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const handleEditSupport = (message: SupportMessage) => {
    setEditingSupport(message);
    setSupportReplyForm({
      admin_reply: message.admin_reply || '',
      status: message.status as any
    });
  };

  const handleSaveSupportReply = async () => {
    if (!editingSupport) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          admin_reply: supportReplyForm.admin_reply || null,
          status: supportReplyForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSupport.id);

      if (error) {
        console.error('خطأ في تحديث الرد:', error);
        return;
      }

      await fetchSupportMessages();
      setEditingSupport(null);
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
  };

  const handleSaveFaq = async (faqData: Partial<FAQ>) => {
    try {
      if (editingFaq) {
        // تحديث سؤال موجود
        const { error } = await supabase
          .from('faqs')
          .update({
            question: faqData.question,
            answer: faqData.answer,
            category: faqData.category,
            order_index: faqData.order_index,
            is_active: faqData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFaq.id);

        if (error) {
          console.error('خطأ في تحديث السؤال:', error);
          return;
        }
      } else {
        // إضافة سؤال جديد
        const { error } = await supabase
          .from('faqs')
          .insert({
            question: faqData.question,
            answer: faqData.answer,
            category: faqData.category || 'عام',
            order_index: faqData.order_index || 0,
            is_active: faqData.is_active !== false
          });

        if (error) {
          console.error('خطأ في إضافة السؤال:', error);
          return;
        }
      }

      await fetchFAQs();
      setEditingFaq(null);
      setShowAddFaq(false);
      setNewFaq({
        question: '',
        answer: '',
        category: 'عام',
        order_index: 0,
        is_active: true
      });
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId);

      if (error) {
        console.error('خطأ في حذف السؤال:', error);
        return;
      }

      await fetchFAQs();
      setDeleteConfirm(null);
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  const handleFileView = async (fileUrl: string, fileName: string, requestId?: string) => {
    try {
      console.log('محاولة عرض الملف في مودال:', fileUrl);
      
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
            
            setFileViewModal({
              isOpen: true,
              fileUrl: fileUrl,
              fileName: fileName,
              fileData: fileData
            });
          };
          
          reader.readAsDataURL(blob);
        });
      }
      
      // فتح الملف في مودال
      setFileViewModal({
        isOpen: true,
        fileUrl: fileUrl,
        fileName: fileName,
        fileData: fileData
      });
      
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف الطلب:', error);
        return;
      }

      await fetchServiceRequests();
      setDeleteConfirm(null);
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesRequestFilter = requestFilter === 'all' || request.status === requestFilter;
    
    return matchesSearch && matchesStatus && matchesRequestFilter;
  });

  // Filter support messages
  const filteredSupportMessages = supportMessages.filter(message => {
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
              case 'pending': return 'text-sky-600 bg-sky-100 dark:bg-sky-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'closed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
              case 'high': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
        case 'medium': return 'text-sky-600 bg-sky-100 dark:bg-sky-900/20';
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
      case 'resolved': return 'محلولة';
      case 'cancelled': return 'ملغية';
      case 'closed': return 'مغلقة';
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
          <p className="text-jet-600 dark:text-platinum-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-jet-800 flex items-center justify-center">
        <CustomCursor isDarkMode={isDarkMode} />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">غير مصرح</h2>
          <p className="text-jet-600 dark:text-platinum-400">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50/40 to-cyan-50/30 dark:from-jet-900 dark:via-jet-800 dark:to-jet-900 relative overflow-hidden">
      <CustomCursor isDarkMode={isDarkMode} />
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-sky-200/8 to-transparent rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-bl from-blue-200/6 to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-tr from-cyan-200/4 to-sky-200/4 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-gradient-to-r from-blue-200/5 to-cyan-200/5 rounded-full animate-pulse" style={{ animationDelay: '3s', animationDuration: '4s' }}></div>
      </div>
      {/* Phone number formatting for Arabic */}
      <style jsx global>{`
        /* Phone number formatting for Arabic */
        .phone-number {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: bidi-override !important;
          font-family: monospace !important;
        }

        /* Flag Gloss Effect */
        .flag-gloss {
          position: relative;
          overflow: hidden;
        }
        
        .flag-gloss::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 40%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.1) 60%,
            transparent 70%
          );
          transform: rotate(45deg);
          transition: all 0.3s ease;
          opacity: 0;
        }
        
        .flag-gloss:hover::before {
          opacity: 1;
          animation: gloss-shine 1.5s ease-in-out;
        }
        
        @keyframes gloss-shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          50% {
            transform: translateX(0%) translateY(0%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        /* Flag Shadow Effect */
        .flag-shadow {
          box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 4px 8px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        /* Ensure cursor is always on top */
        .cursor-element {
          z-index: 9999 !important;
          position: fixed !important;
        }

        /* Hide custom cursor on touch devices */
        @media (hover: none) and (pointer: coarse) {
          .cursor-element {
            display: none !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-50 via-blue-50/30 to-cyan-50/40 dark:from-jet-900 dark:via-jet-800 dark:to-jet-900 shadow-lg border-b border-sky-200 dark:border-jet-700">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-sky-200/15 to-transparent rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-tr from-blue-200/12 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-r from-cyan-200/8 to-sky-200/8 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Home button */}
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="group flex items-center px-4 py-2 bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-white dark:hover:bg-jet-600 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2 group-hover:animate-pulse" />
                <span className="text-sm md:text-base font-medium">{t('nav.home')}</span>
              </button>
            </div>

            {/* Center - Title */}
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-caribbean-600 via-indigo-600 to-caribbean-600 dark:from-caribbean-400 dark:via-indigo-400 dark:to-caribbean-400 bg-clip-text text-transparent animate-pulse">
                {t('admin.dashboard')}
              </h1>
            </div>

            {/* Right side - Dark mode toggle */}
            <div className="flex items-center">
              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  className="group flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-jet-700/80 backdrop-blur-sm text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-white dark:hover:bg-jet-600 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-110"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 group-hover:animate-spin" />
                  ) : (
                    <Moon className="w-5 h-5 group-hover:animate-pulse" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center text-sm text-jet-600 dark:text-platinum-400">
          <button
            onClick={() => navigate('/admin')}
            className="hover:text-caribbean-600 dark:hover:text-caribbean-400 transition-colors duration-200"
          >
            لوحة التحكم
          </button>
          {activeTab !== 'requests' && (
            <>
              <span className="mx-2">/</span>
              <span className="text-caribbean-600 dark:text-caribbean-400">
                {activeTab === 'support' && 'رسائل الدعم'}
                {activeTab === 'faqs' && 'الأسئلة الشائعة'}
                {activeTab === 'voluntary-return' && 'العودة الطوعية'}
                {activeTab === 'moderators' && (profile?.role === 'admin' ? 'إدارة المشرفين' : 'الوصول مرفوض')}
              </span>
            </>
          )}
          {activeTab === 'voluntary-return' && voluntaryReturnView !== 'list' && (
            <>
              <span className="mx-2">/</span>
              <span className="text-caribbean-600 dark:text-caribbean-400">
                {voluntaryReturnView === 'create' && 'إنشاء نموذج جديد'}
                {voluntaryReturnView === 'chart' && 'الإحصائيات'}
              </span>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 mb-8 overflow-hidden">
          <div className="flex border-b border-sky-200 dark:border-jet-700 overflow-x-auto bg-gradient-to-r from-sky-50/20 via-transparent to-blue-50/20 dark:from-sky-900/10 dark:via-transparent dark:to-blue-900/10">
            <button
              onClick={() => navigateToTab('requests')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'requests'
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">طلبات ({requests.length})</span>
              </div>
            </button>
            <button
              onClick={() => navigateToTab('support')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'support'
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <Mail className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">دعم ({supportMessages.length})</span>
              </div>
            </button>
            <button
              onClick={() => navigateToTab('faqs')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'faqs'
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">أسئلة ({faqs.length})</span>
              </div>
            </button>
            <button
              onClick={() => navigateToTab('voluntary-return')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'voluntary-return'
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <Globe className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">عودة طوعية</span>
              </div>
            </button>
            <button
              onClick={() => navigateToTab('moderators')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'moderators'
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <Shield className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">المشرفين</span>
              </div>
            </button>
            <button
              onClick={() => navigateToTab('health-insurance')}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'health-insurance'
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <Shield className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">التأمين الصحي</span>
              </div>
            </button>
          </div>
        </div>

        {/* Service Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              <button
                onClick={() => setRequestFilter('all')}
                className={`group bg-gradient-to-br from-white via-sky-50/20 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-4 md:p-6 rounded-xl shadow-lg border transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-right ${
                  requestFilter === 'all'
                    ? 'border-sky-300 dark:border-sky-500 shadow-sky-200/50 dark:shadow-sky-500/20'
                    : 'border-sky-200 dark:border-jet-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg transition-all duration-300 ${
                    requestFilter === 'all'
                      ? 'bg-caribbean-200 dark:bg-caribbean-800 group-hover:animate-pulse'
                      : 'bg-caribbean-100 dark:bg-caribbean-900/20'
                  }`}>
                    <FileText className="w-6 h-6 text-caribbean-600 dark:text-caribbean-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">{requests.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRequestFilter('pending')}
                className={`group bg-gradient-to-br from-white via-sky-50/20 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-4 md:p-6 rounded-xl shadow-lg border transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-right ${
                  requestFilter === 'pending'
                    ? 'border-sky-300 dark:border-sky-500 shadow-sky-200/50 dark:shadow-sky-500/20'
                    : 'border-sky-200 dark:border-jet-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg transition-all duration-300 ${
                    requestFilter === 'pending'
                      ? 'bg-sky-200 dark:bg-sky-800 group-hover:animate-pulse'
                      : 'bg-sky-100 dark:bg-sky-900/20'
                  }`}>
                    <Clock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRequestFilter('in_progress')}
                            className={`group bg-gradient-to-br from-white via-sky-50/20 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-4 md:p-6 rounded-xl shadow-lg border transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-right ${
              requestFilter === 'in_progress'
                ? 'border-blue-300 dark:border-blue-500 shadow-blue-200/50 dark:shadow-blue-500/20'
                : 'border-sky-200 dark:border-jet-700'
            }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg transition-all duration-300 ${
                    requestFilter === 'in_progress'
                      ? 'bg-blue-200 dark:bg-blue-800 group-hover:animate-pulse'
                      : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">قيد التنفيذ</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">
                      {requests.filter(r => r.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRequestFilter('completed')}
                            className={`group bg-gradient-to-br from-white via-sky-50/20 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-4 md:p-6 rounded-xl shadow-lg border transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-right ${
              requestFilter === 'completed'
                ? 'border-green-300 dark:border-green-500 shadow-green-200/50 dark:shadow-green-500/20'
                : 'border-sky-200 dark:border-jet-700'
            }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg transition-all duration-300 ${
                    requestFilter === 'completed'
                      ? 'bg-green-200 dark:bg-green-800 group-hover:animate-pulse'
                      : 'bg-green-100 dark:bg-green-900/20'
                  }`}>
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">مكتملة</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">
                      {requests.filter(r => r.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Active Filter Indicator */}
            {requestFilter !== 'all' && (
              <div className="mb-4 p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl border border-sky-200 dark:border-sky-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-sky-100 dark:bg-sky-800 rounded-lg mr-3">
                      <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm text-jet-600 dark:text-platinum-400">عرض الطلبات:</p>
                      <p className="font-semibold text-jet-800 dark:text-white">
                        {requestFilter === 'pending' ? 'قيد الانتظار' : 
                         requestFilter === 'in_progress' ? 'قيد التنفيذ' : 
                         requestFilter === 'completed' ? 'مكتملة' : 'جميع الطلبات'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRequestFilter('all')}
                    className="px-3 py-1 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                  >
                    عرض الكل
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-6 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث في الطلبات..."
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
              <div className="space-y-4 md:space-y-6">
              {filteredRequests.length === 0 ? (
                <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-12 text-center">
                  <FileText className="w-16 h-16 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">لا توجد طلبات</h3>
                  <p className="text-jet-600 dark:text-platinum-400">لا توجد طلبات تطابق معايير البحث</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="group bg-gradient-to-br from-white via-sky-50/20 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 p-4 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
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
                        <p className="text-jet-600 dark:text-platinum-400 mb-2">
                          <strong>نوع الخدمة:</strong> {getServiceTypeArabic(request.service_type)}
                        </p>
                        {request.description && (
                          <p className="text-jet-700 dark:text-platinum-300 mb-3">
                            {request.description}
                          </p>
                        )}
                        
                        {/* File Display */}
                        {request.file_url && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 rounded-lg border border-sky-200 dark:border-sky-700/30">
                            <p className="text-sm text-sky-800 dark:text-sky-300 mb-2">
                              <strong>الملف المرفق:</strong> {request.file_name || 'ملف مرفق'}
                              {request.file_url.startsWith('base64://') && (
                                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                                  (محفوظ في قاعدة البيانات)
                                </span>
                              )}
                            </p>
                            <div className="flex space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleFileView(request.file_url!, request.file_name || 'file', request.id)}
                                className="group flex items-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
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
                        
                        <div className="flex items-center space-x-4 space-x-reverse text-sm text-jet-500 dark:text-platinum-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            <span>{formatDisplayDate(request.created_at)}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {getPriorityArabic(request.priority)}
                          </span>
                        </div>
                        
                        {/* Contact Info */}
                        <div className="bg-platinum-50 dark:bg-jet-700 p-3 rounded-lg mb-3">
                          <h4 className="font-medium text-jet-800 dark:text-white mb-2">معلومات التواصل</h4>
                          <div className="text-sm text-jet-600 dark:text-platinum-400 space-y-1">
                            <p><strong>الاسم:</strong> {request.contact_name}</p>
                            <p><strong>البريد الإلكتروني:</strong> {request.contact_email}</p>
                            {request.contact_phone && (
                              <div className="flex items-center">
                                <span className="text-jet-600 dark:text-platinum-400">
                                  <strong>رقم الجوال:</strong> <span className="font-mono text-left font-bold" dir="ltr">{request.contact_country_code} {request.contact_phone}</span>
                                </span>
                                <a
                                  href={`https://wa.me/${formatPhoneForWhatsApp(request.contact_country_code + request.contact_phone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors cursor-pointer"
                                  title="فتح الواتساب"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                  </svg>
                                </a>
                              </div>
                            )}
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 ml-1" />
                              <a 
                                href={`mailto:${request.contact_email}?subject=بخصوص طلبك: ${request.title}`}
                                className="text-caribbean-600 dark:text-caribbean-400 hover:underline"
                              >
                                إرسال بريد إلكتروني
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        {request.admin_notes && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <strong>ملاحظات الإدارة:</strong> {request.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(request)}
                          className="p-2 text-caribbean-600 hover:text-caribbean-700 dark:text-caribbean-400 dark:hover:text-caribbean-300 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors duration-200"
                          title="تعديل الطلب"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(request.id)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Support Messages Tab */}
        {activeTab === 'support' && (
          <>
            {/* Support Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
                <div className="flex items-center">
                  <div className="p-3 bg-caribbean-100 dark:bg-caribbean-900/20 rounded-lg">
                    <Mail className="w-6 h-6 text-caribbean-600 dark:text-caribbean-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">إجمالي الرسائل</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">{supportMessages.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
                <div className="flex items-center">
                                  <div className="p-3 bg-sky-100 dark:bg-sky-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">
                      {supportMessages.filter(m => m.status === 'pending').length}
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
                    <p className="text-sm text-jet-600 dark:text-platinum-400">قيد المعالجة</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">
                      {supportMessages.filter(m => m.status === 'in_progress').length}
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
                    <p className="text-sm text-jet-600 dark:text-platinum-400">محلولة</p>
                    <p className="text-2xl font-bold text-jet-800 dark:text-white">
                      {supportMessages.filter(m => m.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Filters */}
            <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث في رسائل الدعم..."
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
                  <option value="in_progress">قيد المعالجة</option>
                  <option value="resolved">محلولة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>
            </div>

            {/* Support Messages List */}
            <div className="space-y-6">
              {filteredSupportMessages.length === 0 ? (
                <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-12 text-center">
                  <Mail className="w-16 h-16 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">لا توجد رسائل</h3>
                  <p className="text-jet-600 dark:text-platinum-400">لا توجد رسائل دعم تطابق معايير البحث</p>
                </div>
              ) : (
                filteredSupportMessages.map((message) => (
                  <div key={message.id} className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-jet-800 dark:text-white ml-3">
                            {message.subject}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {getStatusIcon(message.status)}
                            <span className="mr-1">{getStatusArabic(message.status)}</span>
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-jet-600 dark:text-platinum-400 mb-2">
                            <strong>من:</strong> {message.name} ({message.email})
                          </p>
                          <p className="text-jet-700 dark:text-platinum-300 bg-platinum-50 dark:bg-jet-700 p-3 rounded-lg">
                            {message.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4 space-x-reverse text-sm text-jet-500 dark:text-platinum-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            <span>{formatDisplayDate(message.created_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 ml-1" />
                            <a 
                              href={`mailto:${message.email}?subject=رد على: ${message.subject}`}
                              className="text-caribbean-600 dark:text-caribbean-400 hover:underline"
                            >
                              رد بالبريد الإلكتروني
                            </a>
                          </div>
                        </div>
                        
                        {message.admin_reply && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <strong>رد الإدارة:</strong> {message.admin_reply}
                            </p>
                            {message.admin_reply_date && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                تاريخ الرد: {formatDisplayDate(message.admin_reply_date)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEditSupport(message)}
                          className="p-2 text-caribbean-600 hover:text-caribbean-700 dark:text-caribbean-400 dark:hover:text-caribbean-300 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors duration-200"
                          title="الرد على الرسالة"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(message.id)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <>
            {/* FAQ Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white">إدارة الأسئلة المتكررة</h2>
              <button
                onClick={() => setShowAddFaq(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة سؤال جديد
              </button>
            </div>

            {/* FAQ Search */}
            <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في الأسئلة المتكررة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                />
              </div>
            </div>

            {/* FAQs List */}
            <div className="space-y-6">
              {filteredFaqs.length === 0 ? (
                <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-12 text-center">
                  <HelpCircle className="w-16 h-16 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">لا توجد أسئلة</h3>
                  <p className="text-jet-600 dark:text-platinum-400">لا توجد أسئلة متكررة تطابق معايير البحث</p>
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-bold text-jet-800 dark:text-white ml-3">
                            {faq.question}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            faq.is_active 
                              ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
                              : 'text-red-600 bg-red-100 dark:bg-red-900/20'
                          }`}>
                            {faq.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                          <span className="inline-block px-2 py-1 bg-caribbean-100 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400 text-xs rounded-full mr-2">
                            {faq.category}
                          </span>
                        </div>
                        
                        <p className="text-jet-700 dark:text-platinum-300 mb-3 bg-platinum-50 dark:bg-jet-700 p-3 rounded-lg">
                          {faq.answer}
                        </p>
                        
                        <div className="flex items-center space-x-4 space-x-reverse text-sm text-jet-500 dark:text-platinum-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            <span>{formatDisplayDate(faq.created_at)}</span>
                          </div>
                          <span>ترتيب: {faq.order_index}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEditFaq(faq)}
                          className="p-2 text-caribbean-600 hover:text-caribbean-700 dark:text-caribbean-400 dark:hover:text-caribbean-300 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors duration-200"
                          title="تعديل السؤال"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(faq.id)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          title="حذف السؤال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Voluntary Return Tab */}
        {activeTab === 'voluntary-return' && (
          <>
            {/* Voluntary Return Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
              <h2 className="text-xl md:text-2xl font-bold text-jet-800 dark:text-white text-center md:text-right">إدارة نماذج العودة الطوعية</h2>
              {voluntaryReturnView === 'list' && (
                <button
                  onClick={() => navigateToVoluntaryReturnView('create')}
                  className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة نموذج جديد
                </button>
              )}
            </div>

            {/* Voluntary Return Navigation Tabs */}
            <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
              <div className="flex border-b border-platinum-200 dark:border-jet-700 overflow-x-auto">
                <button
                  onClick={() => navigateToVoluntaryReturnView('list')}
                  className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    voluntaryReturnView === 'list'
                      ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                      : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                    <span className="text-sm md:text-base">قائمة النماذج</span>
                  </div>
                </button>
                <button
                  onClick={() => navigateToVoluntaryReturnView('create')}
                  className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    voluntaryReturnView === 'create'
                      ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                      : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
                  }`}
                >
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                    <span className="text-sm md:text-base">إنشاء نموذج جديد</span>
                  </div>
                </button>
                <button
                  onClick={() => navigateToVoluntaryReturnView('chart')}
                  className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    voluntaryReturnView === 'chart'
                      ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                      : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                    <span className="text-sm md:text-base">الإحصائيات</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Voluntary Return Content */}
            <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
              {voluntaryReturnView === 'list' ? (
                <VoluntaryReturnFormsList isDarkMode={isDarkMode} />
              ) : voluntaryReturnView === 'create' ? (
                <VoluntaryReturnForm isDarkMode={isDarkMode} />
              ) : (
                <VoluntaryReturnChart isDarkMode={isDarkMode} />
              )}
            </div>
          </>
        )}


      </div>

      {/* Edit Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingRequest(null)}></div>
          <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white">تحديث الطلب</h2>
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
                  حالة الطلب
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  أولوية الطلب
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value as any})}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  ملاحظات الإدارة
                </label>
                <textarea
                  value={editForm.admin_notes}
                  onChange={(e) => setEditForm({...editForm, admin_notes: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="أضف ملاحظات للعميل..."
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

      {/* Support Reply Modal */}
      {editingSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingSupport(null)}></div>
          <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white">الرد على الرسالة</h2>
              <button
                onClick={() => setEditingSupport(null)}
                className="text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-platinum-50 dark:bg-jet-700 p-3 rounded-lg">
                <p className="text-sm text-jet-600 dark:text-platinum-400 mb-1">
                  <strong>الموضوع:</strong> {editingSupport.subject}
                </p>
                <p className="text-sm text-jet-600 dark:text-platinum-400">
                  <strong>من:</strong> {editingSupport.name} ({editingSupport.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  حالة الرسالة
                </label>
                <select
                  value={supportReplyForm.status}
                  onChange={(e) => setSupportReplyForm({...supportReplyForm, status: e.target.value as any})}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_progress">قيد المعالجة</option>
                  <option value="resolved">محلولة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  رد الإدارة
                </label>
                <textarea
                  value={supportReplyForm.admin_reply}
                  onChange={(e) => setSupportReplyForm({...supportReplyForm, admin_reply: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="اكتب ردك هنا..."
                />
              </div>

              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  onClick={handleSaveSupportReply}
                  className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center"
                >
                  <Reply className="w-4 h-4 ml-2" />
                  إرسال الرد
                </button>
                <button
                  onClick={() => setEditingSupport(null)}
                  className="flex-1 bg-gray-200 dark:bg-jet-600 text-jet-800 dark:text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-jet-500 transition-colors duration-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit FAQ Modal */}
      {(showAddFaq || editingFaq) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowAddFaq(false);
            setEditingFaq(null);
          }}></div>
          <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-jet-800 dark:text-white">
                {editingFaq ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowAddFaq(false);
                  setEditingFaq(null);
                }}
                className="text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  السؤال
                </label>
                <input
                  type="text"
                  value={editingFaq ? editingFaq.question : newFaq.question}
                  onChange={(e) => {
                    if (editingFaq) {
                      setEditingFaq({...editingFaq, question: e.target.value});
                    } else {
                      setNewFaq({...newFaq, question: e.target.value});
                    }
                  }}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="اكتب السؤال هنا..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  الإجابة
                </label>
                <textarea
                  value={editingFaq ? editingFaq.answer : newFaq.answer}
                  onChange={(e) => {
                    if (editingFaq) {
                      setEditingFaq({...editingFaq, answer: e.target.value});
                    } else {
                      setNewFaq({...newFaq, answer: e.target.value});
                    }
                  }}
                  rows={4}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="اكتب الإجابة هنا..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  التصنيف
                </label>
                <input
                  type="text"
                  value={editingFaq ? editingFaq.category : newFaq.category}
                  onChange={(e) => {
                    if (editingFaq) {
                      setEditingFaq({...editingFaq, category: e.target.value});
                    } else {
                      setNewFaq({...newFaq, category: e.target.value});
                    }
                  }}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="مثال: عام، خدمات، أسعار..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={editingFaq ? editingFaq.order_index : newFaq.order_index}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (editingFaq) {
                      setEditingFaq({...editingFaq, order_index: value});
                    } else {
                      setNewFaq({...newFaq, order_index: value});
                    }
                  }}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingFaq ? editingFaq.is_active : newFaq.is_active}
                  onChange={(e) => {
                    if (editingFaq) {
                      setEditingFaq({...editingFaq, is_active: e.target.checked});
                    } else {
                      setNewFaq({...newFaq, is_active: e.target.checked});
                    }
                  }}
                  className="w-4 h-4 text-caribbean-600 bg-white dark:bg-jet-700 border-platinum-300 dark:border-jet-600 rounded focus:ring-caribbean-500 dark:focus:ring-caribbean-400 focus:ring-2"
                />
                <label htmlFor="is_active" className="mr-2 text-sm font-medium text-jet-700 dark:text-platinum-300">
                  نشط (يظهر للعملاء)
                </label>
              </div>

              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  onClick={() => handleSaveFaq(editingFaq || newFaq)}
                  className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-4 h-4 ml-2" />
                  {editingFaq ? 'حفظ التغييرات' : 'إضافة السؤال'}
                </button>
                <button
                  onClick={() => {
                    setShowAddFaq(false);
                    setEditingFaq(null);
                  }}
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
                هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    if (activeTab === 'requests') {
                      handleDelete(deleteConfirm);
                    } else if (activeTab === 'faqs') {
                      handleDeleteFaq(deleteConfirm);
                    }
                  }}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300"
                >
                  حذف
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

      {/* File View Modal - Glass Effect */}
      {fileViewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with enhanced blur */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/20 to-blue-900/20 backdrop-blur-xl"
            onClick={() => setFileViewModal({...fileViewModal, isOpen: false})}
          ></div>
          
          {/* Glass Modal */}
          <div className="relative w-full max-w-3xl mx-auto animate-fade-in-up">
            {/* Glass Container */}
            <div className="bg-white/10 dark:bg-jet-900/20 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-jet-600/20 overflow-hidden">
              {/* Animated Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-jet-600/20 bg-white/10 dark:bg-jet-800/10 backdrop-blur-sm">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-jet-800 animate-pulse"></div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        عرض الملف
                      </h2>
                      <p className="text-sm text-jet-600 dark:text-platinum-400 mt-1">
                        {fileViewModal.fileName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFileViewModal({...fileViewModal, isOpen: false})}
                    className="group w-10 h-10 bg-white/20 dark:bg-jet-700/20 hover:bg-white/30 dark:hover:bg-jet-600/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90"
                  >
                    <X className="w-5 h-5 text-jet-600 dark:text-platinum-400 group-hover:text-red-500 transition-colors duration-200" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {fileViewModal.fileData ? (
                    <div className="space-y-4">
                      {/* File Preview Card */}
                      <div className="bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-jet-600/30 shadow-xl">
                        
                        {/* File Preview Section */}
                        <div className="mb-6">
                          {(() => {
                            const fileName = fileViewModal.fileName.toLowerCase();
                            const isImage = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif') || fileName.endsWith('.webp');
                            const isPDF = fileName.endsWith('.pdf');
                                                         const isText = fileName.endsWith('.txt') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || fileName.endsWith('.rtf');
                            
                                                         if (isImage) {
                               // عرض معاينة الصورة
                               let imageUrl = `data:image/jpeg;base64,${fileViewModal.fileData}`;
                               
                               // تحديد نوع الصورة الصحيح
                               if (fileName.endsWith('.png')) {
                                 imageUrl = `data:image/png;base64,${fileViewModal.fileData}`;
                               } else if (fileName.endsWith('.gif')) {
                                 imageUrl = `data:image/gif;base64,${fileViewModal.fileData}`;
                               } else if (fileName.endsWith('.webp')) {
                                 imageUrl = `data:image/webp;base64,${fileViewModal.fileData}`;
                               }
                              return (
                                <div className="text-center">
                                  <div className="relative inline-block">
                                    <img 
                                      src={imageUrl} 
                                      alt={fileViewModal.fileName}
                                      className="max-w-full max-h-64 rounded-xl shadow-lg border-2 border-white/30 dark:border-jet-600/30 object-contain"
                                                                             onError={(e) => {
                                         // إذا فشل عرض الصورة، اعرض أيقونة
                                         const target = e.currentTarget as HTMLImageElement;
                                         target.style.display = 'none';
                                         const nextElement = target.nextElementSibling as HTMLElement;
                                         if (nextElement) {
                                           nextElement.style.display = 'flex';
                                         }
                                       }}
                                    />
                                    <div className="hidden w-64 h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                      <FileText className="w-16 h-16 text-white" />
                                    </div>
                                  </div>
                                  <p className="text-sm text-jet-600 dark:text-platinum-400 mt-2">
                                    معاينة الصورة
                                  </p>
                                </div>
                              );
                            } else if (isPDF) {
                              // عرض معاينة PDF
                              return (
                                <div className="text-center">
                                  <div className="w-64 h-64 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                                    <div className="text-center">
                                      <FileText className="w-16 h-16 text-white mb-2" />
                                      <p className="text-white font-semibold">PDF</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-jet-600 dark:text-platinum-400 mt-2">
                                    ملف PDF - اضغط "فتح في تبويب جديد" لعرضه
                                  </p>
                                </div>
                              );
                            } else if (isText) {
                              // عرض معاينة النص
                              try {
                                const textContent = atob(fileViewModal.fileData);
                                const previewText = textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
                                return (
                                  <div className="text-center">
                                    <div className="w-64 h-32 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mx-auto overflow-hidden">
                                      <div className="text-white text-sm text-right leading-relaxed h-full overflow-y-auto">
                                        {previewText}
                                      </div>
                                    </div>
                                    <p className="text-sm text-jet-600 dark:text-platinum-400 mt-2">
                                      معاينة النص
                                    </p>
                                  </div>
                                );
                              } catch (error) {
                                // إذا فشل في فك تشفير النص
                                return (
                                  <div className="text-center">
                                    <div className="w-64 h-32 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto">
                                      <FileText className="w-12 h-12 text-white" />
                                    </div>
                                    <p className="text-sm text-jet-600 dark:text-platinum-400 mt-2">
                                      ملف نصي
                                    </p>
                                  </div>
                                );
                              }
                            } else {
                              // عرض أيقونة عامة للملفات الأخرى
                              return (
                                <div className="text-center">
                                  <div className="w-64 h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                                    <FileText className="w-12 h-12 text-white" />
                                  </div>
                                  <p className="text-sm text-jet-600 dark:text-platinum-400 mt-2">
                                    ملف مرفق
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                        
                        {/* File Info */}
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-1">
                            {fileViewModal.fileName}
                          </h3>
                          <p className="text-jet-600 dark:text-platinum-400 text-sm">
                            ملف مرفق جاهز للعرض
                          </p>
                        </div>
                        
                        {/* File Actions */}
                        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                          <button
                            onClick={() => handleFileDownload(fileViewModal.fileUrl, fileViewModal.fileName)}
                            className="group flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform text-sm"
                          >
                            <Download className="w-4 h-4 ml-2 group-hover:animate-bounce" />
                            <span className="font-semibold">تحميل الملف</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              const blob = new Blob([Uint8Array.from(atob(fileViewModal.fileData!), c => c.charCodeAt(0))], { type: 'application/octet-stream' });
                              const url = window.URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            }}
                            className="group flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform text-sm"
                          >
                            <ExternalLink className="w-4 h-4 ml-2 group-hover:animate-pulse" />
                            <span className="font-semibold">فتح في تبويب جديد</span>
                          </button>
                        </div>
                      </div>

                      {/* File Info Card */}
                      <div className="bg-white/30 dark:bg-jet-700/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-jet-600/20">
                        <h4 className="font-bold text-jet-800 dark:text-white mb-3 text-base flex items-center">
                          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center ml-2">
                            <FileText className="w-3 h-3 text-white" />
                          </div>
                          معلومات الملف
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/20 dark:bg-jet-600/20 rounded-xl p-3">
                            <span className="text-jet-600 dark:text-platinum-400 text-xs font-medium">اسم الملف:</span>
                            <span className="block font-bold text-jet-800 dark:text-white text-sm mt-1 truncate">{fileViewModal.fileName}</span>
                          </div>
                          <div className="bg-white/20 dark:bg-jet-600/20 rounded-xl p-3">
                            <span className="text-jet-600 dark:text-platinum-400 text-xs font-medium">حجم البيانات:</span>
                            <span className="block font-bold text-jet-800 dark:text-white text-sm mt-1">
                              {Math.round(fileViewModal.fileData.length * 0.75 / 1024)} KB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-jet-700 dark:to-jet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FileText className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">
                        لا يمكن عرض الملف
                      </h3>
                      <p className="text-jet-600 dark:text-platinum-400">
                        يرجى تحميل الملف لعرضه
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderators Tab */}
      {activeTab === 'moderators' && (
        <>
          {/* Show moderator management for admin users */}
          {profile?.role === 'admin' && (
            <ModeratorManagement isDarkMode={isDarkMode} />
          )}
          
          {/* Show access denied for non-admin users */}
          {profile?.role !== 'admin' && (
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                {/* Access Denied Message */}
                <div className="bg-white/20 dark:bg-jet-800/20 backdrop-blur-md border border-white/30 dark:border-jet-600/30 rounded-2xl shadow-2xl p-8 text-center">
                  <div className="w-20 h-20 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">
                    🔒 الوصول مرفوض
                  </h2>
                  <p className="text-lg text-jet-600 dark:text-platinum-400 mb-6">
                    فقط الأدمن يمكنه الوصول إلى هذه الصفحة
                  </p>
                  <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">
                      هذه الصفحة مخصصة لإدارة المشرفين وتتطلب صلاحيات أدمن كاملة
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Health Insurance Tab */}
      {activeTab === 'health-insurance' && (
        <>
          {/* Show health insurance management for admin and moderator users */}
          {(profile?.role === 'admin' || profile?.role === 'moderator') && (
            <HealthInsuranceManagement />
          )}
          
          {/* Show access denied for non-admin/moderator users */}
          {(profile?.role !== 'admin' && profile?.role !== 'moderator') && (
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                {/* Access Denied Message */}
                <div className="bg-white/20 dark:bg-jet-800/20 backdrop-blur-md border border-white/30 dark:border-jet-600/30 rounded-2xl shadow-2xl p-8 text-center">
                  <div className="w-20 h-20 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-4">
                    🔒 الوصول مرفوض
                  </h2>
                  <p className="text-lg text-jet-600 dark:text-platinum-400 mb-6">
                    فقط الأدمن والمشرفين يمكنهم الوصول إلى هذه الصفحة
                  </p>
                  <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-sm text-jet-600 dark:text-platinum-400">
                      هذه الصفحة مخصصة لإدارة التأمين الصحي وتتطلب صلاحيات أدمن أو مشرف
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}



      {/* Success Message */}
      {updateSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/20 dark:bg-jet-800/20 backdrop-blur-md border border-white/30 dark:border-jet-600/30 rounded-2xl shadow-2xl p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-jet-800 dark:text-white mb-2">
              تم الحفظ بنجاح! ✨
            </h3>
            <p className="text-jet-600 dark:text-platinum-400 text-sm">
              تم تحديث البيانات بنجاح
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

export default AdminDashboard;
