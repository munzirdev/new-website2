import React, { useState } from 'react';
import ProfessionalThemeToggle from './ProfessionalThemeToggle';

const ThemeToggleTest: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleToggle = () => {
    console.log('🎨 Theme toggle clicked!');
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isDarkMode 
        ? 'bg-slate-900 text-white' 
        : 'bg-sky-50 text-slate-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          اختبار نظام الانتقال الاحترافي
        </h1>
        
        <div className="flex flex-col items-center space-y-8">
          <div className="text-center">
            <p className="text-xl mb-4">
              الوضع الحالي: {isDarkMode ? '🌙 ليلي' : '☀️ نهاري'}
            </p>
            <p className="text-sm text-gray-500">
              انقر على الزر أدناه لاختبار الانتقال الاحترافي
            </p>
          </div>
          
          <div className="relative">
            <ProfessionalThemeToggle
              isDarkMode={isDarkMode}
              onToggle={handleToggle}
              className="relative z-10"
            />
          </div>
          
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold mb-4">المميزات المتوقعة:</h2>
            <ul className="text-left space-y-2">
              <li>✨ انتقالات سلسة مع easing functions</li>
              <li>🎨 تأثيرات بصرية متقدمة</li>
              <li>🔊 أصوات انتقال احترافية</li>
              <li>📱 استجابة هزازية للأجهزة المحمولة</li>
              <li>⚡ تحسين الأداء للأجهزة الضعيفة</li>
              <li>♿ دعم إمكانية الوصول</li>
              <li>🔒 حماية أمنية شاملة</li>
              <li>🌐 توافق مع جميع المتصفحات</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeToggleTest;
