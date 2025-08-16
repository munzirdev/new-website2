import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Send, 
  User, 
  Bot, 
  Search, 
  RefreshCw, 
  Bell, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye,
  Settings,
  Zap,
  Heart,
  Smile,
  Frown,
  Meh,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { telegramService } from '../services/telegramService';
import { webhookService } from '../services/webhookService';
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
  is_read?: boolean;
  attachments?: string[];
  reaction?: 'like' | 'dislike' | 'heart' | 'thumbs_up' | 'thumbs_down';
}

interface ChatSession {
  session_id: string;
  last_message: string;
  last_message_time: string;
  message_count: number;
  language: string;
  status: 'active' | 'closed' | 'waiting_support' | 'archived' | 'pending';
  user_info?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    ip_address?: string;
    user_agent?: string;
    avatar?: string;
    last_seen?: string;
    is_online?: boolean;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  satisfaction_rating?: number;
  response_time_avg?: number;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  category?: 'general' | 'technical' | 'billing' | 'support' | 'sales';
  source?: 'web' | 'mobile' | 'telegram' | 'whatsapp' | 'email';
  estimated_resolution_time?: number;
  customer_satisfaction?: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied';
}

interface Notification {
  id: string;
  type: 'support_request' | 'new_message' | 'session_status' | 'urgent_message' | 'satisfaction_rating' | 'assignment' | 'mention' | 'system';
  title: string;
  message: string;
  sessionId?: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata?: Record<string, any>;
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
  resolvedToday: number;
  avgResolutionTime: number;
  customerSatisfactionRate: number;
  responseRate: number;
  peakHours: string[];
  busyDays: string[];
}

interface QuickResponse {
  id: string;
  title: string;
  content: string;
  category: 'greeting' | 'farewell' | 'support' | 'technical' | 'billing' | 'custom';
  language: 'ar' | 'en';
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatFilter {
  status: 'all' | 'active' | 'closed' | 'waiting_support' | 'archived' | 'pending';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  language: 'all' | 'ar' | 'en';
  category: 'all' | 'general' | 'technical' | 'billing' | 'support' | 'sales';
  source: 'all' | 'web' | 'mobile' | 'telegram' | 'whatsapp' | 'email';
  assigned: 'all' | 'me' | 'unassigned' | 'others';
  dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed' | 'waiting_support' | 'archived' | 'urgent'>('all');
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
    newSessionsToday: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    customerSatisfactionRate: 0,
    responseRate: 0,
    peakHours: [],
    busyDays: []
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'none' | 'archive' | 'close' | 'delete' | 'assign' | 'tag'>('none');
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
  
  // New modern state variables
  const [chatFilter, setChatFilter] = useState<ChatFilter>({
    status: 'all',
    priority: 'all',
    language: 'all',
    category: 'all',
    source: 'all',
    assigned: 'all',
    dateRange: 'all'
  });
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [sortBy, setSortBy] = useState<'latest' | 'priority' | 'status' | 'customer'>('latest');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['urgent', 'vip', 'technical', 'billing', 'support', 'new-customer', 'returning']);
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [chatLayout, setChatLayout] = useState<'split' | 'full' | 'minimal'>('split');
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showRelatedChats, setShowRelatedChats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showVoiceMessage, setShowVoiceMessage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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

  // إزالة التمرير التلقائي - لا نريد سكرول تلقائي
  // useEffect(() => {
  //   // فقط إذا كان هناك رسائل وكانت الجلسة محددة
  //   if (messages.length > 0 && selectedSession) {
  //     // تأخير قليل للتأكد من أن الرسائل تم تحميلها
  //     setTimeout(() => {
  //       scrollToBottom();
  //     }, 100);
  //   }
  // }, [messages, selectedSession]);

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
          // فحص الجلسات الجديدة التي تطلب دعم - معطل لتجنب الإرسال عند التحديث
          // checkForSupportRequests(data);
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

  // فحص طلبات الدعم وإرسال إشعارات التلقرام - معطل لتجنب الإرسال عند التحديث
  const checkForSupportRequests = async (sessionsData: ChatSession[]) => {
    // معطل - لا نريد إرسال إشعارات عند تحميل البيانات
    // سيتم إرسال الإشعارات فقط عند إرسال رسالة جديدة من العميل
    console.log('checkForSupportRequests معطل لتجنب الإرسال عند تحديث الصفحة');
    return;
    
    // الكود الأصلي معطل
    /*
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
    */
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
          
          // فحص الرسائل المستعجلة - معطل لتجنب الإرسال عند التحديث
          // checkForUrgentMessages(messagesWithSentiment, sessionId);
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

  // فحص الرسائل المستعجلة وإرسال إشعارات التلقرام - معطل لتجنب الإرسال عند التحديث
  const checkForUrgentMessages = async (messagesData: ChatMessage[], sessionId: string) => {
    // معطل - لا نريد إرسال إشعارات عند تحميل الرسائل
    // سيتم إرسال الإشعارات فقط عند إرسال رسالة جديدة من العميل
    console.log('checkForUrgentMessages معطل لتجنب الإرسال عند تحديث الصفحة');
    return;
    
    // الكود الأصلي معطل
    /*
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
          await webhookService.sendUrgentMessageWebhook(session, message.content);
          
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
    */
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
      newSessionsToday,
      resolvedToday: 0,
      avgResolutionTime: 0,
      customerSatisfactionRate: 0,
      responseRate: 0,
      peakHours: [],
      busyDays: []
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

  // دالة جديدة لإرسال الإشعارات عند إرسال رسالة جديدة من العميل
  const handleNewCustomerMessage = async (message: ChatMessage, session: ChatSession) => {
    try {
      console.log('🔔 معالجة رسالة جديدة من العميل:', message.content);
      
      // فحص إذا كانت الرسالة مستعجلة
      if (message.is_urgent) {
        console.log('🚨 رسالة مستعجلة - إرسال إشعار تلقرام');
        
        // إرسال إشعار تلقرام للرسائل المستعجلة
        await webhookService.sendUrgentMessageWebhook(session, message.content);
        
        // إضافة إشعار محلي
        addNotification({
          type: 'urgent_message',
          title: language === 'ar' ? 'رسالة مستعجلة!' : 'Urgent Message!',
          message: language === 'ar' 
            ? `رسالة مستعجلة من: ${session.user_info?.name || 'غير محدد'}`
            : `Urgent message from: ${session.user_info?.name || 'Unknown'}`,
          sessionId: session.session_id,
          priority: 'urgent',
          timestamp: new Date(),
          isRead: false
        });
      }
      
      // فحص إذا كان العميل يطلب ممثل خدمة عملاء
      const isRequestingRepresentative = 
        message.content.toLowerCase().includes('ممثل') ||
        message.content.toLowerCase().includes('إنسان') ||
        message.content.toLowerCase().includes('حقيقي') ||
        message.content.toLowerCase().includes('representative') ||
        message.content.toLowerCase().includes('human') ||
        message.content.toLowerCase().includes('real');
      
      if (isRequestingRepresentative) {
        console.log('👤 طلب ممثل خدمة عملاء - إرسال إشعار تلقرام');
        
        // إرسال إشعار تلقرام لطلب ممثل
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
      
      // إرسال إشعار عام للرسالة الجديدة (إذا لم تكن مستعجلة أو طلب ممثل)
      if (!message.is_urgent && !isRequestingRepresentative) {
        console.log('📨 رسالة عادية - إرسال إشعار تلقرام');
        
        // إرسال إشعار تلقرام للرسالة الجديدة
        await telegramService.sendNewMessageNotification(session, message.content);
        
        // إضافة إشعار محلي
        addNotification({
          type: 'new_message',
          title: language === 'ar' ? 'رسالة جديدة' : 'New Message',
          message: language === 'ar' 
            ? `رسالة جديدة من: ${session.user_info?.name || 'غير محدد'}`
            : `New message from: ${session.user_info?.name || 'Unknown'}`,
          sessionId: session.session_id,
          priority: 'low',
          timestamp: new Date(),
          isRead: false
        });
      }
      
    } catch (error) {
      console.error('❌ خطأ في معالجة رسالة العميل الجديدة:', error);
    }
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
      
      // لا نريد إعادة تعيين موضع التمرير - إزالة السكرول التلقائي
      // setTimeout(() => {
      //   const chatArea = document.querySelector('.chat-messages-area');
      //   if (chatArea) {
      //     chatArea.scrollTop = 0;
      //   }
      // }, 50);
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

  // التمرير إلى أسفل - معطل لتجنب السكرول التلقائي
  const scrollToBottom = () => {
    // معطل لتجنب السكرول التلقائي غير المرغوب فيه
    // if (messagesEndRef.current) {
    //   // فقط إذا كان المستخدم في أسفل المحادثة أو إذا كانت رسائل جديدة
    //   const chatArea = document.querySelector('.chat-messages-area') as HTMLElement;
    //   if (chatArea) {
    //     const isAtBottom = chatArea.scrollTop + chatArea.clientHeight >= chatArea.scrollHeight - 100;
    //     if (isAtBottom) {
    //       messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    //     }
    //   }
    // }
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0 h-16">
        <div className="px-4 py-3 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left Section */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'مركز المحادثات' : 'Chat Center'}
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar' ? 'إدارة المحادثات والرسائل' : 'Manage conversations and messages'}
                  </p>
                </div>
                </div>
              </div>
            
            {/* Center Section - Stats */}
            <div className="hidden md:flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {stats.active} {language === 'ar' ? 'نشط' : 'Active'}
                 </span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {stats.waiting} {language === 'ar' ? 'في الانتظار' : 'Waiting'}
                </span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {stats.urgent} {language === 'ar' ? 'مستعجل' : 'Urgent'}
                </span>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-1 space-x-reverse">
              {/* Notifications */}
               <div className="relative">
                 <button
                   onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 relative"
                 >
                  <Bell className="w-4 h-4" />
                   {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                           </button>
                     </div>
                     
              {/* Settings */}
               <button
                 onClick={() => setShowTelegramModal(true)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
               >
                <Settings className="w-4 h-4" />
               </button>

              {/* Refresh */}
                <button
                  onClick={loadSessions}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                >
                <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Chat List */}
        <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
          {/* Search and Filters */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search conversations...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'active', 'waiting_support', 'urgent'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                    filterStatus === filter
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {filter === 'all' 
                    ? (language === 'ar' ? 'الكل' : 'All')
                    : filter === 'active'
                    ? (language === 'ar' ? 'نشط' : 'Active')
                    : filter === 'waiting_support'
                    ? (language === 'ar' ? 'في الانتظار' : 'Waiting')
                    : (language === 'ar' ? 'مستعجل' : 'Urgent')
                  }
                </button>
              ))}
            </div>
            </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'لا توجد محادثات' : 'No conversations'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSessions.map((session) => {
                  const hasUnreadNotifications = notifications.some(
                    n => n.sessionId === session.session_id && !n.isRead
                  );
                  
                  return (
                    <div
                      key={session.session_id}
                      onClick={() => handleSessionClick(session.session_id)}
                      className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        selectedSession === session.session_id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2 space-x-reverse">
                        {/* Avatar */}
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {session.user_info?.name || session.session_id.slice(0, 8)}
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                              {new Date(session.last_message_time).toLocaleTimeString()}
                              </span>
                        </div>
                        
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2">
                            {session.last_message}
                          </p>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 space-x-reverse">
                              {session.priority && (
                                <span className={`px-1 py-0.5 text-xs font-medium rounded-full ${
                                  session.priority === 'urgent'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : session.priority === 'high'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                    : session.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                }`}>
                                  {getPriorityText(session.priority)}
                            </span>
                              )}
                              
                              <span className={`px-1 py-0.5 text-xs font-medium rounded-full ${
                                session.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : session.status === 'waiting_support'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                  : session.status === 'closed'
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              }`}>
                                {getStatusText(session.status)}
                            </span>
                          </div>
                            
                            {hasUnreadNotifications && (
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 min-h-0">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sessionDetails?.user_info?.name || selectedSession.slice(0, 8)}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {sessionDetails?.user_info?.email || 'No email provided'}
                      </p>
                    </div>
                          </div>
                  
                  <div className="flex items-center space-x-1 space-x-reverse">
                      <button
                      onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                      >
                      <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCloseSession}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 text-xs font-medium"
                      >
                        {language === 'ar' ? 'إغلاق' : 'Close'}
                      </button>
                    </div>
                  </div>
                </div>

                  {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'لا توجد رسائل' : 'No messages'}
                        </p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <div
                          key={message.id}
                      className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.sender === 'admin'
                          ? 'bg-blue-500 text-white'
                          : message.sender === 'bot'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

              {/* Message Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <div className="flex items-end space-x-2 space-x-reverse">
                  <div className="flex-1">
                    <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                      placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none"
                      rows={2}
                    />
                  </div>
                        <button
                          onClick={sendAdminMessage}
                          disabled={!newMessage.trim() || isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1 space-x-reverse flex-shrink-0"
                        >
                    <Send className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {language === 'ar' ? 'إرسال' : 'Send'}
                    </span>
                        </button>
                      </div>
                    </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {language === 'ar' ? 'مرحباً بك في مركز المحادثات' : 'Welcome to Chat Center'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'اختر محادثة من القائمة لبدء الرد' : 'Select a conversation from the list to start responding'}
                          </p>
                        </div>
                          </div>
                        )}
                        </div>
                        </div>
                        
      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute top-16 right-4 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </h3>
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors duration-200"
              >
                {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
              </button>
                              </div>
                            </div>
          
          <div className="p-3">
            {notifications.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-3 text-sm">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-2 ${
                    notification.isRead 
                      ? 'bg-slate-50 dark:bg-slate-700' 
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                          </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {notification.timestamp.toLocaleString()}
                              </p>
                            </div>
                            </div>
                            </div>
              ))
            )}
                    </div>
                  </div>
                )}

      {/* Telegram Settings Modal */}
      {showTelegramModal && (
      <TelegramSettingsModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        count={bulkDeleteCount}
      />
      )}
    </div>
  );
};

export default AdminChatSupport;
