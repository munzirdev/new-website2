import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Trash2, Eye, Calendar, User, Phone, Edit } from 'lucide-react';
import { voluntaryReturnService } from '../lib/voluntaryReturnService';
import { VoluntaryReturnForm } from '../lib/types';
import { useLanguage } from '../hooks/useLanguage';
import VoluntaryReturnFormEditor from './VoluntaryReturnFormEditor';

interface VoluntaryReturnFormsListProps {
  isDarkMode: boolean;
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

const VoluntaryReturnFormsList: React.FC<VoluntaryReturnFormsListProps> = ({ isDarkMode }) => {
  const { t, language } = useLanguage();
  const [forms, setForms] = useState<VoluntaryReturnForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedForm, setSelectedForm] = useState<VoluntaryReturnForm | null>(null);
  const [editingForm, setEditingForm] = useState<VoluntaryReturnForm | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 بدء تحميل النماذج...');
      
      const { data, error } = await voluntaryReturnService.getAllForms();
      
      if (error) {
        console.error('❌ خطأ في تحميل النماذج:', error);
        throw error;
      }
      
      console.log('✅ تم تحميل النماذج بنجاح:', data?.length || 0);
      console.log('📋 بيانات النماذج:', data);
      
      setForms(data || []);
    } catch (err) {
      console.error('💥 خطأ في تحميل النماذج:', err);
      setError(language === 'ar' ? 'خطأ في تحميل النماذج' : 'Formlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا النموذج؟' : 'Bu formu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await voluntaryReturnService.deleteForm(id);
      
      if (error) {
        throw error;
      }
      
      setForms(forms.filter(form => form.id !== id));
    } catch (err) {
      console.error('Error deleting form:', err);
      alert(language === 'ar' ? 'خطأ في حذف النموذج' : 'Form silinirken hata oluştu');
    }
  };

  const handleFormUpdate = (updatedForm: VoluntaryReturnForm) => {
    setForms(forms.map(form => form.id === updatedForm.id ? updatedForm : form));
    setEditingForm(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'tr-TR');
  };

  // دالة لفلترة النماذج حسب الفترة الزمنية
  const getFilteredForms = () => {
    if (timeFilter === 'all') {
      return forms;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return forms.filter(form => {
      const formDate = new Date(form.created_at);
      
      switch (timeFilter) {
        case 'today':
          return formDate >= today;
        case 'week':
          return formDate >= weekAgo;
        case 'month':
          return formDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredForms = getFilteredForms();

  const openPrintWindow = (content: string) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Yazdır / طباعة</title>
            <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Alexandria', Arial, sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: black;
                background: white;
                margin: 20px;
              }
              [dir=rtl] {
                direction: rtl;
                font-family: 'Alexandria', Arial, sans-serif;
                font-size: 14px;
              }
              #turkishPage, #arabicPage {
                page-break-after: always;
                margin-bottom: 40px;
                text-align: center;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-top: 10px;
              }
              th, td {
                border: 1px solid #555;
                padding: 6px 8px;
                text-align: left;
                background-color: white;
              }
              tr:nth-child(even) td {
                background-color: #f0f0f0;
              }
              th {
                background-color: #999999;
              }
            </style>
          </head>
          <body>
            <div id="printArea">${content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const generateFormContent = (form: VoluntaryReturnForm) => {
    const requestDate = form.custom_date || form.request_date;
    const requestDateTR = new Date(requestDate).toLocaleDateString("tr-TR", { numberingSystem: "latn" });
    const requestDateAR = new Date(requestDate).toLocaleDateString("ar-EG").replace(/\//g, "/");

    let refakatPartTR = "";
    if (form.refakat_entries && form.refakat_entries.length > 0) {
      const rows = form.refakat_entries
        .map(entry => `<tr><td style="white-space: nowrap;">${entry.id}</td><td>${entry.name}</td></tr>`)
        .join("");
      
      refakatPartTR = `
        <br><br>REFAKATİMDEKİLER
        <table class="refakat-table">
          <thead>
            <tr>
              <th>Kimlik No</th>
              <th>İsim</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    const gsmPartTR = form.gsm ? `<br><br>GSM : ${form.gsm}` : "";

    const turkishForm = `
      <div id="turkishPage" style="text-align: center; margin-top: 60px;">
        <strong>İL GÖÇ İDARESİ MÜDÜRLÜĞÜ'NE</strong><br />MERSİN
        <div style="margin-top: 40px; text-align: left;">
          <div style="text-align: right; font-family: Arial, sans-serif;" dir="ltr">${requestDateTR}</div><br />
          Ben Suriye uyrukluyum. Adım ${form.full_name_tr} . ${form.kimlik_no} no'lu yabancı kimlik sahibiyim . ${form.sinir_kapisi.toUpperCase()} Sınır Kapısından Geçici koruma haklarımdan feraget ederek Suriye'ye gerekli gönüllü dönüş işlemin yapılması ve geçici koruma kimlik kaydımın iptal edilmesi için gereğinin yapılmasını saygımla arz ederim.
          ${refakatPartTR}
          ${gsmPartTR}
          <div style="text-align: right; margin-top: 60px;">
            <strong>AD SOYAD</strong><br />${form.full_name_tr}
          </div>
        </div>
      </div>
    `;

    const gateTranslations: { [key: string]: string } = {
      "yayladağı": "كسب",
      "cilvegözü": "باب الهوى",
      "öncüpınar": "باب السلامة",
      "istanbul havalimanı": "مطار اسطنبول",
      "çobanbey": "الراعي",
      "zeytindalı": "غصن الزيتون",
      "karakamış": "جرابلس"
    };

    const arabicGate = gateTranslations[form.sinir_kapisi] || form.sinir_kapisi;
    const arabicForm = `
      <div id="arabicPage" dir="rtl" style="text-align: center; margin-top: 60px;">
        <strong>إلى مديرية إدارة الهجرة</strong><br />مرسين
        <div style="margin-top: 40px; text-align: right;">
          التاريخ: ${requestDateAR}<br /><br />
          أنا الموقّع أدناه ${form.full_name_ar}، أحمل بطاقة الحماية المؤقتة رقم ${form.kimlik_no}. أطلب منكم التفضل بتسليمي الأوراق اللازمة لتنفيذ إجراءات العودة الطوعية إلى سوريا عبر معبر ${arabicGate} الحدودي.<br />
          وتفضلوا بقبول فائق الاحترام والتقدير.<br /><br />
          المقدّم/ة:<br />${form.full_name_ar}
        </div>
      </div>
    `;

    return turkishForm + arabicForm;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean-600"></div>
        <span className="mr-3 text-jet-600 dark:text-platinum-400">
          {language === 'ar' ? 'جاري التحميل...' : 'Yükleniyor...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        <button
          onClick={loadForms}
          className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Tekrar Dene'}
        </button>
      </div>
    );
  }

  if (editingForm) {
    return (
      <VoluntaryReturnFormEditor
        form={editingForm}
        onBack={() => setEditingForm(null)}
        onUpdate={handleFormUpdate}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl md:text-2xl font-bold text-jet-800 dark:text-platinum-200 text-center md:text-right">
          {language === 'ar' ? 'نماذج العودة الطوعية' : 'Gönüllü Dönüş Formları'}
        </h2>
        <div className="flex items-center justify-center md:justify-end gap-3 md:gap-4">
          <span className="text-sm text-jet-600 dark:text-platinum-400">
            {filteredForms.length} {language === 'ar' ? 'نموذج' : 'form'}
          </span>
          <button
            onClick={loadForms}
            className="px-3 py-1 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {language === 'ar' ? 'تحديث' : 'Yenile'}
          </button>
        </div>
      </div>

      {/* Time Filter Buttons */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
        <button
          onClick={() => setTimeFilter('all')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            timeFilter === 'all'
              ? 'bg-caribbean-600 text-white'
              : 'bg-white dark:bg-jet-700 text-jet-600 dark:text-platinum-400 border border-platinum-200 dark:border-jet-600 hover:bg-platinum-50 dark:hover:bg-jet-600'
          }`}
        >
          {language === 'ar' ? 'كل الوقت' : 'Tüm Zaman'}
        </button>
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            timeFilter === 'today'
              ? 'bg-caribbean-600 text-white'
              : 'bg-white dark:bg-jet-700 text-jet-600 dark:text-platinum-400 border border-platinum-200 dark:border-jet-600 hover:bg-platinum-50 dark:hover:bg-jet-600'
          }`}
        >
          {language === 'ar' ? 'آخر يوم' : 'Bugün'}
        </button>
        <button
          onClick={() => setTimeFilter('week')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            timeFilter === 'week'
              ? 'bg-caribbean-600 text-white'
              : 'bg-white dark:bg-jet-700 text-jet-600 dark:text-platinum-400 border border-platinum-200 dark:border-jet-600 hover:bg-platinum-50 dark:hover:bg-jet-600'
          }`}
        >
          {language === 'ar' ? 'أسبوع' : 'Hafta'}
        </button>
        <button
          onClick={() => setTimeFilter('month')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            timeFilter === 'month'
              ? 'bg-caribbean-600 text-white'
              : 'bg-white dark:bg-jet-700 text-jet-600 dark:text-platinum-400 border border-platinum-200 dark:border-jet-600 hover:bg-platinum-50 dark:hover:bg-jet-600'
          }`}
        >
          {language === 'ar' ? 'شهر' : 'Ay'}
        </button>
      </div>

      {filteredForms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-jet-400 dark:text-jet-600 mx-auto mb-4" />
          <p className="text-jet-600 dark:text-platinum-400 mb-4">
            {timeFilter === 'all' 
              ? (language === 'ar' ? 'لا توجد نماذج محفوظة' : 'Henüz kaydedilmiş form yok')
              : (language === 'ar' ? `لا توجد نماذج في الفترة المحددة` : 'Seçilen dönemde form bulunamadı')
            }
          </p>
          {timeFilter !== 'all' && (
            <button
              onClick={() => setTimeFilter('all')}
              className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors flex items-center mx-auto mb-3"
            >
              {language === 'ar' ? 'عرض جميع النماذج' : 'Tüm Formları Göster'}
            </button>
          )}
          <button
            onClick={loadForms}
            className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors flex items-center mx-auto"
          >
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {language === 'ar' ? 'إعادة تحميل' : 'Yenile'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              className="bg-white dark:bg-jet-800 rounded-lg shadow-md border border-platinum-200 dark:border-jet-600 p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 space-y-3 md:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <h3 className="text-base md:text-lg font-semibold text-jet-800 dark:text-platinum-200">
                      {form.full_name_tr}
                    </h3>
                    <span className="text-sm text-jet-600 dark:text-platinum-400">
                      {form.full_name_ar}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-caribbean-600" />
                      <span className="text-jet-600 dark:text-platinum-400">
                        {form.kimlik_no}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="text-jet-600 dark:text-platinum-400">
                        {form.sinir_kapisi}
                      </span>
                    </div>
                    {form.gsm && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        <span className="text-jet-600 dark:text-platinum-400 font-mono text-left font-bold" dir="ltr">
                          {form.gsm}
                        </span>
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(form.gsm)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors cursor-pointer"
                          title={language === 'ar' ? 'فتح الواتساب' : 'WhatsApp\'ta Aç'}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-jet-600 dark:text-platinum-400">
                        {formatDate(form.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-1 md:gap-2">
                  <button
                    onClick={() => setEditingForm(form)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'تعديل النموذج' : 'Formu Düzenle'}
                  >
                    <Edit className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedForm(selectedForm?.id === form.id ? null : form)}
                    className="p-2 text-caribbean-600 hover:text-caribbean-700 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'عرض التفاصيل' : 'Detayları Göster'}
                  >
                    <Eye className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => openPrintWindow(generateFormContent(form))}
                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'طباعة' : 'Yazdır'}
                  >
                    <Printer className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => deleteForm(form.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'حذف' : 'Sil'}
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {selectedForm?.id === form.id && (
                <div className="mt-4 p-3 md:p-4 bg-platinum-50 dark:bg-jet-700 rounded-lg">
                  <h4 className="font-semibold text-jet-800 dark:text-platinum-200 mb-2 text-sm md:text-base">
                    {language === 'ar' ? 'المرافقين:' : 'Refakatçiler:'}
                  </h4>
                  {form.refakat_entries && form.refakat_entries.length > 0 ? (
                    <div className="space-y-2">
                      {form.refakat_entries.map((entry, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                          <span className="text-jet-600 dark:text-platinum-400">
                            {language === 'ar' ? 'مرافق' : 'Refakatçi'} {index + 1}:
                          </span>
                          <span className="font-medium">{entry.id}</span>
                          <span className="text-jet-600 dark:text-platinum-400 hidden sm:inline">-</span>
                          <span className="font-medium">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-jet-600 dark:text-platinum-400 text-sm">
                      {language === 'ar' ? 'لا يوجد مرافقين' : 'Refakatçi yok'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoluntaryReturnFormsList;
