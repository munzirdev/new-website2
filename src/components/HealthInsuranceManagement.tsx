import React, { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, Plus, Save, X, DollarSign, Building, Calendar, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'pricing' | 'requests' | 'companies' | 'ageGroups'>('pricing');
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

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load age groups
      const { data: ageGroupsData, error: ageGroupsError } = await supabase
        .from('age_groups')
        .select('*')
        .order('min_age');

      if (ageGroupsError) throw ageGroupsError;
      setAgeGroups(ageGroupsData || []);

      // Load pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .rpc('get_health_insurance_pricing');

      if (pricingError) throw pricingError;
      setPricingData(pricingData || []);

      // Load requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('health_insurance_requests')
        .select(`
          *,
          insurance_companies(name, name_ar),
          age_groups(name, name_ar)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pricing management
  const handleUpdatePricing = async (pricing: PricingData) => {
    try {
      const { error } = await supabase
        .from('health_insurance_pricing')
        .update({ price_try: pricing.price_try, is_active: pricing.is_active })
        .eq('id', pricing.id);

      if (error) throw error;
      
      setEditingPricing(null);
      loadData();
    } catch (error) {
      console.error('Error updating pricing:', error);
    }
  };

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
      loadData();
    } catch (error) {
      console.error('Error adding pricing:', error);
    }
  };

  // Company management
  const handleUpdateCompany = async (company: InsuranceCompany) => {
    try {
      const { error } = await supabase
        .from('insurance_companies')
        .update({ name: company.name, name_ar: company.name_ar, logo_url: company.logo_url, is_active: company.is_active })
        .eq('id', company.id);

      if (error) throw error;
      
      setEditingCompany(null);
      loadData();
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleAddCompany = async () => {
    try {
      const { error } = await supabase
        .from('insurance_companies')
        .insert(newCompany);

      if (error) throw error;
      
      setNewCompany({ name: '', name_ar: '', logo_url: '' });
      loadData();
    } catch (error) {
      console.error('Error adding company:', error);
    }
  };

  // Age group management
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

  const handleAddAgeGroup = async () => {
    try {
      const { error } = await supabase
        .from('age_groups')
        .insert(newAgeGroup);

      if (error) throw error;
      
      setNewAgeGroup({ min_age: 0, max_age: 0, name: '', name_ar: '' });
      loadData();
    } catch (error) {
      console.error('Error adding age group:', error);
    }
  };

  // Request management
  const handleUpdateRequest = async (request: HealthInsuranceRequest) => {
    try {
      const { error } = await supabase
        .from('health_insurance_requests')
        .update({ status: request.status, admin_notes: request.admin_notes })
        .eq('id', request.id);

      if (error) throw error;
      
      setEditingRequest(null);
      loadData();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-caribbean-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Shield className="w-8 h-8 text-caribbean-600" />
        <h2 className="text-2xl font-bold">
          {isArabic ? 'إدارة التأمين الصحي' : 'Health Insurance Management'}
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-platinum-300 dark:border-jet-600">
        <nav className="flex space-x-8 space-x-reverse">
          {[
            { id: 'pricing', label: isArabic ? 'الأسعار' : 'Pricing', icon: DollarSign },
            { id: 'requests', label: isArabic ? 'الطلبات' : 'Requests', icon: Users },
            { id: 'companies', label: isArabic ? 'الشركات' : 'Companies', icon: Building },
            { id: 'ageGroups', label: isArabic ? 'الفئات العمرية' : 'Age Groups', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 space-x-reverse py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-caribbean-500 text-caribbean-600 dark:text-caribbean-400'
                  : 'border-transparent text-jet-500 dark:text-jet-400 hover:text-jet-700 dark:hover:text-jet-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {isArabic ? 'أسعار التأمين الصحي' : 'Health Insurance Pricing'}
            </h3>
            <button
              onClick={() => setNewPricing({ company_id: '', age_group_id: '', duration_months: 12, price_try: 0 })}
              className="bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-colors duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة سعر' : 'Add Price'}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-jet-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-platinum-300 dark:divide-jet-600">
                <thead className="bg-platinum-50 dark:bg-jet-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الشركة' : 'Company'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الفئة العمرية' : 'Age Group'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'المدة' : 'Duration'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'السعر' : 'Price'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-jet-800 divide-y divide-platinum-300 dark:divide-jet-600">
                  {pricingData.map((pricing) => (
                    <tr key={pricing.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-900 dark:text-white">
                        {isArabic ? pricing.company_name_ar : pricing.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-900 dark:text-white">
                        {isArabic ? pricing.age_group_name_ar : pricing.age_group_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-900 dark:text-white">
                        {pricing.duration_months === 12 ? (isArabic ? 'سنة واحدة' : '1 Year') : (isArabic ? 'سنتان' : '2 Years')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-900 dark:text-white">
                        {formatPrice(pricing.price_try)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${pricing.is_active ? 'text-green-800 bg-green-100 dark:bg-green-900/20' : 'text-red-800 bg-red-100 dark:bg-red-900/20'}`}>
                          {pricing.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setEditingPricing(pricing)}
                          className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">
            {isArabic ? 'طلبات التأمين الصحي' : 'Health Insurance Requests'}
          </h3>

          <div className="bg-white dark:bg-jet-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-platinum-300 dark:divide-jet-600">
                <thead className="bg-platinum-50 dark:bg-jet-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'العميل' : 'Client'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الشركة' : 'Company'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'السعر' : 'Price'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 dark:text-jet-400 uppercase tracking-wider">
                      {isArabic ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-jet-800 divide-y divide-platinum-300 dark:divide-jet-600">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-jet-900 dark:text-white">
                          <div className="font-medium">{request.contact_name}</div>
                          <div className="text-jet-500 dark:text-jet-400">{request.contact_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-900 dark:text-white">
                        {request.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-900 dark:text-white">
                        {formatPrice(request.calculated_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-500 dark:text-jet-400">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setEditingRequest(request)}
                          className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {isArabic ? 'شركات التأمين' : 'Insurance Companies'}
            </h3>
            <button
              onClick={() => setNewCompany({ name: '', name_ar: '', logo_url: '' })}
              className="bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-colors duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة شركة' : 'Add Company'}</span>
            </button>
          </div>

          <div className="grid gap-4">
            {companies.map((company) => (
              <div key={company.id} className="bg-white dark:bg-jet-800 p-4 rounded-lg shadow border border-platinum-300 dark:border-jet-600">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-jet-900 dark:text-white">{company.name}</h4>
                    <p className="text-sm text-jet-500 dark:text-jet-400">{company.name_ar}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${company.is_active ? 'text-green-800 bg-green-100 dark:bg-green-900/20' : 'text-red-800 bg-red-100 dark:bg-red-900/20'}`}>
                      {company.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingCompany(company)}
                    className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age Groups Tab */}
      {activeTab === 'ageGroups' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {isArabic ? 'الفئات العمرية' : 'Age Groups'}
            </h3>
            <button
              onClick={() => setNewAgeGroup({ min_age: 0, max_age: 0, name: '', name_ar: '' })}
              className="bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-colors duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة فئة عمرية' : 'Add Age Group'}</span>
            </button>
          </div>

          <div className="grid gap-4">
            {ageGroups.map((ageGroup) => (
              <div key={ageGroup.id} className="bg-white dark:bg-jet-800 p-4 rounded-lg shadow border border-platinum-300 dark:border-jet-600">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-jet-900 dark:text-white">{ageGroup.name}</h4>
                    <p className="text-sm text-jet-500 dark:text-jet-400">{ageGroup.name_ar}</p>
                    <p className="text-sm text-jet-500 dark:text-jet-400">
                      {ageGroup.min_age} - {ageGroup.max_age} {isArabic ? 'سنة' : 'years'}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${ageGroup.is_active ? 'text-green-800 bg-green-100 dark:bg-green-900/20' : 'text-red-800 bg-red-100 dark:bg-red-900/20'}`}>
                      {ageGroup.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingAgeGroup(ageGroup)}
                    className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default HealthInsuranceManagement;
