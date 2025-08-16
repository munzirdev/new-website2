import React from 'react';
import { X, Shield, FileText, CheckCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface TermsOfServiceProps {
  onClose: () => void;
  isDarkMode: boolean;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose, isDarkMode }) => {
  const { t, language } = useLanguage();

  const termsContent = {
    ar: {
      title: 'شروط الاستخدام',
      lastUpdated: 'آخر تحديث: ديسمبر 2024',
      sections: [
        {
          title: '1. قبول الشروط',
          content: 'باستخدام خدمات مجموعة تواصل، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام خدماتنا.'
        },
        {
          title: '2. وصف الخدمات',
          content: 'نحن نقدم خدمات متنوعة في تركيا تشمل التأمين الصحي، الترجمة، السفر، الخدمات القانونية، الخدمات الحكومية، والتأمين العام.'
        },
        {
          title: '3. الأهلية',
          content: 'يجب أن تكون عمرك 18 عاماً أو أكثر لاستخدام خدماتنا. إذا كنت قاصراً، يجب أن تحصل على موافقة الوالدين أو الوصي القانوني.'
        },
        {
          title: '4. الحساب والمسؤولية',
          content: 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور الخاصة بك. أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك.'
        },
        {
          title: '5. الاستخدام المقبول',
          content: 'يجب استخدام خدماتنا فقط للأغراض القانونية والمشروعة. يحظر استخدام خدماتنا لأي نشاط غير قانوني أو ضار.'
        },
        {
          title: '6. الملكية الفكرية',
          content: 'جميع المحتويات والعلامات التجارية والبرامج المستخدمة في خدماتنا هي ملك لمجموعة تواصل أو شركائنا المرخص لهم.'
        },
        {
          title: '7. الخصوصية',
          content: 'سيتم التعامل مع معلوماتك الشخصية وفقاً لسياسة الخصوصية الخاصة بنا، والتي تشكل جزءاً لا يتجزأ من هذه الشروط.'
        },
        {
          title: '8. التعديلات',
          content: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.'
        },
        {
          title: '9. إنهاء الخدمة',
          content: 'يمكننا إنهاء أو تعليق حسابك في أي وقت لأي سبب، بما في ذلك انتهاك هذه الشروط أو السلوك غير المقبول.'
        },
        {
          title: '10. القانون المطبق',
          content: 'تخضع هذه الشروط لقوانين جمهورية تركيا. أي نزاعات ستخضع للاختصاص القضائي للمحاكم التركية.'
        }
      ]
    },
    tr: {
      title: 'Kullanım Şartları',
      lastUpdated: 'Son güncelleme: Aralık 2024',
      sections: [
        {
          title: '1. Şartları Kabul Etme',
          content: 'Tevasul Group hizmetlerini kullanarak bu şartları ve koşulları kabul etmiş olursunuz. Bu şartların herhangi bir kısmını kabul etmiyorsanız, lütfen hizmetlerimizi kullanmayın.'
        },
        {
          title: '2. Hizmet Açıklaması',
          content: 'Türkiye\'de sağlık sigortası, çeviri, seyahat, yasal hizmetler, devlet hizmetleri ve genel sigorta dahil olmak üzere çeşitli hizmetler sunuyoruz.'
        },
        {
          title: '3. Uygunluk',
          content: 'Hizmetlerimizi kullanmak için 18 yaşında veya daha büyük olmalısınız. Reşit değilseniz, ebeveyn veya yasal vasinizin onayını almalısınız.'
        },
        {
          title: '4. Hesap ve Sorumluluk',
          content: 'Hesap bilgilerinizi ve şifrenizi gizli tutmaktan sorumlusunuz. Hesabınız altında gerçekleşen tüm faaliyetlerden sorumlusunuz.'
        },
        {
          title: '5. Kabul Edilebilir Kullanım',
          content: 'Hizmetlerimiz yalnızca yasal ve meşru amaçlar için kullanılmalıdır. Hizmetlerimizi herhangi bir yasa dışı veya zararlı faaliyet için kullanmak yasaktır.'
        },
        {
          title: '6. Fikri Mülkiyet',
          content: 'Hizmetlerimizde kullanılan tüm içerik, ticari markalar ve yazılımlar Tevasul Group veya lisanslı ortaklarımıza aittir.'
        },
        {
          title: '7. Gizlilik',
          content: 'Kişisel bilgileriniz gizlilik politikamıza göre işlenecektir ve bu şartların ayrılmaz bir parçasıdır.'
        },
        {
          title: '8. Değişiklikler',
          content: 'Bu şartları herhangi bir zamanda değiştirme hakkını saklı tutarız. Önemli değişiklikler hakkında e-posta veya site bildirimi ile bilgilendirileceksiniz.'
        },
        {
          title: '9. Hizmet Sonlandırma',
          content: 'Bu şartları ihlal etme veya kabul edilemez davranış dahil olmak üzere herhangi bir nedenle hesabınızı herhangi bir zamanda sonlandırabilir veya askıya alabiliriz.'
        },
        {
          title: '10. Uygulanabilir Hukuk',
          content: 'Bu şartlar Türkiye Cumhuriyeti yasalarına tabidir. Herhangi bir anlaşmazlık Türk mahkemelerinin yargı yetkisine tabi olacaktır.'
        }
      ]
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: December 2024',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: 'By using Tevasul Group services, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use our services.'
        },
        {
          title: '2. Service Description',
          content: 'We provide various services in Turkey including health insurance, translation, travel, legal services, government services, and general insurance.'
        },
        {
          title: '3. Eligibility',
          content: 'You must be 18 years of age or older to use our services. If you are a minor, you must obtain consent from your parent or legal guardian.'
        },
        {
          title: '4. Account and Responsibility',
          content: 'You are responsible for maintaining the confidentiality of your account information and password. You are responsible for all activities that occur under your account.'
        },
        {
          title: '5. Acceptable Use',
          content: 'Our services should only be used for legal and legitimate purposes. Using our services for any illegal or harmful activity is prohibited.'
        },
        {
          title: '6. Intellectual Property',
          content: 'All content, trademarks, and software used in our services are owned by Tevasul Group or our licensed partners.'
        },
        {
          title: '7. Privacy',
          content: 'Your personal information will be handled according to our privacy policy, which forms an integral part of these terms.'
        },
        {
          title: '8. Modifications',
          content: 'We reserve the right to modify these terms at any time. You will be notified of any material changes via email or site notification.'
        },
        {
          title: '9. Service Termination',
          content: 'We may terminate or suspend your account at any time for any reason, including violation of these terms or unacceptable behavior.'
        },
        {
          title: '10. Governing Law',
          content: 'These terms are subject to the laws of the Republic of Turkey. Any disputes will be subject to the jurisdiction of Turkish courts.'
        }
      ]
    }
  };

  const content = termsContent[language as keyof typeof termsContent] || termsContent.ar;

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
              <FileText className="w-6 h-6" />
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
            {content.sections.map((section, index) => (
              <div key={index} className={`p-6 rounded-xl ${
                isDarkMode 
                  ? 'bg-jet-700/50 border border-jet-600' 
                  : 'bg-platinum-50/50 border border-platinum-200'
              }`}>
                <div className="flex items-start space-x-3 space-x-reverse mb-4">
                  <div className={`p-1.5 rounded-full ${
                    isDarkMode ? 'bg-caribbean-500/20' : 'bg-caribbean-100'
                  }`}>
                    <CheckCircle className={`w-4 h-4 ${
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
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-6 border-t ${
          isDarkMode ? 'border-jet-600 bg-jet-800/80' : 'border-platinum-200 bg-white/80'
        } backdrop-blur-md`}>
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <p className={`text-sm ${
              isDarkMode ? 'text-platinum-400' : 'text-jet-600'
            }`}>
              {language === 'ar' ? 'هذه الشروط تحمي حقوقك وحقوقنا' : 
               language === 'tr' ? 'Bu şartlar haklarınızı ve haklarımızı korur' :
               'These terms protect your rights and our rights'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
