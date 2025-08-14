import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Calendar, TrendingUp, BarChart3, PieChart, Filter, Download, RefreshCw, Eye, Users, MapPin, Clock, FileText } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { voluntaryReturnService } from '../lib/voluntaryReturnService';
import { VoluntaryReturnForm } from '../lib/types';
import { formatDisplayDate } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface VoluntaryReturnChartProps {
  isDarkMode: boolean;
}

type TimeRange = '7days' | '30days' | '3months' | '6months' | '1year';
type ChartType = 'line' | 'bar' | 'doughnut';

const VoluntaryReturnChart: React.FC<VoluntaryReturnChartProps> = ({ isDarkMode }) => {
  const { language } = useLanguage();
  const [forms, setForms] = useState<VoluntaryReturnForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  // Auto refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto refreshing data...');
      loadForms();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 بدء تحميل النماذج...');
      
      const { data, error } = await voluntaryReturnService.getAllForms();
      
      if (error) {
        throw error;
      }
      
      setForms(data || []);
      setLastUpdated(new Date());
      console.log('✅ تم تحميل النماذج بنجاح:', data?.length || 0);
    } catch (err) {
      console.error('Error loading forms:', err);
      setError(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate: now };
  };

  const filterFormsByDateRange = (range: TimeRange) => {
    const { startDate, endDate } = getDateRange(range);
    return forms.filter(form => {
      const formDate = new Date(form.created_at);
      return formDate >= startDate && formDate <= endDate;
    });
  };

  const generateTimeLabels = (range: TimeRange) => {
    const { startDate, endDate } = getDateRange(range);
    const labels = [];
    const current = new Date(startDate);
    
    switch (range) {
      case '7days':
        while (current <= endDate) {
          labels.push(formatDisplayDate(current));
          current.setDate(current.getDate() + 1);
        }
        break;
      case '30days':
        while (current <= endDate) {
          labels.push(formatDisplayDate(current));
          current.setDate(current.getDate() + 1);
        }
        break;
      case '3months':
      case '6months':
        while (current <= endDate) {
          labels.push(formatDisplayDate(current));
          current.setMonth(current.getMonth() + 1);
        }
        break;
      case '1year':
        while (current <= endDate) {
          labels.push(formatDisplayDate(current));
          current.setMonth(current.getMonth() + 1);
        }
        break;
    }
    
    return labels;
  };

  const generateFormData = (range: TimeRange) => {
    const filteredForms = filterFormsByDateRange(range);
    const labels = generateTimeLabels(range);
    const data = new Array(labels.length).fill(0);
    
    filteredForms.forEach(form => {
      const formDate = new Date(form.created_at);
      const { startDate } = getDateRange(range);
      
      let index = 0;
      switch (range) {
        case '7days':
        case '30days':
          index = Math.floor((formDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          break;
        case '3months':
        case '6months':
        case '1year':
          index = (formDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (formDate.getMonth() - startDate.getMonth());
          break;
      }
      
      if (index >= 0 && index < data.length) {
        data[index]++;
      }
    });
    
    return data;
  };

  const generateBorderCrossingData = () => {
    const filteredForms = filterFormsByDateRange(timeRange);
    const crossingCounts: { [key: string]: number } = {};
    
    filteredForms.forEach(form => {
      const crossing = form.sinir_kapisi;
      crossingCounts[crossing] = (crossingCounts[crossing] || 0) + 1;
    });
    
    return {
      labels: Object.keys(crossingCounts),
      data: Object.values(crossingCounts)
    };
  };

  const getStatistics = () => {
    const filteredForms = filterFormsByDateRange(timeRange);
    const totalForms = filteredForms.length;
    const uniqueUsers = new Set(filteredForms.map(form => form.user_id)).size;
    const crossingData = generateBorderCrossingData();
    const mostUsedCrossing = crossingData.labels.length > 0 
      ? crossingData.labels[crossingData.data.indexOf(Math.max(...crossingData.data))]
      : language === 'ar' ? 'لا توجد بيانات' : 'Veri Yok';
    
    const days = timeRange === '7days' ? 7 : 
                timeRange === '30days' ? 30 : 
                timeRange === '3months' ? 90 : 
                timeRange === '6months' ? 180 : 365;
    const dailyAverage = Math.round((totalForms / days) * 10) / 10;
    
    // Calculate growth rate
    const previousRange = getPreviousRange(timeRange);
    const previousForms = filterFormsByDateRange(previousRange).length;
    const growthRate = previousForms > 0 
      ? Math.round(((totalForms - previousForms) / previousForms) * 100)
      : 0;
    
    return {
      totalForms,
      uniqueUsers,
      mostUsedCrossing,
      dailyAverage,
      growthRate,
      crossingData
    };
  };

  const getPreviousRange = (range: TimeRange): TimeRange => {
    switch (range) {
      case '7days': return '7days';
      case '30days': return '30days';
      case '3months': return '3months';
      case '6months': return '6months';
      case '1year': return '1year';
      default: return '30days';
    }
  };

  const chartData = {
    line: {
      labels: generateTimeLabels(timeRange),
      datasets: [
        {
          label: language === 'ar' ? 'عدد النماذج' : 'Form Sayısı',
          data: generateFormData(timeRange),
          borderColor: isDarkMode ? '#10b981' : '#059669',
          backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: isDarkMode ? '#10b981' : '#059669',
          pointBorderColor: isDarkMode ? '#ffffff' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    bar: {
      labels: generateTimeLabels(timeRange),
      datasets: [
        {
          label: language === 'ar' ? 'عدد النماذج' : 'Form Sayısı',
          data: generateFormData(timeRange),
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)',
          borderColor: isDarkMode ? '#3b82f6' : '#2563eb',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    doughnut: {
      labels: generateBorderCrossingData().labels,
      datasets: [
        {
          data: generateBorderCrossingData().data,
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
            '#84cc16',
            '#f97316',
          ],
          borderColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    },
  };

  const chartOptions = {
    line: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: isDarkMode ? '#f3f4f6' : '#374151',
            font: {
              size: 14,
              weight: 'bold' as const,
            },
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          titleColor: isDarkMode ? '#f3f4f6' : '#374151',
          bodyColor: isDarkMode ? '#f3f4f6' : '#374151',
          borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: {
            color: isDarkMode ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          },
        },
        y: {
          grid: {
            color: isDarkMode ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            stepSize: 1,
          },
          beginAtZero: true,
        },
      },
    },
    bar: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: isDarkMode ? '#f3f4f6' : '#374151',
            font: {
              size: 14,
              weight: 'bold' as const,
            },
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          titleColor: isDarkMode ? '#f3f4f6' : '#374151',
          bodyColor: isDarkMode ? '#f3f4f6' : '#374151',
          borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: {
            color: isDarkMode ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          },
        },
        y: {
          grid: {
            color: isDarkMode ? '#374151' : '#e5e7eb',
          },
          ticks: {
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            stepSize: 1,
          },
          beginAtZero: true,
        },
      },
    },
    doughnut: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            color: isDarkMode ? '#f3f4f6' : '#374151',
            font: {
              size: 12,
            },
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          titleColor: isDarkMode ? '#f3f4f6' : '#374151',
          bodyColor: isDarkMode ? '#f3f4f6' : '#374151',
          borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
    },
  };

  const exportData = () => {
    const stats = getStatistics();
    const data = {
      timeRange,
      lastUpdated: lastUpdated.toISOString(),
      statistics: stats,
      forms: filterFormsByDateRange(timeRange)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voluntary-return-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-caribbean-600"></div>
        <span className="mr-3 text-jet-600 dark:text-platinum-400">
          {language === 'ar' ? 'جاري تحميل البيانات...' : 'Veriler yükleniyor...'}
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

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData.line} options={chartOptions.line} />;
      case 'bar':
        return <Bar data={chartData.bar} options={chartOptions.bar} />;
      case 'doughnut':
        return <Doughnut data={chartData.doughnut} options={chartOptions.doughnut} />;
      default:
        return <Line data={chartData.line} options={chartOptions.line} />;
    }
  };

  const stats = getStatistics();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-jet-800 dark:text-platinum-200">
            {language === 'ar' ? 'الإحصائيات الزمنية' : 'Zaman Serisi İstatistikleri'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-jet-500 dark:text-platinum-500">
            <Clock className="w-4 h-4" />
            <span>
              {language === 'ar' ? 'آخر تحديث:' : 'Son güncelleme:'} {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        {/* Enhanced Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-caribbean-600" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-600 rounded-lg text-jet-800 dark:text-platinum-200 focus:ring-2 focus:ring-caribbean-500 focus:border-transparent"
            >
              <option value="7days">{language === 'ar' ? 'آخر 7 أيام' : 'Son 7 Gün'}</option>
              <option value="30days">{language === 'ar' ? 'آخر 30 يوم' : 'Son 30 Gün'}</option>
              <option value="3months">{language === 'ar' ? 'آخر 3 أشهر' : 'Son 3 Ay'}</option>
              <option value="6months">{language === 'ar' ? 'آخر 6 أشهر' : 'Son 6 Ay'}</option>
              <option value="1year">{language === 'ar' ? 'آخر سنة' : 'Son 1 Yıl'}</option>
            </select>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-caribbean-600" />
            <div className="flex bg-white dark:bg-jet-800 border border-platinum-200 dark:border-jet-600 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  chartType === 'line'
                    ? 'bg-caribbean-600 text-white'
                    : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600'
                }`}
                title={language === 'ar' ? 'خط زمني' : 'Zaman Serisi'}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  chartType === 'bar'
                    ? 'bg-caribbean-600 text-white'
                    : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600'
                }`}
                title={language === 'ar' ? 'أعمدة' : 'Sütun Grafik'}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('doughnut')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  chartType === 'doughnut'
                    ? 'bg-caribbean-600 text-white'
                    : 'text-jet-600 dark:text-platinum-400 hover:text-caribbean-600'
                }`}
                title={language === 'ar' ? 'دائري' : 'Pasta Grafik'}
              >
                <PieChart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'text-green-600 animate-spin' : 'text-jet-600'}`} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-platinum-300 text-caribbean-600 focus:ring-caribbean-500"
              />
              <span className="text-jet-600 dark:text-platinum-400">
                {language === 'ar' ? 'تحديث تلقائي' : 'Otomatik Yenile'}
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadForms}
              className="px-4 py-2 bg-caribbean-600 text-white rounded-lg hover:bg-caribbean-700 transition-colors flex items-center gap-2"
              title={language === 'ar' ? 'تحديث البيانات' : 'Verileri Yenile'}
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'ar' ? 'تحديث' : 'Yenile'}
            </button>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              title={language === 'ar' ? 'تصدير البيانات' : 'Verileri Dışa Aktar'}
            >
              <Download className="w-4 h-4" />
              {language === 'ar' ? 'تصدير' : 'Dışa Aktar'}
            </button>
          </div>
        </div>

        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-caribbean-500 to-caribbean-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">
                  {language === 'ar' ? 'إجمالي النماذج' : 'Toplam Form'}
                </p>
                <p className="text-3xl font-bold">{stats.totalForms}</p>
                {stats.growthRate !== 0 && (
                  <p className={`text-sm ${stats.growthRate > 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}% {language === 'ar' ? 'من الفترة السابقة' : 'önceki dönemden'}
                  </p>
                )}
              </div>
              <FileText className="w-10 h-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">
                  {language === 'ar' ? 'المستخدمين الفريدين' : 'Benzersiz Kullanıcılar'}
                </p>
                <p className="text-3xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-sm opacity-80">
                  {language === 'ar' ? 'مستخدم نشط' : 'aktif kullanıcı'}
                </p>
              </div>
              <Users className="w-10 h-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">
                  {language === 'ar' ? 'المعبر الأكثر استخداماً' : 'En Çok Kullanılan Geçiş'}
                </p>
                <p className="text-lg font-bold truncate">
                  {stats.mostUsedCrossing}
                </p>
                <p className="text-sm opacity-80">
                  {language === 'ar' ? 'معبر شائع' : 'popüler geçiş'}
                </p>
              </div>
              <MapPin className="w-10 h-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">
                  {language === 'ar' ? 'المتوسط اليومي' : 'Günlük Ortalama'}
                </p>
                <p className="text-3xl font-bold">{stats.dailyAverage}</p>
                <p className="text-sm opacity-80">
                  {language === 'ar' ? 'نموذج/يوم' : 'form/gün'}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            <h4 className="text-lg font-semibold text-jet-800 dark:text-platinum-200 mb-4">
              {language === 'ar' ? 'توزيع المعابر' : 'Geçiş Dağılımı'}
            </h4>
            <div className="space-y-2">
              {stats.crossingData.labels.slice(0, 5).map((crossing, index) => (
                <div key={crossing} className="flex items-center justify-between">
                  <span className="text-jet-600 dark:text-platinum-400 text-sm">{crossing}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-platinum-200 dark:bg-jet-600 rounded-full h-2">
                      <div 
                        className="bg-caribbean-500 h-2 rounded-full"
                        style={{ 
                          width: `${(stats.crossingData.data[index] / Math.max(...stats.crossingData.data)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-jet-800 dark:text-platinum-200 text-sm font-medium">
                      {stats.crossingData.data[index]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-jet-800 p-6 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700">
            <h4 className="text-lg font-semibold text-jet-800 dark:text-platinum-200 mb-4">
              {language === 'ar' ? 'ملخص سريع' : 'Hızlı Özet'}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-jet-600 dark:text-platinum-400">
                  {language === 'ar' ? 'النماذج هذا الشهر' : 'Bu ayki formlar'}
                </span>
                <span className="font-semibold text-jet-800 dark:text-platinum-200">
                  {filterFormsByDateRange('30days').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-jet-600 dark:text-platinum-400">
                  {language === 'ar' ? 'النماذج هذا الأسبوع' : 'Bu haftaki formlar'}
                </span>
                <span className="font-semibold text-jet-800 dark:text-platinum-200">
                  {filterFormsByDateRange('7days').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-jet-600 dark:text-platinum-400">
                  {language === 'ar' ? 'معدل النمو' : 'Büyüme Oranı'}
                </span>
                <span className={`font-semibold ${stats.growthRate > 0 ? 'text-green-600' : stats.growthRate < 0 ? 'text-red-600' : 'text-jet-600'}`}>
                  {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart Container */}
      <div className="bg-white dark:bg-jet-800 rounded-xl shadow-sm border border-platinum-200 dark:border-jet-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-jet-800 dark:text-platinum-200">
            {chartType === 'line' && (language === 'ar' ? 'الرسم البياني الزمني' : 'Zaman Serisi Grafiği')}
            {chartType === 'bar' && (language === 'ar' ? 'رسم بياني بالأعمدة' : 'Sütun Grafiği')}
            {chartType === 'doughnut' && (language === 'ar' ? 'رسم بياني دائري' : 'Pasta Grafiği')}
          </h4>
          <div className="flex items-center gap-2 text-sm text-jet-500 dark:text-platinum-500">
            <Eye className="w-4 h-4" />
            <span>
              {language === 'ar' ? 'عرض تفاعلي' : 'İnteraktif Görünüm'}
            </span>
          </div>
        </div>
        <div className="h-96">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default VoluntaryReturnChart;
