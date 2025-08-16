import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText, BarChart3 } from 'lucide-react';
import CustomCursor from './CustomCursor';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthContext } from './AuthProvider';
import VoluntaryReturnFormsList from './VoluntaryReturnFormsList';
import VoluntaryReturnForm from './VoluntaryReturnForm';
import VoluntaryReturnChart from './VoluntaryReturnChart';
import ProtectedRoute from './ProtectedRoute';

interface VoluntaryReturnPageProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const VoluntaryReturnPage: React.FC<VoluntaryReturnPageProps> = ({ onBack, isDarkMode }) => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuthContext();
  const [activeView, setActiveView] = useState<'list' | 'create' | 'chart'>('list');

  // Check if user is admin
  // Check admin by email (consistent with other parts of the app)
  const isAdmin = user?.email === 'admin@tevasul.group';

  if (!isAdmin) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div>This should not be visible</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-platinum-50 dark:bg-jet-900">
        <CustomCursor isDarkMode={isDarkMode} />
        {/* Header */}
        <div className="bg-white dark:bg-jet-800 shadow-sm border-b border-platinum-200 dark:border-jet-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={onBack}
                  className="flex items-center text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 transition-colors duration-300 ml-4"
                >
                  <ArrowLeft className="w-5 h-5 ml-2" />
                  {t('nav.home')}
                </button>
                <h1 className="text-2xl font-bold text-jet-800 dark:text-white">
                  {language === 'ar' ? 'إدارة العودة الطوعية' : 'Gönüllü Dönüş Yönetimi'}
                </h1>
              </div>
              
              {activeView === 'list' && (
                <button
                  onClick={() => setActiveView('create')}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-caribbean-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {language === 'ar' ? 'إضافة نموذج جديد' : 'Yeni Form Ekle'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 mb-8">
            <div className="flex border-b border-platinum-200 dark:border-jet-700">
              <button
                onClick={() => setActiveView('list')}
                className={`px-6 py-4 font-medium transition-colors duration-200 ${
                  activeView === 'list'
                    ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                    : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 ml-2" />
                  {language === 'ar' ? 'قائمة النماذج' : 'Form Listesi'}
                </div>
              </button>
              <button
                onClick={() => setActiveView('create')}
                className={`px-6 py-4 font-medium transition-colors duration-200 ${
                  activeView === 'create'
                    ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                    : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
                }`}
              >
                <div className="flex items-center">
                  <Plus className="w-5 h-5 ml-2" />
                  {language === 'ar' ? 'إنشاء نموذج جديد' : 'Yeni Form Oluştur'}
                </div>
              </button>
              <button
                onClick={() => setActiveView('chart')}
                className={`px-6 py-4 font-medium transition-colors duration-200 ${
                  activeView === 'chart'
                    ? 'text-caribbean-600 dark:text-caribbean-400 border-b-2 border-caribbean-600 dark:border-caribbean-400'
                    : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 ml-2" />
                  {language === 'ar' ? 'الإحصائيات' : 'İstatistikler'}
                </div>
              </button>
            </div>
          </div>



          {/* Content */}
          <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            {activeView === 'list' ? (
              <VoluntaryReturnFormsList isDarkMode={isDarkMode} />
            ) : activeView === 'create' ? (
              <VoluntaryReturnForm 
                isDarkMode={isDarkMode}
              />
            ) : (
              <VoluntaryReturnChart isDarkMode={isDarkMode} />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default VoluntaryReturnPage;
