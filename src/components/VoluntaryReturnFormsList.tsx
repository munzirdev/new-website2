import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Trash2, Eye, Calendar, User, Phone, Edit } from 'lucide-react';
import { voluntaryReturnService } from '../lib/voluntaryReturnService';
import { VoluntaryReturnForm } from '../lib/types';
import { useLanguage } from '../hooks/useLanguage';
import VoluntaryReturnFormEditor from './VoluntaryReturnFormEditor';

interface VoluntaryReturnFormsListProps {
  isDarkMode: boolean;
}

const VoluntaryReturnFormsList: React.FC<VoluntaryReturnFormsListProps> = ({ isDarkMode }) => {
  const { t, language } = useLanguage();
  const [forms, setForms] = useState<VoluntaryReturnForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedForm, setSelectedForm] = useState<VoluntaryReturnForm | null>(null);
  const [editingForm, setEditingForm] = useState<VoluntaryReturnForm | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await voluntaryReturnService.getAllForms();
      
      if (error) {
        throw error;
      }
      
      setForms(data || []);
    } catch (err) {
      console.error('Error loading forms:', err);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-jet-800 dark:text-platinum-200">
          {language === 'ar' ? 'نماذج العودة الطوعية' : 'Gönüllü Dönüş Formları'}
        </h2>
        <span className="text-sm text-jet-600 dark:text-platinum-400">
          {forms.length} {language === 'ar' ? 'نموذج' : 'form'}
        </span>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-jet-400 dark:text-jet-600 mx-auto mb-4" />
          <p className="text-jet-600 dark:text-platinum-400">
            {language === 'ar' ? 'لا توجد نماذج محفوظة' : 'Henüz kaydedilmiş form yok'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white dark:bg-jet-800 rounded-lg shadow-md border border-platinum-200 dark:border-jet-600 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-jet-800 dark:text-platinum-200">
                      {form.full_name_tr}
                    </h3>
                    <span className="text-sm text-jet-600 dark:text-platinum-400">
                      {form.full_name_ar}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                        <span className="text-jet-600 dark:text-platinum-400">
                          {form.gsm}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-jet-600 dark:text-platinum-400">
                        {formatDate(form.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingForm(form)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'تعديل النموذج' : 'Formu Düzenle'}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedForm(selectedForm?.id === form.id ? null : form)}
                    className="p-2 text-caribbean-600 hover:text-caribbean-700 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'عرض التفاصيل' : 'Detayları Göster'}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openPrintWindow(generateFormContent(form))}
                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'طباعة' : 'Yazdır'}
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteForm(form.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={language === 'ar' ? 'حذف' : 'Sil'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {selectedForm?.id === form.id && (
                <div className="mt-4 p-4 bg-platinum-50 dark:bg-jet-700 rounded-lg">
                  <h4 className="font-semibold text-jet-800 dark:text-platinum-200 mb-2">
                    {language === 'ar' ? 'المرافقين:' : 'Refakatçiler:'}
                  </h4>
                  {form.refakat_entries && form.refakat_entries.length > 0 ? (
                    <div className="space-y-2">
                      {form.refakat_entries.map((entry, index) => (
                        <div key={index} className="flex items-center gap-4 text-sm">
                          <span className="text-jet-600 dark:text-platinum-400">
                            {language === 'ar' ? 'مرافق' : 'Refakatçi'} {index + 1}:
                          </span>
                          <span className="font-medium">{entry.id}</span>
                          <span className="text-jet-600 dark:text-platinum-400">-</span>
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
