import React, { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, Plus, Save, X, DollarSign, Building, Calendar, Users, FileText, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';

interface InsuranceCompany {
  id: string;
  name: string;
  name_ar: string;
  logo_url?: string;
  is_active: boolean;
}

interface AgeGroup {
  id: string;
  min_age: number;
  max_age: number;
  name: string;
  name_ar: string;
  is_active: boolean;
}

interface PricingData {
  id: string;
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
  is_active: boolean;
}

interface HealthInsuranceRequest {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  age_group_id: string;
  age_group_name: string;
  duration_months: number;
  calculated_price: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  additional_notes: string;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

const HealthInsuranceManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState<'companies' | 'requests' | 'ageGroups'>('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [requests, setRequests] = useState<HealthInsuranceRequest[]>([]);

  // Edit states
  const [editingPricing, setEditingPricing] = useState<PricingData | null>(null);
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [editingRequest, setEditingRequest] = useState<HealthInsuranceRequest | null>(null);

  // Form states
  const [newCompany, setNewCompany] = useState({ name: '', name_ar: '', logo_url: '' });
  const [newAgeGroup, setNewAgeGroup] = useState({ min_age: 0, max_age: 0, name: '', name_ar: '' });
  const [newPricing, setNewPricing] = useState({ company_id: '', age_group_id: '', duration_months: 12, price_try: 0 });
  
  // Modal states
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddAgeGroup, setShowAddAgeGroup] = useState(false);
  const [showAddPricing, setShowAddPricing] = useState(false);

  // Inline editing states
  const [inlineEditing, setInlineEditing] = useState<{id: string, field: string} | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Set first company as selected by default
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 جلب بيانات إدارة التأمين الصحي...');
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('name');

      if (companiesError) {
        console.error('خطأ في جلب الشركات:', companiesError);
        throw companiesError;
      }
      console.log('📋 الشركات المحملة:', companiesData?.length || 0);
      setCompanies(companiesData || []);

      // Load age groups
      const { data: ageGroupsData, error: ageGroupsError } = await supabase
        .from('age_groups')
        .select('*')
        .order('min_age');

      if (ageGroupsError) {
        console.error('خطأ في جلب الفئات العمرية:', ageGroupsError);
        throw ageGroupsError;
      }
      console.log('📋 الفئات العمرية المحملة:', ageGroupsData?.length || 0);
      setAgeGroups(ageGroupsData || []);

      // Load pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .from('health_insurance_pricing')
        .select(`
          *,
          insurance_companies(name, name_ar),
          age_groups(name, name_ar, min_age, max_age)
        `)
        .order('company_id');

      if (pricingError) {
        console.error('خطأ في جلب بيانات الأسعار:', pricingError);
        throw pricingError;
      }
      
      const formattedPricing = pricingData?.map((p: any) => ({
        ...p,
        company_name: p.insurance_companies?.name || '',
        company_name_ar: p.insurance_companies?.name_ar || '',
        age_group_name: p.age_groups?.name || '',
        age_group_name_ar: p.age_groups?.name_ar || '',
        min_age: p.age_groups?.min_age || 0,
        max_age: p.age_groups?.max_age || 0
      })) || [];
      
      console.log('📋 بيانات الأسعار المحملة:', formattedPricing.length);
      setPricingData(formattedPricing);

      // Load requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('health_insurance_requests')
        .select(`
          *,
          insurance_companies(name),
          age_groups(name)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('خطأ في جلب الطلبات:', requestsError);
        throw requestsError;
      }
      
      const formattedRequests = requestsData?.map((r: any) => ({
        ...r,
        company_name: r.insurance_companies?.name || '',
        age_group_name: r.age_groups?.name || ''
      })) || [];
      
      console.log('📋 الطلبات المحملة:', formattedRequests.length);
      setRequests(formattedRequests);

    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      alert(isArabic ? 'حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.' : 'Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Inline editing functions
  const startInlineEdit = (id: string, field: string, currentValue: string) => {
    setInlineEditing({ id, field });
    setInlineValue(currentValue);
  };

  const saveInlineEdit = async () => {
    if (!inlineEditing) return;

    try {
      const pricing = pricingData.find(p => p.id === inlineEditing.id);
      if (!pricing) return;

      const updatedPricing = { ...pricing };
      
      if (inlineEditing.field === 'price_try') {
        updatedPricing.price_try = parseFloat(inlineValue);
      } else if (inlineEditing.field === 'duration_months') {
        updatedPricing.duration_months = parseInt(inlineValue);
      }

      await handleUpdatePricing(updatedPricing);
      setInlineEditing(null);
      setInlineValue('');
    } catch (error) {
      console.error('Error saving inline edit:', error);
    }
  };

  const cancelInlineEdit = () => {
    setInlineEditing(null);
    setInlineValue('');
  };

  const handleUpdatePricing = async (pricing: PricingData) => {
    try {
      const { error } = await supabase
        .from('health_insurance_pricing')
        .update({
          price_try: pricing.price_try,
          duration_months: pricing.duration_months,
          is_active: pricing.is_active
        })
        .eq('id', pricing.id);

      if (error) throw error;
      
      setEditingPricing(null);
      loadData();
    } catch (error) {
      console.error('Error updating pricing:', error);
    }
  };

  const handleUpdateRequest = async (request: HealthInsuranceRequest) => {
    try {
      const { error } = await supabase
        .from('health_insurance_requests')
        .update({
          status: request.status,
          admin_notes: request.admin_notes
        })
        .eq('id', request.id);

      if (error) throw error;
      
      setEditingRequest(null);
      loadData();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  // Company management
  const handleAddCompany = async () => {
    try {
      const { error } = await supabase
        .from('insurance_companies')
        .insert(newCompany);

      if (error) throw error;
      
      setNewCompany({ name: '', name_ar: '', logo_url: '' });
      setShowAddCompany(false);
      loadData();
    } catch (error) {
      console.error('Error adding company:', error);
    }
  };

  const handleUpdateCompany = async (company: InsuranceCompany) => {
    try {
      const { error } = await supabase
        .from('insurance_companies')
        .update({ 
          name: company.name, 
          name_ar: company.name_ar, 
          logo_url: company.logo_url, 
          is_active: company.is_active 
        })
        .eq('id', company.id);

      if (error) throw error;
      
      setEditingCompany(null);
      loadData();
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  // Age group management
  const handleAddAgeGroup = async () => {
    try {
      const { error } = await supabase
        .from('age_groups')
        .insert(newAgeGroup);

      if (error) throw error;
      
      setNewAgeGroup({ min_age: 0, max_age: 0, name: '', name_ar: '' });
      setShowAddAgeGroup(false);
      loadData();
    } catch (error) {
      console.error('Error adding age group:', error);
    }
  };

  const handleUpdateAgeGroup = async (ageGroup: AgeGroup) => {
    try {
      const { error } = await supabase
        .from('age_groups')
        .update({ 
          min_age: ageGroup.min_age, 
          max_age: ageGroup.max_age, 
          name: ageGroup.name, 
          name_ar: ageGroup.name_ar, 
          is_active: ageGroup.is_active 
        })
        .eq('id', ageGroup.id);

      if (error) throw error;
      
      setEditingAgeGroup(null);
      loadData();
    } catch (error) {
      console.error('Error updating age group:', error);
    }
  };

  // Pricing management
  const handleAddPricing = async () => {
    try {
      const { error } = await supabase
        .from('health_insurance_pricing')
        .insert({
          company_id: newPricing.company_id,
          age_group_id: newPricing.age_group_id,
          duration_months: newPricing.duration_months,
          price_try: newPricing.price_try
        });

      if (error) throw error;
      
      setNewPricing({ company_id: '', age_group_id: '', duration_months: 12, price_try: 0 });
      setShowAddPricing(false);
      loadData();
    } catch (error) {
      console.error('Error adding pricing:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get pricing data for selected company
  const getCompanyPricingData = () => {
    if (!selectedCompany) return [];
    return pricingData.filter(p => p.company_id === selectedCompany);
  };

  // Group pricing data by age group
  const getGroupedPricingData = () => {
    const companyData = getCompanyPricingData();
    const grouped = new Map();

    companyData.forEach(pricing => {
      const ageGroupKey = pricing.age_group_id;
      if (!grouped.has(ageGroupKey)) {
        grouped.set(ageGroupKey, {
          ageGroupId: ageGroupKey,
          ageGroupName: pricing.age_group_name,
          ageGroupNameAr: pricing.age_group_name_ar,
          minAge: pricing.min_age,
          maxAge: pricing.max_age,
          pricing1Year: null,
          pricing2Years: null
        });
      }

      const group = grouped.get(ageGroupKey);
      if (pricing.duration_months === 12) {
        group.pricing1Year = pricing;
      } else if (pricing.duration_months === 24) {
        group.pricing2Years = pricing;
      }
    });

    // Convert to array and sort by min age
    return Array.from(grouped.values()).sort((a, b) => a.minAge - b.minAge);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-caribbean-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Shield className="w-8 h-8 text-caribbean-600 dark:text-caribbean-400" />
        <h2 className="text-2xl font-bold text-jet-900 dark:text-white">
          {isArabic ? 'إدارة التأمين الصحي' : 'Health Insurance Management'}
        </h2>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {isArabic ? 'معلومات التصحيح:' : 'Debug Information:'}
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>{isArabic ? 'عدد الشركات:' : 'Companies:'} {companies.length}</p>
            <p>{isArabic ? 'عدد الفئات العمرية:' : 'Age Groups:'} {ageGroups.length}</p>
            <p>{isArabic ? 'عدد بيانات الأسعار:' : 'Pricing Records:'} {pricingData.length}</p>
            <p>{isArabic ? 'عدد الطلبات:' : 'Requests:'} {requests.length}</p>
            <p>{isArabic ? 'حالة التحميل:' : 'Loading:'} {loading ? 'جاري التحميل' : 'مكتمل'}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 mb-8 overflow-hidden relative z-10">
        <div className="flex border-b border-sky-200 dark:border-jet-700 overflow-x-auto bg-gradient-to-r from-sky-50/20 via-transparent to-blue-50/20 dark:from-sky-900/10 dark:via-transparent dark:to-blue-900/10 px-2">
          {[
            { id: 'companies', label: isArabic ? 'الشركات' : 'Companies', icon: Building },
            { id: 'requests', label: isArabic ? 'الطلبات' : 'Requests', icon: Users },
            { id: 'ageGroups', label: isArabic ? 'الفئات العمرية' : 'Age Groups', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 md:px-6 py-3 md:py-4 font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                  : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
              }`}
            >
              <div className="flex items-center">
                <tab.icon className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                <span className="text-sm md:text-base">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Companies Tab - Enhanced with Company Tabs */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-jet-800 dark:text-white">
              {isArabic ? 'إدارة أسعار التأمين الصحي' : 'Health Insurance Pricing Management'}
            </h3>
            <button
              onClick={() => setShowAddCompany(true)}
              className="bg-gradient-to-r from-caribbean-600 to-sky-600 text-white px-4 py-2 rounded-lg hover:from-caribbean-700 hover:to-sky-700 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة شركة' : 'Add Company'}</span>
            </button>
          </div>

          {/* Company Selection Tabs */}
          <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 overflow-hidden relative z-10">
            <div className="border-b border-sky-200 dark:border-jet-700 bg-gradient-to-r from-sky-50/20 via-transparent to-blue-50/20 dark:from-sky-900/10 dark:via-transparent dark:to-blue-900/10">
              <div className="flex overflow-x-auto px-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company.id)}
                    className={`flex-shrink-0 px-4 md:px-6 py-3 md:py-4 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      selectedCompany === company.id
                        ? 'border-caribbean-500 text-caribbean-600 dark:text-caribbean-400 bg-gradient-to-r from-caribbean-50/50 to-sky-50/50 dark:from-caribbean-900/20 dark:to-sky-900/20'
                        : 'border-transparent text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-blue-50/30 dark:hover:from-sky-900/10 dark:hover:to-blue-900/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Building className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-sm md:text-base">{isArabic ? company.name_ar : company.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        company.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {company.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Company Pricing Table */}
            {selectedCompany ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-jet-900 dark:text-white">
                      {isArabic ? companies.find(c => c.id === selectedCompany)?.name_ar : companies.find(c => c.id === selectedCompany)?.name}
                    </h4>
                    <p className="text-sm text-jet-500 dark:text-jet-400">
                      {isArabic ? 'إدارة الأسعار والفئات العمرية' : 'Manage pricing and age groups'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPricing(true)}
                    className="bg-gradient-to-r from-caribbean-600 to-sky-600 text-white px-4 py-2 rounded-lg hover:from-caribbean-700 hover:to-sky-700 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isArabic ? 'إضافة سعر' : 'Add Price'}</span>
                  </button>
                </div>

                {/* Enhanced Pricing Table with Grouped Age Groups */}
                <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 overflow-hidden relative z-10">
                  <div className="overflow-x-auto px-2">
                    <table className="min-w-full divide-y divide-sky-200 dark:divide-jet-600 relative z-10">
                      <thead className="bg-gradient-to-r from-sky-50/50 via-caribbean-50/30 to-blue-50/50 dark:from-sky-900/20 dark:via-jet-700 dark:to-blue-900/20">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                            {isArabic ? 'الفئة العمرية' : 'Age Group'}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                            {isArabic ? 'سنة واحدة' : '1 Year'}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                            {isArabic ? 'سنتان' : '2 Years'}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                            {isArabic ? 'الإجراءات' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-jet-800 divide-y divide-platinum-100 dark:divide-jet-600">
                        {getGroupedPricingData().length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center space-y-3 space-y-reverse">
                                <div className="w-16 h-16 bg-sky-100 dark:bg-jet-700 rounded-full flex items-center justify-center">
                                  <DollarSign className="w-8 h-8 text-sky-400 dark:text-jet-500" />
                                </div>
                                <div>
                                  <p className="text-lg font-medium text-jet-700 dark:text-white">
                                    {isArabic ? 'لا توجد أسعار محددة' : 'No pricing data'}
                                  </p>
                                  <p className="text-sm text-jet-600 dark:text-platinum-300">
                                    {isArabic ? 'اضغط على "إضافة سعر" لبدء إضافة الأسعار' : 'Click "Add Price" to start adding pricing'}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          getGroupedPricingData().map((group, index) => (
                            <tr key={group.ageGroupId} className={`hover:bg-sky-50 dark:hover:bg-jet-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-jet-800' : 'bg-sky-25 dark:bg-jet-750'}`}>
                              {/* Age Group Column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900 rounded-lg flex items-center justify-center mr-3">
                                    <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-jet-900 dark:text-white">
                                      {isArabic ? group.ageGroupNameAr : group.ageGroupName}
                                    </span>
                                    <div className="text-xs text-jet-500 dark:text-jet-400">
                                      {group.minAge} - {group.maxAge} {isArabic ? 'سنة' : 'years'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 1 Year Pricing Column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {group.pricing1Year ? (
                                  <div className="space-y-2">
                                    {/* Price */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                                        <span className="text-sm font-semibold text-jet-900 dark:text-white">
                                          {formatPrice(group.pricing1Year.price_try)}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => startInlineEdit(group.pricing1Year.id, 'price_try', group.pricing1Year.price_try.toString())}
                                        className="text-caribbean-600 hover:text-caribbean-900 p-1 rounded hover:bg-caribbean-50"
                                        title={isArabic ? 'تعديل السعر' : 'Edit Price'}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    </div>
                                    
                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${group.pricing1Year.is_active ? 'text-green-800 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : 'text-red-800 bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>
                                        {group.pricing1Year.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                                      </span>
                                      <button
                                        onClick={() => handleUpdatePricing({ ...group.pricing1Year, is_active: !group.pricing1Year.is_active })}
                                        className={`p-1 rounded transition-colors duration-200 ${
                                          group.pricing1Year.is_active 
                                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                        }`}
                                        title={group.pricing1Year.is_active ? (isArabic ? 'إلغاء التفعيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                                      >
                                        {group.pricing1Year.is_active ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-jet-400 dark:text-jet-500">
                                      {isArabic ? 'غير محدد' : 'Not set'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* 2 Years Pricing Column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {group.pricing2Years ? (
                                  <div className="space-y-2">
                                    {/* Price */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                                        <span className="text-sm font-semibold text-jet-900 dark:text-white">
                                          {formatPrice(group.pricing2Years.price_try)}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => startInlineEdit(group.pricing2Years.id, 'price_try', group.pricing2Years.price_try.toString())}
                                        className="text-caribbean-600 hover:text-caribbean-900 p-1 rounded hover:bg-caribbean-50"
                                        title={isArabic ? 'تعديل السعر' : 'Edit Price'}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    </div>
                                    
                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${group.pricing2Years.is_active ? 'text-green-800 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : 'text-red-800 bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>
                                        {group.pricing2Years.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                                      </span>
                                      <button
                                        onClick={() => handleUpdatePricing({ ...group.pricing2Years, is_active: !group.pricing2Years.is_active })}
                                        className={`p-1 rounded transition-colors duration-200 ${
                                          group.pricing2Years.is_active 
                                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                        }`}
                                        title={group.pricing2Years.is_active ? (isArabic ? 'إلغاء التفعيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                                      >
                                        {group.pricing2Years.is_active ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-jet-400 dark:text-jet-500">
                                      {isArabic ? 'غير محدد' : 'Not set'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Actions Column */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => setShowAddPricing(true)}
                                    className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300 p-2 rounded-lg hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200"
                                    title={isArabic ? 'إضافة سعر' : 'Add Price'}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPricing(group.pricing1Year || group.pricing2Years)}
                                    className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300 p-2 rounded-lg hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200"
                                    title={isArabic ? 'تعديل' : 'Edit'}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4 space-y-reverse">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-caribbean-100 dark:from-sky-900 dark:to-caribbean-900 rounded-full flex items-center justify-center">
                    <Building className="w-10 h-10 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-jet-800 dark:text-white">
                      {isArabic ? 'اختر شركة تأمين' : 'Select an insurance company'}
                    </p>
                    <p className="text-sm text-jet-600 dark:text-platinum-300 mt-2">
                      {isArabic ? 'اختر شركة من القائمة أعلاه لإدارة أسعارها' : 'Select a company from the list above to manage its pricing'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-jet-900 dark:text-white">
            {isArabic ? 'طلبات التأمين الصحي' : 'Health Insurance Requests'}
          </h3>

          <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 overflow-hidden relative z-10">
            <div className="overflow-x-auto px-2">
              <table className="min-w-full divide-y divide-sky-200 dark:divide-jet-600 relative z-10">
                <thead className="bg-gradient-to-r from-sky-50/50 via-caribbean-50/30 to-blue-50/50 dark:from-sky-900/20 dark:via-jet-700 dark:to-blue-900/20">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                      {isArabic ? 'العميل' : 'Client'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                      {isArabic ? 'الشركة' : 'Company'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                      {isArabic ? 'السعر' : 'Price'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                      {isArabic ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                      {isArabic ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-jet-700 dark:text-white tracking-wider">
                      {isArabic ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-jet-800 divide-y divide-platinum-100 dark:divide-jet-600">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3 space-y-reverse">
                          <div className="w-16 h-16 bg-platinum-100 dark:bg-jet-700 rounded-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-platinum-400 dark:text-jet-500" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-jet-600 dark:text-jet-300">
                              {isArabic ? 'لا توجد طلبات بعد' : 'No requests yet'}
                            </p>
                            <p className="text-sm text-jet-500 dark:text-jet-400">
                              {isArabic ? 'ستظهر طلبات التأمين الصحي هنا' : 'Health insurance requests will appear here'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((request, index) => (
                      <tr key={request.id} className={`hover:bg-sky-50 dark:hover:bg-jet-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-jet-800' : 'bg-sky-25 dark:bg-jet-750'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-semibold text-jet-900 dark:text-white">{request.contact_name}</div>
                            <div className="text-jet-600 dark:text-platinum-300">{request.contact_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-caribbean-100 dark:bg-caribbean-900 rounded-lg flex items-center justify-center mr-3">
                              <Building className="w-4 h-4 text-caribbean-600 dark:text-caribbean-400" />
                            </div>
                            <span className="text-sm font-medium text-jet-900 dark:text-white">{request.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-sm font-semibold text-jet-900 dark:text-white">{formatPrice(request.calculated_price)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-500 dark:text-jet-400">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setEditingRequest(request)}
                            className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300 p-2 rounded-lg hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* Age Groups Tab */}
      {activeTab === 'ageGroups' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-jet-900 dark:text-white">
              {isArabic ? 'الفئات العمرية' : 'Age Groups'}
            </h3>
            <button
              onClick={() => setShowAddAgeGroup(true)}
              className="bg-gradient-to-r from-caribbean-600 to-sky-600 text-white px-4 py-2 rounded-lg hover:from-caribbean-700 hover:to-sky-700 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة فئة عمرية' : 'Add Age Group'}</span>
            </button>
          </div>

          <div className="grid gap-4 px-2">
            {ageGroups.length === 0 ? (
                              <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-12 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 text-center relative z-10">
                <div className="flex flex-col items-center space-y-4 space-y-reverse">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-caribbean-100 dark:from-sky-900 dark:to-caribbean-900 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-jet-800 dark:text-white">
                      {isArabic ? 'لا توجد فئات عمرية' : 'No age groups'}
                    </p>
                    <p className="text-sm text-jet-600 dark:text-platinum-300 mt-2">
                      {isArabic ? 'سيتم تحميل الفئات العمرية قريباً' : 'Age groups will be loaded soon'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              ageGroups.map((ageGroup) => (
                <div key={ageGroup.id} className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-6 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 hover:shadow-xl transition-all duration-300 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-caribbean-100 dark:from-sky-900 dark:to-caribbean-900 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-jet-900 dark:text-white">{ageGroup.name}</h4>
                        <p className="text-sm text-jet-500 dark:text-jet-400">{ageGroup.name_ar}</p>
                        <div className="flex items-center mt-2 space-x-2 space-x-reverse">
                          <Calendar className="w-4 h-4 text-caribbean-500" />
                          <p className="text-sm font-medium text-jet-700 dark:text-jet-300">
                            {ageGroup.min_age} - {ageGroup.max_age} {isArabic ? 'سنة' : 'years'}
                          </p>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-2 ${ageGroup.is_active ? 'text-green-800 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : 'text-red-800 bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>
                          {ageGroup.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingAgeGroup(ageGroup)}
                      className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300 p-2 rounded-lg hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {editingPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'تعديل السعر' : 'Edit Price'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'السعر' : 'Price'}
                </label>
                <input
                  type="number"
                  value={editingPricing.price_try}
                  onChange={(e) => setEditingPricing({ ...editingPricing, price_try: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPricing.is_active}
                  onChange={(e) => setEditingPricing({ ...editingPricing, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">
                  {isArabic ? 'نشط' : 'Active'}
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setEditingPricing(null)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleUpdatePricing(editingPricing)}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'تعديل الطلب' : 'Edit Request'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={editingRequest.status}
                  onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                >
                  <option value="pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
                  <option value="approved">{isArabic ? 'موافق عليه' : 'Approved'}</option>
                  <option value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</option>
                  <option value="completed">{isArabic ? 'مكتمل' : 'Completed'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'ملاحظات الإدارة' : 'Admin Notes'}
                </label>
                <textarea
                  value={editingRequest.admin_notes || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, admin_notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleUpdateRequest(editingRequest)}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'إضافة شركة تأمين' : 'Add Insurance Company'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}
                </label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={newCompany.name_ar}
                  onChange={(e) => setNewCompany({ ...newCompany, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'رابط الشعار' : 'Logo URL'}
                </label>
                <input
                  type="text"
                  value={newCompany.logo_url}
                  onChange={(e) => setNewCompany({ ...newCompany, logo_url: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setShowAddCompany(false)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddCompany}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Age Group Modal */}
      {showAddAgeGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'إضافة فئة عمرية' : 'Add Age Group'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'الحد الأدنى للعمر' : 'Minimum Age'}
                </label>
                <input
                  type="number"
                  value={newAgeGroup.min_age}
                  onChange={(e) => setNewAgeGroup({ ...newAgeGroup, min_age: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'الحد الأقصى للعمر' : 'Maximum Age'}
                </label>
                <input
                  type="number"
                  value={newAgeGroup.max_age}
                  onChange={(e) => setNewAgeGroup({ ...newAgeGroup, max_age: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الفئة (إنجليزي)' : 'Group Name (English)'}
                </label>
                <input
                  type="text"
                  value={newAgeGroup.name}
                  onChange={(e) => setNewAgeGroup({ ...newAgeGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الفئة (عربي)' : 'Group Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={newAgeGroup.name_ar}
                  onChange={(e) => setNewAgeGroup({ ...newAgeGroup, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setShowAddAgeGroup(false)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddAgeGroup}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pricing Modal */}
      {showAddPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'إضافة سعر تأمين' : 'Add Insurance Price'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'شركة التأمين' : 'Insurance Company'}
                </label>
                <select
                  value={newPricing.company_id}
                  onChange={(e) => setNewPricing({ ...newPricing, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                >
                  <option value="">{isArabic ? 'اختر الشركة' : 'Select Company'}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {isArabic ? company.name_ar : company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'الفئة العمرية' : 'Age Group'}
                </label>
                <select
                  value={newPricing.age_group_id}
                  onChange={(e) => setNewPricing({ ...newPricing, age_group_id: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                >
                  <option value="">{isArabic ? 'اختر الفئة العمرية' : 'Select Age Group'}</option>
                  {ageGroups.map((ageGroup) => (
                    <option key={ageGroup.id} value={ageGroup.id}>
                      {isArabic ? ageGroup.name_ar : ageGroup.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'المدة' : 'Duration'}
                </label>
                <select
                  value={newPricing.duration_months}
                  onChange={(e) => setNewPricing({ ...newPricing, duration_months: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                >
                  <option value={12}>{isArabic ? 'سنة واحدة' : '1 Year'}</option>
                  <option value={24}>{isArabic ? 'سنتان' : '2 Years'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'السعر (ليرة تركية)' : 'Price (TRY)'}
                </label>
                <input
                  type="number"
                  value={newPricing.price_try}
                  onChange={(e) => setNewPricing({ ...newPricing, price_try: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setShowAddPricing(false)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddPricing}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'تعديل شركة التأمين' : 'Edit Insurance Company'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}
                </label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={editingCompany.name_ar}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'رابط الشعار' : 'Logo URL'}
                </label>
                <input
                  type="text"
                  value={editingCompany.logo_url || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, logo_url: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingCompany.is_active}
                  onChange={(e) => setEditingCompany({ ...editingCompany, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">
                  {isArabic ? 'نشط' : 'Active'}
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleUpdateCompany(editingCompany)}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Age Group Modal */}
      {editingAgeGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'تعديل الفئة العمرية' : 'Edit Age Group'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'الحد الأدنى للعمر' : 'Minimum Age'}
                </label>
                <input
                  type="number"
                  value={editingAgeGroup.min_age}
                  onChange={(e) => setEditingAgeGroup({ ...editingAgeGroup, min_age: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'الحد الأقصى للعمر' : 'Maximum Age'}
                </label>
                <input
                  type="number"
                  value={editingAgeGroup.max_age}
                  onChange={(e) => setEditingAgeGroup({ ...editingAgeGroup, max_age: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الفئة (إنجليزي)' : 'Group Name (English)'}
                </label>
                <input
                  type="text"
                  value={editingAgeGroup.name}
                  onChange={(e) => setEditingAgeGroup({ ...editingAgeGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'اسم الفئة (عربي)' : 'Group Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={editingAgeGroup.name_ar}
                  onChange={(e) => setEditingAgeGroup({ ...editingAgeGroup, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingAgeGroup.is_active}
                  onChange={(e) => setEditingAgeGroup({ ...editingAgeGroup, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">
                  {isArabic ? 'نشط' : 'Active'}
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                onClick={() => setEditingAgeGroup(null)}
                className="px-4 py-2 text-jet-600 dark:text-jet-400 hover:bg-platinum-100 dark:hover:bg-jet-700 rounded-lg"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleUpdateAgeGroup(editingAgeGroup)}
                className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700"
              >
                {isArabic ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthInsuranceManagement;
