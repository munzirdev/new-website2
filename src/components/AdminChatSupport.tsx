import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Send, 
  User, 
  Bot, 
  Phone, 
  Search, 
  Filter, 
  RefreshCw, 
  Bell, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText,
  Eye,
  Archive,
  Star,
  MoreVertical,
  Download,
  Settings,
  Volume2,
  VolumeX,
  Calendar,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Heart,
  Smile,
  Frown,
  Meh,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { telegramService } from '../services/telegramService';
import TelegramSettingsModal from './TelegramSettingsModal';
import BulkDeleteModal from './BulkDeleteModal';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'admin';
  session_id: string;
  created_at: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_urgent?: boolean;
}

interface ChatSession {
  session_id: string;
  last_message: string;
  last_message_time: string;
  message_count: number;
  language: string;
  status: 'active' | 'closed' | 'waiting_support' | 'archived';
  user_info?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    ip_address?: string;
    user_agent?: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  satisfaction_rating?: number;
  response_time_avg?: number;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  type: 'support_request' | 'new_message' | 'session_status' | 'urgent_message' | 'satisfaction_rating';
  title: string;
  message: string;
  sessionId?: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface ChatStats {
  total: number;
  active: number;
  waiting: number;
  closed: number;
  archived: number;
  urgent: number;
  avgResponseTime: number;
  satisfactionScore: number;
  messagesToday: number;
  newSessionsToday: number;
}

const AdminChatSupport: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed' | 'waiting_support' | 'archived'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'ar' | 'en'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<ChatStats>({
    total: 0,
    active: 0,
    waiting: 0,
    closed: 0,
    archived: 0,
    urgent: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    messagesToday: 0,
    newSessionsToday: 0
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'none' | 'archive' | 'close' | 'delete'>('none');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<ChatSession | null>(null);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'user' | 'admin' | 'bot'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Array<{id: string, ar: string, en: string}>>([]);
  const [newTemplate, setNewTemplate] = useState({ ar: '', en: '' });
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0);
  const [bulkDeleteSessionIds, setBulkDeleteSessionIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // دوال معالجة الجلسات
  const handleCloseSession = async () => {
    if (!selectedSession) return;
    
    try {
      setIsLoading(true);
      
      // تحديث في قاعدة البيانات
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', selectedSession);
      
      if (error) {
        console.error('Error closing session:', error);
        // استخدام البيانات التجريبية في حالة الخطأ
        setSessions(prev => prev.map(session => 
          session.session_id === selectedSession 
            ? { ...session, status: 'closed' as const }
            : session
        ));
      } else {
        // تحديث الحالة المحلية
        setSessions(prev => prev.map(session => 
          session.session_id === selectedSession 
            ? { ...session, status: 'closed' as const }
            : session
        ));
      }
      
      // إضافة إشعار
      addNotification({
        type: 'session_status',
        title: language === 'ar' ? 'تم إغلاق الجلسة' : 'Session Closed',
        message: language === 'ar' ? `تم إغلاق الجلسة ${selectedSession.slice(0, 8)}...` : `Session ${selectedSession.slice(0, 8)}... has been closed`,
        sessionId: selectedSession,
        priority: 'medium',
        timestamp: new Date(),
        isRead: false
      });
      
    } catch (error) {
      console.error('Error in handleCloseSession:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveSession = async () => {
    if (!selectedSession) return;
    
    try {
      setIsLoading(true);
      
      // تحديث في قاعدة البيانات
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', selectedSession);
      
      if (error) {
        console.error('Error archiving session:', error);
        // استخدام البيانات التجريبية في حالة الخطأ
        setSessions(prev => prev.map(session => 
          session.session_id === selectedSession 
            ? { ...session, status: 'archived' as const }
            : session
        ));
      } else {
        // تحديث الحالة المحلية
        setSessions(prev => prev.map(session => 
          session.session_id === selectedSession 
            ? { ...session, status: 'archived' as const }
            : session
        ));
      }
      
      // إضافة إشعار
      addNotification({
        type: 'session_status',
        title: language === 'ar' ? 'تم أرشفة الجلسة' : 'Session Archived',
        message: language === 'ar' ? `تم أرشفة الجلسة ${selectedSession.slice(0, 8)}...` : `Session ${selectedSession.slice(0, 8)}... has been archived`,
        sessionId: selectedSession,
        priority: 'medium',
        timestamp: new Date(),
        isRead: false
      });
      
    } catch (error) {
      console.error('Error in handleArchiveSession:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (bulkDeleteSessionIds.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // حذف الرسائل أولاً
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .in('session_id', bulkDeleteSessionIds);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
      }
      
      // حذف الجلسات
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .in('session_id', bulkDeleteSessionIds);
      
      if (sessionError) {
        console.error('Error deleting sessions:', sessionError);
      }
      
      // تحديث الحالة المحلية
      setSessions(prev => prev.filter(session => !bulkDeleteSessionIds.includes(session.session_id)));
      setSelectedSessions(new Set());
      setBulkAction('none');
      
      // إذا كانت الجلسة المحددة من بين المحذوفة، امسحها
      if (selectedSession && bulkDeleteSessionIds.includes(selectedSession)) {
        setMessages([]);
        setSelectedSession(null);
        setSessionDetails(null);
      }
      
      // إضافة إشعار
      addNotification({
        type: 'session_status',
        title: language === 'ar' ? 'تم الحذف الجماعي' : 'Bulk Delete Completed',
        message: language === 'ar' ? `تم حذف ${bulkDeleteSessionIds.length} محادثة` : `${bulkDeleteSessionIds.length} conversations have been deleted`,
        priority: 'high',
        timestamp: new Date(),
        isRead: false
      });
      
    } catch (error) {
      console.error('Error in handleBulkDelete:', error);
    } finally {
      setIsLoading(false);
      setShowBulkDeleteModal(false);
      setBulkDeleteSessionIds([]);
      setBulkDeleteCount(0);
    }
  };

  const handleSingleDelete = async () => {
    if (!selectedSession) return;
    
    // تأكيد الحذف
    const confirmDelete = window.confirm(
      language === 'ar' 
        ? 'هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this conversation? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    try {
      setIsLoading(true);
      
      // حذف الرسائل أولاً
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', selectedSession);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
      }
      
      // حذف الجلسة
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('session_id', selectedSession);
      
      if (sessionError) {
        console.error('Error deleting session:', sessionError);
      }
      
      // تحديث الحالة المحلية
      setSessions(prev => prev.filter(session => session.session_id !== selectedSession));
      setMessages([]);
      setSelectedSession(null);
      setSessionDetails(null);
      
      // إضافة إشعار
      addNotification({
        type: 'session_status',
        title: language === 'ar' ? 'تم حذف الجلسة' : 'Session Deleted',
        message: language === 'ar' ? `تم حذف الجلسة ${selectedSession.slice(0, 8)}...` : `Session ${selectedSession.slice(0, 8)}... has been deleted`,
        priority: 'high',
        timestamp: new Date(),
        isRead: false
      });
      
    } catch (error) {
      console.error('Error in handleSingleDelete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // بيانات تجريبية للجلسات
        const mockSessions: ChatSession[] = [
          {
            session_id: 'demo-session-001',
            last_message: 'أريد التحدث مع ممثل حقيقي',
            last_message_time: new Date().toISOString(),
            message_count: 3,
            language: 'ar',
            status: 'waiting_support',
      priority: 'urgent',
            user_info: {
              name: 'أحمد محمد',
              email: 'ahmed@example.com',
        phone: '+966501234567',
        country: 'Saudi Arabia',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...'
      },
      satisfaction_rating: 4,
      response_time_avg: 120,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
          },
          {
            session_id: 'demo-session-002',
            last_message: 'مشكلة في التأمين الصحي',
            last_message_time: new Date(Date.now() - 3600000).toISOString(),
            message_count: 5,
            language: 'ar',
            status: 'active',
      priority: 'medium',
            user_info: {
              name: 'فاطمة علي',
              email: 'fatima@example.com',
        phone: '+966507654321',
        country: 'Saudi Arabia',
        ip_address: '192.168.1.2',
        user_agent: 'Mozilla/5.0...'
      },
      satisfaction_rating: 3,
      response_time_avg: 180,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      session_id: 'demo-session-003',
      last_message: 'شكراً لك على المساعدة',
      last_message_time: new Date(Date.now() - 7200000).toISOString(),
      message_count: 8,
      language: 'ar',
      status: 'closed',
      priority: 'low',
      user_info: {
        name: 'محمد عبدالله',
        email: 'mohammed@example.com',
        phone: '+966509876543',
        country: 'Saudi Arabia',
        ip_address: '192.168.1.3',
        user_agent: 'Mozilla/5.0...'
      },
      satisfaction_rating: 5,
      response_time_avg: 90,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // بيانات تجريبية للرسائل
        const mockMessages: ChatMessage[] = [
          {
            id: 'demo-msg-1',
            content: 'مرحباً، كيف يمكنني مساعدتك؟',
            sender: 'bot',
      session_id: 'demo-session-001',
      created_at: new Date(Date.now() - 300000).toISOString(),
      sentiment: 'positive'
          },
          {
            id: 'demo-msg-2',
            content: 'أحتاج مساعدة في التأمين الصحي',
            sender: 'user',
      session_id: 'demo-session-001',
      created_at: new Date(Date.now() - 240000).toISOString(),
      sentiment: 'neutral'
          },
          {
            id: 'demo-msg-3',
            content: 'أريد التحدث مع ممثل حقيقي',
            sender: 'user',
      session_id: 'demo-session-001',
      created_at: new Date(Date.now() - 180000).toISOString(),
      sentiment: 'negative',
      is_urgent: true
    },
    {
      id: 'demo-msg-4',
      content: 'سأقوم بتحويلك إلى ممثل خدمة العملاء',
      sender: 'admin',
      session_id: 'demo-session-001',
      created_at: new Date(Date.now() - 120000).toISOString(),
      sentiment: 'positive'
    }
  ];

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    console.log('Loading chat support component...');
    loadSessions();
    loadNotifications();
    loadStats();
    loadCustomTemplates();
  }, []);

  // تحديث الإحصائيات عند تغيير الجلسات
  useEffect(() => {
    updateStats();
  }, [sessions]);

  // تحديث عدد الإشعارات غير المقروءة
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  // التمرير إلى أسفل عند تغيير الرسائل (فقط عند إضافة رسائل جديدة)
  useEffect(() => {
    // فقط إذا كان هناك رسائل وكانت الجلسة محددة
    if (messages.length > 0 && selectedSession) {
      // تأخير قليل للتأكد من أن الرسائل تم تحميلها
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, selectedSession]);

  // تحميل الجلسات
  const loadSessions = async () => {
    try {
      console.log('Loading sessions...');
      
      // محاولة تحميل من قاعدة البيانات
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('last_message_time', { ascending: false });

      if (error) {
        console.error('Error loading sessions from database:', error);
        console.log('Using mock data instead...');
        setSessions(mockSessions);
      } else {
        console.log('Sessions loaded from database:', data);
        if (data && data.length > 0) {
          setSessions(data);
          // فحص الجلسات الجديدة التي تطلب دعم
          checkForSupportRequests(data);
        } else {
          console.log('No sessions in database, using mock data...');
          setSessions(mockSessions);
        }
      }
    } catch (error) {
      console.error('Error in loadSessions:', error);
      console.log('Using mock data due to error...');
      setSessions(mockSessions);
    }
  };

  // فحص طلبات الدعم وإرسال إشعارات التلقرام
  const checkForSupportRequests = async (sessionsData: ChatSession[]) => {
    try {
      const supportRequests = sessionsData.filter(session => 
        session.status === 'waiting_support' && 
        session.last_message.toLowerCase().includes('ممثل') ||
        session.last_message.toLowerCase().includes('إنسان') ||
        session.last_message.toLowerCase().includes('حقيقي') ||
        session.last_message.toLowerCase().includes('representative') ||
        session.last_message.toLowerCase().includes('human') ||
        session.last_message.toLowerCase().includes('real')
      );

      for (const session of supportRequests) {
        // إرسال إشعار تلقرام
        await telegramService.sendSupportRequestNotification(session);
        
        // إضافة إشعار محلي
        addNotification({
          type: 'support_request',
          title: language === 'ar' ? 'طلب ممثل خدمة عملاء' : 'Customer Service Request',
          message: language === 'ar' 
            ? `عميل يطلب التحدث مع ممثل: ${session.user_info?.name || 'غير محدد'}`
            : `Customer requesting representative: ${session.user_info?.name || 'Unknown'}`,
          sessionId: session.session_id,
          priority: session.priority || 'medium',
          timestamp: new Date(),
          isRead: false
        });
      }
    } catch (error) {
      console.error('Error checking for support requests:', error);
    }
  };

  // تحميل الرسائل
  const loadMessages = async (sessionId: string) => {
    try {
      console.log('Loading messages for session:', sessionId);
      
      // محاولة تحميل من قاعدة البيانات
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages from database:', error);
        console.log('Using mock messages instead...');
        const sessionMessages = mockMessages.filter(msg => msg.session_id === sessionId);
        setMessages(sessionMessages);
      } else {
        console.log('Messages loaded from database:', data);
        if (data && data.length > 0) {
          const messagesWithSentiment = data.map((message: any) => ({
            ...message,
            sentiment: analyzeSentiment(message.content),
            is_urgent: isUrgentMessage(message.content)
          }));
          setMessages(messagesWithSentiment);
          
          // فحص الرسائل المستعجلة
          checkForUrgentMessages(messagesWithSentiment, sessionId);
        } else {
          console.log('No messages in database, using mock messages...');
          const sessionMessages = mockMessages.filter(msg => msg.session_id === sessionId);
          setMessages(sessionMessages);
        }
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
      console.log('Using mock messages due to error...');
      const sessionMessages = mockMessages.filter(msg => msg.session_id === sessionId);
      setMessages(sessionMessages);
    }
  };

  // فحص الرسائل المستعجلة وإرسال إشعارات التلقرام
  const checkForUrgentMessages = async (messagesData: ChatMessage[], sessionId: string) => {
    try {
      const urgentMessages = messagesData.filter(message => 
        message.is_urgent && 
        message.sender === 'user' &&
        new Date(message.created_at) > new Date(Date.now() - 300000) // آخر 5 دقائق
      );

      for (const message of urgentMessages) {
        const session = sessions.find(s => s.session_id === sessionId);
        if (session) {
          // إرسال إشعار تلقرام للرسائل المستعجلة
          await telegramService.sendUrgentMessageNotification(session, message.content);
          
          // إضافة إشعار محلي
          addNotification({
            type: 'urgent_message',
            title: language === 'ar' ? 'رسالة مستعجلة!' : 'Urgent Message!',
            message: language === 'ar' 
              ? `رسالة مستعجلة من: ${session.user_info?.name || 'غير محدد'}`
              : `Urgent message from: ${session.user_info?.name || 'Unknown'}`,
            sessionId: sessionId,
            priority: 'urgent',
            timestamp: new Date(),
            isRead: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking for urgent messages:', error);
    }
  };

  // تحميل الإشعارات
  const loadNotifications = () => {
    const savedNotifications = localStorage.getItem('chat_notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    } else {
      // إشعارات تجريبية
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          type: 'urgent_message',
          title: language === 'ar' ? 'رسالة مستعجلة' : 'Urgent Message',
          message: language === 'ar' ? 'عميل يطلب التحدث مع ممثل حقيقي' : 'Customer requesting real representative',
          sessionId: 'demo-session-001',
          timestamp: new Date(),
          isRead: false,
          priority: 'urgent'
        },
        {
          id: 'notif-2',
          type: 'new_message',
          title: language === 'ar' ? 'رسالة جديدة' : 'New Message',
          message: language === 'ar' ? 'رسالة جديدة من العميل' : 'New message from customer',
          sessionId: 'demo-session-002',
          timestamp: new Date(Date.now() - 300000),
          isRead: false,
          priority: 'medium'
        }
      ];
      setNotifications(mockNotifications);
    }
  };

  // تحميل القوالب المخصصة
  const loadCustomTemplates = () => {
    const saved = localStorage.getItem('chat_custom_templates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading custom templates:', error);
        setCustomTemplates([]);
      }
    } else {
      setCustomTemplates([]);
    }
  };

  // تحديث الإحصائيات
  const updateStats = () => {
    const total = sessions.length;
    const active = sessions.filter(s => s.status === 'active').length;
    const waiting = sessions.filter(s => s.status === 'waiting_support').length;
    const closed = sessions.filter(s => s.status === 'closed').length;
    const archived = sessions.filter(s => s.status === 'archived').length;
    const urgent = sessions.filter(s => s.priority === 'urgent').length;
    
    const responseTimes = sessions
      .filter(s => s.response_time_avg)
      .map(s => s.response_time_avg || 0);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const ratings = sessions
      .filter(s => s.satisfaction_rating)
      .map(s => s.satisfaction_rating || 0);
    const satisfactionScore = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = messages.filter(m => 
      new Date(m.created_at) >= today
    ).length;
    const newSessionsToday = sessions.filter(s => 
      new Date(s.created_at) >= today
    ).length;
    
    setStats({ 
      total, 
      active, 
      waiting, 
      closed, 
      archived, 
      urgent, 
      avgResponseTime, 
      satisfactionScore, 
      messagesToday, 
      newSessionsToday 
    });
  };

  // تحميل الإحصائيات (مبسط)
  const loadStats = () => {
    updateStats();
  };

  // تحليل المشاعر
  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['شكراً', 'ممتاز', 'رائع', 'جيد', 'مفيد', 'thanks', 'great', 'excellent', 'good', 'helpful'];
    const negativeWords = ['مشكلة', 'سيء', 'غاضب', 'مستاء', 'مستعجل', 'problem', 'bad', 'angry', 'upset', 'urgent'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  // تحديد الرسائل المستعجلة
  const isUrgentMessage = (text: string): boolean => {
    const urgentWords = ['مستعجل', 'مهم', 'عاجل', 'urgent', 'important', 'emergency', 'critical'];
    const lowerText = text.toLowerCase();
    return urgentWords.some(word => lowerText.includes(word));
  };

  // إرسال رسالة من المشرف
  const sendAdminMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const adminMessage: ChatMessage = {
        id: uuidv4(),
        content: newMessage.trim(),
        sender: 'admin',
        session_id: selectedSession,
        created_at: new Date().toISOString(),
        sentiment: analyzeSentiment(newMessage.trim()),
        is_urgent: isUrgentMessage(newMessage.trim())
      };

      console.log('Sending admin message:', adminMessage);

      // محاولة حفظ في قاعدة البيانات
      try {
      const { error } = await supabase
        .from('chat_messages')
        .insert(adminMessage);

      if (error) {
          console.error('Error saving message to database:', error);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      // إضافة للواجهة
      setMessages(prev => [...prev, adminMessage]);
      setNewMessage('');

      // تحديث حالة الجلسة
      try {
        await supabase
          .from('chat_sessions')
          .update({ 
            status: 'active',
            last_message_time: new Date().toISOString()
          })
          .eq('session_id', selectedSession);
      } catch (error) {
        console.error('Error updating session status:', error);
      }

      // إرسال إشعار تلقرام للعميل (إذا كان مفعلاً)
      try {
        const session = sessions.find(s => s.session_id === selectedSession);
        if (session) {
          await telegramService.sendNewMessageNotification(session, newMessage.trim());
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }

    } catch (error) {
      console.error('Error sending admin message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة إشعار
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
  };

  // تحديد الإشعارات كمقروءة
  const markNotificationsAsRead = (sessionId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.sessionId === sessionId ? { ...n, isRead: true } : n
      )
    );
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  // حذف إشعار
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // حفظ القوالب المخصصة
  const saveCustomTemplates = () => {
    localStorage.setItem('chat_custom_templates', JSON.stringify(customTemplates));
  };

  // إضافة قالب مخصص
  const addCustomTemplate = () => {
    if (newTemplate.ar.trim() && newTemplate.en.trim()) {
      const template = {
        id: uuidv4(),
        ar: newTemplate.ar.trim(),
        en: newTemplate.en.trim()
      };
      setCustomTemplates(prev => [...prev, template]);
      setNewTemplate({ ar: '', en: '' });
      saveCustomTemplates();
    }
  };

  // حذف قالب مخصص
  const removeCustomTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    saveCustomTemplates();
  };

  // فلترة الجلسات
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.last_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.user_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.user_info?.phone?.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || session.priority === filterPriority;
    const matchesLanguage = filterLanguage === 'all' || session.language === filterLanguage;
    return matchesSearch && matchesFilter && matchesPriority && matchesLanguage;
  });

  // فلترة الرسائل
  const filteredMessages = messages.filter(message => {
    const matchesSearch = messageSearchTerm === '' || 
                         message.content.toLowerCase().includes(messageSearchTerm.toLowerCase());
    const matchesFilter = messageFilter === 'all' || message.sender === messageFilter;
    const matchesSentiment = sentimentFilter === 'all' || message.sentiment === sentimentFilter;
    return matchesSearch && matchesFilter && matchesSentiment;
  });

  // اختيار الجلسة
  const handleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  // إجراء جماعي
  const handleBulkAction = async () => {
    if (selectedSessions.size === 0 || bulkAction === 'none') return;

    try {
      const sessionIds = Array.from(selectedSessions);
      
      switch (bulkAction) {
        case 'archive':
          await supabase
            .from('chat_sessions')
            .update({ status: 'archived' })
            .in('session_id', sessionIds);
          break;
        case 'close':
          await supabase
            .from('chat_sessions')
            .update({ status: 'closed' })
            .in('session_id', sessionIds);
          break;
        case 'delete':
          setBulkDeleteSessionIds(sessionIds);
          setBulkDeleteCount(sessionIds.length);
          setShowBulkDeleteModal(true);
          return; // لا نكمل التنفيذ هنا، سننتظر تأكيد الحذف
      }
      
      setSelectedSessions(new Set());
      setBulkAction('none');
      loadSessions();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // تصدير الجلسات
  const exportSessions = () => {
    const data = filteredSessions.map(session => ({
      session_id: session.session_id,
      status: session.status,
      priority: session.priority,
      language: session.language,
      message_count: session.message_count,
      last_message: session.last_message,
      last_message_time: session.last_message_time,
      user_name: session.user_info?.name,
      user_email: session.user_info?.email,
      user_phone: session.user_info?.phone,
      satisfaction_rating: session.satisfaction_rating,
      response_time_avg: session.response_time_avg
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // تصدير المحادثة
  const exportConversation = () => {
    if (!selectedSession || messages.length === 0) return;

    const conversationData = {
      session_id: selectedSession,
      export_date: new Date().toISOString(),
      messages: messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.created_at,
        sentiment: msg.sentiment,
        is_urgent: msg.is_urgent
      }))
    };

    const json = JSON.stringify(conversationData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${selectedSession}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // إرسال قالب رسالة
  const sendTemplateMessage = (template: string) => {
    setNewMessage(template);
  };

  // قوالب الرسائل
  const messageTemplates = [
    {
      id: 'greeting',
      ar: 'مرحباً، كيف يمكنني مساعدتك اليوم؟',
      en: 'Hello, how can I help you today?'
    },
    {
      id: 'thanks',
      ar: 'شكراً لك على التواصل معنا. هل هناك شيء آخر تحتاج مساعدة فيه؟',
      en: 'Thank you for contacting us. Is there anything else you need help with?'
    },
    {
      id: 'transfer',
      ar: 'سأقوم بتحويلك إلى ممثل خدمة العملاء المتخصص. يرجى الانتظار قليلاً.',
      en: 'I will transfer you to a specialized customer service representative. Please wait a moment.'
    },
    {
      id: 'apology',
      ar: 'أعتذر عن التأخير في الرد. كيف يمكنني مساعدتك الآن؟',
      en: 'I apologize for the delay in response. How can I help you now?'
    },
    {
      id: 'closing',
      ar: 'شكراً لك على التواصل معنا. نتمنى لك يوماً سعيداً!',
      en: 'Thank you for contacting us. Have a great day!'
    }
  ];

  // النقر على الجلسة
  const handleSessionClick = (sessionId: string) => {
    console.log('Session clicked:', sessionId);
    
    // منع التمرير التلقائي عند تغيير الجلسة
    if (selectedSession !== sessionId) {
      setSelectedSession(sessionId);
      markNotificationsAsRead(sessionId);
      loadMessages(sessionId);
      
      // تحميل تفاصيل الجلسة
      const session = sessions.find(s => s.session_id === sessionId);
      if (session) {
        setSessionDetails(session);
      }
      
      // إعادة تعيين موضع التمرير في منطقة المحادثة
      setTimeout(() => {
        const chatArea = document.querySelector('.chat-messages-area');
        if (chatArea) {
          chatArea.scrollTop = 0;
        }
      }, 50);
    }
  };

  // النقر على الإشعار
  const handleNotificationClick = (notification: Notification) => {
    if (notification.sessionId) {
      setSelectedSession(notification.sessionId);
      markNotificationsAsRead(notification.sessionId);
      loadMessages(notification.sessionId);
    }
    setShowNotifications(false);
  };

  // التمرير إلى أسفل
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // فقط إذا كان المستخدم في أسفل المحادثة أو إذا كانت رسائل جديدة
      const chatArea = document.querySelector('.chat-messages-area') as HTMLElement;
      if (chatArea) {
        const isAtBottom = chatArea.scrollTop + chatArea.clientHeight >= chatArea.scrollHeight - 100;
        if (isAtBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  // معالجة الضغط على المفتاح
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdminMessage();
    }
  };

  // دوال المساعدة للعرض
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'waiting_support': return 'bg-orange-500';
      case 'closed': return 'bg-gray-500';
      case 'archived': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return language === 'ar' ? 'نشط' : 'Active';
      case 'waiting_support': return language === 'ar' ? 'في انتظار الدعم' : 'Waiting Support';
      case 'closed': return language === 'ar' ? 'مغلق' : 'Closed';
      case 'archived': return language === 'ar' ? 'مؤرشف' : 'Archived';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return language === 'ar' ? 'مستعجل' : 'Urgent';
      case 'high': return language === 'ar' ? 'عالي' : 'High';
      case 'medium': return language === 'ar' ? 'متوسط' : 'Medium';
      case 'low': return language === 'ar' ? 'منخفض' : 'Low';
      default: return priority;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_request': return <AlertCircle className="w-4 h-4" />;
      case 'new_message': return <MessageCircle className="w-4 h-4" />;
      case 'session_status': return <Clock className="w-4 h-4" />;
      case 'urgent_message': return <Zap className="w-4 h-4" />;
      case 'satisfaction_rating': return <Heart className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'support_request': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'new_message': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'session_status': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'urgent_message': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'satisfaction_rating': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-green-500" />;
      case 'negative': return <Frown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Meh className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getUrgentIndicator = (message: ChatMessage) => {
    if (message.is_urgent) {
      return <Zap className="w-3 h-3 text-red-500 ml-1" />;
    }
    return null;
  };

  // حساب إحصائيات المحادثة
  const getConversationStats = () => {
    if (!selectedSession || messages.length === 0) return null;

    const userMessages = messages.filter(m => m.sender === 'user');
    const adminMessages = messages.filter(m => m.sender === 'admin');
    const botMessages = messages.filter(m => m.sender === 'bot');
    
    const positiveMessages = messages.filter(m => m.sentiment === 'positive').length;
    const negativeMessages = messages.filter(m => m.sentiment === 'negative').length;
    const neutralMessages = messages.filter(m => m.sentiment === 'neutral').length;
    const urgentMessages = messages.filter(m => m.is_urgent).length;
    
    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      adminMessages: adminMessages.length,
      botMessages: botMessages.length,
      positiveMessages,
      negativeMessages,
      neutralMessages,
      urgentMessages,
      avgResponseTime: 120, // قيمة تجريبية
      satisfactionScore: 4.2 // قيمة تجريبية
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-30">
      {/* Audio element for notifications */}
      <audio ref={audioRef} src="/notification-sound.mp3" preload="auto" />
      
      {/* New Header Design */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        
        {/* Header Content */}
        <div className="relative p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3 md:space-x-4 space-x-reverse">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-all duration-500">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2 tracking-tight">
                  {language === 'ar' ? 'مركز المحادثات' : 'Chat Hub'}
                </h1>
                <p className="text-sm md:text-base text-cyan-200 font-medium">
                  {language === 'ar' ? 'إدارة المحادثات المتقدمة' : 'Advanced Conversation Management'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4 space-x-reverse">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  soundEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25' 
                    : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700'
                }`}
                title={soundEnabled ? (language === 'ar' ? 'إيقاف الصوت' : 'Mute') : (language === 'ar' ? 'تشغيل الصوت' : 'Unmute')}
              >
                {soundEnabled ? <Volume2 size={20} className="md:w-6 md:h-6 text-white" /> : <VolumeX size={20} className="md:w-6 md:h-6 text-white" />}
              </button>
              
              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  autoRefresh 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25' 
                    : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700'
                }`}
                title={autoRefresh ? (language === 'ar' ? 'إيقاف التحديث التلقائي' : 'Disable Auto-refresh') : (language === 'ar' ? 'تشغيل التحديث التلقائي' : 'Enable Auto-refresh')}
              >
                <RefreshCw size={20} className={`md:w-6 md:h-6 text-white ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Export Button */}
              <button
                onClick={exportSessions}
                className="p-3 md:p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-purple-500/25"
                title={language === 'ar' ? 'تصدير البيانات' : 'Export Data'}
              >
                <Download size={20} className="md:w-6 md:h-6 text-white" />
              </button>
              
              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-3 md:p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-orange-500/25 relative"
                >
                  <Bell size={20} className="md:w-6 md:h-6 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center font-bold animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Enhanced Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-700 z-50 max-h-80 md:max-h-96 overflow-y-auto backdrop-blur-xl">
                    <div className="p-6 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg">
                          {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h3>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                          >
                            {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                          </button>
                          <button
                            onClick={() => setNotifications([])}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                          >
                            {language === 'ar' ? 'مسح الكل' : 'Clear all'}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-400 font-medium">
                            {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 mb-3 ${
                              notification.isRead 
                                ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700' 
                                : 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50 hover:from-blue-800/50 hover:to-indigo-800/50 border border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-start space-x-3 space-x-reverse">
                              <div className={`p-2 rounded-xl ${getNotificationColor(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-bold text-white">
                                    {notification.title}
                                  </p>
                                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                    notification.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    notification.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                    notification.priority === 'medium' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                    'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                  }`}>
                                    {getPriorityText(notification.priority)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {notification.timestamp.toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="text-slate-400 hover:text-red-400 transition-colors p-1"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={loadSessions}
                className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-emerald-500/25"
                title={language === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <RefreshCw size={24} className="text-white" />
              </button>
              
              {/* Telegram Settings Button */}
              <button
                onClick={() => setShowTelegramModal(true)}
                className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-teal-500/25"
                title={language === 'ar' ? 'إعدادات التلقرام' : 'Telegram Settings'}
              >
                <Bot size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* New Stats Cards Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-cyan-200 font-bold text-center mb-2">{language === 'ar' ? 'إجمالي' : 'Total'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.total}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-green-200 font-bold text-center mb-2">{language === 'ar' ? 'نشط' : 'Active'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.active}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-orange-200 font-bold text-center mb-2">{language === 'ar' ? 'في الانتظار' : 'Waiting'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.waiting}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-gray-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-slate-200 font-bold text-center mb-2">{language === 'ar' ? 'مغلق' : 'Closed'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.closed}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Archive className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-purple-200 font-bold text-center mb-2">{language === 'ar' ? 'مؤرشف' : 'Archived'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.archived}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-red-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-red-200 font-bold text-center mb-2">{language === 'ar' ? 'مستعجل' : 'Urgent'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.urgent}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-blue-200 font-bold text-center mb-2">{language === 'ar' ? 'متوسط الاستجابة' : 'Avg Response'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.avgResponseTime.toFixed(0)}s</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-yellow-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-yellow-200 font-bold text-center mb-2">{language === 'ar' ? 'درجة الرضا' : 'Satisfaction'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.satisfactionScore.toFixed(1)}/5</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-indigo-200 font-bold text-center mb-2">{language === 'ar' ? 'رسائل اليوم' : 'Today Msgs'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.messagesToday}</p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-teal-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-teal-200 font-bold text-center mb-2">{language === 'ar' ? 'جلسات جديدة' : 'New Sessions'}</p>
                <p className="text-3xl font-black text-white text-center">{stats.newSessionsToday}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* New Sessions List Design */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-700/50 flex flex-col min-w-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl">
          {/* Mobile Session Header - Show when no session is selected */}
          {!selectedSession && (
            <div className="lg:hidden p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/90 to-slate-900/90">
              <h2 className="text-lg font-bold text-white">
                {language === 'ar' ? 'المحادثات' : 'Conversations'}
              </h2>
              <p className="text-sm text-slate-400">
                {filteredSessions.length} {language === 'ar' ? 'محادثة' : 'conversations'}
              </p>
            </div>
          )}
          {/* New Search and Filter Design */}
          <div className="p-4 md:p-6 border-b border-slate-700/50 flex-shrink-0">
            <div className="relative mb-4 md:mb-6">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search conversations...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-2 border-slate-600/50 rounded-2xl md:rounded-3xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-white text-base md:text-lg transition-all duration-300 placeholder-slate-400"
              />
            </div>
            
            {/* New Status Filters */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-4 md:mb-6">
              {(['all', 'active', 'waiting_support', 'closed', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-slate-300 hover:from-slate-600/50 hover:to-slate-700/50 hover:text-white border border-slate-600/50'
                  }`}
                >
                  {status === 'all' 
                    ? (language === 'ar' ? 'الكل' : 'All')
                    : getStatusText(status)
                  }
                </button>
              ))}
            </div>

            {/* New Advanced Filters Toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 space-x-reverse text-sm text-cyan-300 hover:text-cyan-200 transition-colors duration-300 font-medium"
              >
                <Filter size={16} />
                <span>{language === 'ar' ? 'فلترة متقدمة' : 'Advanced Filters'}</span>
              </button>
              
              {/* New Bulk Actions */}
              {selectedSessions.size > 0 && (
                <div className="flex items-center space-x-3 space-x-reverse bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-2xl border border-orange-500/30">
                  <span className="text-sm text-orange-200 font-bold">
                    {language === 'ar' ? `${selectedSessions.size} محادثة محددة` : `${selectedSessions.size} conversations selected`}
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="text-sm bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="none">{language === 'ar' ? 'اختر إجراء' : 'Select Action'}</option>
                    <option value="archive">{language === 'ar' ? 'أرشفة' : 'Archive'}</option>
                    <option value="close">{language === 'ar' ? 'إغلاق' : 'Close'}</option>
                    <option value="delete">{language === 'ar' ? 'حذف' : 'Delete'}</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={bulkAction === 'none'}
                    className="text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-700 transition-all duration-300 transform hover:scale-105 disabled:transform-none font-bold"
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* New Advanced Filters */}
            {showAdvancedFilters && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-3xl border border-slate-600/50">
                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-bold text-cyan-200 mb-3">
                    {language === 'ar' ? 'الأولوية' : 'Priority'}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['all', 'low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setFilterPriority(priority)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                          filterPriority === priority
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                            : 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/50'
                        }`}
                      >
                        {priority === 'all' 
                          ? (language === 'ar' ? 'الكل' : 'All')
                          : getPriorityText(priority)
                        }
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-bold text-cyan-200 mb-3">
                    {language === 'ar' ? 'اللغة' : 'Language'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['all', 'ar', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setFilterLanguage(lang)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                          filterLanguage === lang
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/50'
                        }`}
                      >
                        {lang === 'all' 
                          ? (language === 'ar' ? 'الكل' : 'All')
                          : lang === 'ar' 
                            ? 'العربية' 
                            : 'English'
                        }
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-refresh Settings */}
                <div>
                  <label className="block text-sm font-bold text-cyan-200 mb-3">
                    {language === 'ar' ? 'فترة التحديث التلقائي' : 'Auto-refresh Interval'}
                  </label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="w-full text-sm bg-gradient-to-r from-slate-600/50 to-slate-700/50 border-2 border-slate-500/50 rounded-xl px-4 py-3 text-white focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300"
                  >
                    <option value={10}>10 {language === 'ar' ? 'ثانية' : 'seconds'}</option>
                    <option value={30}>30 {language === 'ar' ? 'ثانية' : 'seconds'}</option>
                    <option value={60}>1 {language === 'ar' ? 'دقيقة' : 'minute'}</option>
                    <option value={300}>5 {language === 'ar' ? 'دقائق' : 'minutes'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* New Sessions List */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 md:p-4">
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-slate-500" />
                </div>
                <p className="text-xl font-bold mb-4">{language === 'ar' ? 'لا توجد محادثات' : 'No conversations'}</p>
                <button
                  onClick={loadSessions}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
                >
                  {language === 'ar' ? 'تحديث' : 'Refresh'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  const hasUnreadNotifications = notifications.some(
                    n => n.sessionId === session.session_id && !n.isRead
                  );
                  const isSelected = selectedSessions.has(session.session_id);
                  
                  return (
                    <div
                      key={session.session_id}
                      className={`group relative p-4 md:p-6 rounded-2xl md:rounded-3xl cursor-pointer transition-all duration-500 transform hover:scale-[1.02] ${
                        selectedSession === session.session_id
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/25'
                          : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-2 border-slate-600/50 hover:border-slate-500/50 hover:shadow-xl'
                      } ${hasUnreadNotifications ? 'ring-2 ring-orange-500/50' : ''} ${
                        isSelected ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50' : ''
                      }`}
                      onClick={() => handleSessionClick(session.session_id)}
                    >
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <div className="flex items-center space-x-2 md:space-x-3 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSessionSelection(session.session_id);
                              }}
                              className="w-4 h-4 md:w-5 md:h-5 rounded-lg border-2 border-slate-400 text-cyan-500 focus:ring-cyan-500 focus:ring-2 transition-all duration-300"
                            />
                            <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse">
                              <div className="w-2 h-2 md:w-3 md:h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-xs md:text-sm font-bold text-white">
                                {session.session_id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse">
                            {hasUnreadNotifications && (
                              <div className="w-2 h-2 md:w-3 md:h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
                            )}
                            <span className={`px-2 md:px-3 py-1 rounded-lg md:rounded-xl text-xs font-bold text-white shadow-lg ${getStatusColor(session.status)}`}>
                              {getStatusText(session.status)}
                            </span>
                            {session.priority && (
                              <span className={`px-2 md:px-3 py-1 rounded-lg md:rounded-xl text-xs font-bold text-white shadow-lg ${getPriorityColor(session.priority)}`}>
                                {getPriorityText(session.priority)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3 md:mb-4">
                          <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-2">
                            {session.last_message}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 md:space-x-4 space-x-reverse">
                            <span className="text-xs text-slate-400 font-bold">
                              {new Date(session.last_message_time).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                              {session.message_count} {language === 'ar' ? 'رسالة' : 'messages'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse">
                            {session.satisfaction_rating && (
                              <div className="flex items-center space-x-1 space-x-reverse bg-gradient-to-r from-red-500/20 to-pink-500/20 px-2 md:px-3 py-1 rounded-lg md:rounded-xl border border-red-500/30">
                                <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                                <span className="text-xs font-bold text-red-200">{session.satisfaction_rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 w-full lg:w-2/3 bg-gradient-to-br from-slate-800/90 to-slate-900/90">
          {/* Mobile Back Button - Show when session is selected */}
          {selectedSession && (
            <div className="lg:hidden p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/90 to-slate-900/90 sticky top-0 z-50">
              <button
                onClick={() => setSelectedSession(null)}
                className="flex items-center space-x-2 space-x-reverse text-white hover:text-cyan-300 transition-colors duration-300"
              >
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'العودة إلى المحادثات' : 'Back to Conversations'}
                </span>
              </button>
            </div>
          )}
          {selectedSession ? (
            <>
              {/* New Chat Header - Fixed */}
              <div className="p-4 md:p-6 border-b border-slate-700/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl flex-shrink-0 sticky top-0 z-40" style={{ position: 'sticky', top: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 md:space-x-4 space-x-reverse">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl">
                      <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">
                        {language === 'ar' ? 'المحادثة' : 'Conversation'}: {selectedSession.slice(0, 8)}...
                      </h3>
                      <p className="text-sm md:text-base text-cyan-200 font-medium">
                        {filteredMessages.length} / {messages.length} {language === 'ar' ? 'رسالة' : 'messages'}
                      </p>
                    </div>
                    {sessionDetails && (
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {sessionDetails.priority && (
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg ${getPriorityColor(sessionDetails.priority)}`}>
                            {getPriorityText(sessionDetails.priority)}
                          </span>
                        )}
                        {sessionDetails.satisfaction_rating && (
                          <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-red-500/20 to-pink-500/20 px-4 py-2 rounded-xl border border-red-500/30">
                            <Heart className="w-5 h-5 text-red-400" />
                            <span className="text-sm font-bold text-red-200">
                              {sessionDetails.satisfaction_rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-3 space-x-reverse">
                    <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse">
                      <button
                        onClick={() => setShowMessageSearch(!showMessageSearch)}
                        className="p-3 md:p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-600/50 hover:to-slate-700/50 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 border border-slate-600/50"
                        title={language === 'ar' ? 'البحث في الرسائل' : 'Search Messages'}
                      >
                        <Search size={18} className="md:w-5 md:h-5 text-cyan-300" />
                      </button>
                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="p-3 md:p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-600/50 hover:to-slate-700/50 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 border border-slate-600/50"
                        title={language === 'ar' ? 'إدارة القوالب' : 'Manage Templates'}
                      >
                        <FileText size={18} className="md:w-5 md:h-5 text-cyan-300" />
                      </button>
                      <button
                        onClick={() => setShowSessionDetails(!showSessionDetails)}
                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                          showSessionDetails 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                            : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-600/50 hover:to-slate-700/50 border border-slate-600/50'
                        }`}
                        title={language === 'ar' ? 'تفاصيل الجلسة' : 'Session Details'}
                      >
                        <Eye size={20} className={showSessionDetails ? 'text-white' : 'text-cyan-300'} />
                      </button>
                      <button
                        onClick={exportConversation}
                        className="p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-600/50 hover:to-slate-700/50 rounded-2xl transition-all duration-300 transform hover:scale-110 border border-slate-600/50"
                        title={language === 'ar' ? 'تصدير المحادثة' : 'Export Conversation'}
                      >
                        <Download size={20} className="text-cyan-300" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={handleCloseSession}
                        className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl text-sm font-bold hover:from-slate-500 hover:to-slate-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        {language === 'ar' ? 'إغلاق' : 'Close'}
                      </button>
                      <button
                        onClick={handleArchiveSession}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
                      >
                        {language === 'ar' ? 'أرشفة' : 'Archive'}
                      </button>
                      <button
                        onClick={handleSingleDelete}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl text-sm font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25"
                      >
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* New Message Search and Filters */}
                {showMessageSearch && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-3xl border border-slate-600/50 shadow-2xl">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-cyan-200 mb-3">
                          {language === 'ar' ? 'البحث في الرسائل' : 'Search Messages'}
                        </label>
                        <input
                          type="text"
                          value={messageSearchTerm}
                          onChange={(e) => setMessageSearchTerm(e.target.value)}
                          placeholder={language === 'ar' ? 'ابحث في محتوى الرسائل...' : 'Search message content...'}
                          className="w-full px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 border-2 border-slate-500/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-white transition-all duration-300 placeholder-slate-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-cyan-200 mb-3">
                            {language === 'ar' ? 'المرسل' : 'Sender'}
                          </label>
                          <select
                            value={messageFilter}
                            onChange={(e) => setMessageFilter(e.target.value as any)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 border-2 border-slate-500/50 rounded-2xl text-sm text-white focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300"
                          >
                            <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                            <option value="user">{language === 'ar' ? 'المستخدم' : 'User'}</option>
                            <option value="admin">{language === 'ar' ? 'المشرف' : 'Admin'}</option>
                            <option value="bot">{language === 'ar' ? 'البوت' : 'Bot'}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-cyan-200 mb-3">
                            {language === 'ar' ? 'المشاعر' : 'Sentiment'}
                          </label>
                          <select
                            value={sentimentFilter}
                            onChange={(e) => setSentimentFilter(e.target.value as any)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 border-2 border-slate-500/50 rounded-2xl text-sm text-white focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300"
                          >
                            <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                            <option value="positive">{language === 'ar' ? 'إيجابي' : 'Positive'}</option>
                            <option value="negative">{language === 'ar' ? 'سلبي' : 'Negative'}</option>
                            <option value="neutral">{language === 'ar' ? 'محايد' : 'Neutral'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Template Management */}
                {showTemplates && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-3xl border border-slate-600/50 shadow-2xl">
                    <div className="space-y-6">
                      <h4 className="font-bold text-white text-xl">
                        {language === 'ar' ? 'إدارة القوالب' : 'Template Management'}
                      </h4>
                      
                      {/* Add New Template */}
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-cyan-200">
                          {language === 'ar' ? 'إضافة قالب جديد' : 'Add New Template'}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={newTemplate.ar}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, ar: e.target.value }))}
                            placeholder={language === 'ar' ? 'النص بالعربية' : 'Arabic text'}
                            className="px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 border-2 border-slate-500/50 rounded-2xl text-sm text-white focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 placeholder-slate-400"
                          />
                          <input
                            type="text"
                            value={newTemplate.en}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, en: e.target.value }))}
                            placeholder={language === 'ar' ? 'النص بالإنجليزية' : 'English text'}
                            className="px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 border-2 border-slate-500/50 rounded-2xl text-sm text-white focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-300 placeholder-slate-400"
                          />
                        </div>
                        <button
                          onClick={addCustomTemplate}
                          disabled={!newTemplate.ar.trim() || !newTemplate.en.trim()}
                          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg shadow-cyan-500/25"
                        >
                          {language === 'ar' ? 'إضافة' : 'Add'}
                        </button>
                      </div>

                      {/* Custom Templates */}
                      {customTemplates.length > 0 && (
                        <div>
                          <label className="block text-sm font-bold text-cyan-200 mb-4">
                            {language === 'ar' ? 'القوالب المخصصة' : 'Custom Templates'}
                          </label>
                          <div className="space-y-4 max-h-40 overflow-y-auto">
                            {customTemplates.map((template) => (
                              <div key={template.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-600/50 to-slate-700/50 rounded-2xl border border-slate-500/50">
                                <div className="flex-1">
                                  <p className="text-sm text-white font-medium">
                                    {template[language as keyof typeof template]}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => sendTemplateMessage(template[language as keyof typeof template])}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                                  >
                                    {language === 'ar' ? 'استخدام' : 'Use'}
                                  </button>
                                  <button
                                    onClick={() => removeCustomTemplate(template.id)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl text-sm font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25"
                                  >
                                    {language === 'ar' ? 'حذف' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Independent Conversation Stats Section - Completely Separate */}
              {selectedSession && getConversationStats() && (
                <div className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-700/50 p-4 md:p-6 flex-shrink-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-xs md:text-sm space-y-2 md:space-y-0">
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 space-x-reverse">
                      <span className="text-cyan-200 font-bold">
                        {language === 'ar' ? 'إجمالي الرسائل' : 'Total'}: {getConversationStats()?.totalMessages}
                      </span>
                      <span className="text-cyan-200 font-bold">
                        {language === 'ar' ? 'متوسط الاستجابة' : 'Avg'}: {getConversationStats()?.avgResponseTime.toFixed(1)}s
                      </span>
                      <span className="text-cyan-200 font-bold">
                        {language === 'ar' ? 'درجة الرضا' : 'Rating'}: {getConversationStats()?.satisfactionScore.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 space-x-reverse">
                      <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-green-500/30">
                        <Smile className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        <span className="text-xs md:text-sm text-green-200 font-bold">{getConversationStats()?.positiveMessages}</span>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse bg-gradient-to-r from-slate-500/20 to-gray-500/20 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-slate-500/30">
                        <Meh className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                        <span className="text-xs md:text-sm text-slate-200 font-bold">{getConversationStats()?.neutralMessages}</span>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse bg-gradient-to-r from-red-500/20 to-pink-500/20 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-red-500/30">
                        <Frown className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                        <span className="text-xs md:text-sm text-red-200 font-bold">{getConversationStats()?.negativeMessages}</span>
                      </div>
                      {getConversationStats()?.urgentMessages! > 0 && (
                        <div className="flex items-center space-x-1 md:space-x-2 space-x-reverse bg-gradient-to-r from-orange-500/20 to-red-500/20 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-orange-500/30">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                          <span className="text-xs md:text-sm text-orange-200 font-bold">{getConversationStats()?.urgentMessages}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages Container - Independent */}
              <div className="flex-1 flex overflow-hidden">
                <div className={`flex-1 flex flex-col ${showSessionDetails ? 'lg:w-2/3' : 'w-full'} overflow-hidden min-h-0`}>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 min-h-0 chat-messages-area relative">
                    {/* Scroll to Bottom Button */}
                    <button
                      onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10 flex items-center justify-center"
                      title={language === 'ar' ? 'التمرير إلى الأسفل' : 'Scroll to bottom'}
                    >
                      <MessageSquare className="w-5 h-5 text-white" />
                    </button>
                    {!selectedSession ? (
                      <div className="text-center text-slate-400 py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <MessageSquare className="w-12 h-12 text-slate-500" />
                        </div>
                        <p className="text-xl font-bold">
                          {language === 'ar' ? 'اختر محادثة لعرض الرسائل' : 'Select a conversation to view messages'}
                        </p>
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="text-center text-slate-400 py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <MessageSquare className="w-12 h-12 text-slate-500" />
                        </div>
                        <p className="text-xl font-bold">
                          {messageSearchTerm || messageFilter !== 'all' || sentimentFilter !== 'all'
                            ? (language === 'ar' ? 'لا توجد رسائل تطابق البحث' : 'No messages match the search')
                            : (language === 'ar' ? 'لا توجد رسائل في هذه المحادثة' : 'No messages in this conversation')
                          }
                        </p>
                        {!messageSearchTerm && messageFilter === 'all' && sentimentFilter === 'all' && (
                          <p className="text-sm text-slate-500 mt-2">
                            {language === 'ar' ? 'ابدأ المحادثة بإرسال رسالة' : 'Start the conversation by sending a message'}
                          </p>
                        )}
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] p-6 rounded-3xl relative shadow-2xl ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                : message.sender === 'admin'
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-2 border-slate-600/50 text-white'
                            }`}
                          >
                            <div className="flex items-start space-x-3 space-x-reverse">
                              <div className="flex-1">
                                <p className="text-base leading-relaxed">{message.content}</p>
                                <div className="flex items-center justify-between mt-4">
                                  <p className="text-xs opacity-70">
                                    {new Date(message.created_at).toLocaleString()}
                                  </p>
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    {getSentimentIcon(message.sentiment)}
                                    {getUrgentIndicator(message)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* New Quick Replies */}
                  {selectedSession && (
                    <div className="p-6 border-t border-slate-700/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl flex-shrink-0">
                      <div className="mb-4">
                        <label className="text-sm font-bold text-cyan-200">
                          {language === 'ar' ? 'قوالب سريعة' : 'Quick Templates'}
                        </label>
                      </div>
                      <div className="flex space-x-3 space-x-reverse overflow-x-auto pb-2">
                        {messageTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => sendTemplateMessage(template[language as keyof typeof template])}
                            className="px-6 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-2 border-slate-600/50 rounded-2xl text-sm text-white hover:from-slate-600/50 hover:to-slate-700/50 transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                          >
                            {template[language as keyof typeof template]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Input */}
                  {selectedSession && (
                    <div className="p-6 border-t border-slate-700/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl flex-shrink-0">
                      <div className="flex space-x-4 space-x-reverse">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-2 border-slate-600/50 rounded-3xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 text-white text-lg transition-all duration-300 placeholder-slate-400"
                          disabled={isLoading}
                        />
                        <button
                          onClick={sendAdminMessage}
                          disabled={!newMessage.trim() || isLoading}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 disabled:transform-none shadow-lg shadow-cyan-500/25"
                        >
                          <Send size={24} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Details Sidebar - Fixed Position */}
                {showSessionDetails && sessionDetails && (
                  <div className="hidden lg:block w-80 border-l border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-6 overflow-y-auto flex-shrink-0">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 space-x-reverse mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xl">
                          {language === 'ar' ? 'تفاصيل الجلسة' : 'Session Details'}
                        </h3>
                      </div>
                      
                      {/* Session Info */}
                      <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            {language === 'ar' ? 'معرف الجلسة' : 'Session ID'}
                          </label>
                          <p className="text-sm text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-600 p-3 rounded-xl border border-slate-200 dark:border-slate-500">
                            {sessionDetails.session_id}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            {language === 'ar' ? 'الحالة' : 'Status'}
                          </label>
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg ${getStatusColor(sessionDetails.status)}`}>
                            {getStatusText(sessionDetails.status)}
                          </span>
                        </div>
                        
                        {sessionDetails.priority && (
                          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                              {language === 'ar' ? 'الأولوية' : 'Priority'}
                            </label>
                            <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg ${getPriorityColor(sessionDetails.priority)}`}>
                              {getPriorityText(sessionDetails.priority)}
                            </span>
                          </div>
                        )}
                        
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            {language === 'ar' ? 'اللغة' : 'Language'}
                          </label>
                          <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-600 p-3 rounded-xl border border-slate-200 dark:border-slate-500 font-medium">
                            {sessionDetails.language === 'ar' ? 'العربية' : 'English'}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            {language === 'ar' ? 'عدد الرسائل' : 'Message Count'}
                          </label>
                          <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-600 p-3 rounded-xl border border-slate-200 dark:border-slate-500 font-medium">
                            {sessionDetails.message_count}
                          </p>
                        </div>
                        
                        {sessionDetails.satisfaction_rating && (
                          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                              {language === 'ar' ? 'درجة الرضا' : 'Satisfaction Rating'}
                            </label>
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="flex space-x-1 space-x-reverse">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-5 h-5 ${
                                      star <= sessionDetails.satisfaction_rating!
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-slate-900 dark:text-white font-bold">
                                {sessionDetails.satisfaction_rating}/5
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {sessionDetails.response_time_avg && (
                          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                              {language === 'ar' ? 'متوسط زمن الاستجابة' : 'Average Response Time'}
                            </label>
                            <p className="text-sm text-slate-900 dark:text-white font-medium">
                              {sessionDetails.response_time_avg} {language === 'ar' ? 'ثانية' : 'seconds'}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      {sessionDetails.user_info && (
                        <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-600/50">
                          <div className="flex items-center space-x-3 space-x-reverse mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                              {language === 'ar' ? 'معلومات المستخدم' : 'User Information'}
                            </h4>
                          </div>
                          
                          {sessionDetails.user_info.name && (
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
                              <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                                {language === 'ar' ? 'الاسم' : 'Name'}
                              </label>
                              <p className="text-sm text-slate-900 dark:text-white font-medium">
                                {sessionDetails.user_info.name}
                              </p>
                            </div>
                          )}
                          
                          {sessionDetails.user_info.email && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
                              <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                              </label>
                              <p className="text-sm text-slate-900 dark:text-white font-medium">
                                {sessionDetails.user_info.email}
                              </p>
                            </div>
                          )}
                          
                          {sessionDetails.user_info.phone && (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-700/50">
                              <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                              </label>
                              <p className="text-sm text-slate-900 dark:text-white font-medium">
                                {sessionDetails.user_info.phone}
                              </p>
                            </div>
                          )}
                          
                          {sessionDetails.user_info.country && (
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200/50 dark:border-orange-700/50">
                              <label className="block text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">
                                {language === 'ar' ? 'البلد' : 'Country'}
                              </label>
                              <p className="text-sm text-slate-900 dark:text-white font-medium">
                                {sessionDetails.user_info.country}
                              </p>
                            </div>
                          )}
                          
                          {sessionDetails.user_info.ip_address && (
                            <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700 dark:to-gray-700 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                              </label>
                              <p className="text-sm text-slate-900 dark:text-white font-mono">
                                {sessionDetails.user_info.ip_address}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Timestamps */}
                      <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-600/50">
                        <div className="flex items-center space-x-3 space-x-reverse mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                            {language === 'ar' ? 'التواريخ' : 'Timestamps'}
                          </h4>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-700/50">
                          <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                            {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                          </label>
                          <p className="text-sm text-slate-900 dark:text-white font-medium">
                            {new Date(sessionDetails.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
                          <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                            {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                          </label>
                          <p className="text-sm text-slate-900 dark:text-white font-medium">
                            {new Date(sessionDetails.updated_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
                          <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                            {language === 'ar' ? 'آخر رسالة' : 'Last Message'}
                          </label>
                          <p className="text-sm text-slate-900 dark:text-white font-medium">
                            {new Date(sessionDetails.last_message_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-700 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={48} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-xl font-medium">{language === 'ar' ? 'اختر محادثة لعرضها' : 'Select a conversation to view'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Settings Modal */}
      <TelegramSettingsModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        count={bulkDeleteCount}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminChatSupport;
