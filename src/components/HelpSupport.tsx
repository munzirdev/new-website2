import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, Search, ChevronDown, ChevronUp, Send, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import Navbar from './Navbar';

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
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount: () => void;
  onToggleDarkMode: () => void;
  onNavigateToMainHome: () => void;
}

const HelpSupport: React.FC<HelpSupportProps> = ({ 
  onBack, 
  isDarkMode, 
  onNavigateToContact,
  onOpenProfile,
  onOpenAccount,
  onToggleDarkMode,
  onNavigateToMainHome
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
      <div className="min-h-screen bg-white dark:bg-jet-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean-600 mx-auto mb-4"></div>
          <p className="text-jet-600 dark:text-platinum-400">جاري تحميل المساعدة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-platinum-50 dark:bg-jet-900 pt-16">
      {/* Fixed Navbar */}
      <Navbar
        onNavigateHome={onNavigateToMainHome}
        onNavigateToContact={onNavigateToContact}
        onOpenProfile={onOpenProfile}
        onOpenAccount={onOpenAccount}
        onOpenHelp={() => {}} // Already in help page
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      {/* Header */}
      <div className="bg-white dark:bg-jet-800 shadow-sm border-b border-platinum-200 dark:border-jet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-jet-800 dark:text-white">
              المساعدة والدعم
            </h1>
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              تواصل معنا
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Messages Section - only show if user has messages */}
        {user && userMessages.length > 0 && (
          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
            <h2 className="text-xl font-bold text-jet-800 dark:text-white mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 ml-2" />
              رسائلك السابقة
            </h2>
            <div className="space-y-4">
              {userMessages.slice(0, 3).map((message) => (
                <div key={message.id} className="border border-platinum-200 dark:border-jet-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-jet-800 dark:text-white">{message.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      message.status === 'resolved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : message.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {message.status === 'resolved' ? 'محلولة' : 
                       message.status === 'in_progress' ? 'قيد المعالجة' : 'قيد الانتظار'}
                    </span>
                  </div>
                  <p className="text-jet-600 dark:text-platinum-400 text-sm mb-2">{message.message}</p>
                  {message.admin_reply && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mt-2">
                      <p className="text-green-800 dark:text-green-300 text-sm">
                        <strong>رد الإدارة:</strong> {message.admin_reply}
                      </p>
                      {message.admin_reply_date && (
                        <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                          {new Date(message.admin_reply_date).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-jet-500 dark:text-platinum-500 text-xs mt-2">
                    {new Date(message.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-500 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث في الأسئلة المتكررة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-12 text-center">
              <HelpCircle className="w-16 h-16 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-jet-800 dark:text-white mb-2">لا توجد أسئلة</h3>
              <p className="text-jet-600 dark:text-platinum-400">لم نجد أسئلة تطابق بحثك</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 text-right hover:bg-platinum-50 dark:hover:bg-jet-700 transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-jet-800 dark:text-white mb-1">
                      {faq.question}
                    </h3>
                    <span className="inline-block px-2 py-1 bg-caribbean-100 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400 text-xs rounded-full">
                      {faq.category}
                    </span>
                  </div>
                  <div className="mr-4">
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                    )}
                  </div>
                </button>
                
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-4 border-t border-platinum-200 dark:border-jet-700">
                    <div className="pt-4">
                      <p className="text-jet-700 dark:text-platinum-300 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">لم تجد ما تبحث عنه؟</h2>
          <p className="text-white/90 mb-6">
            تواصل معنا مباشرة وسيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن
          </p>
          <button
            onClick={() => setShowContactModal(true)}
            className="bg-white text-caribbean-700 px-8 py-3 rounded-lg font-semibold hover:bg-platinum-100 transition-colors duration-300 flex items-center justify-center mx-auto"
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            تواصل معنا الآن
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowContactModal(false)}></div>
          
          <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200 transition-colors duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            {contactSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                  تم إرسال رسالتك بنجاح!
                </h2>
                <p className="text-jet-600 dark:text-platinum-400">
                  سيتم الرد عليك قريباً من قبل فريق الدعم
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-caribbean-100 dark:bg-caribbean-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-caribbean-600 dark:text-caribbean-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
                    تواصل معنا
                  </h2>
                  <p className="text-jet-600 dark:text-platinum-400">
                    أرسل لنا رسالة وسنرد عليك قريباً
                  </p>
                </div>

                {contactError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
                    <p className="text-red-600 dark:text-red-400 text-sm">{contactError}</p>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      موضوع الرسالة
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                      placeholder="مثال: استفسار عن خدمة الترجمة"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      نص الرسالة
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                      placeholder="اكتب رسالتك هنا..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {contactLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 ml-2" />
                        إرسال الرسالة
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;
