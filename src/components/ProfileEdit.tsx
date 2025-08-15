import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, X, CheckCircle, AlertCircle, Search, ChevronDown } from 'lucide-react';
import CustomCursor from './CustomCursor';
import { useAuthContext } from './AuthProvider';
import { supabase, countryCodes, CountryCode } from '../lib/supabase';
import { formatDisplayDate } from '../lib/utils';

interface ProfileEditProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ 
  onBack, 
  isDarkMode
}) => {
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    country_code: '+90'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country_code: profile.country_code || '+90'
      });
    }
  }, [profile]);

  const filteredCountries = countryCodes.filter(country =>
    country.name.includes(countrySearch) ||
    country.dialCode.includes(countrySearch) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countryCodes.find(country => country.dialCode === formData.country_code) || countryCodes[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!formData.full_name.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      return;
    }

    if (!formData.email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // تحديث الملف الشخصي
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          country_code: formData.country_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('خطأ في تحديث الملف الشخصي:', updateError);
        setError('حدث خطأ في تحديث البيانات. يرجى المحاولة مرة أخرى.');
        return;
      }

      // تحديث البريد الإلكتروني في auth إذا تغير
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) {
          console.error('خطأ في تحديث البريد الإلكتروني:', emailError);
          setError('تم تحديث البيانات الأساسية، لكن فشل في تحديث البريد الإلكتروني.');
        }
      }

      setSuccess(true);
      
      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-platinum-50 dark:bg-jet-900 pt-16">
      <CustomCursor isDarkMode={isDarkMode} />
      {/* Header */}
      <div className="bg-white dark:bg-jet-800 shadow-sm border-b border-platinum-200 dark:border-jet-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-jet-800 dark:text-white">
            تعديل الملف الشخصي
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-jet-800 rounded-2xl shadow-sm border border-platinum-200 dark:border-jet-700 p-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-caribbean-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
              {profile?.full_name || 'المستخدم'}
            </h2>
            <p className="text-jet-600 dark:text-platinum-400">
                              عضو منذ {profile?.created_at ? formatDisplayDate(profile.created_at) : 'غير محدد'}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
              <p className="text-green-600 dark:text-green-400 text-sm">تم تحديث بياناتك بنجاح!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                الاسم الكامل *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="اكتب اسمك الكامل"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                البريد الإلكتروني *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                  placeholder="example@email.com"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                </div>
              </div>
              <p className="text-xs text-jet-500 dark:text-platinum-500 mt-1">
                سيتم إرسال رسالة تأكيد إذا تم تغيير البريد الإلكتروني
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                رقم الهاتف
              </label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="flex items-center px-3 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white min-w-[120px]"
                  >
                    <span className="text-lg mr-2">{selectedCountry.flag}</span>
                    <span className="text-sm">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </button>
                  
                  {/* Country Dropdown */}
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-jet-700 border border-platinum-300 dark:border-jet-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                      {/* Search Box */}
                      <div className="p-2 border-b border-platinum-200 dark:border-jet-600">
                        <div className="relative">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="ابحث عن دولة..."
                            className="w-full px-3 py-2 pl-8 text-sm border border-platinum-300 dark:border-jet-600 rounded focus:outline-none focus:ring-1 focus:ring-caribbean-500 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                          />
                          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-jet-400 dark:text-platinum-400" />
                        </div>
                      </div>
                      
                      {/* Countries List */}
                      <div className="max-h-40 overflow-y-auto">
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, country_code: country.dialCode});
                              setIsCountryDropdownOpen(false);
                              setCountrySearch('');
                            }}
                            className="w-full flex items-center px-3 py-2 text-right hover:bg-platinum-100 dark:hover:bg-jet-600 transition-colors duration-200"
                          >
                            <span className="text-lg ml-3">{country.flag}</span>
                            <span className="text-sm text-jet-600 dark:text-platinum-400 ml-2">{country.dialCode}</span>
                            <span className="text-sm text-jet-800 dark:text-white">{country.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Phone Number Input */}
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 pl-12 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
                    placeholder="5XX XXX XX XX"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Phone className="w-5 h-5 text-jet-400 dark:text-platinum-400" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-jet-500 dark:text-platinum-500 mt-1">
                رقم الهاتف للتواصل معك فقط - اختياري
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 space-x-reverse pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onBack}
                className="flex-1 bg-gray-200 dark:bg-jet-600 text-jet-800 dark:text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-jet-500 transition-colors duration-300 flex items-center justify-center"
              >
                <X className="w-5 h-5 ml-2" />
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isCountryDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsCountryDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ProfileEdit;
