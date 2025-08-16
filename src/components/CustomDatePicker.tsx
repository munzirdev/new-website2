import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
  placeholder?: string;
  isArabic?: boolean;
  isDarkMode?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  maxDate = new Date().toISOString().split('T')[0],
  placeholder = 'Select date',
  isArabic = false,
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualInputValue, setManualInputValue] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsYearSelectorOpen(false);
        setIsMonthSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const isDisabled = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date > new Date(maxDate);
  };

  const handleManualInputChange = (inputValue: string) => {
    setManualInputValue(inputValue);
    // No auto-completion - user must manually confirm with Enter key
  };

  const handleManualInputConfirm = () => {
    const inputValue = manualInputValue.trim();
    if (!inputValue) return;
    
    // Remove all non-digit characters for flexible parsing
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Try different date formats
    let parsedDate: Date | null = null;
    
    // Format 1: DDMMYYYY (8 digits) - e.g., 01012000
    if (digitsOnly.length === 8) {
      const day = parseInt(digitsOnly.substring(0, 2));
      const month = parseInt(digitsOnly.substring(2, 4));
      const year = parseInt(digitsOnly.substring(4, 8));
      parsedDate = new Date(year, month - 1, day);
    }
    // Format 2: DDMMYY (6 digits) - e.g., 010100 (assuming 2000s)
    else if (digitsOnly.length === 6) {
      const day = parseInt(digitsOnly.substring(0, 2));
      const month = parseInt(digitsOnly.substring(2, 4));
      const year = parseInt(digitsOnly.substring(4, 6));
      // Assume years 00-29 are 2000s, 30-99 are 1900s
      const fullYear = year < 30 ? 2000 + year : 1900 + year;
      parsedDate = new Date(fullYear, month - 1, day);
    }
    // Format 3: Traditional formats with separators
    else {
      // Try various separator patterns
      const patterns = [
        /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, // DD/MM/YYYY
        /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/, // DD/MM/YY
        /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/, // YYYY-MM-DD
      ];
      
      for (const pattern of patterns) {
        const match = inputValue.match(pattern);
        if (match) {
          let day, month, year;
          
          if (pattern.source.includes('(\\d{4})') && pattern.source.startsWith('^(\\d{4})')) {
            // YYYY-MM-DD format
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          } else {
            // DD-MM-YYYY or DD-MM-YY format
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = parseInt(match[3]);
            
            // Handle 2-digit years
            if (year < 100) {
              year = year < 30 ? 2000 + year : 1900 + year;
            }
          }
          
          parsedDate = new Date(year, month - 1, day);
          break;
        }
      }
    }
    
    // Validate the parsed date
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const day = parsedDate.getDate();
      const month = parsedDate.getMonth();
      const year = parsedDate.getFullYear();
      
      // Check if it's a valid date and not in the future
      if (parsedDate.getDate() === day && 
          parsedDate.getMonth() === month && 
          parsedDate.getFullYear() === year &&
          parsedDate <= new Date(maxDate)) {
        setSelectedDate(parsedDate);
        onChange(formatDate(parsedDate));
        setIsManualInput(false);
      }
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setIsYearSelectorOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setIsMonthSelectorOpen(false);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push(year);
    }
    return years;
  };

  const monthNames = isArabic ? [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ] : [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = isArabic ? [
    'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'
  ] : [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDate = isToday(day);
      const isSelectedDate = isSelected(day);
      const isDisabledDate = isDisabled(day);

      days.push(
        <button
          key={day}
          onClick={() => !isDisabledDate && handleDateSelect(day)}
          disabled={isDisabledDate}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
            ${isSelectedDate 
              ? 'bg-gradient-to-r from-caribbean-500 to-indigo-600 text-white shadow-lg transform scale-105' 
              : isTodayDate 
                ? 'border-2 border-caribbean-500 text-caribbean-700 dark:text-caribbean-300 font-bold' 
                : 'text-jet-700 dark:text-jet-300 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20'
            }
            ${isDisabledDate 
              ? 'opacity-30 cursor-not-allowed' 
              : 'cursor-pointer hover:shadow-md'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative" ref={pickerRef}>
      {/* Input Field */}
      <div className="relative group">
        {isManualInput ? (
          <input
            type="text"
            value={manualInputValue}
            onChange={(e) => handleManualInputChange(e.target.value)}
            onBlur={() => setIsManualInput(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsManualInput(false);
                setManualInputValue('');
              }
              if (e.key === 'Enter') {
                // Try to parse the current input and set the date
                handleManualInputConfirm();
              }
            }}
            placeholder={isArabic ? 'أدخل التاريخ (مثال: 01/01/1990 أو 01011990)' : 'Enter date (e.g., 01/01/1990 or 01011990)'}
            className="w-full px-4 py-3 pr-12 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 bg-white/20 backdrop-blur-md text-white placeholder-white/70 shadow-lg hover:bg-white/25 hover:border-white/50 text-right font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.25) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
            autoFocus
          />
        ) : (
          <input
             type="text"
             value={selectedDate ? selectedDate.toLocaleDateString('en-GB') : ''}
             onClick={() => {
               setIsManualInput(true);
               setManualInputValue(selectedDate ? selectedDate.toLocaleDateString('en-GB') : '');
             }}
             readOnly
             placeholder={placeholder}
             className="w-full px-4 py-3 pr-12 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 bg-white/20 backdrop-blur-md text-white placeholder-white/70 shadow-lg hover:bg-white/25 hover:border-white/50 cursor-text"
             style={{
               background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.25) 100%)',
               backdropFilter: 'blur(10px)',
               WebkitBackdropFilter: 'blur(10px)'
             }}
           />
         )}
        
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
           <button
             onClick={(e) => {
               e.stopPropagation();
               setIsOpen(!isOpen);
             }}
             className="p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg hover:bg-white/30 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl"
             style={{
               background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.3) 100%)',
               backdropFilter: 'blur(10px)',
               WebkitBackdropFilter: 'blur(10px)'
             }}
           >
             <Calendar className="w-4 h-4 text-white" />
           </button>
         </div>
        
        {/* Clear button */}
        {selectedDate && !isManualInput && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDate(null);
              onChange('');
            }}
            className="absolute inset-y-0 right-0 pr-12 flex items-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        
      </div>

      {/* Help text for manual input */}
      {isManualInput && (
        <div className="absolute top-full left-0 mt-1 z-40 bg-white/90 dark:bg-jet-800/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-white/20">
          <div className="text-xs text-jet-600 dark:text-jet-300">
            {isArabic ? 'اضغط Enter لتأكيد التاريخ' : 'Press Enter to confirm the date'}
          </div>
        </div>
      )}

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-jet-800 rounded-xl shadow-2xl border border-platinum-200 dark:border-jet-600 p-4 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-platinum-100 dark:hover:bg-jet-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-jet-600 dark:text-jet-400" />
            </button>
            
            <div className="text-center flex-1 mx-4">
               <div className="flex flex-col items-center space-y-1">
                 {/* Month Selector */}
                 <div className="relative">
                   <button
                     onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
                     className="text-lg font-bold text-jet-900 dark:text-white hover:text-caribbean-600 dark:hover:text-caribbean-400 transition-colors flex items-center"
                   >
                     {monthNames[currentDate.getMonth()]}
                     {isMonthSelectorOpen ? (
                       <ChevronUp className="w-4 h-4 ml-1" />
                     ) : (
                       <ChevronDown className="w-4 h-4 ml-1" />
                     )}
                   </button>
                   
                   {/* Month Selector Dropdown */}
                   {isMonthSelectorOpen && (
                     <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-600 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto z-10 min-w-[140px]">
                       <div className="grid grid-cols-2 gap-1">
                         {monthNames.map((month, index) => (
                           <button
                             key={month}
                             onClick={() => handleMonthSelect(index)}
                             className={`
                               px-3 py-2 text-sm rounded transition-colors text-left
                               ${currentDate.getMonth() === index
                                 ? 'bg-caribbean-500 text-white'
                                 : 'hover:bg-platinum-100 dark:hover:bg-jet-700 text-jet-700 dark:text-jet-300'
                               }
                             `}
                           >
                             {month}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Year Selector */}
                 <div className="relative">
                   <button
                     onClick={() => setIsYearSelectorOpen(!isYearSelectorOpen)}
                     className="text-sm text-jet-600 dark:text-jet-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 transition-colors flex items-center justify-center mx-auto"
                   >
                     {currentDate.getFullYear()}
                     {isYearSelectorOpen ? (
                       <ChevronUp className="w-3 h-3 ml-1" />
                     ) : (
                       <ChevronDown className="w-3 h-3 ml-1" />
                     )}
                   </button>
                   
                   {/* Year Selector Dropdown */}
                   {isYearSelectorOpen && (
                     <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-600 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto z-10 min-w-[120px]">
                       <div className="grid grid-cols-3 gap-1">
                         {generateYearOptions().map((year) => (
                           <button
                             key={year}
                             onClick={() => handleYearSelect(year)}
                             className={`
                               px-2 py-1 text-xs rounded transition-colors
                               ${currentDate.getFullYear() === year
                                 ? 'bg-caribbean-500 text-white'
                                 : 'hover:bg-platinum-100 dark:hover:bg-jet-700 text-jet-700 dark:text-jet-300'
                               }
                             `}
                           >
                             {year}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-platinum-100 dark:hover:bg-jet-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-jet-600 dark:text-jet-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-semibold text-caribbean-600 dark:text-caribbean-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-platinum-200 dark:border-jet-600">
            <div className="flex items-center justify-between text-xs text-jet-500 dark:text-jet-400">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 border-2 border-caribbean-500 rounded"></div>
                <span>{isArabic ? 'اليوم الحالي' : 'Today'}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-gradient-to-r from-caribbean-500 to-indigo-600 rounded"></div>
                <span>{isArabic ? 'التاريخ المختار' : 'Selected'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
