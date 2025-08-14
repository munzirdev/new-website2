import React, { useState } from 'react';
import { X, Send, FileText, AlertCircle, Upload, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';

interface ServiceRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
  serviceTitle: string;
  isDarkMode: boolean;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  isOpen,
  onClose,
  serviceType,
  serviceTitle,
  isDarkMode
}) => {
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
    fileUrl: '',
    fileName: ''
  });

  const handleFileUpload = async (file: File): Promise<{
    url: string;
    name: string;
    path: string;
    isBase64?: boolean;
    base64Data?: string;
  } | null> => {
    if (!file) return null;

    if (!user) {
      console.error('المستخدم غير مسجل الدخول');
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    setUploadingFile(true);
    setError(null);

    try {
      console.log('بدء رفع الملف:', { 
        originalName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        userId: user.id
      });

      // رفع الملف كـ Base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const base64String = base64Data.split(',')[1]; // إزالة data:image/jpeg;base64,
            
            console.log('تم تحويل الملف إلى Base64، الحجم:', base64String.length);
            
            // التحقق من حجم Base64 (لا يتجاوز 1MB)
            if (base64String.length > 1024 * 1024) {
              console.error('حجم الملف كبير جداً بعد التحويل إلى Base64');
              setError('حجم الملف كبير جداً. يرجى اختيار ملف أصغر');
              resolve(null);
              return;
            }
            
            // محاولة حفظ الملف في جدول file_attachments أولاً
            try {
              console.log('محاولة حفظ الملف في file_attachments للمستخدم:', user.id);
              
              const { data: insertData, error: insertError } = await supabase
                .from('file_attachments')
                .insert({
                  user_id: user.id,
                  file_name: file.name,
                  file_type: file.type,
                  file_size: file.size,
                  file_data: base64String,
                  created_at: new Date().toISOString()
                })
                .select()
                .single();
              
              if (insertError) {
                console.error('خطأ في حفظ الملف في file_attachments:', insertError);
                console.log('تفاصيل الخطأ:', {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint
                });
                
                // إذا كان الخطأ يتعلق بالصلاحيات، جرب الحفظ في service_requests
                if (insertError.code === '42501' || insertError.message.includes('permission') || insertError.message.includes('row-level security')) {
                  console.log('خطأ في الصلاحيات، محاولة حفظ في service_requests...');
                  resolve({
                    url: `base64://service_requests/${file.name}`,
                    name: file.name,
                    path: `base64/service_requests/${file.name}`,
                    isBase64: true,
                    base64Data: base64String
                  });
                  return;
                }
                
                // لأي خطأ آخر، جرب الحفظ في service_requests
                console.log('خطأ آخر، محاولة حفظ في service_requests...');
                resolve({
                  url: `base64://service_requests/${file.name}`,
                  name: file.name,
                  path: `base64/service_requests/${file.name}`,
                  isBase64: true,
                  base64Data: base64String
                });
                return;
              } else {
                console.log('تم حفظ الملف في file_attachments بنجاح:', insertData.id);
                resolve({
                  url: `base64://${insertData.id}`,
                  name: file.name,
                  path: `base64/${insertData.id}`,
                  isBase64: true
                });
              }
            } catch (error) {
              console.log('فشل في حفظ الملف في file_attachments، محاولة حفظ في service_requests...');
              console.error('تفاصيل الخطأ:', error);
              
              // محاولة بديلة: حفظ الملف في جدول service_requests مباشرة
              resolve({
                url: `base64://service_requests/${file.name}`,
                name: file.name,
                path: `base64/service_requests/${file.name}`,
                isBase64: true,
                base64Data: base64String
              });
            }
          } catch (error) {
            console.error('خطأ في معالجة الملف:', error);
            setError('فشل في معالجة الملف. يرجى المحاولة مرة أخرى.');
            resolve(null);
          }
        };
        
        reader.onerror = () => {
          console.error('خطأ في قراءة الملف');
          setError('فشل في قراءة الملف. يرجى المحاولة مرة أخرى.');
          resolve(null);
        };
        
        reader.readAsDataURL(file);
      });

    } catch (error) {
      console.error('خطأ غير متوقع في رفع الملف:', error);
      setError('حدث خطأ غير متوقع في رفع الملف. يرجى المحاولة مرة أخرى.');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // إعادة تعيين الأخطاء
    setError(null);

    // التحقق من نوع الملف
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('نوع الملف غير مدعوم. يرجى اختيار صورة (JPG, PNG, GIF) أو ملف PDF أو Word');
      return;
    }

    // التحقق من حجم الملف (2MB كحد أقصى للـ Base64)
    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت');
      return;
    }

    console.log('تم اختيار الملف:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setFormData({...formData, file});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    // Check if user profile exists, if not create one automatically
    if (!profile) {
      console.log('User profile not found, attempting to create one...');
      try {
        const { data: newProfile, error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم جديد',
            phone: user.user_metadata?.phone || null,
            country_code: user.user_metadata?.country_code || '+90',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          setError('مشكلة في إنشاء الملف الشخصي. يرجى المحاولة مرة أخرى.');
          return;
        }

        console.log('User profile created successfully:', newProfile);
      } catch (error) {
        console.error('Error in profile creation:', error);
        setError('مشكلة في إنشاء الملف الشخصي. يرجى المحاولة مرة أخرى.');
        return;
      }
    }

    if (!formData.title.trim()) {
      setError('يرجى إدخال عنوان الطلب');
      return;
    }

    setLoading(true);
    setError(null);

    let fileUrl = '';
    let fileName = '';
    let fileData = null;

    // رفع الملف إذا كان موجوداً
    if (formData.file) {
      console.log('بدء رفع الملف...');
      const uploadResult = await handleFileUpload(formData.file);
      if (uploadResult) {
        fileUrl = uploadResult.url || '';
        fileName = uploadResult.name || '';
        fileData = uploadResult.base64Data || null;
        
        console.log('تم رفع الملف بنجاح:', {
          url: fileUrl,
          name: fileName,
          hasBase64Data: !!fileData
        });
        
        // إذا كان الملف محفوظ كـ Base64 في service_requests
        if (uploadResult.base64Data) {
          console.log('الملف سيتم حفظه في جدول service_requests');
        }
      } else {
        console.error('فشل في رفع الملف');
        setError('فشل في رفع الملف. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('محاولة إرسال الطلب للمستخدم:', user.id);
      console.log('بيانات الطلب:', {
        service_type: serviceType,
        title: formData.title.trim(),
        hasFile: !!fileData,
        fileUrl: fileUrl
      });
      
      const { error: insertError } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          service_type: serviceType,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          priority: 'medium',
          status: 'pending',
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_data: fileData
        });

      if (insertError) {
        console.error('خطأ في إرسال الطلب:', insertError);
        
        // إذا كان الخطأ يتعلق بالصلاحيات، حاول إصلاح المشكلة
        if (insertError.code === '42501' || insertError.message.includes('permission')) {
          console.log('خطأ في الصلاحيات، محاولة إصلاح...');
          setError('مشكلة في الصلاحيات. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.');
        } else if (insertError.code === '23503' || insertError.message.includes('foreign key')) {
          console.log('خطأ في العلاقة الخارجية، محاولة إصلاح...');
          setError('مشكلة في البيانات. يرجى المحاولة مرة أخرى.');
        } else {
          setError('حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
        }
        return;
      }

      setSuccess(true);
      setFormData({ 
        title: '', 
        description: '', 
        file: null,
        fileUrl: '',
        fileName: ''
      });
      
      // إغلاق النافذة بعد 2 ثانية
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // التحقق من إمكانية رفع الملفات للخدمات المحددة
  const canUploadFile = serviceType === 'translation' || serviceType === 'insurance';

  // دالة لتحميل الملفات بشكل صحيح
  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('فشل في تحميل الملف');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      setError('فشل في تحميل الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
            تم إرسال الطلب بنجاح!
          </h2>
          <p className="text-jet-600 dark:text-platinum-400 mb-4">
            سيتم التواصل معك قريباً لمتابعة طلبك
          </p>
          <div className="w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-jet-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-platinum-300 dark:border-jet-600 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-jet-400 hover:text-jet-600 dark:text-platinum-400 dark:hover:text-platinum-200 transition-colors duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-caribbean-100 dark:bg-caribbean-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-caribbean-600 dark:text-caribbean-400" />
          </div>
          <h2 className="text-2xl font-bold text-jet-800 dark:text-white mb-2">
            طلب خدمة جديد
          </h2>
          <p className="text-jet-600 dark:text-platinum-400">
            {serviceTitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
              عنوان الطلب *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
              placeholder="مثال: ترجمة شهادة الميلاد"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
              وصف الطلب
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-jet-700 text-jet-900 dark:text-white"
              placeholder="اكتب تفاصيل إضافية عن طلبك..."
            />
          </div>

          {/* File Upload - only for translation and insurance services */}
          {canUploadFile && (
            <div>
              <label className="block text-sm font-medium text-jet-700 dark:text-platinum-300 mb-2">
                {serviceType === 'translation' ? 'صورة الوثيقة المطلوب ترجمتها' : 'صورة جواز السفر أو الإقامة'}
              </label>
              <div className="relative border-2 border-dashed border-platinum-300 dark:border-jet-600 rounded-lg p-6 text-center hover:border-caribbean-500 dark:hover:border-caribbean-400 transition-colors duration-300">
                {formData.file ? (
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <Image className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {formData.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, file: null})}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-jet-400 dark:text-platinum-500 mx-auto mb-4" />
                    <p className="text-jet-600 dark:text-platinum-400 mb-2">
                      اضغط لاختيار ملف أو اسحبه هنا
                    </p>
                    <p className="text-xs text-jet-500 dark:text-platinum-500">
                      JPG, PNG, GIF, PDF (حتى 5 ميجابايت)
                    </p>
                  </>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={uploadingFile}
                />
              </div>
              <p className="text-xs text-jet-500 dark:text-platinum-500 mt-1">
                {serviceType === 'translation' 
                  ? 'رفع صورة الوثيقة يساعدنا في تقديم عرض سعر دقيق'
                  : 'رفع صورة الوثائق يسرع من عملية معالجة طلبك'
                }
              </p>
            </div>
          )}



          <div className="bg-platinum-50 dark:bg-jet-700 p-4 rounded-lg">
            <h4 className="font-medium text-jet-800 dark:text-white mb-2">معلومات التواصل</h4>
            <div className="text-sm text-jet-600 dark:text-platinum-400 space-y-1">
              <p><strong>الاسم:</strong> {profile?.full_name}</p>
              <p><strong>البريد الإلكتروني:</strong> {profile?.email}</p>
              {profile?.phone && (
                <p><strong>الهاتف:</strong> {profile.country_code} {profile.phone}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingFile}
            className="w-full bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {loading || uploadingFile ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                {uploadingFile ? 'جاري رفع الملف...' : 'جاري الإرسال...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5 ml-2" />
                إرسال الطلب
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-jet-500 dark:text-platinum-500">
            سيتم التواصل معك خلال 24 ساعة لمتابعة طلبك
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
