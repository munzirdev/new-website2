import React, { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, Plus, Save, X, DollarSign, Building, Calendar, Users, FileText, Check, AlertCircle, MessageCircle, Phone, Mail, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import ConfirmDeleteModal from './ConfirmDeleteModal';

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
  age_group_id: string;
  duration_months: number;
  calculated_price: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  additional_notes: string;
  passport_image_url?: string;
  insurance_offer_confirmed: boolean;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  age_group_name: string;
  customer_age?: number;
  birth_date?: string;
  submission_date?: string;
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedRequestForContact, setSelectedRequestForContact] = useState<HealthInsuranceRequest | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp' | 'phone'>('email');
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string, type: 'request' | 'company' | 'ageGroup' | 'pricing'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success message states
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // File preview modal
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{url: string, name: string, type: string} | null>(null);

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
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('name');

      if (companiesError) {
        console.error('خطأ في جلب الشركات:', companiesError);
        throw companiesError;
      }
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
          admin_notes: request.admin_notes,
          customer_age: request.customer_age,
          birth_date: request.birth_date
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

  // Add delete functions
  const handleDeleteCompany = (company: InsuranceCompany) => {
    setDeleteTarget({
      id: company.id,
      name: isArabic ? company.name_ar : company.name,
      type: 'company'
    });
    setShowDeleteModal(true);
  };

  const performDeleteCompany = async (companyId: string) => {
    try {
      setIsDeleting(true);
      
      // First check if there are any pricing records for this company
      const { data: pricingRecords, error: pricingError } = await supabase
        .from('health_insurance_pricing')
        .select('id')
        .eq('company_id', companyId);

      if (pricingError) throw pricingError;

      if (pricingRecords && pricingRecords.length > 0) {
        alert(isArabic ? 'لا يمكن حذف الشركة لأنها تحتوي على أسعار. يرجى حذف الأسعار أولاً.' : 'Cannot delete company because it has pricing records. Please delete the pricing records first.');
        return;
      }

      // Check if there are any requests for this company
      const { data: requests, error: requestsError } = await supabase
        .from('health_insurance_requests')
        .select('id')
        .eq('company_id', companyId);

      if (requestsError) throw requestsError;

      if (requests && requests.length > 0) {
        alert(isArabic ? 'لا يمكن حذف الشركة لأنها تحتوي على طلبات. يرجى معالجة الطلبات أولاً.' : 'Cannot delete company because it has requests. Please handle the requests first.');
        return;
      }

      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      
      loadData();
      alert(isArabic ? 'تم حذف الشركة بنجاح' : 'Company deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(isArabic ? 'حدث خطأ في حذف الشركة' : 'Error deleting company');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
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

  const handleDeleteAgeGroup = (ageGroup: AgeGroup) => {
    setDeleteTarget({
      id: ageGroup.id,
      name: isArabic ? ageGroup.name_ar : ageGroup.name,
      type: 'ageGroup'
    });
    setShowDeleteModal(true);
  };

  const performDeleteAgeGroup = async (ageGroupId: string) => {
    try {
      setIsDeleting(true);
      
      // First check if there are any pricing records for this age group
      const { data: pricingRecords, error: pricingError } = await supabase
        .from('health_insurance_pricing')
        .select('id')
        .eq('age_group_id', ageGroupId);

      if (pricingError) throw pricingError;

      if (pricingRecords && pricingRecords.length > 0) {
        alert(isArabic ? 'لا يمكن حذف الفئة العمرية لأنها تحتوي على أسعار. يرجى حذف الأسعار أولاً.' : 'Cannot delete age group because it has pricing records. Please delete the pricing records first.');
        return;
      }

      // Check if there are any requests for this age group
      const { data: requests, error: requestsError } = await supabase
        .from('health_insurance_requests')
        .select('id')
        .eq('age_group_id', ageGroupId);

      if (requestsError) throw requestsError;

      if (requests && requests.length > 0) {
        alert(isArabic ? 'لا يمكن حذف الفئة العمرية لأنها تحتوي على طلبات. يرجى معالجة الطلبات أولاً.' : 'Cannot delete age group because it has requests. Please handle the requests first.');
        return;
      }

      const { error } = await supabase
        .from('age_groups')
        .delete()
        .eq('id', ageGroupId);

      if (error) throw error;
      
      loadData();
      alert(isArabic ? 'تم حذف الفئة العمرية بنجاح' : 'Age group deleted successfully');
    } catch (error) {
      console.error('Error deleting age group:', error);
      alert(isArabic ? 'حدث خطأ في حذف الفئة العمرية' : 'Error deleting age group');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
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



  const handleDeletePricing = (pricing: PricingData) => {
    setDeleteTarget({
      id: pricing.id,
      name: `${formatPrice(pricing.price_try)} - ${isArabic ? pricing.age_group_name_ar : pricing.age_group_name}`,
      type: 'pricing'
    });
    setShowDeleteModal(true);
  };

  const performDeletePricing = async (pricingId: string) => {
    try {
      setIsDeleting(true);
      
      // Check if there are any requests using this pricing
      const { data: requests, error: requestsError } = await supabase
        .from('health_insurance_requests')
        .select('id')
        .eq('pricing_id', pricingId);

      if (requestsError) throw requestsError;

      if (requests && requests.length > 0) {
        alert(isArabic ? 'لا يمكن حذف السعر لأنه مستخدم في طلبات. يرجى معالجة الطلبات أولاً.' : 'Cannot delete pricing because it is used in requests. Please handle the requests first.');
        return;
      }

      const { error } = await supabase
        .from('health_insurance_pricing')
        .delete()
        .eq('id', pricingId);

      if (error) throw error;
      
      loadData();
      alert(isArabic ? 'تم حذف السعر بنجاح' : 'Pricing deleted successfully');
    } catch (error) {
      console.error('Error deleting pricing:', error);
      alert(isArabic ? 'حدث خطأ في حذف السعر' : 'Error deleting pricing');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Delete health insurance request
  const handleDeleteRequest = (request: HealthInsuranceRequest) => {
    setDeleteTarget({
      id: request.id,
      name: request.contact_name,
      type: 'request'
    });
    setShowDeleteModal(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage('');
    }, 3000);
  };

  const performDeleteRequest = async (requestId: string) => {
    try {
      setIsDeleting(true);
      
      const { data, error } = await supabase
        .from('health_insurance_requests')
        .delete()
        .eq('id', requestId)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
        showSuccess(isArabic ? 'تم حذف الطلب بنجاح' : 'Request deleted successfully');
      } else {
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
        showSuccess(isArabic ? 'تم حذف الطلب بنجاح' : 'Request deleted successfully');
      }
      
    } catch (error) {
      alert(isArabic ? 'حدث خطأ في حذف الطلب' : 'Error deleting request');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // General delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'request':
        await performDeleteRequest(deleteTarget.id);
        break;
      case 'company':
        await performDeleteCompany(deleteTarget.id);
        break;
      case 'ageGroup':
        await performDeleteAgeGroup(deleteTarget.id);
        break;
      case 'pricing':
        await performDeletePricing(deleteTarget.id);
        break;
    }
  };

  const getDeleteModalTitle = () => {
    if (!deleteTarget) return '';
    
    switch (deleteTarget.type) {
      case 'request':
        return isArabic ? 'حذف طلب التأمين الصحي' : 'Delete Health Insurance Request';
      case 'company':
        return isArabic ? 'حذف شركة التأمين' : 'Delete Insurance Company';
      case 'ageGroup':
        return isArabic ? 'حذف الفئة العمرية' : 'Delete Age Group';
      case 'pricing':
        return isArabic ? 'حذف السعر' : 'Delete Pricing';
      default:
        return isArabic ? 'حذف العنصر' : 'Delete Item';
    }
  };

  const getDeleteModalMessage = () => {
    if (!deleteTarget) return '';
    
    switch (deleteTarget.type) {
      case 'request':
        return isArabic ? 'هل أنت متأكد من حذف طلب التأمين الصحي الخاص بـ' : 'Are you sure you want to delete the health insurance request for';
      case 'company':
        return isArabic ? 'هل أنت متأكد من حذف شركة التأمين' : 'Are you sure you want to delete the insurance company';
      case 'ageGroup':
        return isArabic ? 'هل أنت متأكد من حذف الفئة العمرية' : 'Are you sure you want to delete the age group';
      case 'pricing':
        return isArabic ? 'هل أنت متأكد من حذف السعر' : 'Are you sure you want to delete the pricing';
      default:
        return isArabic ? 'هل أنت متأكد من حذف هذا العنصر' : 'Are you sure you want to delete this item';
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

  const formatDateEnglish = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Contact functions
  const handleContactCustomer = (request: HealthInsuranceRequest) => {
    setSelectedRequestForContact(request);
    setShowContactModal(true);
  };

  const handleSendContact = async () => {
    if (!selectedRequestForContact || !contactMessage.trim()) return;

    try {
      // Update request with admin contact
      const { error } = await supabase
        .from('health_insurance_requests')
        .update({
          admin_notes: contactMessage,
          status: 'in_progress'
        })
        .eq('id', selectedRequestForContact.id);

      if (error) throw error;

      // Send contact based on method
      if (contactMethod === 'email' && selectedRequestForContact.contact_email) {
        // Here you would integrate with your email service
    
        alert(isArabic ? 'تم إرسال البريد الإلكتروني بنجاح' : 'Email sent successfully');
      } else if (contactMethod === 'whatsapp' && selectedRequestForContact.contact_phone) {
        // Open WhatsApp with pre-filled message
        const message = encodeURIComponent(contactMessage);
        const phone = selectedRequestForContact.contact_phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      } else if (contactMethod === 'phone' && selectedRequestForContact.contact_phone) {
        // Copy phone number to clipboard
        navigator.clipboard.writeText(selectedRequestForContact.contact_phone);
        alert(isArabic ? 'تم نسخ رقم الهاتف إلى الحافظة' : 'Phone number copied to clipboard');
      }

      setShowContactModal(false);
      setSelectedRequestForContact(null);
      setContactMessage('');
      loadData();
    } catch (error) {
      console.error('Error contacting customer:', error);
      alert(isArabic ? 'حدث خطأ في التواصل مع العميل' : 'Error contacting customer');
    }
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

  // Get age groups that have pricing data
  const getAgeGroupsWithPricing = () => {
    const companyData = getCompanyPricingData();
    const ageGroupsWithPricing = new Set();
    
    companyData.forEach(pricing => {
      if (pricing.duration_months === 12) {
        ageGroupsWithPricing.add(pricing.age_group_id);
      }
    });
    
    return ageGroups.filter(ageGroup => ageGroupsWithPricing.has(ageGroup.id));
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
          pricing1Year: null
        });
      }

      const group = grouped.get(ageGroupKey);
      if (pricing.duration_months === 12) {
        group.pricing1Year = pricing;
      }
    });

    // Convert to array, filter out age groups with no pricing, and sort by min age
    return Array.from(grouped.values())
      .filter(group => group.pricing1Year) // Only show age groups that have first year pricing
      .sort((a, b) => a.minAge - b.minAge);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-caribbean-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/40 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 p-6 relative overflow-hidden">
      {/* Enhanced Glass Morphism Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-200/12 to-indigo-200/8 backdrop-blur-sm rounded-full animate-pulse border border-white/8" style={{ animationDuration: '8s' }}></div>
        <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-tr from-indigo-200/10 to-purple-200/6 backdrop-blur-sm rounded-full animate-pulse border border-white/6" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-r from-sky-200/6 to-blue-200/5 backdrop-blur-sm rounded-full animate-pulse border border-white/5" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-gradient-to-l from-purple-200/6 to-pink-200/4 backdrop-blur-sm rounded-full animate-pulse border border-white/5" style={{ animationDelay: '1s', animationDuration: '9s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto z-10">
        {/* Enhanced Success Message with Glass Morphism */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-2xl transform transition-all duration-500 animate-bounce border border-emerald-400/30">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Check className="w-5 h-5" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Enhanced Header with Glass Morphism */}
        <div className="mb-8">
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-white/20 shadow-xl">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {isArabic ? 'إدارة التأمين الصحي' : 'Health Insurance Management'}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                  {isArabic ? 'إدارة شركات التأمين والفئات العمرية والأسعار والطلبات' : 'Manage insurance companies, age groups, pricing, and requests'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs with Glass Morphism */}
        <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 dark:border-white/20 mb-8 overflow-hidden">
          <div className="flex border-b border-white/20 dark:border-white/10 overflow-x-auto bg-gradient-to-r from-blue-50/20 via-transparent to-indigo-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10 px-3">
            {[
              { id: 'companies', label: isArabic ? 'الشركات' : 'Companies', icon: Building },
              { id: 'requests', label: isArabic ? 'الطلبات' : 'Requests', icon: Users },
              { id: 'ageGroups', label: isArabic ? 'الفئات العمرية' : 'Age Groups', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 md:px-6 py-4 md:py-5 font-semibold transition-all duration-500 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center">
                  <tab.icon className="w-5 h-5 md:w-6 md:h-6 ml-3" />
                  <span className="text-sm md:text-base">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      {/* Enhanced Companies Tab with Glass Morphism */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {isArabic ? 'إدارة أسعار التأمين الصحي' : 'Health Insurance Pricing Management'}
            </h3>
            <button
              onClick={() => setShowAddCompany(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-500 flex items-center space-x-3 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105 relative z-20"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">{isArabic ? 'إضافة شركة' : 'Add Company'}</span>
            </button>
          </div>

          {/* Enhanced Company Selection Tabs with Glass Morphism */}
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 dark:border-white/20 overflow-hidden">
            <div className="border-b border-white/20 dark:border-white/10 bg-gradient-to-r from-blue-50/20 via-transparent to-indigo-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10">
              <div className="flex overflow-x-auto px-3">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company.id)}
                    className={`flex-shrink-0 px-5 md:px-6 py-4 md:py-5 text-sm font-semibold border-b-2 transition-all duration-500 whitespace-nowrap ${
                      selectedCompany === company.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Building className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-sm md:text-base">{isArabic ? company.name_ar : company.name}</span>
                      <span className={`px-3 py-1.5 text-xs rounded-full font-semibold backdrop-blur-sm border border-white/20 ${
                        company.is_active 
                          ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-400'
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
                    <h4 className="text-xl font-bold text-slate-700 dark:text-white">
                      {isArabic ? companies.find(c => c.id === selectedCompany)?.name_ar : companies.find(c => c.id === selectedCompany)?.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isArabic ? 'إدارة الأسعار والفئات العمرية' : 'Manage pricing and age groups'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPricing(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105 relative z-20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isArabic ? 'إضافة سعر' : 'Add Price'}</span>
                  </button>
                </div>

                {/* Enhanced Pricing Table with Glass Morphism */}
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 dark:border-white/20 overflow-hidden relative z-10">
                  <div className="overflow-x-auto px-2">
                    <table className="min-w-full divide-y divide-white/20 dark:divide-white/10 relative z-10">
                      <thead className="bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                            {isArabic ? 'الفئة العمرية' : 'Age Group'}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                            {isArabic ? 'سنة واحدة' : '1 Year'}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                            {isArabic ? 'مجموع السنتين' : '2 Years Total'}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                            {isArabic ? 'الإجراءات' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-white/5 divide-y divide-white/20 dark:divide-white/10">
                        {getGroupedPricingData().length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center space-y-3 space-y-reverse">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <DollarSign className="w-8 h-8 text-blue-400 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-lg font-medium text-slate-700 dark:text-white">
                                    {isArabic ? 'لا توجد أسعار محددة' : 'No pricing data'}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-300">
                                    {isArabic ? 'اضغط على "إضافة سعر" لبدء إضافة الأسعار' : 'Click "Add Price" to start adding pricing'}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          getGroupedPricingData().map((group, index) => (
                            <tr key={group.ageGroupId} className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white/30 dark:bg-white/5' : 'bg-white/20 dark:bg-white/3'}`}>
                              {/* Age Group Column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-white">
                                      {isArabic ? group.ageGroupNameAr : group.ageGroupName}
                                    </span>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
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
                                        <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-white">
                                          {formatPrice(group.pricing1Year.price_try)}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => startInlineEdit(group.pricing1Year.id, 'price_try', group.pricing1Year.price_try.toString())}
                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 relative z-20"
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
                                      <div className="flex items-center space-x-1 space-x-reverse">
                                        <button
                                          onClick={() => handleUpdatePricing({ ...group.pricing1Year, is_active: !group.pricing1Year.is_active })}
                                          className={`p-1 rounded transition-colors duration-200 relative z-20 ${
                                            group.pricing1Year.is_active 
                                              ? 'text-red-600 hover:text-red-900 hover:bg-red-50/50'
                                              : 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50/50'
                                          }`}
                                          title={group.pricing1Year.is_active ? (isArabic ? 'إلغاء التفعيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                                        >
                                          {group.pricing1Year.is_active ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                        </button>
                                        <button
                                          onClick={() => handleDeletePricing(group.pricing1Year)}
                                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50/50 transition-colors duration-200 relative z-20"
                                          title={isArabic ? 'حذف السعر' : 'Delete Price'}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      {isArabic ? 'غير محدد' : 'Not set'}
                                    </span>
                                  </div>
                                )}
                              </td>



                              {/* 2 Years Total Column */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {group.pricing1Year ? (
                                  <div className="text-center py-2">
                                    <div className="flex items-center justify-center">
                                      <DollarSign className="w-4 h-4 text-purple-500 mr-1" />
                                      <span className="text-sm font-bold text-slate-700 dark:text-white">
                                        {formatPrice(group.pricing1Year.price_try + (group.pricing1Year.price_try * 1.8))}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {isArabic ? 'محسوب تلقائياً' : 'Auto-calculated'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
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
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200 relative z-20"
                                    title={isArabic ? 'إضافة سعر' : 'Add Price'}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPricing(group.pricing1Year || group.pricing2Years)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200 relative z-20"
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

      {/* Enhanced Requests Tab with Glass Morphism */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {isArabic ? 'طلبات التأمين الصحي' : 'Health Insurance Requests'}
          </h3>

          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 dark:border-white/20 overflow-hidden">
                          <div className="overflow-x-auto px-3">
                <table className="min-w-full divide-y divide-white/20 dark:divide-white/10 relative z-10">
                  <thead className="bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'العميل' : 'Client'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'العمر' : 'Age'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'تاريخ الميلاد' : 'Birth Date'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'الشركة' : 'Company'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'السعر' : 'Price'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'الحالة' : 'Status'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'تاريخ التقديم' : 'Submission Date'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'الملف المرفوع' : 'Attached File'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                        {isArabic ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 dark:bg-white/5 divide-y divide-white/20 dark:divide-white/10">
                                          {requests.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center space-y-3 space-y-reverse">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-blue-400 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                                    {isArabic ? 'لا توجد طلبات بعد' : 'No requests yet'}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {isArabic ? 'ستظهر طلبات التأمين الصحي هنا' : 'Health insurance requests will appear here'}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                  ) : (
                                          requests.map((request, index) => (
                        <tr key={request.id} className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white/30 dark:bg-white/5' : 'bg-white/20 dark:bg-white/3'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-semibold text-slate-700 dark:text-white">{request.contact_name}</div>
                              <div className="text-slate-600 dark:text-slate-300">{request.contact_email}</div>
                              <div className="text-slate-500 dark:text-slate-400">{request.contact_phone}</div>

                            {request.insurance_offer_confirmed && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {isArabic ? 'تأكيد العرض' : 'Offer confirmed'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {request.customer_age ? (
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-caribbean-500 mr-1" />
                                <span className="font-medium text-slate-700 dark:text-white">
                                  {request.customer_age} {isArabic ? 'سنة' : 'years'}
                                </span>
                              </div>
                            ) : request.birth_date ? (
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-caribbean-500 mr-1" />
                                <span className="font-medium text-slate-700 dark:text-white">
                                  {calculateAge(request.birth_date)} {isArabic ? 'سنة' : 'years'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs">
                                {isArabic ? 'غير محدد' : 'Not specified'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {request.birth_date ? (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-blue-500 mr-1" />
                                <span className="font-medium text-slate-700 dark:text-white">
                                  {formatDateEnglish(request.birth_date)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs">
                                {isArabic ? 'غير محدد' : 'Not specified'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-white">{request.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-white">{formatPrice(request.calculated_price)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {request.submission_date ? formatDateEnglish(request.submission_date) : formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            return request.passport_image_url ? (
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2 hover:shadow-md transition-all duration-200 cursor-pointer"
                                   onClick={() => {
                                     // تحديد نوع الملف بناءً على امتداده
                                     const fileExtension = request.passport_image_url?.split('.').pop()?.toLowerCase();
                                     let fileType = 'image';
                                     if (fileExtension === 'pdf') {
                                       fileType = 'pdf';
                                     } else if (['doc', 'docx'].includes(fileExtension || '')) {
                                       fileType = 'document';
                                     }
                                     
                                     setSelectedFile({
                                       url: `https://fctvityawavmuethxxix.supabase.co/storage/v1/object/public/passport-images/${request.passport_image_url}`,
                                       name: `Passport_${request.contact_name}_${request.id}`,
                                       type: fileType
                                     });
                                     setShowFilePreview(true);
                                   }}>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                    {isArabic ? 'عرض' : 'View'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `https://fctvityawavmuethxxix.supabase.co/storage/v1/object/public/passport-images/${request.passport_image_url}`;
                                  link.download = `Passport_${request.contact_name}_${request.id}.jpg`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                title={isArabic ? 'تحميل الملف' : 'Download File'}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {isArabic ? 'لا يوجد ملف' : 'No file'}
                            </span>
                          );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => setEditingRequest(request)}
                              className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300 p-2 rounded-lg hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200 relative z-20"
                              title={isArabic ? 'تعديل الطلب' : 'Edit Request'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(request)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 relative z-20"
                              title={isArabic ? 'حذف الطلب' : 'Delete Request'}
                            >
                              <Trash2 className="w-4 h-4" />
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
              className="bg-gradient-to-r from-caribbean-600 to-sky-600 text-white px-4 py-2 rounded-lg hover:from-caribbean-700 hover:to-sky-700 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105 relative z-20"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة فئة عمرية' : 'Add Age Group'}</span>
            </button>
          </div>

          <div className="grid gap-4 px-2">
            {getAgeGroupsWithPricing().length === 0 ? (
                              <div className="bg-gradient-to-r from-white via-sky-50/30 to-white dark:from-jet-800 dark:via-jet-700 dark:to-jet-800 p-12 rounded-xl shadow-lg border border-sky-200 dark:border-jet-700 text-center relative z-10">
                <div className="flex flex-col items-center space-y-4 space-y-reverse">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-caribbean-100 dark:from-sky-900 dark:to-caribbean-900 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-700 dark:text-white">
                      {isArabic ? 'لا توجد فئات عمرية مع أسعار' : 'No age groups with pricing'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {isArabic ? 'أضف أسعار للفئات العمرية لتظهر هنا' : 'Add pricing to age groups to see them here'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              getAgeGroupsWithPricing().map((ageGroup) => (
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
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => setEditingAgeGroup(ageGroup)}
                        className="text-caribbean-600 hover:text-caribbean-900 dark:text-caribbean-400 dark:hover:text-caribbean-300 p-2 rounded-lg hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 transition-colors duration-200 relative z-20"
                        title={isArabic ? 'تعديل الفئة العمرية' : 'Edit Age Group'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAgeGroup(ageGroup)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 relative z-20"
                        title={isArabic ? 'حذف الفئة العمرية' : 'Delete Age Group'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* Edit Request Modal */}
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
                  {isArabic ? 'العمر' : 'Age'}
                </label>
                <input
                  type="number"
                  value={editingRequest.customer_age || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, customer_age: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                  placeholder={isArabic ? 'أدخل العمر' : 'Enter age'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isArabic ? 'تاريخ الميلاد' : 'Birth Date'}
                </label>
                <input
                  type="date"
                  value={editingRequest.birth_date || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500"
                />
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

      {/* Contact Customer Modal */}
      {showContactModal && selectedRequestForContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {isArabic ? 'التواصل مع العميل' : 'Contact Customer'}
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-jet-400 hover:text-jet-600 dark:text-jet-500 dark:hover:text-jet-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {isArabic ? 'معلومات العميل:' : 'Customer Information:'}
                </h4>
                <div className="space-y-1 text-sm text-jet-600 dark:text-platinum-400">
                  <p>
                    <span className="font-medium">{isArabic ? 'الاسم:' : 'Name:'}</span> {selectedRequestForContact.contact_name}
                  </p>
                  <p>
                    <span className="font-medium">{isArabic ? 'البريد الإلكتروني:' : 'Email:'}</span> {selectedRequestForContact.contact_email}
                  </p>
                  <p>
                    <span className="font-medium">{isArabic ? 'الهاتف:' : 'Phone:'}</span> {selectedRequestForContact.contact_phone}
                  </p>
                  <p>
                    <span className="font-medium">{isArabic ? 'الشركة:' : 'Company:'}</span> {selectedRequestForContact.company_name}
                  </p>
                  <p>
                    <span className="font-medium">{isArabic ? 'السعر:' : 'Price:'}</span> {formatPrice(selectedRequestForContact.calculated_price)}
                  </p>
                </div>
              </div>

              {/* Contact Method */}
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  {isArabic ? 'طريقة التواصل' : 'Contact Method'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setContactMethod('email')}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 flex flex-col items-center ${
                      contactMethod === 'email'
                        ? 'border-caribbean-500 bg-caribbean-50 dark:bg-caribbean-900/20 text-caribbean-700 dark:text-caribbean-400'
                        : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-caribbean-300 dark:hover:border-caribbean-500'
                    }`}
                  >
                    <Mail className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{isArabic ? 'بريد إلكتروني' : 'Email'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod('whatsapp')}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 flex flex-col items-center ${
                      contactMethod === 'whatsapp'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-green-300 dark:hover:border-green-500'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod('phone')}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 flex flex-col items-center ${
                      contactMethod === 'phone'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-platinum-300 dark:border-jet-600 bg-white dark:bg-jet-800 text-jet-700 dark:text-platinum-300 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <Phone className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{isArabic ? 'هاتف' : 'Phone'}</span>
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  {isArabic ? 'الرسالة' : 'Message'}
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg text-jet-700 dark:text-platinum-300 hover:bg-platinum-50 dark:hover:bg-jet-700 transition-all duration-300"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSendContact}
                  disabled={!contactMessage.trim()}
                  className="flex-1 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isArabic ? 'إرسال' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-jet-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-jet-900 dark:text-white">
                {isArabic ? 'عرض الملف المرفوع' : 'File Preview'}
              </h3>
              <button
                onClick={() => {
                  setShowFilePreview(false);
                  setSelectedFile(null);
                }}
                className="text-jet-400 hover:text-jet-600 dark:text-jet-500 dark:hover:text-jet-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                      {selectedFile.name}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {isArabic ? 'صورة جواز السفر أو الإقامة' : 'Passport or Residence Image'}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Preview */}
              <div className="bg-gray-50 dark:bg-jet-700 rounded-lg p-4">
                {selectedFile.type === 'image' ? (
                  <div className="text-center">
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'text-red-500 dark:text-red-400 p-8 text-center';
                        errorDiv.innerHTML = isArabic ? 'خطأ في تحميل الصورة' : 'Error loading image';
                        target.parentNode?.appendChild(errorDiv);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isArabic ? 'معاينة غير متاحة لهذا النوع من الملفات' : 'Preview not available for this file type'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowFilePreview(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg text-jet-700 dark:text-platinum-300 hover:bg-platinum-50 dark:hover:bg-jet-700 transition-all duration-300"
                >
                  {isArabic ? 'إغلاق' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedFile.url;
                    link.download = selectedFile.name;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isArabic ? 'تحميل الملف' : 'Download File'}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(selectedFile.url, '_blank')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {isArabic ? 'فتح في نافذة جديدة' : 'Open in New Tab'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={getDeleteModalTitle()}
        message={getDeleteModalMessage()}
        itemName={deleteTarget?.name}
        isLoading={isDeleting}
      />
    </div>
  </div>
  );
};

export default HealthInsuranceManagement;
