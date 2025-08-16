import React from 'react';
import { CheckCircle, Star, Users, Clock, Shield, Phone, Mail } from 'lucide-react';
import CustomCursor from './CustomCursor';
import { useAuthContext } from './AuthProvider';
import { useLanguage } from '../hooks/useLanguage';
import ServiceRequestForm from './ServiceRequestForm';


interface ServicePageProps {
  service: {
    id: string;
    icon: React.ReactNode;
    titleKey: string;
    descriptionKey: string;
    fullDescriptionKey: string;
    featuresKey: string;
    benefitsKey: string;
    processKey: string;
  };
  onBack: () => void;
  isDarkMode: boolean;
  onNavigateToContact: () => void;
  onOpenProfile: () => void;
  onOpenAccount: () => void;
  onOpenHelp: () => void;
  onToggleDarkMode: () => void;
  onNavigateToMainHome: () => void;
}

const ServicePage: React.FC<ServicePageProps> = ({ 
  service, 
  onBack, 
  isDarkMode, 
  onNavigateToContact,
  onOpenProfile,
  onOpenAccount,
  onOpenHelp,
  onToggleDarkMode,
  onNavigateToMainHome
}) => {
  const { user } = useAuthContext();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [showRequestForm, setShowRequestForm] = React.useState(false);

  // Utility function to format phone number with RTL support for Arabic
  const formatPhoneNumber = (phoneNumber: string, isArabic: boolean) => {
    if (!phoneNumber) return '';
    
    if (isArabic) {
      // For Arabic, format with RTL direction but keep original format
      return (
        <span className="phone-number" style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'bidi-override' }}>
          {phoneNumber}
        </span>
      );
    } else {
      // For English, return original format
      return phoneNumber;
    }
  };
  
  // Custom cursor state
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);
  const [isCursorVisible, setIsCursorVisible] = React.useState(false);
  const [showFloatingButton, setShowFloatingButton] = React.useState(false);

  // Custom cursor effect
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsCursorVisible(true);
      
      // Simple hover detection for better performance
      const target = e.target as HTMLElement;
      const isInteractive = target.tagName === 'BUTTON' || 
                           target.tagName === 'A' || 
                           target.closest('button') !== null || 
                           target.closest('a') !== null;
      
      setIsHovering(isInteractive);
    };

    const handleMouseLeave = () => {
      setIsCursorVisible(false);
    };
    
    // Check if device is touch-based
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Only add mouse events for non-touch devices
    if (!isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (!isTouchDevice) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Monitor consultation card visibility for floating button
  React.useEffect(() => {
    const handleScroll = () => {
      const consultationCard = document.querySelector('.consultation-card');
      if (consultationCard) {
        const rect = consultationCard.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setShowFloatingButton(!isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-jet-800 text-jet-800 dark:text-white overflow-x-hidden font-alexandria">
      <CustomCursor isDarkMode={isDarkMode} />
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-white/95 dark:bg-jet-800/95 backdrop-blur-md shadow-xl border-b border-platinum-300 dark:border-jet-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 md:py-3">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 space-x-reverse bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium text-sm md:text-base">العودة للرئيسية</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              <button
                onClick={() => onNavigateToMainHome()}
                className="relative transition-colors duration-300 group font-medium text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400"
              >
                {t('nav.home')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600"></span>
              </button>
              
              <button
                onClick={() => {
                  onNavigateToMainHome();
                  setTimeout(() => {
                    const section = document.getElementById('services');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="relative transition-colors duration-300 group font-medium text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400"
              >
                {t('nav.services')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600"></span>
              </button>
              
              <button
                onClick={() => {
                  onNavigateToMainHome();
                  setTimeout(() => {
                    const section = document.getElementById('about');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="relative transition-colors duration-300 group font-medium text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400"
              >
                {t('nav.about')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600"></span>
              </button>
              
              <button
                onClick={() => {
                  onNavigateToMainHome();
                  setTimeout(() => {
                    const section = document.getElementById('contact');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="relative transition-colors duration-300 group font-medium text-jet-800 dark:text-platinum-200 hover:text-caribbean-700 dark:hover:text-caribbean-400"
              >
                {t('nav.contact')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-gradient-to-r from-caribbean-600 to-indigo-600"></span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => onNavigateToMainHome()}
                className="bg-caribbean-600 text-white px-4 py-2 rounded-lg hover:bg-caribbean-700 transition-all duration-300"
              >
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      </nav>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Custom cursor styles - commented out to restore default cursor */
          /* html, body, * {
            cursor: none !important;
          }
          
          button, a, input, select, textarea, [role="button"], [onclick], [tabindex] {
            cursor: none !important;
          }
          
          .dropdown, .modal, .popup, [data-dropdown], [role="menu"], [role="listbox"], 
          [class*="dropdown"], [class*="modal"], [class*="popup"] {
            cursor: none !important;
          }
          
          * * {
            cursor: none !important;
          }
          
          * {
            cursor: none !important;
          } */

                      /* Exception for logo button to allow clicks */
            .logo-button {
              cursor: pointer !important;
            }

            /* Phone number formatting for Arabic */
            .phone-number {
              direction: ltr !important;
              text-align: left !important;
              unicode-bidi: bidi-override !important;
              font-family: monospace !important;
            }

          /* Show default cursor on touch devices */
          @media (hover: none) and (pointer: coarse) {
            html, body, * {
              cursor: auto !important;
            }
            
            button, a, input, select, textarea, [role="button"], [onclick], [tabindex] {
              cursor: pointer !important;
            }
            
            .dropdown, .modal, .popup, [data-dropdown], [role="menu"], [role="listbox"], 
            [class*="dropdown"], [class*="modal"], [class*="popup"] {
              cursor: auto !important;
            }
            
            * * {
              cursor: auto !important;
            }
            
            * {
              cursor: auto !important;
            }
          }

          /* Flag Gloss Effect */
          .flag-gloss {
            position: relative;
            overflow: hidden;
          }
          
          .flag-gloss::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              transparent 30%,
              rgba(255, 255, 255, 0.1) 40%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0.1) 60%,
              transparent 70%
            );
            transform: rotate(45deg);
            transition: all 0.3s ease;
            opacity: 0;
          }
          
          .flag-gloss:hover::before {
            opacity: 1;
            animation: gloss-shine 1.5s ease-in-out;
          }
          
          @keyframes gloss-shine {
            0% {
              transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            50% {
              transform: translateX(0%) translateY(0%) rotate(45deg);
            }
            100% {
              transform: translateX(100%) translateY(100%) rotate(45deg);
            }
          }

          /* Flag Shadow Effect */
          .flag-shadow {
            box-shadow: 
              0 2px 4px rgba(0, 0, 0, 0.1),
              0 4px 8px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }

          /* Ensure cursor is always on top */
          .cursor-element {
            z-index: 9999 !important;
            position: fixed !important;
          }

          /* Hide custom cursor on touch devices */
          @media (hover: none) and (pointer: coarse) {
            .cursor-element {
              display: none !important;
            }
          }
        `
      }} />
      
      {/* Custom Cursor */}
      {isCursorVisible && (
        <>
          {!isHovering ? (
            <>
              <div className="fixed w-6 h-6 border-2 border-white rounded-full pointer-events-none z-[9999] transition-transform duration-75 ease-out shadow-lg cursor-element hidden md:block"
                   style={{
                     left: `${mousePosition.x}px`,
                     top: `${mousePosition.y}px`,
                     transform: 'translate(-50%, -50%)',
                   }}>
              </div>
              <div className="fixed w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] transition-transform duration-75 ease-out cursor-element hidden md:block"
                   style={{
                     left: `${mousePosition.x}px`,
                     top: `${mousePosition.y}px`,
                     transform: 'translate(-50%, -50%)',
                   }}>
              </div>
            </>
          ) : (
            <>
              <div className="fixed w-8 h-8 border-2 border-caribbean-400 rounded-full pointer-events-none z-[9999] transition-transform duration-75 ease-out shadow-xl cursor-element hidden md:block"
                   style={{
                     left: `${mousePosition.x}px`,
                     top: `${mousePosition.y}px`,
                     transform: 'translate(-50%, -50%)',
                   }}>
              </div>
              <div className="fixed w-3 h-3 bg-caribbean-400 rounded-full pointer-events-none z-[9999] transition-transform duration-75 ease-out cursor-element hidden md:block"
                   style={{
                     left: `${mousePosition.x}px`,
                     top: `${mousePosition.y}px`,
                     transform: 'translate(-50%, -50%)',
                   }}>
              </div>
            </>
          )}
        </>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-16 mt-0 pt-24 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center mb-6">
            <div className="p-4 bg-white/20 rounded-2xl mb-4 md:mb-0 md:ml-6">
              {service.icon}
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t(service.titleKey)}</h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl">{t(service.descriptionKey)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Background Animation Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-caribbean-200/20 dark:bg-caribbean-800/20 rounded-full animate-float-slow"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-platinum-300/30 dark:bg-jet-600/30 rounded-full animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-caribbean-300/25 dark:bg-caribbean-700/25 rounded-full animate-float-reverse"></div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Description */}
          <div className="lg:col-span-2 relative z-10">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400">
                {t('servicePage.whyChooseUs')}
              </h2>
              <p className="text-lg text-jet-600 dark:text-platinum-400 leading-relaxed mb-8 animate-fade-in-delay-1">
                {t(service.fullDescriptionKey)}
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8 animate-fade-in-delay-2">
                <div className="bg-gradient-to-r from-caribbean-50 to-indigo-50 dark:from-caribbean-900/20 dark:to-indigo-900/20 p-6 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <Users className="w-8 h-8 text-caribbean-600 dark:text-caribbean-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{t('servicePage.extensiveExperience')}</h3>
                  <p className="text-jet-600 dark:text-platinum-400">{t('servicePage.extensiveExperienceDesc')}</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-caribbean-50 dark:from-indigo-900/20 dark:to-caribbean-900/20 p-6 rounded-xl transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{t('servicePage.fastCompletion')}</h3>
                  <p className="text-jet-600 dark:text-platinum-400">{t('servicePage.fastCompletionDesc')}</p>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400 animate-fade-in-delay-1">
                {t('servicePage.serviceFeatures')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(t(service.featuresKey) as string[]).map((feature, index) => (
                  <div key={index} className="flex items-center p-4 bg-white dark:bg-jet-700 rounded-lg shadow-md">
                    <CheckCircle className="w-6 h-6 text-green-500 ml-3 flex-shrink-0" />
                    <span className="text-jet-700 dark:text-platinum-300">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Process */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-caribbean-700 dark:text-caribbean-400 animate-fade-in-delay-2">
                {t('servicePage.howWeWork')}
              </h2>
              <div className="space-y-4">
                {(t(service.processKey) as string[]).map((step, index) => (
                  <div key={index} className="flex items-start p-4 bg-gradient-to-r from-platinum-50 to-caribbean-50 dark:from-jet-700 dark:to-caribbean-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-caribbean-600 text-white rounded-full flex items-center justify-center font-bold ml-4">
                      {index + 1}
                    </div>
                    <p className="text-jet-700 dark:text-platinum-300 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 relative z-10">
            {/* Contact Card */}
            <div className="consultation-card bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white p-8 rounded-2xl shadow-xl mb-8 sticky top-8 transform hover:scale-105 transition-all duration-300 animate-fade-in-delay-3">
              <h3 className="text-2xl font-bold mb-6">{t('servicePage.getFreeConsultation')}</h3>
              <p className="mb-6 text-white/90">
                {t('servicePage.consultationDesc')}
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 ml-3" />
                    <span>{formatPhoneNumber('+90 534 962 72 41', isArabic)}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 ml-3" />
                  <span>info@tevasul.group</span>
                </div>
              </div>
              
              <button 
                onClick={onNavigateToContact}
                className="w-full bg-white text-caribbean-700 py-3 px-6 rounded-lg font-semibold hover:bg-platinum-100 transition-colors duration-300"
              >
                {t('servicePage.contactNow')}
              </button>
              
              {user && (
                <button 
                  onClick={() => setShowRequestForm(true)}
                  className="w-full mt-3 bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
                >
                  {t('servicePage.requestServiceNow')}
                </button>
              )}
              {!user && (
                <button 
                  onClick={() => {
                    // حفظ معلومات الخدمة وتوجيه المستخدم لتسجيل الدخول
                    localStorage.setItem('pendingServiceRequest', JSON.stringify({
                      serviceType: service.id,
                      serviceTitle: t(service.titleKey)
                    }));
                    // العودة للصفحة الرئيسية وفتح نموذج تسجيل الدخول
                    onBack();
                    setTimeout(() => {
                      // هذا سيحتاج إلى تمرير دالة من App.tsx
                      window.dispatchEvent(new CustomEvent('openLogin'));
                    }, 100);
                  }}
                  className="w-full mt-3 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {t('servicePage.loginToRequest')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white py-16 relative overflow-hidden">
        {/* Background Animation Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-20 w-40 h-40 bg-white/10 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full animate-float-slow"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/8 rounded-full animate-bounce-slow"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
            {t('servicePage.readyToStart')}
          </h2>
          <p className="text-xl text-white/90 mb-8 animate-fade-in-delay-1">
            {t('servicePage.joinThousands')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
            {user ? (
              <button 
                onClick={() => setShowRequestForm(true)}
                className="bg-white text-caribbean-700 px-8 py-4 rounded-full font-semibold hover:bg-platinum-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {t('servicePage.requestServiceNow')}
              </button>
            ) : (
              <button 
                onClick={onNavigateToContact}
                className="bg-white text-caribbean-700 px-8 py-4 rounded-full font-semibold hover:bg-platinum-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {t('servicePage.bookFreeConsultation')}
              </button>
            )}
            <button 
              onClick={onNavigateToContact}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              {t('servicePage.talkToExpert')}
            </button>
          </div>
        </div>
      </div>

              {/* Floating Consultation Button - Mobile Only */}
        {showFloatingButton && (
          <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={() => {
                // Scroll to consultation card
                const consultationCard = document.querySelector('.consultation-card');
                if (consultationCard) {
                  consultationCard.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }
              }}
              className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white px-6 py-3 rounded-full font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 space-x-reverse animate-pulse"
            >
              <span className="text-sm">{t('servicePage.getFreeConsultation')}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

      {/* Service Request Form */}
      <ServiceRequestForm
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        serviceType={service.id}
        serviceTitle={t(service.titleKey) as string}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ServicePage;
