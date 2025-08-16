import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, MessageCircle, Clock, CheckCircle, Settings, Trash2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface Notification {
  id: string;
  type: 'support_request' | 'new_message' | 'session_status' | 'system';
  title: string;
  message: string;
  sessionId?: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface RealTimeNotificationsProps {
  onNotificationClick?: (notification: Notification) => void;
  onSessionSelect?: (sessionId: string) => void;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  onNotificationClick,
  onSessionSelect
}) => {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadNotifications();
    setupRealTimeNotifications();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const loadNotifications = () => {
    const saved = localStorage.getItem('admin_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  };

  const saveNotifications = () => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
  };

  useEffect(() => {
    saveNotifications();
  }, [notifications]);

  const setupRealTimeNotifications = () => {
    // إعداد WebSocket أو Server-Sent Events للإشعارات في الوقت الفعلي
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      addNotification(notification);
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
    };

    return () => {
      eventSource.close();
    };
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // الاحتفاظ بآخر 50 إشعار

    // إظهار إشعار للمتصفح إذا كان مطلوب
    if (Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/logo.png',
        tag: newNotification.id
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowDropdown(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    // إخفاء الرقم فوراً عند النقر
    setIsAnimating(true);
    
    // تأخير بسيط لإظهار التأثير البصري
    setTimeout(() => {
      markAsRead(notification.id);
      setIsAnimating(false);
    }, 100);
    
    if (notification.sessionId && onSessionSelect) {
      onSessionSelect(notification.sessionId);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    setShowDropdown(false);
  };

  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_request': return <AlertCircle className="w-4 h-4" />;
      case 'new_message': return <MessageCircle className="w-4 h-4" />;
      case 'session_status': return <Clock className="w-4 h-4" />;
      case 'system': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (priority === 'high') return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    
    switch (type) {
      case 'support_request': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'new_message': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'session_status': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'system': return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return language === 'ar' ? 'عاجل' : 'Urgent';
      case 'high': return language === 'ar' ? 'عالية' : 'High';
      case 'medium': return language === 'ar' ? 'متوسطة' : 'Medium';
      case 'low': return language === 'ar' ? 'منخفضة' : 'Low';
      default: return priority;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* زر الإشعارات */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 group"
        onMouseEnter={requestNotificationPermission}
      >
        <Bell className={`w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 group-hover:scale-110 ${isAnimating ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && !isAnimating && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-3 w-96 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-50 max-h-[500px] overflow-hidden">
          {/* رأس القائمة */}
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {unreadCount} {language === 'ar' ? 'جديد' : 'new'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={markAllAsRead}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                  title={language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* قائمة الإشعارات */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  {language === 'ar' ? 'ستظهر الإشعارات الجديدة هنا' : 'New notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border-l-4 hover:shadow-lg transform hover:scale-[1.02] ${
                      notification.isRead 
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50' 
                        : 'bg-blue-50/80 dark:bg-blue-900/20 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 shadow-sm'
                    } ${getNotificationColor(notification.type, notification.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 space-x-reverse flex-1">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            notification.isRead ? 'bg-slate-200 dark:bg-slate-600' : 'bg-blue-200 dark:bg-blue-800'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {notification.title}
                            </p>
                            {notification.priority !== 'medium' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                notification.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                notification.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
                              }`}>
                                {getPriorityText(notification.priority)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center">
                            <Clock className="w-3 h-3 ml-1" />
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title={language === 'ar' ? 'حذف الإشعار' : 'Delete notification'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* تذييل القائمة */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {notifications.length} {language === 'ar' ? 'إشعار' : 'notification'}
                </span>
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors duration-200 flex items-center space-x-1 space-x-reverse"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{language === 'ar' ? 'مسح الكل' : 'Clear all'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;
