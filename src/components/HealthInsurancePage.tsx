import React, { useState, useEffect } from 'react';
import { Shield, Calculator, Users, Clock, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Building, Calendar, DollarSign, Phone, Mail, Send, X } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';

interface HealthInsurancePageProps {
  onBack: () => void;
  isDarkMode: boolean;
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount: () => void;
  onOpenHelp: () => void;
  onToggleDarkMode: () => void;
  onNavigateToMainHome: () => void;
}

interface InsuranceCompany {
  id: string;
  name: string;
  name_ar: string;
  logo_url?: string;
}

interface AgeGroup {
  id: string;
  min_age: number;
  max_age: number;
  name: string;
  name_ar: string;
}

interface PricingData {
  company_id: string;
  company_name: string;
  company_name_ar: string;
  age_group_id: string;
  age_group_name: string;
  age_group_name_ar: string;
  min_age: number;
  max_age: number;
  duration_months: number;
  price_try: number;
}

const HealthInsurancePage: React.FC<HealthInsurancePageProps> = ({
  onBack,
  isDarkMode,
  onNavigateToContact,
  onOpenProfile,
  onOpenAccount,
  onOpenHelp,
  onToggleDarkMode,
  onNavigateToMainHome
}) => {
  const { user } = useAuthContext();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  // State for pricing data
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(12);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // State for request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load pricing data
  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load age groups
      const { data: ageGroupsData, error: ageGroupsError } = await supabase
        .from('age_groups')
        .select('*')
        .eq('is_active', true)
        .order('min_age');

      if (ageGroupsError) throw ageGroupsError;
      setAgeGroups(ageGroupsData || []);

      // Load pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .rpc('get_health_insurance_pricing');

      if (pricingError) throw pricingError;
      setPricingData(pricingData || []);

    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate price when selections change
  useEffect(() => {
    if (selectedCompany && selectedAgeGroup && selectedDuration) {
      const price = pricingData.find(
        item => 
          item.company_id === selectedCompany &&
          item.age_group_id === selectedAgeGroup &&
          item.duration_months === selectedDuration
      );
      
      setCalculatedPrice(price?.price_try || null);
    } else {
      setCalculatedPrice(null);
    }
  }, [selectedCompany, selectedAgeGroup, selectedDuration, pricingData]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError(isArabic ? 'يجب تسجيل الدخول لتقديم الطلب' : 'You must be logged in to submit a request');
      return;
    }

    if (!selectedCompany || !selectedAgeGroup || !calculatedPrice) {
      setSubmitError(isArabic ? 'يرجى اختيار جميع الخيارات المطلوبة' : 'Please select all required options');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const { data, error } = await supabase
        .from('health_insurance_requests')
        .insert({
          user_id: user.id,
          company_id: selectedCompany,
          age_group_id: selectedAgeGroup,
          duration_months: selectedDuration,
          calculated_price: calculatedPrice,
          contact_name: requestForm.contactName,
          contact_email: requestForm.contactEmail,
          contact_phone: requestForm.contactPhone,
          additional_notes: requestForm.additionalNotes
        });

      if (error) throw error;

      setSubmitSuccess(true);
      setRequestForm({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        additionalNotes: ''
      });
      setShowRequestForm(false);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitError(isArabic ? 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'An error occurred while submitting the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getDurationText = (months: number) => {
    if (isArabic) {
      return months === 12 ? 'سنة واحدة' : 'سنتان';
    }
    return months === 12 ? '1 Year' : '2 Years';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-white/95 dark:bg-jet-800/95 backdrop-blur-md shadow-xl border-b border-platinum-300 dark:border-jet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 space-x-reverse bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium text-sm md:text-base">
                  {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                </span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              <button
                onClick={() => onNavigateToMainHome()}
                className="relative transition-colors duration-300 group font-medium text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400"
              >
                {t('nav.home')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 md:pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-caribbean-50/30 via-indigo-50/20 to-platinum-50 dark:from-caribbean-900/10 dark:via-indigo-900/5 dark:to-jet-700 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-caribbean-200/20 to-indigo-200/20 dark:from-caribbean-800/10 dark:to-indigo-800/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-caribbean-200/20 dark:from-indigo-800/10 dark:to-caribbean-800/10 rounded-full blur-3xl animate-float-reverse"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="mb-8 flex justify-center">
                <div className="p-4 bg-gradient-to-r from-caribbean-500 to-indigo-600 rounded-2xl">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-caribbean-700 via-indigo-700 to-caribbean-600 dark:from-caribbean-400 dark:via-indigo-400 dark:to-caribbean-300 bg-clip-text text-transparent mb-6">
                {t('services.healthInsurance.title')}
              </h1>
              <p className="text-xl text-jet-700 dark:text-platinum-300 max-w-3xl mx-auto leading-relaxed">
                {t('services.healthInsurance.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="py-16 bg-white dark:bg-jet-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400">
                  {isArabic ? 'لماذا التأمين الصحي للأجانب؟' : 'Why Health Insurance for Foreigners?'}
                </h2>
                <p className="text-lg text-jet-600 dark:text-platinum-400 leading-relaxed mb-8">
                  {t('services.healthInsurance.fullDescription')}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
                    <Users className="w-8 h-8 text-caribbean-600 dark:text-caribbean-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      {isArabic ? 'تغطية شاملة' : 'Comprehensive Coverage'}
                    </h3>
                    <p className="text-jet-600 dark:text-platinum-400">
                      {isArabic ? 'جميع الخدمات الطبية والعلاجية' : 'All medical and treatment services'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-caribbean-50 dark:from-indigo-900/20 dark:to-caribbean-900/20 p-6 rounded-xl">
                    <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      {isArabic ? 'خدمة سريعة' : 'Fast Service'}
                    </h3>
                    <p className="text-jet-600 dark:text-platinum-400">
                      {isArabic ? 'إجراءات سريعة وبسيطة' : 'Fast and simple procedures'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-caribbean-100 to-indigo-100 dark:from-caribbean-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isArabic ? 'مميزات التأمين الصحي' : 'Health Insurance Features'}
                  </h3>
                  <div className="space-y-4">
                    {t('services.healthInsurance.features').map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 space-x-reverse">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-jet-700 dark:text-platinum-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Calculator Section */}
        <section className="py-16 bg-gradient-to-br from-caribbean-50/30 via-indigo-50/20 to-platinum-50 dark:from-caribbean-900/10 dark:via-indigo-900/5 dark:to-jet-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-caribbean-700 dark:text-caribbean-400">
                {isArabic ? 'حاسبة أسعار التأمين الصحي' : 'Health Insurance Price Calculator'}
              </h2>
              <p className="text-lg text-jet-600 dark:text-platinum-400">
                {isArabic ? 'احسب سعر التأمين الصحي حسب الفئة العمرية وشركة التأمين والمدة' : 'Calculate health insurance price based on age group, insurance company, and duration'}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean-600 mx-auto"></div>
                <p className="mt-4 text-jet-600 dark:text-platinum-400">
                  {isArabic ? 'جاري تحميل البيانات...' : 'Loading data...'}
                </p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Calculator Form */}
                <div className="bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-lg border border-platinum-300 dark:border-jet-600">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isArabic ? 'اختر الخيارات' : 'Select Options'}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Insurance Company */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                        {isArabic ? 'شركة التأمين' : 'Insurance Company'}
                      </label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      >
                        <option value="">
                          {isArabic ? 'اختر شركة التأمين' : 'Select Insurance Company'}
                        </option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {isArabic ? company.name_ar : company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Age Group */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                        {isArabic ? 'الفئة العمرية' : 'Age Group'}
                      </label>
                      <select
                        value={selectedAgeGroup}
                        onChange={(e) => setSelectedAgeGroup(e.target.value)}
                        className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      >
                        <option value="">
                          {isArabic ? 'اختر الفئة العمرية' : 'Select Age Group'}
                        </option>
                        {ageGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {isArabic ? group.name_ar : group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                        {isArabic ? 'مدة التأمين' : 'Insurance Duration'}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedDuration(12)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedDuration === 12
                              ? 'border-caribbean-500 bg-caribbean-50 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400'
                              : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-caribbean-300 dark:hover:border-caribbean-500'
                          }`}
                        >
                          <Calendar className="w-6 h-6 mx-auto mb-2" />
                          <span className="font-medium">{getDurationText(12)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDuration(24)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedDuration === 24
                              ? 'border-caribbean-500 bg-caribbean-50 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400'
                              : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-caribbean-300 dark:hover:border-caribbean-500'
                          }`}
                        >
                          <Calendar className="w-6 h-6 mx-auto mb-2" />
                          <span className="font-medium">{getDurationText(24)}</span>
                        </button>
                      </div>
                    </div>

                    {/* Calculate Button */}
                    <button
                      onClick={() => setShowRequestForm(true)}
                      disabled={!selectedCompany || !selectedAgeGroup || !calculatedPrice}
                      className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      {isArabic ? 'احسب السعر واطلب التأمين' : 'Calculate Price & Request Insurance'}
                    </button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-lg border border-platinum-300 dark:border-jet-600">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isArabic ? 'السعر المحسوب' : 'Calculated Price'}
                  </h3>
                  
                  {calculatedPrice ? (
                    <div className="text-center">
                      <div className="mb-6">
                        <DollarSign className="w-16 h-16 text-caribbean-500 mx-auto mb-4" />
                        <div className="text-4xl font-bold text-caribbean-700 dark:text-caribbean-400 mb-2">
                          {formatPrice(calculatedPrice)}
                        </div>
                        <p className="text-jet-600 dark:text-platinum-400">
                          {isArabic ? 'للمدة المحددة' : 'for the selected duration'}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                        <h4 className="font-semibold mb-4 text-green-700 dark:text-green-400">
                          {isArabic ? 'ما يشمل السعر:' : 'Price includes:'}
                        </h4>
                        <ul className="text-left space-y-2 text-jet-700 dark:text-platinum-300">
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'تغطية طبية شاملة' : 'Comprehensive medical coverage'}
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'شبكة مستشفيات واسعة' : 'Wide hospital network'}
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'خدمة عملاء 24/7' : '24/7 customer service'}
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {isArabic ? 'إجراءات سريعة' : 'Fast procedures'}
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calculator className="w-16 h-16 text-jet-400 dark:text-jet-600 mx-auto mb-4" />
                      <p className="text-jet-600 dark:text-platinum-400">
                        {isArabic ? 'اختر الخيارات لحساب السعر' : 'Select options to calculate price'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-jet-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {isArabic ? 'طلب التأمين الصحي' : 'Health Insurance Request'}
                </h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-jet-400 hover:text-jet-600 dark:text-jet-500 dark:hover:text-jet-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                    {isArabic ? 'تم إرسال الطلب بنجاح!' : 'Request submitted successfully!'}
                  </h4>
                  <p className="text-jet-600 dark:text-platinum-400">
                    {isArabic ? 'سنتواصل معك قريباً لتأكيد التفاصيل' : 'We will contact you soon to confirm the details'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-6">
                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-800 dark:text-red-200">{submitError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={requestForm.contactName}
                      onChange={(e) => setRequestForm({ ...requestForm, contactName: e.target.value })}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={requestForm.contactEmail}
                      onChange={(e) => setRequestForm({ ...requestForm, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={requestForm.contactPhone}
                      onChange={(e) => setRequestForm({ ...requestForm, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder={isArabic ? '+90 555 123 4567' : '+90 555 123 4567'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                      {isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}
                    </label>
                    <textarea
                      value={requestForm.additionalNotes}
                      onChange={(e) => setRequestForm({ ...requestForm, additionalNotes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                      placeholder={isArabic ? 'أي معلومات إضافية تريد إضافتها...' : 'Any additional information you want to add...'}
                    />
                  </div>

                  <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {isArabic ? 'تفاصيل الطلب:' : 'Request Details:'}
                    </h4>
                    <div className="space-y-1 text-sm text-jet-600 dark:text-platinum-400">
                      <p>
                        <span className="font-medium">{isArabic ? 'الشركة:' : 'Company:'}</span> {companies.find(c => c.id === selectedCompany)?.name || ''}
                      </p>
                      <p>
                        <span className="font-medium">{isArabic ? 'الفئة العمرية:' : 'Age Group:'}</span> {ageGroups.find(g => g.id === selectedAgeGroup)?.name || ''}
                      </p>
                      <p>
                        <span className="font-medium">{isArabic ? 'المدة:' : 'Duration:'}</span> {getDurationText(selectedDuration)}
                      </p>
                      <p>
                        <span className="font-medium">{isArabic ? 'السعر:' : 'Price:'}</span> {calculatedPrice ? formatPrice(calculatedPrice) : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="flex-1 px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg text-jet-700 dark:text-platinum-300 hover:bg-platinum-50 dark:hover:bg-jet-700 transition-all duration-300"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {isArabic ? 'إرسال الطلب' : 'Submit Request'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <section className="py-16 bg-white dark:bg-jet-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-caribbean-700 dark:text-caribbean-400">
                {isArabic ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
              </h2>
              <p className="text-lg text-jet-600 dark:text-platinum-400">
                {isArabic ? 'تواصل معنا للحصول على استشارة مجانية' : 'Contact us for a free consultation'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <Phone className="w-12 h-12 text-caribbean-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isArabic ? 'اتصل بنا' : 'Call Us'}
                </h3>
                <p className="text-jet-600 dark:text-platinum-400">
                  +90 555 123 4567
                </p>
              </div>
              <div className="text-center">
                <Mail className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isArabic ? 'راسلنا' : 'Email Us'}
                </h3>
                <p className="text-jet-600 dark:text-platinum-400">
                  info@tevasul.group
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HealthInsurancePage;
