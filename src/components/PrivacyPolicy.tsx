import React from 'react';
import { X, Shield, Lock, Eye, Database, Users, Globe } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface PrivacyPolicyProps {
  onClose: () => void;
  isDarkMode: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose, isDarkMode }) => {
  const { t, language } = useLanguage();

  const privacyContent = {
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: ديسمبر 2024',
      sections: [
        {
          title: '1. مقدمة',
          content: 'نحن في مجموعة تواصل نلتزم بحماية خصوصيتك. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام خدماتنا.',
          icon: Shield
        },
        {
          title: '2. المعلومات التي نجمعها',
          content: 'نجمع معلومات مثل الاسم، البريد الإلكتروني، رقم الهاتف، العنوان، معلومات الهوية، ومعلومات الخدمات المطلوبة لتقديم خدماتنا بشكل فعال.',
          icon: Database
        },
        {
          title: '3. كيفية استخدام المعلومات',
          content: 'نستخدم معلوماتك لتقديم الخدمات المطلوبة، التواصل معك، تحسين خدماتنا، وإرسال التحديثات المهمة المتعلقة بحسابك.',
          icon: Users
        },
        {
          title: '4. مشاركة المعلومات',
          content: 'لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا عند الضرورة لتقديم الخدمات أو عند طلب القانون.',
          icon: Globe
        },
        {
          title: '5. حماية المعلومات',
          content: 'نستخدم تقنيات تشفير متقدمة وحماية قوية لحماية معلوماتك من الوصول غير المصرح به أو الاستخدام أو الكشف.',
          icon: Lock
        },
        {
          title: '6. ملفات تعريف الارتباط',
          content: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم وتذكر تفضيلاتك. يمكنك التحكم في إعدادات ملفات تعريف الارتباط في متصفحك.',
          icon: Eye
        },
        {
          title: '7. حقوقك',
          content: 'لديك الحق في الوصول إلى معلوماتك الشخصية وتحديثها أو حذفها أو تصحيحها. يمكنك أيضاً طلب نسخة من معلوماتك أو سحب موافقتك.',
          icon: Shield
        },
        {
          title: '8. الاحتفاظ بالبيانات',
          content: 'نحتفظ بمعلوماتك طالما كان ذلك ضرورياً لتقديم الخدمات أو الوفاء بالالتزامات القانونية. نحذف المعلومات عند عدم الحاجة إليها.',
          icon: Database
        },
        {
          title: '9. التغييرات على السياسة',
          content: 'قد نحدث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.',
          icon: Users
        },
        {
          title: '10. التواصل معنا',
          content: 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف المذكور في موقعنا.',
          icon: Globe
        }
      ]
    },
    tr: {
      title: 'Gizlilik Politikası',
      lastUpdated: 'Son güncelleme: Aralık 2024',
      sections: [
        {
          title: '1. Giriş',
          content: 'Tevasul Group olarak gizliliğinizi korumaya kararlıyız. Bu politika, hizmetlerimizi kullanırken kişisel bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.',
          icon: Shield
        },
        {
          title: '2. Topladığımız Bilgiler',
          content: 'Ad, e-posta, telefon numarası, adres, kimlik bilgileri ve hizmet talepleri gibi bilgileri hizmetlerimizi etkili bir şekilde sunmak için topluyoruz.',
          icon: Database
        },
        {
          title: '3. Bilgilerin Kullanımı',
          content: 'Bilgilerinizi talep edilen hizmetleri sunmak, sizinle iletişim kurmak, hizmetlerimizi iyileştirmek ve hesabınızla ilgili önemli güncellemeler göndermek için kullanıyoruz.',
          icon: Users
        },
        {
          title: '4. Bilgi Paylaşımı',
          content: 'Kişisel bilgilerinizi hizmetleri sunmak için gerekli olduğunda veya yasa tarafından talep edildiğinde üçüncü taraflarla satmaz, kiralamaz veya paylaşmayız.',
          icon: Globe
        },
        {
          title: '5. Bilgi Koruması',
          content: 'Bilgilerinizi yetkisiz erişim, kullanım veya ifşadan korumak için gelişmiş şifreleme teknolojileri ve güçlü güvenlik önlemleri kullanıyoruz.',
          icon: Lock
        },
        {
          title: '6. Çerezler',
          content: 'Kullanıcı deneyimini iyileştirmek ve tercihlerinizi hatırlamak için çerezler kullanıyoruz. Tarayıcınızda çerez ayarlarını kontrol edebilirsiniz.',
          icon: Eye
        },
        {
          title: '7. Haklarınız',
          content: 'Kişisel bilgilerinize erişme, güncelleme, silme veya düzeltme hakkına sahipsiniz. Ayrıca bilgilerinizin bir kopyasını talep edebilir veya onayınızı geri çekebilirsiniz.',
          icon: Shield
        },
        {
          title: '8. Veri Saklama',
          content: 'Bilgilerinizi hizmetleri sunmak veya yasal yükümlülükleri yerine getirmek için gerekli olduğu sürece saklıyoruz. Artık gerekli olmadığında bilgileri siliyoruz.',
          icon: Database
        },
        {
          title: '9. Politika Değişiklikleri',
          content: 'Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler hakkında e-posta veya site bildirimi ile bilgilendirileceksiniz.',
          icon: Users
        },
        {
          title: '10. Bizimle İletişim',
          content: 'Bu gizlilik politikası hakkında herhangi bir sorunuz varsa, web sitemizde belirtilen e-posta veya telefon yoluyla bizimle iletişime geçebilirsiniz.',
          icon: Globe
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: December 2024',
      sections: [
        {
          title: '1. Introduction',
          content: 'At Tevasul Group, we are committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when using our services.',
          icon: Shield
        },
        {
          title: '2. Information We Collect',
          content: 'We collect information such as name, email, phone number, address, identification details, and service requirements to provide our services effectively.',
          icon: Database
        },
        {
          title: '3. How We Use Information',
          content: 'We use your information to provide requested services, communicate with you, improve our services, and send important updates related to your account.',
          icon: Users
        },
        {
          title: '4. Information Sharing',
          content: 'We do not sell, rent, or share your personal information with third parties except when necessary to provide services or when required by law.',
          icon: Globe
        },
        {
          title: '5. Information Protection',
          content: 'We use advanced encryption technologies and strong security measures to protect your information from unauthorized access, use, or disclosure.',
          icon: Lock
        },
        {
          title: '6. Cookies',
          content: 'We use cookies to improve user experience and remember your preferences. You can control cookie settings in your browser.',
          icon: Eye
        },
        {
          title: '7. Your Rights',
          content: 'You have the right to access, update, delete, or correct your personal information. You can also request a copy of your information or withdraw your consent.',
          icon: Shield
        },
        {
          title: '8. Data Retention',
          content: 'We retain your information as long as necessary to provide services or fulfill legal obligations. We delete information when no longer needed.',
          icon: Database
        },
        {
          title: '9. Policy Changes',
          content: 'We may update this policy from time to time. You will be notified of any material changes via email or site notification.',
          icon: Users
        },
        {
          title: '10. Contact Us',
          content: 'If you have any questions about this privacy policy, you can contact us via email or phone listed on our website.',
          icon: Globe
        }
      ]
    }
  };

  const content = privacyContent[language as keyof typeof privacyContent] || privacyContent.ar;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
        isDarkMode 
          ? 'bg-gradient-to-br from-jet-800 via-jet-700 to-jet-900 border border-jet-600' 
          : 'bg-gradient-to-br from-white via-platinum-50 to-white border border-platinum-300'
      }`}>
        
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-jet-600 bg-jet-800/80' : 'border-platinum-200 bg-white/80'
        } backdrop-blur-md`}>
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-caribbean-500/20 text-caribbean-400' : 'bg-caribbean-100 text-caribbean-600'
            }`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-jet-800'
              }`}>
                {content.title}
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-platinum-400' : 'text-jet-600'
              }`}>
                {content.lastUpdated}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode 
                ? 'text-platinum-400 hover:text-white hover:bg-jet-700' 
                : 'text-jet-600 hover:text-jet-800 hover:bg-platinum-100'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="space-y-6">
            {content.sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div key={index} className={`p-6 rounded-xl ${
                  isDarkMode 
                    ? 'bg-jet-700/50 border border-jet-600' 
                    : 'bg-platinum-50/50 border border-platinum-200'
                }`}>
                  <div className="flex items-start space-x-3 space-x-reverse mb-4">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-caribbean-500/20' : 'bg-caribbean-100'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isDarkMode ? 'text-caribbean-400' : 'text-caribbean-600'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-jet-800'
                    }`}>
                      {section.title}
                    </h3>
                  </div>
                  <p className={`leading-relaxed ${
                    isDarkMode ? 'text-platinum-300' : 'text-jet-700'
                  }`}>
                    {section.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-6 border-t ${
          isDarkMode ? 'border-jet-600 bg-jet-800/80' : 'border-platinum-200 bg-white/80'
        } backdrop-blur-md`}>
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <p className={`text-sm ${
              isDarkMode ? 'text-platinum-400' : 'text-jet-600'
            }`}>
              {language === 'ar' ? 'نحن نحمي خصوصيتك ونحترم حقوقك' : 
               language === 'tr' ? 'Gizliliğinizi koruyoruz ve haklarınıza saygı duyuyoruz' :
               'We protect your privacy and respect your rights'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
