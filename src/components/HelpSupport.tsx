import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, Search, ChevronDown, ChevronUp, Send, X, CheckCircle, AlertCircle, ArrowLeft, Clock, User, Mail, Phone, MapPin, Globe } from 'lucide-react';
import CustomCursor from './CustomCursor';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { formatDisplayDate } from '../lib/utils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
}

interface HelpSupportProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const HelpSupport: React.FC<HelpSupportProps> = ({ 
  onBack, 
  isDarkMode
}) => {
  const { user, profile } = useAuthContext();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stats, setStats] = useState({
    totalFaqs: 0,
    totalCategories: 0,
    resolvedMessages: 0,
    pendingMessages: 0
  });

  useEffect(() => {
    fetchFAQs();
    if (user) {
      fetchUserMessages();
    }
  }, [user]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('خطأ في جلب الأسئلة المتكررة:', error);
        return;
      }

      setFaqs(data || []);
      
      // حساب الإحصائيات
      const categories = new Set(data?.map(faq => faq.category) || []);
      setStats({
        totalFaqs: data?.length || 0,
        totalCategories: categories.size,
        resolvedMessages: userMessages.filter(m => m.status === 'resolved').length,
        pendingMessages: userMessages.filter(m => m.status === 'pending').length
      });
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMessages = async () => {
    if (!user) return;

    try {
      setLoadingMessages(true);
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب رسائل المستخدم:', error);
        return;
      }

      setUserMessages(data || []);
      
      // تحديث إحصائيات الرسائل
      setStats(prev => ({
        ...prev,
        resolvedMessages: data?.filter(m => m.status === 'resolved').length || 0,
        pendingMessages: data?.filter(m => m.status === 'pending').length || 0
      }));
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      setContactError('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setContactError('يرجى ملء جميع الحقول');
      return;
    }

    setContactLoading(true);
    setContactError(null);

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          name: profile.full_name,
          email: profile.email || user.email,
          subject: contactForm.subject.trim(),
          message: contactForm.message.trim(),
          status: 'pending'
        });

      if (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        setContactError('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
        return;
      }

      setContactSuccess(true);
      setContactForm({ subject: '', message: '' });
      
      // تحديث قائمة الرسائل
      await fetchUserMessages();
      
      // إغلاق المودال بعد 2 ثانية
      setTimeout(() => {
        setContactSuccess(false);
        setShowContactModal(false);
      }, 2000);

    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setContactError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setContactLoading(false);
    }
  };

  // Get unique categories
  const categories = ['الكل', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'الكل' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <CustomCursor isDarkMode={isDarkMode} />
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-slate-700 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-4">جاري تحميل مركز المساعدة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <CustomCursor isDarkMode={isDarkMode} />
      
      {/* Modern Header */}
      <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={onBack}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
              </button>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    مركز المساعدة
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    نحن هنا لمساعدتك في أي وقت
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              تواصل معنا
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            كيف يمكننا مساعدتك؟
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            ابحث في الأسئلة المتكررة أو تواصل مع فريق الدعم للحصول على مساعدة مخصصة
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">الأسئلة</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFaqs}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">الفئات</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCategories}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          
          {user && (
            <>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">محلولة</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.resolvedMessages}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingMessages}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">البحث السريع</h3>
            <p className="text-blue-100 leading-relaxed">
              ابحث في الأسئلة المتكررة للحصول على إجابة فورية
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">تواصل مباشر</h3>
            <p className="text-emerald-100 leading-relaxed">
              تواصل مع فريق الدعم للحصول على مساعدة مخصصة
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">متابعة الطلبات</h3>
            <p className="text-purple-100 leading-relaxed">
              تابع حالة طلباتك السابقة والردود عليها
            </p>
          </div>
        </div>

        {/* User Messages Section - only show if user has messages */}
        {user && userMessages.length > 0 && (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                رسائلك السابقة
              </h2>
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                {userMessages.length} رسالة
              </span>
            </div>
            <div className="grid gap-6">
              {userMessages.slice(0, 3).map((message) => (
                <div key={message.id} className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{message.subject}</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{message.message}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                      message.status === 'resolved' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : message.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {message.status === 'resolved' ? 'محلولة' : 
                       message.status === 'in_progress' ? 'قيد المعالجة' : 'قيد الانتظار'}
                    </span>
                  </div>
                  {message.admin_reply && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-xl mt-4 border-r-4 border-emerald-500">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed font-medium">
                            رد الإدارة:
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-400 text-sm leading-relaxed mt-1">
                            {message.admin_reply}
                          </p>
                          {message.admin_reply_date && (
                            <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-2 flex items-center">
                              <Clock className="w-3 h-3 ml-1" />
                              {formatDisplayDate(message.admin_reply_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                    <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center">
                      <Clock className="w-3 h-3 ml-1" />
                      {formatDisplayDate(message.created_at)}
                    </p>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200">
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              ابحث في الأسئلة المتكررة
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              ابحث عن إجابات لأسئلتك الشائعة أو تصفح الفئات المختلفة
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="اكتب سؤالك هنا..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300 group-hover:border-blue-400 dark:group-hover:border-blue-500 text-lg"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="relative group">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all duration-300 group-hover:border-blue-400 dark:group-hover:border-blue-500 appearance-none cursor-pointer text-lg"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
              </div>
            </div>
          </div>
          
          {/* Search Results Summary */}
          {searchTerm && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center justify-between">
                <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
                  تم العثور على <span className="font-bold text-lg">{filteredFaqs.length}</span> نتيجة لـ "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                >
                  مسح البحث
                </button>
              </div>
            </div>
          )}

          {/* Category Pills */}
          {selectedCategory === 'الكل' && categories.length > 1 && (
            <div className="mt-6">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-3">تصفية سريعة:</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(1).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 border border-slate-200 dark:border-slate-600"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAQs Section */}
        <div className="mb-12">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-16 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-700 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                <HelpCircle className="w-16 h-16 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">لا توجد أسئلة</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xl mb-8 max-w-md mx-auto">
                لم نجد أسئلة تطابق بحثك. جرب كلمات مختلفة أو تواصل معنا مباشرة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  مسح البحث
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 border border-slate-200 dark:border-slate-600"
                >
                  تواصل معنا
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <div 
                  key={faq.id} 
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-2xl transform hover:scale-[1.02]"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-8 py-8 text-right hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-700/50 dark:hover:to-blue-900/20 transition-all duration-300 flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 leading-relaxed group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {faq.question}
                      </h3>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full font-bold">
                          {faq.category}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">
                          اضغط للعرض
                        </span>
                      </div>
                    </div>
                    <div className="mr-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        expandedFaq === faq.id 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-slate-400 dark:text-slate-400 group-hover:text-blue-500" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {expandedFaq === faq.id && (
                    <div className="px-8 pb-8 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="pt-8">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-700/50 dark:to-blue-900/20 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            هل هذه الإجابة مفيدة؟
                          </p>
                          <div className="flex space-x-4 space-x-reverse">
                            <button className="px-6 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors duration-200">
                              نعم، مفيدة
                            </button>
                            <button className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200">
                              لا، غير مفيدة
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">لم تجد ما تبحث عنه؟</h2>
            <p className="text-white/90 mb-10 text-xl leading-relaxed max-w-3xl mx-auto">
              تواصل معنا مباشرة وسيقوم فريق الدعم المختص بالرد عليك في أقرب وقت ممكن
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => setShowContactModal(true)}
                className="bg-white text-blue-700 px-10 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center text-lg"
              >
                <MessageCircle className="w-6 h-6 ml-3" />
                تواصل معنا الآن
              </button>
              <button
                onClick={() => window.open('mailto:support@tevasul.group', '_blank')}
                className="bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 border-2 border-white/30 flex items-center justify-center text-lg"
              >
                <Mail className="w-6 h-6 ml-3" />
                إرسال بريد إلكتروني
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowContactModal(false)}></div>
          
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-6 right-6 p-3 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-300 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            {contactSuccess ? (
              <div className="text-center py-16 px-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  تم إرسال رسالتك بنجاح!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  سيتم الرد عليك قريباً من قبل فريق الدعم
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">
                    تواصل معنا
                  </h2>
                  <p className="text-blue-100 text-lg">
                    أرسل لنا رسالة وسنرد عليك قريباً
                  </p>
                </div>

                <div className="p-8">
                  {contactError && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center">
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 ml-4" />
                      <p className="text-red-600 dark:text-red-400 text-sm">{contactError}</p>
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div>
                      <label className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        موضوع الرسالة
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        className="w-full px-6 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-lg"
                        placeholder="مثال: استفسار عن خدمة الترجمة"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        نص الرسالة
                      </label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        rows={6}
                        className="w-full px-6 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none text-lg"
                        placeholder="اكتب رسالتك هنا..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 px-8 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-xl"
                    >
                      {contactLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white ml-3"></div>
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6 ml-3" />
                          إرسال الرسالة
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HelpSupport;
