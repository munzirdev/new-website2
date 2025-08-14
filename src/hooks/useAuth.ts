import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  hasNotifications: boolean;
}

interface SignUpData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
}

interface SignInData {
  emailOrPhone: string;
  password: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    hasNotifications: false,
  });
  const [initialized, setInitialized] = useState(false);


  useEffect(() => {
    console.log('🔄 useAuth useEffect triggered, initialized:', initialized);
    
    if (initialized) {
      console.log('🔄 useAuth already initialized, skipping...');
      return;
    }
    
    console.log('🔄 بدء تهيئة useAuth...');
    setInitialized(true);
    
    // الحصول على الجلسة الحالية
    const getInitialSession = async () => {
      try {
        console.log('📡 جلب الجلسة الحالية...');
        
        // Add timeout to getSession
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session retrieval timeout')), 2000); // 2 second timeout
        });
        
        const { data: { session }, error } = await Promise.race([sessionPromise, sessionTimeoutPromise]) as any;
        
        if (error) {
          console.error('❌ خطأ في جلب الجلسة:', error);
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }
        
        console.log('📋 الجلسة الحالية:', session ? 'موجودة' : 'غير موجودة');
        
        if (session?.user) {
          console.log('👤 المستخدم موجود:', session.user.email);
          
          // Set user immediately to prevent race conditions
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
            loading: false,
          }));
          
          // Load profile and notifications asynchronously
          try {
            const profile = await getUserProfile(session.user.id);
            const hasNotifications = await checkForNotifications(session.user.id);
            
            setAuthState(prev => ({
              ...prev,
              profile,
              hasNotifications,
            }));
          } catch (profileError) {
            console.error('❌ خطأ في جلب الملف الشخصي:', profileError);
            // Keep the user authenticated even if profile loading fails
          }
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('💥 خطأ غير متوقع في getInitialSession:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    getInitialSession();

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔔 تغيير حالة المصادقة:', event, 'at', new Date().toISOString());
        console.log('🔔 تغيير حالة المصادقة:', event);
        console.log('👤 المستخدم:', session?.user?.email || 'غير موجود');
        console.log('📊 الجلسة:', session ? 'موجودة' : 'غير موجودة');
        
        // Only set loading true for sign in events, not sign out
        if (event !== 'SIGNED_OUT') {
          setAuthState(prev => ({ ...prev, loading: true }));
        }
        
        if (session?.user) {
          console.log('✅ جلسة نشطة - تحديث الحالة...');
          console.log('👤 معرف المستخدم من الجلسة:', session.user.id);
          
          // Set user immediately to prevent race conditions
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
            loading: false,
          }));
          
          // If we already have the same user with profile, don't reload everything
          if (authState.user?.id === session.user.id && authState.profile) {
            console.log('🔄 نفس المستخدم موجود بالفعل، تحديث الجلسة فقط');
            return;
          }
          
          try {
            const profile = await getUserProfile(session.user.id);
            const hasNotifications = await checkForNotifications(session.user.id);
            
            const newAuthState = {
              user: session.user,
              profile,
              session,
              loading: false,
              hasNotifications,
            };
            
            console.log('📊 الحالة الجديدة من onAuthStateChange:', newAuthState);
            setAuthState(newAuthState);
            console.log('✅ تم تحديث حالة المصادقة بنجاح');
          } catch (error) {
            console.error('❌ خطأ في تحديث حالة المصادقة:', error);
            // Set a fallback state even if profile loading fails
            const fallbackState = {
              user: session.user,
                             profile: {
                 id: session.user.id,
                 email: session.user.email || '',
                 full_name: session.user.email?.split('@')[0] || 'مستخدم',
                 phone: undefined,
                 country_code: '+90',
                 role: session.user.email === 'admin@tevasul.group' ? 'admin' : 'user',
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString(),
               },
              session,
              loading: false,
              hasNotifications: false,
            };
            setAuthState(fallbackState);
            console.log('✅ تم تعيين حالة المصادقة الاحتياطية');
          }
        } else {
          console.log('❌ لا توجد جلسة - تنظيف الحالة...');
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            hasNotifications: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  // إضافة useEffect لمراقبة تغييرات user وإعادة جلب profile
  useEffect(() => {
    if (authState.user && !authState.profile && !authState.loading) {
      console.log('🔄 إعادة جلب الملف الشخصي للمستخدم:', authState.user.id);
      setAuthState(prev => ({ ...prev, loading: true }));
      
      getUserProfile(authState.user.id).then(profile => {
        if (profile) {
          setAuthState(prev => ({ ...prev, profile, loading: false }));
          console.log('✅ تم تحديث الملف الشخصي:', profile.full_name);
        } else {
          // إذا لم يتم العثور على profile، حاول إنشاؤه من user_metadata
          console.log('🔄 محاولة إنشاء profile من user_metadata...');
          if (!authState.user) return;
          createProfileFromMetadata(authState.user).then(newProfile => {
            if (newProfile) {
              setAuthState(prev => ({ ...prev, profile: newProfile, loading: false }));
              console.log('✅ تم إنشاء الملف الشخصي من user_metadata:', newProfile.full_name);
            } else {
              setAuthState(prev => ({ ...prev, loading: false }));
            }
          });
        }
      });
    }
  }, [authState.user, authState.profile, authState.loading]);



  // Timeout to prevent loading state from getting stuck
  useEffect(() => {
    if (authState.loading) {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout: Loading state stuck, forcing completion');
        setAuthState(prev => ({ ...prev, loading: false }));
      }, 5000); // 5 second timeout (reduced from 8)

      return () => clearTimeout(timeout);
    }
  }, [authState.loading]);

  // Additional timeout for initialization
  useEffect(() => {
    if (!initialized) {
      const initTimeout = setTimeout(() => {
        console.log('⏰ Init Timeout: Forcing initialization completion');
        setInitialized(true);
        setAuthState(prev => ({ ...prev, loading: false }));
      }, 3000); // 3 second timeout for initialization (reduced from 5)

      return () => clearTimeout(initTimeout);
    }
  }, [initialized]);

  // دالة لإنشاء profile من user_metadata
  const createProfileFromMetadata = async (user: any): Promise<UserProfile | null> => {
    try {
      console.log('🔄 إنشاء profile من user_metadata للمستخدم:', user.id);
      console.log('📋 user_metadata:', user.user_metadata);
      
      if (!user.user_metadata) {
        console.log('❌ لا توجد user_metadata');
        return null;
      }

      // Check if user is admin by email
      const isAdminUser = user.email === 'admin@tevasul.group';
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'مستخدم',
          phone: user.user_metadata.phone || null,
          country_code: user.user_metadata.country_code || '+90',
          role: isAdminUser ? 'admin' : 'user',
        })
        .select()
        .single();
        
      if (!createError && newProfile) {
        console.log('✅ تم إنشاء profile بنجاح:', newProfile.full_name);
        return newProfile;
      } else {
        console.error('❌ فشل في إنشاء profile:', createError);
        return null;
      }
    } catch (error) {
      console.error('💥 خطأ في إنشاء profile من user_metadata:', error);
      return null;
    }
  };

    const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📄 جلب الملف الشخصي للمستخدم:', userId);
      
      // Get user data first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', userError);
        return null;
      }
      
      console.log('👤 بيانات المستخدم من auth:', user.email);
      
      // Check if user is admin by email
      const isAdminUser = user.email === 'admin@tevasul.group';
      
      // Try to get profile from database with timeout
      try {
        console.log('🔍 محاولة جلب الملف الشخصي من قاعدة البيانات...');
        
        // Add a timeout to the database query
        const queryPromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 2000); // 2 second timeout (reduced from 3)
        });
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
          
        console.log('🔍 نتيجة الاستعلام:', { data: !!data, error: error?.message });
        
        if (!error && data) {
          console.log('✅ تم جلب الملف الشخصي بنجاح');
          console.log('📋 بيانات الملف الشخصي:', data);
          return data;
        }
        
        // If no profile found, create a fallback profile
        if (error && error.code === 'PGRST116') {
          console.log('⚠️ لم يتم العثور على الملف الشخصي، إنشاء ملف احتياطي...');
          return {
            id: userId,
            email: user.email || '',
            full_name: user.email?.split('@')[0] || 'مستخدم',
            phone: undefined,
            country_code: '+90',
            role: isAdminUser ? 'admin' : 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        
        // If profile doesn't exist, create it
        if (error?.code === 'PGRST116') { // No rows returned
          console.log('🔄 محاولة إنشاء ملف شخصي جديد...');
          
          const createPromise = supabase
            .from('user_profiles')
            .upsert({
              id: userId,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
              phone: user.user_metadata?.phone || null,
              country_code: user.user_metadata?.country_code || '+90',
              role: isAdminUser ? 'admin' : 'user',
            })
            .select()
            .single();
            
          const createTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile creation timeout')), 3000); // 3 second timeout
          });
          
          const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeoutPromise]) as any;
            
          if (!createError && newProfile) {
            console.log('✅ تم إنشاء ملف شخصي جديد:', newProfile.full_name);
            return newProfile;
          }
        }
      } catch (dbError) {
        console.error('💥 خطأ في قاعدة البيانات:', dbError);
      }
      
      // Return default profile if database operations fail
      console.log('🔄 إنشاء ملف شخصي افتراضي');
      return {
        id: userId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
        phone: user.user_metadata?.phone || null,
        country_code: user.user_metadata?.country_code || '+90',
        role: isAdminUser ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('💥 خطأ في جلب الملف الشخصي:', error);
      return null;
    }
  };

  const checkForNotifications = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔔 فحص الإشعارات للمستخدم:', userId);
      
      // فحص الطلبات التي تم تحديثها خلال آخر 7 أيام (لضمان عدم فقدان الإشعارات)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Add timeout to notifications query
      const queryPromise = supabase
        .from('service_requests')
        .select('id, status, updated_at, created_at')
        .eq('user_id', userId)
        .gt('updated_at', sevenDaysAgo.toISOString());
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Notifications query timeout')), 1500); // 1.5 second timeout (reduced from 2s)
      });
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('خطأ في فحص الإشعارات:', error);
        return false;
      }

      console.log('📋 الطلبات المحدثة:', data?.length || 0);
      
      // التحقق من وجود طلبات تم تحديثها (فرق أكثر من 30 ثانية بين الإنشاء والتحديث)
      const hasUpdatedRequests = data?.some((request: any) => {
        const created = new Date(request.created_at);
        const updated = new Date(request.updated_at);
        const timeDiff = Math.abs(updated.getTime() - created.getTime());
        
        console.log(`📝 طلب ${request.id}:`, {
          created: created.toISOString(),
          updated: updated.toISOString(),
          diffSeconds: Math.floor(timeDiff / 1000),
          hasUpdate: timeDiff > 30000
        });
        
        // إذا كان وقت التحديث مختلف عن وقت الإنشاء بأكثر من 30 ثانية
        return timeDiff > 30000;
      }) || false;

      console.log('🔔 حالة الإشعارات:', hasUpdatedRequests);
      return hasUpdatedRequests;
    } catch (error) {
      console.error('💥 خطأ في فحص الإشعارات (timeout or other):', error);
      return false;
    }
  };

  const clearNotifications = async () => {
    console.log('🧹 تنظيف الإشعارات...');
    setAuthState(prev => ({ ...prev, hasNotifications: false }));
  };

  const signUp = async (signUpData: SignUpData) => {
    try {
      console.log('🚀 بدء عملية إنشاء الحساب...');
      console.log('📧 البريد الإلكتروني:', signUpData.email);
      console.log('🔧 فحص الاتصال مع Supabase...');
      
      // Check if Supabase is properly configured
      if (supabase.isConnected === false) {
        const connectionError = supabase.connectionError || 'Supabase is not properly configured';
        console.error('❌ خطأ في إعداد Supabase:', connectionError);
        return { 
          error: {
            message: connectionError,
            status: 500,
            name: 'ConfigurationError'
          }
        };
      }
      
      // Test connection first
      const { data: testData, error: testError } = await supabase.auth.getSession();
      if (testError) {
        console.error('❌ خطأ في الاتصال مع Supabase:', testError);
        return { error: testError };
      }
      console.log('✅ الاتصال مع Supabase يعمل بنجاح');
      
      // إنشاء المستخدم مع metadata
      console.log('👤 إنشاء المستخدم في Supabase Auth...');
      console.log('📧 البيانات المرسلة:', {
        email: signUpData.email,
        name: signUpData.name,
        phone: signUpData.phone,
        countryCode: signUpData.countryCode
      });
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.name,
            phone: signUpData.phone,
            country_code: signUpData.countryCode,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ خطأ في إنشاء الحساب:', error);
        console.error('❌ تفاصيل الخطأ:', {
          message: error.message,
          status: error.status,
          name: error.name,
          details: error.details,
          hint: error.hint
        });
        
        // تحسين رسائل الخطأ
        let improvedError = { ...error };
        if (error.message?.includes('Database error saving new user')) {
          improvedError.message = 'خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.';
        } else if (error.message?.includes('User already registered')) {
          improvedError.message = 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.';
        }
        
        return { error: improvedError };
      }

      console.log('✅ تم إنشاء المستخدم بنجاح');
      console.log('👤 معرف المستخدم:', data.user?.id);
      console.log('📧 تأكيد البريد الإلكتروني مطلوب:', data.user?.email_confirmed_at ? 'لا' : 'نعم');
      console.log('📋 بيانات user_metadata:', data.user?.user_metadata);

      // إنشاء الملف الشخصي بعد تأكيد إنشاء المستخدم
      if (data.user) {
        console.log('📝 إنشاء الملف الشخصي...');
        
        // Wait a moment for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // تحديث user_metadata إذا لم تكن موجودة
        if (!data.user.user_metadata?.full_name) {
          console.log('🔄 تحديث user_metadata...');
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: signUpData.name,
              phone: signUpData.phone,
              country_code: signUpData.countryCode,
            }
          });
          if (updateError) {
            console.error('⚠️ خطأ في تحديث user_metadata:', updateError);
          } else {
            console.log('✅ تم تحديث user_metadata بنجاح');
          }
        }
        
        console.log('🔧 محاولة إنشاء الملف الشخصي للمستخدم:', data.user.id);
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            email: signUpData.email,
            full_name: signUpData.name,
            phone: signUpData.phone,
            country_code: signUpData.countryCode,
            role: 'user',
          });

        if (profileError) {
          console.error('⚠️ خطأ في إنشاء الملف الشخصي:', profileError);
          console.error('⚠️ تفاصيل خطأ الملف الشخصي:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          // Don't fail the signup if profile creation fails
          console.log('⚠️ سيتم إنشاء الملف الشخصي لاحقاً');
        } else {
          console.log('✅ تم إنشاء الملف الشخصي بنجاح');
        }
        
        // Force state update after successful signup
        console.log('🔄 تحديث حالة المصادقة بعد التسجيل...');
        const profile = await getUserProfile(data.user.id);
        const hasNotifications = await checkForNotifications(data.user.id);
        setAuthState({
          user: data.user,
          profile,
          session: data.session,
          loading: false,
          hasNotifications,
        });
        console.log('✅ تم تحديث الحالة بعد التسجيل');
      }

      return { error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في إنشاء الحساب:', error);
      console.error('💥 تفاصيل الخطأ غير المتوقع:', error);
      return { error: error as any };
    }
  };

  const signIn = async (signInData: SignInData) => {
    try {
      console.log('🔐 بدء عملية تسجيل الدخول...');
      console.log('📧 البريد الإلكتروني:', signInData.emailOrPhone);
      
      // فحص الاتصال أولاً
      if (!supabase || supabase.supabaseUrl === 'https://dummy.supabase.co') {
        console.error('❌ Supabase غير مُعد بشكل صحيح');
        return { 
          error: {
            message: 'Supabase غير مُعد بشكل صحيح. يرجى التحقق من متغيرات البيئة.',
            status: 500,
            name: 'ConfigurationError'
          }
        };
      }
      
      // اختبار الاتصال قبل تسجيل الدخول مع timeout أطول
      try {
        console.log('🔍 اختبار الاتصال قبل تسجيل الدخول...');
        
        // تجاوز اختبار الاتصال مؤقتاً في حالة وجود مشاكل
        if (signInData.emailOrPhone === 'test@test.com' && signInData.password === 'test123') {
          console.log('🧪 وضع الاختبار - تجاوز اختبار الاتصال');
        } else {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 15000); // 15 seconds
          });
          
          const connectionPromise = supabase.auth.getSession();
          const { data: testData, error: testError } = await Promise.race([connectionPromise, timeoutPromise]) as any;
          
          if (testError) {
            console.error('❌ خطأ في الاتصال مع Supabase:', testError);
            return { 
              error: {
                message: 'لا يمكن الاتصال بخادم Supabase. تحقق من اتصال الإنترنت ومتغيرات البيئة.',
                status: 500,
                name: 'ConnectionError'
              }
            };
          }
          console.log('✅ الاتصال مع Supabase يعمل');
        }
      } catch (connectionError) {
        console.error('❌ فشل في اختبار الاتصال:', connectionError);
        return { 
          error: {
            message: 'فشل في الاتصال بخادم Supabase. تحقق من اتصال الإنترنت.',
            status: 500,
            name: 'ConnectionError'
          }
        };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.emailOrPhone,
        password: signInData.password,
      });
      
      if (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        return { error };
      }
      
      console.log('✅ تم تسجيل الدخول بنجاح');
      console.log('👤 المستخدم:', data.user?.email);
      
      // Force state update after successful login
      if (data.user) {
        console.log('🔄 تحديث حالة المصادقة يدوياً...');
        console.log('👤 معرف المستخدم:', data.user.id);
        
        // Create immediate auth state without waiting for profile
        const immediateAuthState = {
          user: data.user,
          profile: {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.email?.split('@')[0] || 'مستخدم',
            phone: undefined,
            country_code: '+90',
            role: data.user.email === 'admin@tevasul.group' ? 'admin' : 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          session: data.session,
          loading: false,
          hasNotifications: false,
        };
        
        console.log('📊 الحالة الفورية:', immediateAuthState);
        setAuthState(immediateAuthState);
        console.log('✅ تم تحديث الحالة فورياً');
        
        // Try to get profile in background (non-blocking)
        setTimeout(async () => {
          try {
            console.log('🔄 محاولة جلب الملف الشخصي في الخلفية...');
            const profile = await getUserProfile(data.user.id);
            const hasNotifications = await checkForNotifications(data.user.id);
            
            if (profile) {
              setAuthState(prev => ({
                ...prev,
                profile,
                hasNotifications,
              }));
              console.log('✅ تم تحديث الملف الشخصي في الخلفية');
            }
          } catch (error) {
            console.error('❌ خطأ في جلب الملف الشخصي في الخلفية:', error);
          }
        }, 100);
      }
      
      return { error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في تسجيل الدخول:', error);
      return { error: error as any };
    }
  };

  const signOut = async () => {
    console.log('🚪 بدء عملية تسجيل الخروج...');
    
    try {
      // First, clear local state immediately
      console.log('🧹 تنظيف الحالة المحلية فوراً...');
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        hasNotifications: false,
      });
      
      // Then try to sign out from Supabase
      console.log('🌐 محاولة تسجيل الخروج من Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ خطأ في تسجيل الخروج من Supabase:', error);
        console.log('⚠️ تم تنظيف الحالة المحلية رغم فشل تسجيل الخروج من الخادم');
      } else {
        console.log('✅ تم تسجيل الخروج من Supabase بنجاح');
      }
      
      // Force a re-render to ensure UI updates
      setTimeout(() => {
        console.log('🔄 إعادة تحميل الحالة للتأكد من التحديث...');
        setAuthState(prev => ({ ...prev }));
      }, 100);
      
      console.log('✅ تم إكمال عملية تسجيل الخروج');
      return { error: null };
      
    } catch (error) {
      console.error('💥 خطأ غير متوقع في تسجيل الخروج:', error);
      
      // Even if there's an error, ensure state is cleared
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        hasNotifications: false,
      });
      
      return { error: error as any };
    }
  };

  // Debug function to check current auth state
  const debugAuthState = () => {
    console.log('🔍 Debug Auth State:', {
      user: authState.user?.email || 'null',
      profile: authState.profile?.full_name || 'null',
      loading: authState.loading,
      session: authState.session ? 'exists' : 'null',
      hasNotifications: authState.hasNotifications,
      initialized: initialized
    });
  };

  // Force clear auth state
  const forceClearAuth = () => {
    console.log('🧹 Force clearing auth state...');
    setAuthState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      hasNotifications: false,
    });
    setInitialized(false);
    console.log('✅ Auth state cleared');
  };

  // Test sign out function
  const testSignOut = async () => {
    console.log('🧪 Testing sign out...');
    console.log('📊 Before sign out:', {
      user: authState.user?.email,
      profile: authState.profile?.full_name,
      loading: authState.loading
    });
    
    const result = await signOut();
    
    console.log('📊 After sign out:', {
      user: authState.user?.email,
      profile: authState.profile?.full_name,
      loading: authState.loading
    });
    
    console.log('📊 Sign out result:', result);
    return result;
  };

  // Simple synchronous sign out (bypasses Supabase)
  const simpleSignOut = () => {
    console.log('🚪 Simple sign out (bypassing Supabase)...');
    setAuthState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      hasNotifications: false,
    });
    console.log('✅ Simple sign out completed');
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    clearNotifications,
    debugAuthState,
    forceClearAuth,
    testSignOut,
    simpleSignOut,
  };
};
