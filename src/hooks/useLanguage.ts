import { useState, useEffect, createContext, useContext } from 'react';

export type Language = 'ar' | 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string | string[];
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation data
const translations = {
  ar: {
    // Navbar
    'navbar.home': 'الرئيسية',
    'navbar.contact': 'تواصل معنا',
    'navbar.account': 'حسابي',
    'navbar.settings': 'الإعدادات',
    'navbar.help': 'المساعدة',
    'navbar.logout': 'تسجيل الخروج',
    'navbar.welcome': 'مرحباً بك في مجموعة تواصل',
    'navbar.darkMode': 'الوضع الليلي',
    'navbar.lightMode': 'الوضع النهاري',

    // Hero Section
    'hero.title': 'أنجز معنا جميع خدماتك في تركيا',
    'hero.subtitle': 'نحن شركاؤك الموثوقون لإنجاز جميع احتياجاتك في تركيا بكفاءة واحترافية عالية',
    'hero.cta.primary': 'ابدأ الآن',
    'hero.cta.secondary': 'تعرف على خدماتنا',

    // Services Section
    'services.title': 'خدماتنا المتميزة',
    'services.subtitle': 'نقدم مجموعة شاملة من الخدمات المصممة خصيصاً لتلبية احتياجاتك',
    
    // Health Insurance Services
    'services.healthInsurance.title': 'التأمين الصحي للأجانب',
    'services.healthInsurance.description': 'تأمين صحي شامل للأجانب في تركيا بأفضل الأسعار والتغطية',
    'services.healthInsurance.fullDescription': 'نقدم خدمات التأمين الصحي الشاملة للأجانب في تركيا. نحن نتعاون مع أفضل شركات التأمين التركية لتقديم أفضل الأسعار والتغطية الشاملة. تأميننا يشمل جميع الخدمات الطبية والعلاجية مع شبكة واسعة من المستشفيات والعيادات في جميع أنحاء تركيا.',
    'services.healthInsurance.features': [
      'تأمين صحي شامل للأفراد والعائلات',
      'أسعار تنافسية حسب الفئة العمرية',
      'تغطية شاملة لجميع الخدمات الطبية',
      'شبكة واسعة من المستشفيات والعيادات',
      'خدمة عملاء متاحة على مدار الساعة',
      'إجراءات سريعة وبسيطة',
      'تأمين لمدة سنة أو سنتين',
      'استشارة مجانية لاختيار أفضل خطة'
    ],
    'services.healthInsurance.benefits': [
      'حماية مالية شاملة للأسرة',
      'راحة البال والاطمئنان',
      'توفير في التكاليف الطبية',
      'خدمة طبية عالية الجودة'
    ],
    'services.healthInsurance.process': [
      'تحديد الفئة العمرية ومدة التأمين',
      'اختيار شركة التأمين المناسبة',
      'حساب السعر النهائي',
      'تقديم الطلب والحصول على التأمين',
      'استلام وثائق التأمين'
    ],
    
    // Translation Services
    'services.translation.title': 'خدمات الترجمة المحلفة',
    'services.translation.description': 'ترجمة معتمدة لجميع الوثائق والمستندات الرسمية والقانونية',
    'services.translation.fullDescription': 'نقدم خدمات الترجمة المحلفة الأكثر دقة واحترافية في تركيا. فريقنا من المترجمين المعتمدين يضمن ترجمة دقيقة لجميع وثائقك الرسمية والقانونية والطبية والأكاديمية. نحن معتمدون من قبل الجهات الرسمية التركية ونضمن قبول ترجماتنا في جميع المؤسسات الحكومية والخاصة.',
    'services.translation.features': [
      'ترجمة معتمدة من الجهات الرسمية',
      'مترجمون محلفون ومعتمدون',
      'ترجمة فورية للحالات العاجلة',
      'دقة 100% في الترجمة',
      'أسعار تنافسية',
      'خدمة عملاء 24/7',
      'ضمان القبول في جميع المؤسسات',
      'ترجمة جميع اللغات'
    ],
    'services.translation.benefits': [
      'توفير الوقت والجهد',
      'ضمان الدقة والاحترافية',
      'قبول مضمون في المؤسسات',
      'أسعار مناسبة للجميع'
    ],
    'services.translation.process': [
      'إرسال الوثائق المطلوب ترجمتها عبر الواتساب أو الإيميل',
      'تقييم الوثائق وتحديد السعر والمدة الزمنية',
      'البدء في عملية الترجمة من قبل مترجمين معتمدين',
      'مراجعة الترجمة من قبل فريق الجودة',
      'تسليم الترجمة المعتمدة والمختومة'
    ],
    
    // Travel Services
    'services.travel.title': 'خدمات السفر والسياحة',
    'services.travel.description': 'تنظيم الرحلات السياحية وحجز الفنادق وخدمات النقل والمواصلات',
    'services.travel.fullDescription': 'اكتشف جمال تركيا مع باقاتنا السياحية المتنوعة والمصممة خصيصاً لتناسب جميع الأذواق والميزانيات. نحن نقدم تجربة سياحية لا تُنسى تشمل أفضل الوجهات التركية مع خدمات متكاملة من النقل والإقامة والجولات السياحية المصحوبة بمرشدين عرب متخصصين.',
    'services.travel.features': [
      'برامج سياحية متنوعة ومخصصة',
      'حجز فنادق بأفضل الأسعار',
      'نقل مريح وآمن',
      'مرشدين سياحيين عرب',
      'جولات ثقافية وتاريخية',
      'رحلات عائلية وشبابية',
      'خدمة عملاء طوال الرحلة',
      'تأمين سفر شامل'
    ],
    'services.travel.benefits': [
      'تجربة سياحية مميزة',
      'أسعار تنافسية',
      'راحة وأمان تام',
      'ذكريات لا تُنسى'
    ],
    'services.travel.process': [
      'استشارة مجانية لتحديد نوع الرحلة المناسبة',
      'تصميم برنامج سياحي مخصص حسب رغباتك',
      'حجز الفنادق ووسائل النقل',
      'تنسيق الجولات السياحية والأنشطة',
      'مرافقة ومتابعة طوال فترة الرحلة'
    ],
    
    // Legal Services
    'services.legal.title': 'الاستشارات القانونية',
    'services.legal.description': 'استشارات قانونية متخصصة في القانون التركي والإجراءات القضائية',
    'services.legal.fullDescription': 'احصل على أفضل الاستشارات القانونية من فريق من المحامين المتخصصين في القانون التركي. نحن نقدم خدمات قانونية شاملة تغطي جميع جوانب القانون التركي من العقارات والشركات إلى قضايا الأسرة والجنسية. خبرتنا الواسعة تضمن لك الحصول على أفضل النتائج.',
    'services.legal.features': [
      'محامون متخصصون في القانون التركي',
      'استشارات في جميع المجالات القانونية',
      'تمثيل قانوني أمام المحاكم',
      'صياغة العقود والاتفاقيات',
      'استشارات عقارية وتجارية',
      'قضايا الجنسية والإقامة',
      'حل النزاعات والوساطة',
      'خدمات قانونية للشركات'
    ],
    'services.legal.benefits': [
      'حماية حقوقك القانونية',
      'توفير المال والوقت',
      'نتائج مضمونة',
      'سرية تامة'
    ],
    'services.legal.process': [
      'استشارة أولية مجانية لفهم قضيتك',
      'تحليل الوضع القانوني وتقييم الخيارات',
      'وضع استراتيجية قانونية مناسبة',
      'تنفيذ الإجراءات القانونية المطلوبة',
      'متابعة القضية حتى الوصول للنتيجة المطلوبة'
    ],
    
    // Government Services
    'services.government.title': 'الخدمات الحكومية',
    'services.government.description': 'إنجاز جميع المعاملات الحكومية والرسمية في تركيا بسرعة وكفاءة عالية',
    'services.government.fullDescription': 'نحن خبراؤك في إنجاز جميع المعاملات الحكومية في تركيا. من استخراج الوثائق الرسمية إلى تجديد الإقامات وإنجاز معاملات الجنسية، نحن نوفر عليك الوقت والجهد ونضمن إنجاز معاملاتك بأسرع وقت ممكن وبأعلى مستوى من الدقة والاحترافية.',
    'services.government.features': [
      'استخراج جميع الوثائق الرسمية',
      'تجديد الإقامات والتصاريح',
      'معاملات الجنسية التركية',
      'تسجيل الشركات والعلامات التجارية',
      'معاملات الضرائب والتأمينات',
      'استخراج رخص القيادة',
      'معاملات العقارات والطابو',
      'خدمات البلدية والمحافظة'
    ],
    'services.government.benefits': [
      'توفير الوقت والجهد',
      'تجنب الأخطاء والتأخير',
      'خبرة في النظام التركي',
      'متابعة مستمرة'
    ],
    'services.government.process': [
      'تحديد نوع المعاملة المطلوبة والوثائق اللازمة',
      'جمع وتحضير جميع الوثائق المطلوبة',
      'تقديم الطلبات في الجهات المختصة',
      'متابعة سير المعاملة مع الجهات الحكومية',
      'استلام الوثائق وتسليمها للعميل'
    ],
    
    // Insurance Services
    'services.insurance.title': 'خدمات التأمين الصحي وتأمين المركبات',
    'services.insurance.description': 'مساعدة في الحصول على التأمين الصحي وتأمين المركبات بأفضل الأسعار',
    'services.insurance.fullDescription': 'احم نفسك وعائلتك ومركبتك مع خدماتنا المتخصصة في التأمين. نحن نساعدك في اختيار أفضل بوالص التأمين الصحي وتأمين المركبات التي تناسب احتياجاتك وميزانيتك. شراكاتنا مع أفضل شركات التأمين في تركيا تضمن لك الحصول على أفضل الأسعار والتغطية الشاملة.',
    'services.insurance.features': [
      'تأمين صحي شامل للأفراد والعائلات',
      'تأمين المركبات ضد جميع المخاطر',
      'أفضل الأسعار في السوق',
      'تغطية شاملة ومرنة',
      'خدمة المطالبات السريعة',
      'شبكة واسعة من المستشفيات',
      'تأمين السفر والحوادث',
      'استشارة مجانية لاختيار التأمين المناسب'
    ],
    'services.insurance.benefits': [
      'حماية مالية شاملة',
      'راحة البال والأمان',
      'خدمات طبية متميزة',
      'توفير في التكاليف'
    ],
    'services.insurance.process': [
      'تقييم احتياجاتك التأمينية الشخصية',
      'مقارنة العروض من أفضل شركات التأمين',
      'اختيار البوليصة الأنسب لك',
      'إتمام إجراءات التأمين والدفع',
      'متابعة مستمرة وخدمة ما بعد البيع'
    ],

    // How We Work Section
    'howWeWork.title': 'كيف نعمل؟',
    'howWeWork.step1': 'تقييم احتياجاتك الأمنية الشخصية',
    'howWeWork.step2': 'مقارنة العروض من أفضل شركات التأمين',
    'howWeWork.step3': 'اختيار البوليصة الأنسب لك',
    'howWeWork.step4': 'إتمام إجراءات التأمين والدفع',
    'howWeWork.step5': 'متابعة مستمرة وخدمة ما بعد البيع',

    // Stats Section
    'stats.clients': 'عميل راضٍ',
    'stats.services': 'خدمة مكتملة',
    'stats.experience': 'سنوات خبرة',
    'stats.satisfaction': 'نسبة الرضا',

    // Contact Section
    'contact.title': 'تواصل معنا',
    'contact.subtitle': 'نحن هنا لمساعدتك في جميع احتياجاتك',
    'contact.form.name': 'الاسم الكامل',
    'contact.form.email': 'البريد الإلكتروني',
    'contact.form.phone': 'رقم الهاتف',
    'contact.form.message': 'رسالتك',
    'contact.form.submit': 'إرسال الرسالة',
    'contact.form.sending': 'جاري الإرسال...',
    'contact.info.phone': 'الهاتف',
    'contact.info.email': 'البريد الإلكتروني',
    'contact.info.address': 'CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin',
    'contact.info.hours': 'ساعات العمل',

    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.welcome': 'مرحباً بك مرة أخرى',
    'auth.joinUs': 'انضم إلى مجموعة تواصل',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'تم بنجاح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.close': 'إغلاق',

    // Navigation
    'nav.home': 'الرئيسية',
    'nav.services': 'خدماتنا',
    'nav.about': 'عنا',
    'nav.contact': 'تواصل معنا',

    // Hero Section Extended
    'hero.mainTitle': 'أنجز جميع خدماتك في تركيا',
    'hero.withUs': 'مع مجموعة تواصل',
    'hero.description': 'نحن شريكك الموثوق في تركيا لإنجاز جميع خدماتك الحكومية والتجارية والشخصية بأعلى مستوى من الاحترافية والكفاءة',
    'hero.discoverServices': 'اكتشف خدماتنا',
    'hero.contactNow': 'تواصل معنا الآن',
    'hero.stats.clients': 'عميل راضٍ',
    'hero.stats.service': 'خدمة على مدار الساعة',
    'hero.stats.experience': 'سنوات خبرة',
    'hero.trust.licensed': ' نحمي معلوماتك',
    'hero.trust.fast': 'خدمة سريعة',
    'hero.trust.excellent': 'تقييم ممتاز',
    'hero.available': 'متاح الآن',
    'hero.discoverServicesShort': 'اكتشف خدماتنا',

    // Services Section Extended
    'services.discoverMore': 'اكتشف المزيد',
    'services.quickRequest': 'طلب سريع',
    'services.loginToRequest': 'سجل دخولك لطلب الخدمة',

    // About Section
    'about.title': 'أنجز معنا',
    'about.description1': 'مجموعة تواصل هي شريكك الموثوق في تركيا لإنجاز جميع خدماتك بكفاءة واحترافية عالية. نحن نفهم تحديات المقيمين والزوار في تركيا ونقدم الحلول المناسبة.',
    'about.description2': 'بفضل خبرتنا الواسعة وشبكة علاقاتنا القوية، نضمن لك إنجاز معاملاتك في أسرع وقت ممكن وبأعلى مستوى من الجودة والدقة.',
    'about.stats.clients': '5000+ عميل راضٍ',
    'about.stats.experience': '10+ سنوات خبرة',
    'about.features.team': 'فريق متخصص',
    'about.features.speed': 'سرعة في الإنجاز',
    'about.features.security': 'أمان وخصوصية',
    'about.features.care': 'أسعار منافسة',
    'about.vision.title': 'رؤيتنا',
    'about.vision.description': 'أن نكون الشريك الأول والأكثر ثقة للعرب في تركيا، ونقدم خدمات متميزة تسهل عليهم حياتهم وتحقق أهدافهم بكل يسر وسهولة.',

    // Contact Section Extended
    'contact.info.title': 'معلومات الاتصال',
    'contact.form.title': 'أرسل لنا رسالة',
    'contact.form.serviceType': 'نوع الخدمة',
    'contact.form.selectService': 'اختر نوع الخدمة',
    'contact.form.translation': 'خدمات الترجمة المحلفة',
    'contact.form.travel': 'خدمات السفر والسياحة',
    'contact.form.legal': 'الاستشارات القانونية',
    'contact.form.government': 'الخدمات الحكومية',
    'contact.form.insurance': 'خدمات التأمين الصحي وتأمين المركبات',

    // Footer
    'footer.description': 'شريكك الموثوق لإنجاز جميع خدماتك في تركيا',
    'footer.copyright': '© 2025 مجموعة تواصل. جميع الحقوق محفوظة. صنع بـ ❤️ بأيدي سوريـّة',
    'footer.quickLinks': 'روابط سريعة',
    'footer.contactInfo': 'معلومات التواصل',

    // User Menu
    'user.profile': 'تعديل الملف الشخصي',
    'user.transactions': 'معاملاتي',
    'user.notifications': 'إعدادات الإشعارات',
    'user.help': 'المساعدة والدعم',
    'user.logout': 'تسجيل الخروج',
    'user.welcome': 'مرحباً،',

    // Language
    'language.change': 'تغيير اللغة',
    'language.arabic': 'العربية',
    'language.turkish': 'Türkçe',
    'language.english': 'English',

    // Admin
    'admin.dashboard': 'لوحة تحكم الأدمن',

    // Service Page Translations
    'servicePage.whyChooseUs': 'لماذا تختار مجموعة تواصل؟',
    'servicePage.extensiveExperience': 'خبرة واسعة',
    'servicePage.extensiveExperienceDesc': 'أكثر من 5 سنوات في خدمة العملاء العرب في تركيا',
    'servicePage.fastCompletion': 'إنجاز سريع',
    'servicePage.fastCompletionDesc': 'نضمن إنجاز خدماتك في أقصر وقت ممكن',
    'servicePage.serviceFeatures': 'مميزات الخدمة',
    'servicePage.howWeWork': 'كيف نعمل؟',
    'servicePage.getFreeConsultation': 'احصل على استشارة مجانية',
    'servicePage.consultationDesc': 'تواصل معنا الآن للحصول على استشارة مجانية حول خدماتنا',
    'servicePage.contactNow': 'تواصل معنا الآن',
    'servicePage.requestServiceNow': 'اطلب الخدمة الآن',
    'servicePage.loginToRequest': 'سجل دخولك لطلب الخدمة',
    'servicePage.readyToStart': 'مستعد لبدء رحلتك معنا؟',
    'servicePage.joinThousands': 'انضم إلى آلاف العملاء الراضين الذين وثقوا بخدماتنا',
    'servicePage.bookFreeConsultation': 'احجز استشارة مجانية',
    'servicePage.talkToExpert': 'تحدث مع خبير',

    // Brand
    'brand.name': 'أنجز',

    // Legal Terms
    'legal.acceptTerms': 'أوافق على شروط الاستخدام',
    'legal.acceptPrivacy': 'أوافق على سياسة الخصوصية',
    'legal.readTerms': 'قراءة شروط الاستخدام',
    'legal.readPrivacy': 'قراءة سياسة الخصوصية',
    'legal.required': 'يجب الموافقة على الشروط والخصوصية للمتابعة',

    // Background Music
    'music.mute': 'كتم الصوت',
    'music.unmute': 'إلغاء الكتم',
    'music.playing': 'الموسيقى تعمل',
    'music.stopped': 'الموسيقى متوقفة',
  },
  tr: {
    // Navbar
    'navbar.home': 'Ana Sayfa',
    'navbar.contact': 'İletişim',
    'navbar.account': 'Hesabım',
    'navbar.settings': 'Ayarlar',
    'navbar.help': 'Yardım',
    'navbar.logout': 'Çıkış Yap',
    'navbar.welcome': 'Tevasul Groupna Hoş Geldiniz',
    'navbar.darkMode': 'Karanlık Mod',
    'navbar.lightMode': 'Aydınlık Mod',

    // Hero Section
    'hero.title': 'Türkiye\'deki Tüm Hizmetlerinizi Bizimle Tamamlayın',
    'hero.subtitle': 'Türkiye\'deki tüm ihtiyaçlarınızı yüksek verimlilik ve profesyonellikle karşılamak için güvenilir ortağınızız',
    'hero.cta.primary': 'Şimdi Başla',
    'hero.cta.secondary': 'Hizmetlerimizi Keşfedin',

    // Services Section
    'services.title': 'Özel Hizmetlerimiz',
    'services.subtitle': 'İhtiyaçlarınızı karşılamak için özel olarak tasarlanmış kapsamlı hizmet yelpazesi sunuyoruz',
    
    // Translation Services
    'services.translation.title': 'Yeminli Tercüme Hizmetleri',
    'services.translation.description': 'Tüm resmi ve yasal belgeler için onaylı tercüme',
    'services.translation.fullDescription': 'Türkiye\'de en doğru ve profesyonel yeminli tercüme hizmetlerini sunuyoruz. Onaylı çevirmenlerimizden oluşan ekibimiz, tüm resmi, yasal, tıbbi ve akademik belgelerinizin doğru çevirisini garanti eder. Türk resmi makamları tarafından onaylıyız ve çevirilerimizin tüm devlet ve özel kurumlarda kabul edilmesini garanti ediyoruz.',
    'services.translation.features': [
      'Resmi makamlardan onaylı tercüme',
      'Yeminli ve onaylı çevirmenler',
      'Acil durumlar için anında tercüme',
      'Çeviride %100 doğruluk',
      'Rekabetçi fiyatlar',
      '7/24 müşteri hizmetleri',
      'Tüm kurumlarda kabul garantisi',
      'Tüm dillerde tercüme'
    ],
    'services.translation.benefits': [
      'Zaman ve emek tasarrufu',
      'Doğruluk ve profesyonellik garantisi',
      'Kurumlarda garanti kabul',
      'Herkes için uygun fiyatlar'
    ],
    'services.translation.process': [
      'Belgeleri WhatsApp veya e-posta ile gönderme',
      'Belgeleri değerlendirme ve fiyat/süre belirleme',
      'Onaylı çevirmenler tarafından çeviri sürecine başlama',
      'Kalite ekibi tarafından çeviri incelemesi',
      'Onaylı ve mühürlü çeviriyi teslim etme'
    ],
    
    // Travel Services
    'services.travel.title': 'Seyahat ve Turizm Hizmetleri',
    'services.travel.description': 'Tur organizasyonu, otel rezervasyonu ve ulaşım hizmetleri',
    'services.travel.fullDescription': 'Türkiye\'nin güzelliklerini çeşitli ve özel olarak tasarlanmış tur paketlerimizle keşfedin. Tüm zevkler ve bütçeler için uygun. En iyi Türk destinasyonlarını kapsayan unutulmaz bir turistik deneyim sunuyoruz, ulaşım, konaklama ve Arap uzman rehberler eşliğinde turistik turlar dahil kapsamlı hizmetlerle.',
    'services.travel.features': [
      'Çeşitli ve özel tur programları',
      'En iyi fiyatlarla otel rezervasyonu',
      'Rahat ve güvenli ulaşım',
      'Arap turist rehberleri',
      'Kültürel ve tarihi turlar',
      'Aile ve gençlik turları',
      'Tüm seyahat boyunca müşteri hizmetleri',
      'Kapsamlı seyahat sigortası'
    ],
    'services.travel.benefits': [
      'Özel turistik deneyim',
      'Rekabetçi fiyatlar',
      'Tam rahatlık ve güvenlik',
      'Unutulmaz anılar'
    ],
    'services.travel.process': [
      'Uygun tur türünü belirlemek için ücretsiz danışmanlık',
      'İsteklerinize göre özel turistik program tasarımı',
      'Otel ve ulaşım araçları rezervasyonu',
      'Turistik turlar ve aktivitelerin koordinasyonu',
      'Tüm seyahat süresi boyunca eşlik ve takip'
    ],
    
    // Legal Services
    'services.legal.title': 'Hukuki Danışmanlık',
    'services.legal.description': 'Türk hukuku ve yasal prosedürler konusunda uzman hukuki danışmanlık',
    'services.legal.fullDescription': 'Türk hukuku konusunda uzman avukatlardan oluşan ekipten en iyi hukuki danışmanlığı alın. Gayrimenkul ve şirketlerden aile ve vatandaşlık davalarına kadar Türk hukukunun tüm yönlerini kapsayan kapsamlı hukuki hizmetler sunuyoruz. Geniş deneyimimiz size en iyi sonuçları garanti eder.',
    'services.legal.features': [
      'Türk hukuku konusunda uzman avukatlar',
      'Tüm hukuki alanlarda danışmanlık',
      'Mahkemelerde hukuki temsil',
      'Sözleşme ve anlaşma hazırlama',
      'Gayrimenkul ve ticari danışmanlık',
      'Vatandaşlık ve ikamet davaları',
      'Uyuşmazlık çözümü ve arabuluculuk',
      'Şirketler için hukuki hizmetler'
    ],
    'services.legal.benefits': [
      'Hukuki haklarınızın korunması',
      'Para ve zaman tasarrufu',
      'Garantili sonuçlar',
      'Tam gizlilik'
    ],
    'services.legal.process': [
      'Davanızı anlamak için ücretsiz ilk danışmanlık',
      'Hukuki durum analizi ve seçenek değerlendirmesi',
      'Uygun hukuki strateji geliştirme',
      'Gerekli hukuki işlemlerin yürütülmesi',
      'İstenen sonuca ulaşana kadar davanın takibi'
    ],
    
    // Government Services
    'services.government.title': 'Devlet Hizmetleri',
    'services.government.description': 'Türkiye\'deki tüm resmi işlemleri hızlı ve yüksek verimlilikle tamamlama',
    'services.government.fullDescription': 'Türkiye\'deki tüm devlet işlemlerini tamamlamada uzmanlarınız. Resmi belge çıkarmaktan ikamet yenilemeye ve vatandaşlık işlemlerini tamamlamaya kadar, size zaman ve emek tasarrufu sağlıyoruz ve işlemlerinizi mümkün olan en kısa sürede en yüksek doğruluk ve profesyonellik seviyesinde tamamlamanızı garanti ediyoruz.',
    'services.government.features': [
      'Tüm resmi belgelerin çıkarılması',
      'İkamet ve izinlerin yenilenmesi',
      'Türk vatandaşlığı işlemleri',
      'Şirket ve ticari marka kayıtları',
      'Vergi ve sigorta işlemleri',
      'Sürücü belgesi çıkarma',
      'Gayrimenkul ve tapu işlemleri',
      'Belediye ve valilik hizmetleri'
    ],
    'services.government.benefits': [
      'Zaman ve emek tasarrufu',
      'Hata ve gecikmelerden kaçınma',
      'Türk sistemi konusunda deneyim',
      'Sürekli takip'
    ],
    'services.government.process': [
      'Gerekli işlem türünü ve belgeleri belirleme',
      'Gerekli tüm belgeleri toplama ve hazırlama',
      'İlgili makamlara başvuruları sunma',
      'Devlet kurumlarıyla işlem takibi',
      'Belgeleri alma ve müşteriye teslim etme'
    ],
    
    // Insurance Services
    'services.insurance.title': 'Sağlık Sigortası ve Araç Sigortası Hizmetleri',
    'services.insurance.description': 'En iyi fiyatlarla sağlık sigortası ve araç sigortası alma konusunda yardım',
    'services.insurance.fullDescription': 'Sigorta konusunda uzmanlaşmış hizmetlerimizle kendinizi, ailenizi ve aracınızı koruyun. İhtiyaçlarınız ve bütçenize uygun en iyi sağlık sigortası ve araç sigortası poliçelerini seçmenize yardımcı oluyoruz. Türkiye\'nin en iyi sigorta şirketleriyle ortaklığımız size en iyi fiyatları ve kapsamlı kapsamayı garanti eder.',
    'services.insurance.features': [
      'Bireyler ve aileler için kapsamlı sağlık sigortası',
      'Tüm risklere karşı araç sigortası',
      'Piyasadaki en iyi fiyatlar',
      'Kapsamlı ve esnek kapsam',
      'Hızlı talep hizmeti',
      'Geniş hastane ağı',
      'Seyahat ve kaza sigortası',
      'Uygun sigortayı seçmek için ücretsiz danışmanlık'
    ],
    'services.insurance.benefits': [
      'Kapsamlı finansal koruma',
      'Huzur ve güvenlik',
      'Mükemmel tıbbi hizmetler',
      'Maliyet tasarrufu'
    ],
    'services.insurance.process': [
      'Kişisel sigorta ihtiyaçlarınızı değerlendirme',
      'En iyi sigorta şirketlerinden teklifleri karşılaştırma',
      'Size en uygun poliçeyi seçme',
      'Sigorta işlemlerini ve ödemeyi tamamlama',
      'Sürekli takip ve satış sonrası hizmet'
    ],

    // How We Work Section
    'howWeWork.title': 'Nasıl Çalışıyoruz?',
    'howWeWork.step1': 'Kişisel güvenlik ihtiyaçlarınızı değerlendirme',
    'howWeWork.step2': 'En iyi sigorta şirketlerinden teklifleri karşılaştırma',
    'howWeWork.step3': 'Size en uygun poliçeyi seçme',
    'howWeWork.step4': 'Sigorta işlemlerini ve ödemeyi tamamlama',
    'howWeWork.step5': 'Sürekli takip ve satış sonrası hizmet',

    // Stats Section
    'stats.clients': 'Memnun Müşteri',
    'stats.services': 'Tamamlanan Hizmet',
    'stats.experience': 'Yıl Deneyim',
    'stats.satisfaction': 'Memnuniyet Oranı',

    // Contact Section
    'contact.title': 'İletişime Geçin',
    'contact.subtitle': 'Tüm ihtiyaçlarınızda size yardımcı olmak için buradayız',
    'contact.form.name': 'Ad Soyad',
    'contact.form.email': 'E-posta',
    'contact.form.phone': 'Telefon Numarası',
    'contact.form.message': 'Mesajınız',
    'contact.form.submit': 'Mesaj Gönder',
    'contact.form.sending': 'Gönderiliyor...',
    'contact.info.phone': 'Telefon',
    'contact.info.email': 'E-posta',
    'contact.info.address': 'CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin',
    'contact.info.hours': 'Çalışma Saatleri',

    // Auth
    'auth.login': 'Giriş Yap',
    'auth.signup': 'Hesap Oluştur',
    'auth.welcome': 'Tekrar Hoş Geldiniz',
    'auth.joinUs': 'Tevasul Groupna Katılın',

    // Common
    'common.loading': 'Yükleniyor...',
    'common.error': 'Bir hata oluştu',
    'common.success': 'Başarılı',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.edit': 'Düzenle',
    'common.delete': 'Sil',
    'common.close': 'Kapat',

    // Navigation
    'nav.home': 'Ana Sayfa',
    'nav.services': 'Hizmetlerimiz',
    'nav.about': 'Hakkımızda',
    'nav.contact': 'İletişim',

    // Hero Section Extended
    'hero.mainTitle': 'Türkiye\'deki Tüm Hizmetlerinizi Tamamlayın',
    'hero.withUs': 'Tevasul Group ile',
    'hero.description': 'Türkiye\'deki tüm Resmi Dairelerde hizmetlerinizi en yüksek profesyonellik ve verimlilik seviyesinde tamamlamak için güvenilir ortağınızız',
    'hero.discoverServices': 'Hizmetlerimizi Keşfedin',
    'hero.contactNow': 'Şimdi İletişime Geçin',
    'hero.stats.clients': 'Memnun Müşteri',
    'hero.stats.service': 'Kesintisiz Hizmet',
    'hero.stats.experience': 'Yıl Deneyim',
    'hero.trust.licensed': 'Resmi Lisanslı',
    'hero.trust.fast': 'Hızlı Hizmet',
    'hero.trust.excellent': 'Mükemmel Değerlendirme',
    'hero.available': 'Şimdi Mevcut',
    'hero.discoverServicesShort': 'Hizmetlerimizi Keşfedin',

    // Services Section Extended
    'services.discoverMore': 'Daha Fazla Keşfedin',
    'services.quickRequest': 'Hızlı Talep',
    'services.loginToRequest': 'Hizmet Talep Etmek İçin Giriş Yapın',

    // About Section
    'about.title': 'Bizimle Tamamlayın',
    'about.description1': 'Tevasul Group, Türkiye\'deki tüm hizmetlerinizi yüksek verimlilik ve profesyonellikle tamamlamak için güvenilir ortağınızdır. Türkiye\'deki sakinlerin ve ziyaretçilerin karşılaştığı zorlukları anlıyoruz ve uygun çözümler sunuyoruz.',
    'about.description2': 'Geniş deneyimimiz ve güçlü ilişki ağımız sayesinde, işlemlerinizi mümkün olan en kısa sürede ve en yüksek kalite ve doğruluk seviyesinde tamamlamanızı garanti ediyoruz.',
    'about.stats.clients': '5000+ Memnun Müşteri',
    'about.stats.experience': '10+ Yıl Deneyim',
    'about.features.team': 'Uzman Ekip',
    'about.features.speed': 'Hızlı Tamamlama',
    'about.features.security': 'Güvenlik ve Gizlilik',
    'about.features.care': 'Kapsamlı Bakım',
    'about.vision.title': 'Vizyonumuz',
    'about.vision.description': 'Türkiye\'deki Araplar için birinci ve en güvenilir ortak olmak, hayatlarını kolaylaştıran ve hedeflerini kolaylıkla gerçekleştirmelerini sağlayan mükemmel hizmetler sunmak.',

    // Contact Section Extended
    'contact.info.title': 'İletişim Bilgileri',
    'contact.form.title': 'Bize Mesaj Gönderin',
    'contact.form.serviceType': 'Hizmet Türü',
    'contact.form.selectService': 'Hizmet Türünü Seçin',
    'contact.form.translation': 'Yeminli Tercüme Hizmetleri',
    'contact.form.travel': 'Seyahat ve Turizm Hizmetleri',
    'contact.form.legal': 'Hukuki Danışmanlık',
    'contact.form.government': 'Devlet Hizmetleri',
    'contact.form.insurance': 'Sağlık Sigortası ve Araç Sigortası Hizmetleri',

    // Footer
    'footer.description': 'Türkiye\'deki tüm hizmetlerinizi tamamlamak için güvenilir ortağınız',
    'footer.copyright': '© 2024 Tevasul Group. Tüm hakları saklıdır. Türkiye\'de ❤️ ile yapıldı',
    'footer.quickLinks': 'Hızlı Bağlantılar',
    'footer.contactInfo': 'İletişim Bilgileri',

    // User Menu
    'user.profile': 'Profil Düzenle',
    'user.transactions': 'İşlemlerim',
    'user.notifications': 'Bildirim Ayarları',
    'user.help': 'Yardım ve Destek',
    'user.logout': 'Çıkış Yap',
    'user.welcome': 'Merhaba,',

    // Language
    'language.change': 'Dili Değiştir',
    'language.arabic': 'العربية',
    'language.turkish': 'Türkçe',
    'language.english': 'English',

    // Admin
    'admin.dashboard': 'Admin Paneli',

    // Service Page Translations
    'servicePage.whyChooseUs': 'Neden Tevasul Groupnu Seçmelisiniz?',
    'servicePage.extensiveExperience': 'Geniş Deneyim',
    'servicePage.extensiveExperienceDesc': 'Türkiye\'de Arap müşterilere 5 yıldan fazla hizmet',
    'servicePage.fastCompletion': 'Hızlı Tamamlama',
    'servicePage.fastCompletionDesc': 'Hizmetlerinizi en kısa sürede tamamlamanızı garanti ediyoruz',
    'servicePage.serviceFeatures': 'Hizmet Özellikleri',
    'servicePage.howWeWork': 'Nasıl Çalışıyoruz?',
    'servicePage.getFreeConsultation': 'Ücretsiz Danışmanlık Alın',
    'servicePage.consultationDesc': 'Hizmetlerimiz hakkında ücretsiz danışmanlık için şimdi bizimle iletişime geçin',
    'servicePage.contactNow': 'Şimdi İletişime Geçin',
    'servicePage.requestServiceNow': 'Şimdi Hizmet Talep Edin',
    'servicePage.loginToRequest': 'Hizmet Talep Etmek İçin Giriş Yapın',
    'servicePage.readyToStart': 'Bizimle Yolculuğunuza Başlamaya Hazır mısınız?',
    'servicePage.joinThousands': 'Hizmetlerimize güvenen binlerce memnun müşteriye katılın',
    'servicePage.bookFreeConsultation': 'Ücretsiz Danışmanlık Rezervasyonu',
    'servicePage.talkToExpert': 'Uzmanla Konuşun',

    // Brand
    'brand.name': 'Tamamla',

    // Main Services Cards
    'services.cards.translation.title': 'Yeminli Tercüme Hizmetleri',
    'services.cards.translation.description': 'Tüm resmi ve yasal belgeler için onaylı tercüme',
    'services.cards.travel.title': 'Seyahat ve Turizm Hizmetleri',
    'services.cards.travel.description': 'Tur organizasyonu, otel rezervasyonu ve ulaşım hizmetleri',
    'services.cards.legal.title': 'Hukuki Danışmanlık',
    'services.cards.legal.description': 'Türk hukuku ve yasal prosedürler konusunda uzman hukuki danışmanlık',
    'services.cards.government.title': 'Devlet Hizmetleri',
    'services.cards.government.description': 'Türkiye\'deki tüm resmi işlemleri hızlı ve yüksek verimlilikle tamamlama',
    'services.cards.insurance.title': 'Sağlık Sigortası ve Araç Sigortası Hizmetleri',
    'services.cards.insurance.description': 'En iyi fiyatlarla sağlık sigortası ve araç sigortası alma konusunda yardım',

    // Legal Terms
    'legal.acceptTerms': 'Kullanım Şartlarını Kabul Ediyorum',
    'legal.acceptPrivacy': 'Gizlilik Politikasını Kabul Ediyorum',
    'legal.readTerms': 'Kullanım Şartlarını Oku',
    'legal.readPrivacy': 'Gizlilik Politikasını Oku',
    'legal.required': 'Devam etmek için şartları ve gizlilik politikasını kabul etmelisiniz',

    // Background Music
    'music.mute': 'Sesi Kapat',
    'music.unmute': 'Sesi Aç',
    'music.playing': 'Müzik Çalıyor',
    'music.stopped': 'Müzik Durdu',
  },
  en: {
    // Navbar
    'navbar.home': 'Home',
    'navbar.contact': 'Contact Us',
    'navbar.account': 'My Account',
    'navbar.settings': 'Settings',
    'navbar.help': 'Help',
    'navbar.logout': 'Logout',
    'navbar.welcome': 'Welcome to Tevasul Group',
    'navbar.darkMode': 'Dark Mode',
    'navbar.lightMode': 'Light Mode',

    // Hero Section
    'hero.title': 'Complete All Your Services in Turkey With Us',
    'hero.subtitle': 'We are your trusted partners to fulfill all your needs in Turkey with high efficiency and professionalism',
    'hero.cta.primary': 'Get Started',
    'hero.cta.secondary': 'Explore Our Services',

    // Services Section
    'services.title': 'Our Distinguished Services',
    'services.subtitle': 'We offer a comprehensive range of services specifically designed to meet your needs',
    
    // Translation Services
    'services.translation.title': 'Certified Translation Services',
    'services.translation.description': 'Certified translation for all official and legal documents',
    'services.translation.fullDescription': 'We provide the most accurate and professional certified translation services in Turkey. Our team of certified translators ensures accurate translation of all your official, legal, medical, and academic documents. We are certified by Turkish official authorities and guarantee the acceptance of our translations in all government and private institutions.',
    'services.translation.features': [
      'Certified translation from official authorities',
      'Sworn and certified translators',
      'Instant translation for urgent cases',
      '100% accuracy in translation',
      'Competitive prices',
      '24/7 customer service',
      'Guaranteed acceptance in all institutions',
      'Translation in all languages'
    ],
    'services.translation.benefits': [
      'Time and effort savings',
      'Guaranteed accuracy and professionalism',
      'Guaranteed acceptance in institutions',
      'Affordable prices for everyone'
    ],
    'services.translation.process': [
      'Send documents for translation via WhatsApp or email',
      'Evaluate documents and determine price and timeframe',
      'Begin translation process by certified translators',
      'Review translation by quality team',
      'Deliver certified and stamped translation'
    ],
    
    // Travel Services
    'services.travel.title': 'Travel and Tourism Services',
    'services.travel.description': 'Tour organization, hotel booking, and transportation services',
    'services.travel.fullDescription': 'Discover the beauty of Turkey with our diverse and specially designed tour packages. Suitable for all tastes and budgets. We offer an unforgettable tourist experience covering the best Turkish destinations with comprehensive services including transportation, accommodation, and tourist tours accompanied by Arab expert guides.',
    'services.travel.features': [
      'Diverse and customized tour programs',
      'Hotel booking at best prices',
      'Comfortable and safe transportation',
      'Arab tourist guides',
      'Cultural and historical tours',
      'Family and youth trips',
      'Customer service throughout the trip',
      'Comprehensive travel insurance'
    ],
    'services.travel.benefits': [
      'Distinguished tourist experience',
      'Competitive prices',
      'Complete comfort and safety',
      'Unforgettable memories'
    ],
    'services.travel.process': [
      'Free consultation to determine suitable trip type',
      'Custom tourist program design according to your preferences',
      'Hotel and transportation booking',
      'Coordination of tourist tours and activities',
      'Accompaniment and follow-up throughout the trip period'
    ],
    
    // Legal Services
    'services.legal.title': 'Legal Consultancy',
    'services.legal.description': 'Specialized legal consultancy in Turkish law and judicial procedures',
    'services.legal.fullDescription': 'Get the best legal consultancy from a team of lawyers specialized in Turkish law. We provide comprehensive legal services covering all aspects of Turkish law from real estate and companies to family and citizenship cases. Our extensive experience guarantees you the best results.',
    'services.legal.features': [
      'Lawyers specialized in Turkish law',
      'Consultancy in all legal fields',
      'Legal representation in courts',
      'Contract and agreement drafting',
      'Real estate and commercial consultancy',
      'Citizenship and residence cases',
      'Dispute resolution and mediation',
      'Legal services for companies'
    ],
    'services.legal.benefits': [
      'Protection of your legal rights',
      'Money and time savings',
      'Guaranteed results',
      'Complete confidentiality'
    ],
    'services.legal.process': [
      'Free initial consultation to understand your case',
      'Legal situation analysis and options evaluation',
      'Develop appropriate legal strategy',
      'Execute required legal procedures',
      'Follow up the case until reaching desired result'
    ],
    
    // Government Services
    'services.government.title': 'Government Services',
    'services.government.description': 'Complete all official transactions in Turkey quickly and with high efficiency',
    'services.government.fullDescription': 'We are your experts in completing all government transactions in Turkey. From extracting official documents to renewing residence permits and completing citizenship transactions, we save you time and effort and guarantee the completion of your transactions in the shortest possible time with the highest level of accuracy and professionalism.',
    'services.government.features': [
      'Extract all official documents',
      'Renew residence permits and authorizations',
      'Turkish citizenship transactions',
      'Company and trademark registration',
      'Tax and insurance transactions',
      'Driver\'s license extraction',
      'Real estate and title deed transactions',
      'Municipality and governorate services'
    ],
    'services.government.benefits': [
      'Time and effort savings',
      'Avoid errors and delays',
      'Experience in Turkish system',
      'Continuous follow-up'
    ],
    'services.government.process': [
      'Determine required transaction type and documents',
      'Collect and prepare all required documents',
      'Submit applications to relevant authorities',
      'Follow up transaction progress with government agencies',
      'Receive documents and deliver to client'
    ],
    
    // Health Insurance Services
    'services.healthInsurance.title': 'Health Insurance for Foreigners',
    'services.healthInsurance.description': 'Comprehensive health insurance for foreigners in Turkey with the best prices and coverage',
    'services.healthInsurance.fullDescription': 'We provide comprehensive health insurance services for foreigners in Turkey. We collaborate with the best Turkish insurance companies to offer the best prices and comprehensive coverage. Our insurance covers all medical and treatment services with a wide network of hospitals and clinics throughout Turkey.',
    'services.healthInsurance.features': [
      'Comprehensive health insurance for individuals and families',
      'Competitive prices based on age groups',
      'Comprehensive coverage for all medical services',
      'Wide network of hospitals and clinics',
      '24/7 customer service',
      'Fast and simple procedures',
      'Insurance for 1 or 2 years',
      'Free consultation to choose the best plan'
    ],
    'services.healthInsurance.benefits': [
      'Comprehensive financial protection for the family',
      'Peace of mind and reassurance',
      'Savings on medical costs',
      'High-quality medical service'
    ],
    'services.healthInsurance.process': [
      'Determine age group and insurance duration',
      'Choose the appropriate insurance company',
      'Calculate final price',
      'Submit request and obtain insurance',
      'Receive insurance documents'
    ],

    // Insurance Services
    'services.insurance.title': 'Health Insurance and Vehicle Insurance Services',
    'services.insurance.description': 'Assistance in obtaining health insurance and vehicle insurance at the best prices',
    'services.insurance.fullDescription': 'Protect yourself, your family, and your vehicle with our specialized insurance services. We help you choose the best health insurance and vehicle insurance policies that suit your needs and budget. Our partnerships with the best insurance companies in Turkey guarantee you the best prices and comprehensive coverage.',
    'services.insurance.features': [
      'Comprehensive health insurance for individuals and families',
      'Vehicle insurance against all risks',
      'Best prices in the market',
      'Comprehensive and flexible coverage',
      'Fast claims service',
      'Wide network of hospitals',
      'Travel and accident insurance',
      'Free consultation to choose suitable insurance'
    ],
    'services.insurance.benefits': [
      'Comprehensive financial protection',
      'Peace of mind and security',
      'Excellent medical services',
      'Cost savings'
    ],
    'services.insurance.process': [
      'Assess your personal insurance needs',
      'Compare offers from best insurance companies',
      'Choose the most suitable policy for you',
      'Complete insurance procedures and payment',
      'Continuous follow-up and after-sales service'
    ],

    // How We Work Section
    'howWeWork.title': 'How Do We Work?',
    'howWeWork.step1': 'Assess your personal security needs',
    'howWeWork.step2': 'Compare offers from the best insurance companies',
    'howWeWork.step3': 'Choose the most suitable policy for you',
    'howWeWork.step4': 'Complete insurance procedures and payment',
    'howWeWork.step5': 'Continuous follow-up and after-sales service',

    // Stats Section
    'stats.clients': 'Satisfied Clients',
    'stats.services': 'Completed Services',
    'stats.experience': 'Years Experience',
    'stats.satisfaction': 'Satisfaction Rate',

    // Contact Section
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are here to help you with all your needs',
    'contact.form.name': 'Full Name',
    'contact.form.email': 'Email',
    'contact.form.phone': 'Phone Number',
    'contact.form.message': 'Your Message',
    'contact.form.submit': 'Send Message',
    'contact.form.sending': 'Sending...',
    'contact.info.phone': 'Phone',
    'contact.info.email': 'Email',
    'contact.info.address': 'CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin',
    'contact.info.hours': 'Working Hours',

    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.welcome': 'Welcome Back',
    'auth.joinUs': 'Join Tevasul Group',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',

    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Our Services',
    'nav.about': 'About Us',
    'nav.contact': 'Contact Us',

    // Hero Section Extended
    'hero.mainTitle': 'Complete All Your Services in Turkey',
    'hero.withUs': 'With Tevasul Group',
    'hero.description': 'We are your trusted partner in Turkey to complete all your government, commercial and personal services with the highest level of professionalism and efficiency',
    'hero.discoverServices': 'Discover Our Services',
    'hero.contactNow': 'Contact Us Now',
    'hero.stats.clients': 'Satisfied Clients',
    'hero.stats.service': '24/7 Service',
    'hero.stats.experience': 'Years Experience',
    'hero.trust.licensed': 'Officially Licensed',
    'hero.trust.fast': 'Fast Service',
    'hero.trust.excellent': 'Excellent Rating',
    'hero.available': 'Available Now',
    'hero.discoverServicesShort': 'Discover Our Services',

    // Services Section Extended
    'services.discoverMore': 'Discover More',
    'services.quickRequest': 'Quick Request',
    'services.loginToRequest': 'Login to Request Service',

    // About Section
    'about.title': 'Complete With Us',
    'about.description1': 'Tevasul Group is your trusted partner in Turkey to complete all your services with high efficiency and professionalism. We understand the challenges faced by residents and visitors in Turkey and provide appropriate solutions.',
    'about.description2': 'Thanks to our extensive experience and strong network of relationships, we guarantee you the completion of your transactions in the shortest possible time and with the highest level of quality and accuracy.',
    'about.stats.clients': '5000+ Satisfied Clients',
    'about.stats.experience': '10+ Years Experience',
    'about.features.team': 'Expert Team',
    'about.features.speed': 'Fast Completion',
    'about.features.security': 'Security & Privacy',
    'about.features.care': 'Comprehensive Care',
    'about.vision.title': 'Our Vision',
    'about.vision.description': 'To be the first and most trusted partner for Arabs in Turkey, and provide excellent services that facilitate their lives and achieve their goals with ease.',

    // Contact Section Extended
    'contact.info.title': 'Contact Information',
    'contact.form.title': 'Send Us a Message',
    'contact.form.serviceType': 'Service Type',
    'contact.form.selectService': 'Select Service Type',
    'contact.form.translation': 'Certified Translation Services',
    'contact.form.travel': 'Travel and Tourism Services',
    'contact.form.legal': 'Legal Consultancy',
    'contact.form.government': 'Government Services',
    'contact.form.insurance': 'Health Insurance and Vehicle Insurance Services',

    // Footer
    'footer.description': 'Your trusted partner to complete all your services in Turkey',
    'footer.copyright': '© 2024 Tevasul Group. All rights reserved. Made with ❤️ in Turkey',
    'footer.quickLinks': 'Quick Links',
    'footer.contactInfo': 'Contact Info',

    // User Menu
    'user.profile': 'Edit Profile',
    'user.transactions': 'My Transactions',
    'user.notifications': 'Notification Settings',
    'user.help': 'Help and Support',
    'user.logout': 'Logout',
    'user.welcome': 'Hello,',

    // Language
    'language.change': 'Change Language',
    'language.arabic': 'العربية',
    'language.turkish': 'Türkçe',
    'language.english': 'English',

    // Admin
    'admin.dashboard': 'Admin Dashboard',

    // Brand
    'brand.name': 'Complete',

    // Service Page Translations
    'servicePage.whyChooseUs': 'Why Choose Tevasul Group?',
    'servicePage.extensiveExperience': 'Extensive Experience',
    'servicePage.extensiveExperienceDesc': 'More than 5 years serving Arab clients in Turkey',
    'servicePage.fastCompletion': 'Fast Completion',
    'servicePage.fastCompletionDesc': 'We guarantee the completion of your services in the shortest time possible',
    'servicePage.serviceFeatures': 'Service Features',
    'servicePage.howWeWork': 'How Do We Work?',
    'servicePage.getFreeConsultation': 'Get Free Consultation',
    'servicePage.consultationDesc': 'Contact us now for a free consultation about our services',
    'servicePage.contactNow': 'Contact Us Now',
    'servicePage.requestServiceNow': 'Request Service Now',
    'servicePage.loginToRequest': 'Login to Request Service',
    'servicePage.readyToStart': 'Ready to Start Your Journey With Us?',
    'servicePage.joinThousands': 'Join thousands of satisfied clients who trusted our services',
    'servicePage.bookFreeConsultation': 'Book Free Consultation',
    'servicePage.talkToExpert': 'Talk to Expert',

    // Main Services Cards
    'services.cards.healthInsurance.title': 'Health Insurance for Foreigners',
    'services.cards.healthInsurance.description': 'Comprehensive health insurance for foreigners in Turkey with the best prices and coverage',
    'services.cards.translation.title': 'Certified Translation Services',
    'services.cards.translation.description': 'Certified translation for all official and legal documents',
    'services.cards.travel.title': 'Travel and Tourism Services',
    'services.cards.travel.description': 'Tour organization, hotel booking, and transportation services',
    'services.cards.legal.title': 'Legal Consultancy',
    'services.cards.legal.description': 'Specialized legal consultancy in Turkish law and judicial procedures',
    'services.cards.government.title': 'Government Services',
    'services.cards.government.description': 'Complete all official transactions in Turkey quickly and with high efficiency',
    'services.cards.insurance.title': 'Health Insurance and Vehicle Insurance Services',
    'services.cards.insurance.description': 'Assistance in obtaining health insurance and vehicle insurance at the best prices',

    // Legal Terms
    'legal.acceptTerms': 'I Accept the Terms of Service',
    'legal.acceptPrivacy': 'I Accept the Privacy Policy',
    'legal.readTerms': 'Read Terms of Service',
    'legal.readPrivacy': 'Read Privacy Policy',
    'legal.required': 'You must accept the terms and privacy policy to continue',

    // Background Music
    'music.mute': 'Mute',
    'music.unmute': 'Unmute',
    'music.playing': 'Music Playing',
    'music.stopped': 'Music Stopped',
  }
};

export const useLanguageProvider = () => {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['ar', 'tr', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
      updateDocumentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    updateDocumentLanguage(lang);
  };

  const updateDocumentLanguage = (lang: Language) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string | string[] => {
    const langTranslations = translations[language] as Record<string, string | string[]>;
    return langTranslations[key] || key;
  };

  return {
    language,
    setLanguage,
    t
  };
};
