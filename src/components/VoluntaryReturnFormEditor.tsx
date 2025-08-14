import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Save, X, Plus, ArrowLeft, Eye } from 'lucide-react';
import { voluntaryReturnService } from '../lib/voluntaryReturnService';
import { VoluntaryReturnForm, RefakatEntry } from '../lib/types';
import { useLanguage } from '../hooks/useLanguage';
import { formatDisplayDate } from '../lib/utils';

interface VoluntaryReturnFormEditorProps {
  form: VoluntaryReturnForm;
  onBack: () => void;
  onUpdate: (updatedForm: VoluntaryReturnForm) => void;
  isDarkMode: boolean;
}

const VoluntaryReturnFormEditor: React.FC<VoluntaryReturnFormEditorProps> = ({ 
  form, 
  onBack, 
  onUpdate, 
  isDarkMode 
}) => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    fullNameTR: form.full_name_tr,
    fullNameAR: form.full_name_ar,
    kimlikNo: form.kimlik_no,
    sinirKapisi: form.sinir_kapisi,
    gsm: form.gsm || '',
    changeDate: form.custom_date ? 'yes' : 'no',
    customDate: form.custom_date || ''
  });
  const [refakatEntries, setRefakatEntries] = useState<RefakatEntry[]>(
    form.refakat_entries || [{ id: '', name: '' }]
  );
  const [output, setOutput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(form.custom_date ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const addRefakat = () => {
    setRefakatEntries([...refakatEntries, { id: '', name: '' }]);
  };

  const removeRefakat = (index: number) => {
    if (refakatEntries.length > 1) {
      setRefakatEntries(refakatEntries.filter((_, i) => i !== index));
    }
  };

  const updateRefakat = (index: number, field: 'id' | 'name', value: string) => {
    const updated = [...refakatEntries];
    updated[index][field] = value;
    setRefakatEntries(updated);
  };

  const saveFormToDatabase = async () => {
    const { fullNameTR, fullNameAR, kimlikNo, sinirKapisi, gsm, changeDate, customDate } = formData;

    if (!fullNameTR || !fullNameAR || !kimlikNo || !sinirKapisi) {
      alert(language === 'ar' ? 'الرجاء تعبئة جميع الحقول المطلوبة' : 'Lütfen tüm zorunlu alanları doldurunuz');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const validRefakat = refakatEntries.filter(entry => entry.id && entry.name);
      
      const formDataToSave = {
        full_name_tr: fullNameTR,
        full_name_ar: fullNameAR,
        kimlik_no: kimlikNo,
        sinir_kapisi: sinirKapisi,
        gsm: gsm || undefined,
        custom_date: changeDate === 'yes' && customDate ? customDate : undefined,
        refakat_entries: validRefakat
      };

      const { data, error } = await voluntaryReturnService.updateForm(form.id, formDataToSave);

      if (error) {
        throw error;
      }

      setSaveMessage(language === 'ar' ? 'تم تحديث النموذج بنجاح!' : 'Form başarıyla güncellendi!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      if (data) {
        onUpdate(data);
      }
    } catch (error) {
      console.error('Error updating form:', error);
      setSaveMessage(language === 'ar' ? 'خطأ في تحديث النموذج' : 'Form güncellenirken hata oluştu');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const generateForms = () => {
    const { fullNameTR, fullNameAR, kimlikNo, sinirKapisi, gsm, changeDate, customDate } = formData;

    if (!fullNameTR || !fullNameAR || !kimlikNo || !sinirKapisi) {
      alert(language === 'ar' ? 'الرجاء تعبئة جميع الحقول المطلوبة' : 'Lütfen tüm zorunlu alanları doldurunuz');
      return;
    }

    let requestDateTR, requestDateAR;
    if (changeDate === "yes" && customDate) {
      const dateObj = new Date(customDate);
      requestDateTR = formatDisplayDate(dateObj);
      requestDateAR = formatDisplayDate(dateObj);
    } else {
      const today = new Date();
      requestDateTR = formatDisplayDate(today);
      requestDateAR = formatDisplayDate(today);
    }

    let refakatPartTR = "";
    const validRefakat = refakatEntries.filter(entry => entry.id && entry.name);
    if (validRefakat.length > 0) {
      const rows = validRefakat
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

    const gsmPartTR = gsm ? `<br><br>GSM : ${gsm}` : "";

    const turkishForm = `
      <div id="turkishPage" style="text-align: center; margin-top: 60px;">
        <strong>İL GÖÇ İDARESİ MÜDÜRLÜĞÜ'NE</strong><br />MERSİN
        <div style="margin-top: 40px; text-align: left;">
          <div style="text-align: right; font-family: Arial, sans-serif;" dir="ltr">${requestDateTR}</div><br />
          Ben Suriye uyrukluyum. Adım ${fullNameTR} . ${kimlikNo} no'lu yabancı kimlik sahibiyim . ${sinirKapisi.toUpperCase()} Sınır Kapısından Geçici koruma haklarımdan feraget ederek Suriye'ye gerekli gönüllü dönüş işlemin yapılması ve geçici koruma kimlik kaydımın iptal edilmesi için gereğinin yapılmasını saygımla arz ederim.
          ${refakatPartTR}
          ${gsmPartTR}
          <div style="text-align: right; margin-top: 60px;">
            <strong>AD SOYAD</strong><br />${fullNameTR}
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

    const arabicGate = gateTranslations[sinirKapisi] || sinirKapisi;
    const arabicForm = `
      <div id="arabicPage" dir="rtl" style="text-align: center; margin-top: 60px;">
        <strong>إلى مديرية إدارة الهجرة</strong><br />مرسين
        <div style="margin-top: 40px; text-align: right;">
          التاريخ: ${requestDateAR}<br /><br />
          أنا الموقّع أدناه ${fullNameAR}، أحمل بطاقة الحماية المؤقتة رقم ${kimlikNo}. أطلب منكم التفضل بتسليمي الأوراق اللازمة لتنفيذ إجراءات العودة الطوعية إلى سوريا عبر معبر ${arabicGate} الحدودي.<br />
          وتفضلوا بقبول فائق الاحترام والتقدير.<br /><br />
          المقدّم/ة:<br />${fullNameAR}
        </div>
      </div>
    `;

    setOutput(turkishForm + arabicForm);
  };

  const printForms = async () => {
    if (!output) {
      alert(language === 'ar' ? 'الرجاء إنشاء الطلب أولاً' : 'Lütfen önce formu oluşturun');
      return;
    }
    
    // Auto-save form before printing
    await saveFormToDatabase();
    openPrintWindow(output);
  };

  const printTurkish = async () => {
    const turkishContent = document.getElementById("output")?.querySelector("#turkishPage");
    if (!turkishContent) {
      alert(language === 'ar' ? 'الرجاء إنشاء الطلب أولاً' : 'Lütfen önce formu oluşturun');
      return;
    }
    
    // Auto-save form before printing
    await saveFormToDatabase();
    openPrintWindow(turkishContent.outerHTML);
  };

  const printArabic = async () => {
    const arabicContent = document.getElementById("output")?.querySelector("#arabicPage");
    if (!arabicContent) {
      alert(language === 'ar' ? 'الرجاء إنشاء الطلب أولاً' : 'Lütfen önce formu oluşturun');
      return;
    }
    
    // Auto-save form before printing
    await saveFormToDatabase();
    openPrintWindow(arabicContent.outerHTML);
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

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-jet-900 dark:via-indigo-900 dark:to-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria relative`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ar' ? 'العودة' : 'Geri'}
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isPreviewMode 
                  ? 'bg-caribbean-600 text-white' 
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
              }`}
            >
              <Eye className="w-5 h-5" />
              {language === 'ar' ? 'معاينة' : 'Önizleme'}
            </button>
            <button
              onClick={saveFormToDatabase}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Kaydediliyor...') : (language === 'ar' ? 'حفظ التغييرات' : 'Değişiklikleri Kaydet')}
            </button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-3 rounded-lg text-center font-medium ${
            saveMessage.includes('نجاح') || saveMessage.includes('başarıyla') 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {saveMessage}
          </div>
        )}

        {isPreviewMode ? (
          /* Preview Mode */
          <div className="bg-white/95 dark:bg-jet-800/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-jet-600/50">
            <h2 className="text-2xl font-bold text-center mb-6 text-jet-800 dark:text-platinum-200">
              {language === 'ar' ? 'معاينة النموذج' : 'Form Önizlemesi'}
            </h2>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <button
                onClick={generateForms}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FileText className="w-5 h-5" />
                {language === 'ar' ? 'إنشاء النماذج' : 'Formları Oluştur'}
              </button>
              <button
                onClick={printTurkish}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Printer className="w-5 h-5" />
                {language === 'ar' ? 'طباعة التركية' : 'Türkçe Yazdır'}
              </button>
              <button
                onClick={printArabic}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Printer className="w-5 h-5" />
                {language === 'ar' ? 'طباعة العربية' : 'Arapça Yazdır'}
              </button>
              <button
                onClick={printForms}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Download className="w-5 h-5" />
                {language === 'ar' ? 'طباعة الكل' : 'Tümünü Yazdır'}
              </button>
            </div>

            {/* Output */}
            {output && (
              <div className="mt-8 bg-white dark:bg-jet-800 p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-jet-600/50">
                <h3 className="text-xl font-bold text-jet-800 dark:text-platinum-200 mb-4">
                  {language === 'ar' ? 'النماذج المُنشأة' : 'Oluşturulan Formlar'}
                </h3>
                <div 
                  id="output"
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: output }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div className="bg-white/95 dark:bg-jet-800/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-jet-600/50">
            <h2 className="text-2xl font-bold text-center mb-6 text-jet-800 dark:text-platinum-200">
              {language === 'ar' ? 'تعديل النموذج' : 'Formu Düzenle'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  الاسم الكامل (بالتركية)
                </label>
                <input
                  type="text"
                  value={formData.fullNameTR}
                  onChange={(e) => setFormData({...formData, fullNameTR: e.target.value})}
                  placeholder="Örn: Muhammed Muhammed"
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  الاسم الكامل (بالعربية)
                </label>
                <input
                  type="text"
                  value={formData.fullNameAR}
                  onChange={(e) => setFormData({...formData, fullNameAR: e.target.value})}
                  placeholder="مثال: محمد المحمد"
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  رقم الحماية المؤقتة
                </label>
                <input
                  type="text"
                  value={formData.kimlikNo}
                  onChange={(e) => setFormData({...formData, kimlikNo: e.target.value})}
                  placeholder="Örn: 99605285486"
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  اسم المعبر
                </label>
                <select
                  value={formData.sinirKapisi}
                  onChange={(e) => setFormData({...formData, sinirKapisi: e.target.value})}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  required
                >
                  <option value="">اختر المعبر</option>
                  <option value="yayladağı">YAYLADAĞI / كسب</option>
                  <option value="cilvegözü">CİLVEGÖZÜ / باب الهوى</option>
                  <option value="öncüpınar">ÖNCÜPINAR / باب السلامة</option>
                  <option value="istanbul havalimanı">İSTANBUL HAVALİMANI / مطار اسطنبول</option>
                  <option value="çobanbey">ÇOBANBEY / الراعي</option>
                  <option value="zeytindalı">ZEYTİNDALI / غصن الزيتون</option>
                  <option value="karakamış">KARAKAMIŞ / جرابلس</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={formData.gsm}
                  onChange={(e) => setFormData({...formData, gsm: e.target.value})}
                  placeholder="Örn: 0541 717 57 49"
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  هل تريد تغيير تاريخ الطلب؟
                </label>
                <select
                  value={formData.changeDate}
                  onChange={(e) => {
                    setFormData({...formData, changeDate: e.target.value});
                    setShowDatePicker(e.target.value === 'yes');
                  }}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                >
                  <option value="no">لا</option>
                  <option value="yes">نعم</option>
                </select>
              </div>
            </div>

            {showDatePicker && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                  اختر التاريخ الجديد
                </label>
                <input
                  type="date"
                  value={formData.customDate}
                  onChange={(e) => setFormData({...formData, customDate: e.target.value})}
                  className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                />
              </div>
            )}

            {/* Refakat Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-4">
                المرافقين
              </label>
              {refakatEntries.map((entry, index) => (
                <div key={index} className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-jet-600 dark:text-platinum-400 min-w-[80px]">
                    مرافق {index + 1}
                  </span>
                  <input
                    type="text"
                    value={entry.id}
                    onChange={(e) => updateRefakat(index, 'id', e.target.value)}
                    placeholder="رقم الهوية"
                    className="flex-1 px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => updateRefakat(index, 'name', e.target.value)}
                    placeholder="الاسم الكامل"
                    className="flex-1 px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-800 text-jet-900 dark:text-white"
                  />
                  {refakatEntries.length > 1 && (
                    <button
                      onClick={() => removeRefakat(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors duration-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRefakat}
                className="flex items-center gap-2 px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors duration-300"
              >
                <Plus className="w-4 h-4" />
                إضافة مرافق جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoluntaryReturnFormEditor;
