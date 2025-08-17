import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../lib/types';

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
        
        // Add timeout to getSession with longer timeout for better reliability
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session retrieval timeout')), 3000); // 3 second timeout (reduced from 5)
        });
        
        const { data: { session }, error } = await Promise.race([sessionPromise, sessionTimeoutPromise]) as any;
        
        if (error) {
          console.error('❌ خطأ في جلب الجلسة:', error);
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }
        
        console.log('📋 الجلسة الحالية:', session ? 'موجودة' : 'غير موجودة');
        
        // Check if user has manually signed out (by checking localStorage)
        const hasManuallySignedOut = localStorage.getItem('manuallySignedOut') === 'true';
        if (hasManuallySignedOut) {
          console.log('🚪 المستخدم قام بتسجيل الخروج يدوياً - تجاهل الجلسة المحفوظة');
          localStorage.removeItem('manuallySignedOut');
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }
        
        if (session?.user) {
          console.log('👤 المستخدم موجود:', session.user.email);
          console.log('📧 حالة تأكيد البريد الإلكتروني:', session.user.email_confirmed_at ? 'مؤكد' : 'غير مؤكد');
          
          // التحقق من تأكيد البريد الإلكتروني باستخدام middleware
          const { isVerified, shouldBlock } = await checkEmailVerification(session.user);
          
          if (shouldBlock) {
            console.error('❌ محاولة وصول بدون تأكيد البريد الإلكتروني في getInitialSession');
            console.log('🚪 تسجيل الخروج تلقائياً...');
            
            // تسجيل الخروج فوراً
            await forceSignOutUnverified();
            
            return;
          }
          
          // Only set user if verification passed
          console.log('✅ التحقق من البريد الإلكتروني نجح - تعيين المستخدم');
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
            loading: false,
          }));
          
          // Load profile and notifications asynchronously with timeout
          try {
            const profilePromise = getUserProfile(session.user.id);
            const notificationsPromise = checkForNotifications(session.user.id);
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile/notifications loading timeout')), 2000); // 2 second timeout
            });
            
            const [profile, hasNotifications] = await Promise.race([
              Promise.all([profilePromise, notificationsPromise]),
              timeoutPromise
            ]) as [UserProfile | null, boolean];
            
            setAuthState(prev => ({
              ...prev,
              profile,
              hasNotifications,
            }));
          } catch (profileError) {
            console.error('❌ خطأ في جلب الملف الشخصي:', profileError);
            // Keep the user authenticated even if profile loading fails
            
            // Create fallback profile for admin/moderator
            const isAdminUser = session.user.email === 'admin@tevasul.group';
            const isModeratorUser = session.user.email?.includes('moderator') || session.user.email?.includes('moderator@');
            
            // محاولة استخراج الاسم من user_metadata
            const googleData = session.user.user_metadata;
            let fallbackName = 'مستخدم';
            
            if (googleData?.full_name) {
              fallbackName = googleData.full_name;
            } else if (googleData?.name) {
              fallbackName = googleData.name;
            } else if (googleData?.display_name) {
              fallbackName = googleData.display_name;
            } else if (googleData?.given_name && googleData?.family_name) {
              fallbackName = `${googleData.given_name} ${googleData.family_name}`;
            } else if (googleData?.given_name) {
              fallbackName = googleData.given_name;
            }
            
            const fallbackProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: fallbackName,
              phone: undefined,
              country_code: '+90',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              role: (isAdminUser ? 'admin' : (isModeratorUser ? 'moderator' : 'user')) as 'user' | 'moderator' | 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            setAuthState(prev => ({
              ...prev,
              profile: fallbackProfile,
              hasNotifications: false,
            }));
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
        
        // Handle sign out event immediately
        if (event === 'SIGNED_OUT') {
          console.log('🚪 حدث تسجيل الخروج - تنظيف الحالة فوراً...');
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            hasNotifications: false,
          });
          return;
        }
        
        // Only set loading true for sign in events, not sign out
        if (event !== 'SIGNED_OUT') {
          setAuthState(prev => ({ ...prev, loading: true }));
        }
        
        if (session?.user) {
          console.log('✅ جلسة نشطة - تحديث الحالة...');
          console.log('👤 معرف المستخدم من الجلسة:', session.user.id);
          console.log('📧 حالة تأكيد البريد الإلكتروني:', session.user.email_confirmed_at ? 'مؤكد' : 'غير مؤكد');
          console.log('🔗 مزود المصادقة:', session.user.user_metadata?.provider || 'email');
          
          // التحقق من تأكيد البريد الإلكتروني فقط للمستخدمين العاديين
          if (session.user.user_metadata?.provider !== 'google') {
            const { isVerified, shouldBlock } = await checkEmailVerification(session.user);
            
            if (shouldBlock) {
              console.error('❌ محاولة وصول بدون تأكيد البريد الإلكتروني في onAuthStateChange');
              console.log('🚪 تسجيل الخروج تلقائياً...');
              
              // تسجيل الخروج فوراً
              await forceSignOutUnverified();
              
              return;
            }
          } else {
            console.log('✅ مستخدم Google - تخطي التحقق من تأكيد البريد الإلكتروني');
          }
          
          // Only set user if verification passed
          console.log('✅ التحقق من البريد الإلكتروني نجح - تعيين المستخدم في onAuthStateChange');
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
            const profilePromise = getUserProfile(session.user.id);
            const notificationsPromise = checkForNotifications(session.user.id);
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile/notifications loading timeout')), 2000); // 2 second timeout
            });
            
            const [profile, hasNotifications] = await Promise.race([
              Promise.all([profilePromise, notificationsPromise]),
              timeoutPromise
            ]) as [UserProfile | null, boolean];
            
            const newAuthState = {
              user: session.user,
              profile: profile ? { ...profile, role: profile.role as 'user' | 'moderator' | 'admin' } : null,
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
            const isAdminUser = session.user.email === 'admin@tevasul.group';
            const isModeratorUser = session.user.email?.includes('moderator') || session.user.email?.includes('moderator@');
            
            // محاولة استخراج الاسم من user_metadata
            const googleData = session.user.user_metadata;
            let fallbackName = 'مستخدم';
            
            if (googleData?.full_name) {
              fallbackName = googleData.full_name;
            } else if (googleData?.name) {
              fallbackName = googleData.name;
            } else if (googleData?.display_name) {
              fallbackName = googleData.display_name;
            } else if (googleData?.given_name && googleData?.family_name) {
              fallbackName = `${googleData.given_name} ${googleData.family_name}`;
            } else if (googleData?.given_name) {
              fallbackName = googleData.given_name;
            }
            
            const fallbackState = {
              user: session.user,
              profile: {
                id: session.user.id,
                email: session.user.email || '',
                full_name: fallbackName,
                phone: undefined,
                country_code: '+90',
                avatar_url: session.user.user_metadata?.avatar_url || null,
                role: (isAdminUser ? 'admin' : (isModeratorUser ? 'moderator' : 'user')) as 'user' | 'moderator' | 'admin',
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

  // إضافة useEffect لمراقبة تغييرات user وإعادة جلب profile (optimized)
  useEffect(() => {
    if (authState.user && !authState.profile && !authState.loading) {
      // Prevent multiple profile loading attempts
      const profileLoadingKey = `profile-loading-${authState.user.id}`;
      if (sessionStorage.getItem(profileLoadingKey)) {
        return;
      }
      
      console.log('🔄 إعادة جلب الملف الشخصي للمستخدم:', authState.user.id);
      sessionStorage.setItem(profileLoadingKey, 'true');
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Add timeout to profile loading
      const profilePromise = getUserProfile(authState.user.id);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 2000); // 2 second timeout (increased from 0.5)
      });
      
      Promise.race([profilePromise, timeoutPromise]).then(profile => {
        if (profile) {
          setAuthState(prev => ({ ...prev, profile, loading: false }));
          console.log('✅ تم تحديث الملف الشخصي:', profile.full_name);
        } else {
          // إذا لم يتم العثور على profile، حاول إنشاؤه من user_metadata
          console.log('🔄 محاولة إنشاء profile من user_metadata...');
          if (!authState.user) return;
          
          const createPromise = createProfileFromMetadata(authState.user);
          const createTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile creation timeout')), 2000); // 2 second timeout (increased from 0.5)
          });
          
          Promise.race([createPromise, createTimeoutPromise]).then(newProfile => {
            if (newProfile) {
              setAuthState(prev => ({ ...prev, profile: newProfile, loading: false }));
              console.log('✅ تم إنشاء الملف الشخصي من user_metadata:', newProfile.full_name);
            } else {
              setAuthState(prev => ({ ...prev, loading: false }));
            }
          }).catch(error => {
            console.error('❌ خطأ في إنشاء الملف الشخصي:', error);
            setAuthState(prev => ({ ...prev, loading: false }));
          });
        }
        sessionStorage.removeItem(profileLoadingKey);
      }).catch(error => {
        console.error('❌ خطأ في جلب الملف الشخصي:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        sessionStorage.removeItem(profileLoadingKey);
      });
    }
  }, [authState.user, authState.profile, authState.loading]);



  // Timeout to prevent loading state from getting stuck
  useEffect(() => {
    if (authState.loading) {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout: Loading state stuck, forcing completion');
        setAuthState(prev => ({ ...prev, loading: false }));
      }, 3000); // 3 second timeout (reduced from 5)

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
      }, 2000); // 2 second timeout for initialization (reduced from 3)

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

      // Check if user is admin or moderator by email
      const isAdminUser = user.email === 'admin@tevasul.group';
      const isModeratorUser = user.email?.includes('moderator') || user.email?.includes('moderator@');
      
      // محاولة استخراج الاسم من user_metadata
      const googleData = user.user_metadata;
      let fullName = 'مستخدم';
      
      if (googleData?.full_name) {
        fullName = googleData.full_name;
      } else if (googleData?.name) {
        fullName = googleData.name;
      } else if (googleData?.display_name) {
        fullName = googleData.display_name;
      } else if (googleData?.given_name && googleData?.family_name) {
        fullName = `${googleData.given_name} ${googleData.family_name}`;
      } else if (googleData?.given_name) {
        fullName = googleData.given_name;
      }
      
      // Add timeout to the profile creation
      const createPromise = supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          phone: user.user_metadata.phone || null,
          country_code: user.user_metadata.country_code || '+90',
          avatar_url: user.user_metadata.avatar_url || null,
          role: isAdminUser ? 'admin' : (isModeratorUser ? 'moderator' : 'user'),
        })
        .select()
        .single();
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile creation timeout')), 3000); // 3 second timeout
      });
      
      const { data: newProfile, error: createError } = await Promise.race([createPromise, timeoutPromise]) as any;
        
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
      
      // Check if user is admin or moderator by email
      const isAdminUser = user.email === 'admin@tevasul.group';
      const isModeratorUser = user.email?.includes('moderator') || user.email?.includes('moderator@');
      
      // Try to get profile from database with timeout
      try {
        console.log('🔍 محاولة جلب الملف الشخصي من قاعدة البيانات...');
        
        // Add a timeout to the database query
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 1000); // 1 second timeout (reduced from 1.5)
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
          
          // Check if user is admin or moderator by email
          const isAdminUser = user.email === 'admin@tevasul.group';
          const isModeratorUser = user.email?.includes('moderator') || user.email?.includes('moderator@');
          
          // محاولة استخراج الاسم من user_metadata
          const googleData = user.user_metadata;
          let fallbackName = 'مستخدم';
          
          if (googleData?.full_name) {
            fallbackName = googleData.full_name;
          } else if (googleData?.name) {
            fallbackName = googleData.name;
          } else if (googleData?.display_name) {
            fallbackName = googleData.display_name;
          } else if (googleData?.given_name && googleData?.family_name) {
            fallbackName = `${googleData.given_name} ${googleData.family_name}`;
          } else if (googleData?.given_name) {
            fallbackName = googleData.given_name;
          }
          
          return {
            id: userId,
            email: user.email || '',
            full_name: fallbackName,
            phone: undefined,
            country_code: '+90',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: isAdminUser ? 'admin' : (isModeratorUser ? 'moderator' : 'user'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        
        console.error('❌ خطأ في جلب الملف الشخصي:', error);
        return null;
      } catch (timeoutError) {
        console.error('⏰ timeout في جلب الملف الشخصي:', timeoutError);
        // Return fallback profile on timeout
        
        // Check if user is admin or moderator by email
        const isAdminUser = user.email === 'admin@tevasul.group';
        const isModeratorUser = user.email?.includes('moderator') || user.email?.includes('moderator@');
        
        // محاولة استخراج الاسم من user_metadata
        const googleData = user.user_metadata;
        let fallbackName = 'مستخدم';
        
        if (googleData?.full_name) {
          fallbackName = googleData.full_name;
        } else if (googleData?.name) {
          fallbackName = googleData.name;
        } else if (googleData?.display_name) {
          fallbackName = googleData.display_name;
        } else if (googleData?.given_name && googleData?.family_name) {
          fallbackName = `${googleData.given_name} ${googleData.family_name}`;
        } else if (googleData?.given_name) {
          fallbackName = googleData.given_name;
        }
        
        return {
          id: userId,
          email: user.email || '',
          full_name: fallbackName,
          phone: undefined,
          country_code: '+90',
          avatar_url: user.user_metadata?.avatar_url || null,
          role: isAdminUser ? 'admin' : (isModeratorUser ? 'moderator' : 'user'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('💥 خطأ غير متوقع في جلب الملف الشخصي:', error);
      return null;
    }
  };

  // دالة للتحقق من وجود إشعارات
  const checkForNotifications = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔔 التحقق من الإشعارات للمستخدم:', userId);
      
      // Skip notifications check for now since table doesn't exist
      console.log('ℹ️ تخطي التحقق من الإشعارات - الجدول غير موجود');
      return false;
      
      // TODO: Uncomment when notifications table is created
      /*
      // Add timeout to the notifications check
      const notificationsPromise = supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false)
        .limit(1);
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Notifications check timeout')), 1500); // 1.5 second timeout
      });
      
      const { data, error } = await Promise.race([notificationsPromise, timeoutPromise]) as any;
      
      if (error) {
        console.log('⚠️ خطأ في التحقق من الإشعارات:', error);
        return false;
      }
      
      const hasNotifications = (data && data.length > 0);
      console.log('🔔 الإشعارات:', hasNotifications ? 'موجودة' : 'غير موجودة');
      
      return hasNotifications;
      */
    } catch (error) {
      console.error('❌ خطأ في التحقق من الإشعارات:', error);
      return false;
    }
  };

  const clearNotifications = async () => {
    console.log('🧹 تنظيف الإشعارات...');
    setAuthState(prev => ({ ...prev, hasNotifications: false }));
  };

  // Sign up function
  const signUp = async (signUpData: SignUpData) => {
    try {
      console.log('📝 بدء عملية التسجيل...');
      console.log('📧 البريد الإلكتروني:', signUpData.email);
      console.log('👤 الاسم:', signUpData.name);

      // محاولة التسجيل مع تأكيد البريد
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.name,
            phone: signUpData.phone,
            country_code: signUpData.countryCode,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
          emailConfirm: true
        }
      });

      if (error) {
        console.error('❌ خطأ في التسجيل مع تأكيد البريد:', error);
        
        // إذا كان الخطأ متعلق بـ SMTP، جرب التسجيل بدون تأكيد
        if (error.message?.includes('SMTP') || error.message?.includes('email') || error.status === 500) {
          console.log('🔄 محاولة التسجيل بدون تأكيد البريد...');
          
          const { data: fallbackData, error: fallbackError } = await supabase.auth.signUp({
            email: signUpData.email,
            password: signUpData.password,
            options: {
              data: {
                full_name: signUpData.name,
                phone: signUpData.phone,
                country_code: signUpData.countryCode,
              },
              emailConfirm: false // تعطيل تأكيد البريد مؤقتاً
            }
          });

          if (fallbackError) {
            console.error('❌ خطأ في التسجيل بدون تأكيد البريد:', fallbackError);
            return { data: null, error: fallbackError };
          }

          console.log('✅ تم التسجيل بدون تأكيد البريد بنجاح');
          console.log('⚠️ يرجى تفعيل البريد الإلكتروني لاحقاً');
          
          return { 
            data: fallbackData, 
            error: null,
            warning: 'تم إنشاء الحساب بنجاح، لكن تأكيد البريد الإلكتروني معطل مؤقتاً'
          };
        }
        
        return { data: null, error };
      }

      console.log('✅ تم التسجيل بنجاح مع تأكيد البريد');
      return { data, error: null };

    } catch (error) {
      console.error('💥 خطأ غير متوقع في التسجيل:', error);
      return { data: null, error: error as any };
    }
  };

  const signIn = async (signInData: SignInData) => {
    try {
      console.log('🔐 بدء تسجيل الدخول...');
      console.log('📧 البريد الإلكتروني:', signInData.emailOrPhone);
      
      // Test connection first
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (connectionError) {
          console.error('❌ خطأ في الاتصال:', connectionError);
          if (connectionError.message?.includes('fetch') || connectionError.message?.includes('network')) {
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
      
      // التحقق من تأكيد البريد الإلكتروني باستخدام middleware
      if (data.user) {
        const { isVerified, shouldBlock } = await checkEmailVerification(data.user);
        
        if (shouldBlock) {
          console.error('❌ البريد الإلكتروني غير مؤكد - منع تسجيل الدخول');
          console.log('📧 حالة التأكيد:', {
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at,
            created_at: data.user.created_at
          });
          
          // تسجيل الخروج فوراً لمنع الوصول
          await forceSignOutUnverified();
          
          return { 
            error: {
              message: 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول. تحقق من بريدك الإلكتروني واضغط على رابط التأكيد.',
              status: 401,
              name: 'EmailNotConfirmed'
            }
          };
        }
      }
      
      // Additional check: Verify email confirmation status from database
      if (data.user) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('email_confirmed_at')
            .eq('id', data.user.id)
            .single();
            
          if (!userError && userData && !userData.email_confirmed_at) {
            const isAdmin = data.user.email === 'admin@tevasul.group';
            const isModerator = data.user.email?.includes('moderator') || data.user.email?.includes('admin');
            
            if (!isAdmin && !isModerator) {
              console.error('❌ تأكيد إضافي: البريد الإلكتروني غير مؤكد في قاعدة البيانات');
              
              // تسجيل الخروج فوراً لمنع الوصول
              await supabase.auth.signOut();
              
              // Clear any existing auth state
              setAuthState({
                user: null,
                profile: null,
                session: null,
                loading: false,
                hasNotifications: false,
              });
              
              return { 
                error: {
                  message: 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول. تحقق من بريدك الإلكتروني واضغط على رابط التأكيد.',
                  status: 401,
                  name: 'EmailNotConfirmed'
                }
              };
            }
          }
        } catch (dbError) {
          console.warn('⚠️ لا يمكن التحقق من قاعدة البيانات، متابعة مع البيانات المحلية:', dbError);
        }
      }
      
      console.log('✅ تم تسجيل الدخول بنجاح');
      console.log('👤 المستخدم:', data.user?.email);
      console.log('📧 البريد الإلكتروني مؤكد:', data.user?.email_confirmed_at ? 'نعم' : 'لا');
      
      // Force state update after successful login
      if (data.user) {
        console.log('🔄 تحديث حالة المصادقة يدوياً...');
        console.log('👤 معرف المستخدم:', data.user.id);
        
        // Only set auth state if user is verified
        const { isVerified, shouldBlock } = await checkEmailVerification(data.user);
        
        if (shouldBlock) {
          console.error('❌ محاولة تعيين حالة للمستخدم غير المؤكد');
          return { 
            error: {
              message: 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول. تحقق من بريدك الإلكتروني واضغط على رابط التأكيد.',
              status: 401,
              name: 'EmailNotConfirmed'
            }
          };
        }
        
        // محاولة استخراج الاسم من user_metadata
        const googleData = data.user.user_metadata;
        let fallbackName = 'مستخدم';
        
        if (googleData?.full_name) {
          fallbackName = googleData.full_name;
        } else if (googleData?.name) {
          fallbackName = googleData.name;
        } else if (googleData?.display_name) {
          fallbackName = googleData.display_name;
        } else if (googleData?.given_name && googleData?.family_name) {
          fallbackName = `${googleData.given_name} ${googleData.family_name}`;
        } else if (googleData?.given_name) {
          fallbackName = googleData.given_name;
        }
        
        // Create immediate auth state without waiting for profile
        const immediateAuthState = {
          user: data.user,
          profile: {
            id: data.user.id,
            email: data.user.email || '',
            full_name: fallbackName,
            phone: undefined,
            country_code: '+90',
            avatar_url: data.user.user_metadata?.avatar_url || null,
            role: (data.user.email === 'admin@tevasul.group' ? 'admin' : 'user') as 'user' | 'moderator' | 'admin',
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
      
      // Clear all localStorage items related to authentication
      console.log('🧹 تنظيف localStorage...');
      localStorage.removeItem('justLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('openServiceRequest');
      localStorage.removeItem('pendingServiceRequest');
      
      // Clear all sessionStorage items related to authentication
      console.log('🧹 تنظيف sessionStorage...');
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('profile-loading-') || 
            key.startsWith('user-visited-') || 
            key.startsWith('admin-redirect-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear Supabase session from localStorage
      console.log('🧹 تنظيف جلسة Supabase من localStorage...');
      const supabaseKeys = Object.keys(localStorage);
      supabaseKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
          console.log('🗑️ تم حذف:', key);
        }
      });
      
      // Mark that user has manually signed out
      localStorage.setItem('manuallySignedOut', 'true');
      
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

  // دالة للتحقق من تأكيد البريد الإلكتروني
  const checkEmailVerification = async (user: any): Promise<{ isVerified: boolean; shouldBlock: boolean }> => {
    try {
      console.log('🔍 التحقق من تأكيد البريد الإلكتروني للمستخدم:', user.email);
      
      // Skip email verification for Google users
      if (user.user_metadata?.provider === 'google') {
        console.log('✅ مستخدم Google - تخطي التحقق من تأكيد البريد الإلكتروني');
        return { isVerified: true, shouldBlock: false };
      }
      
      // Skip email verification for users with confirmed email
      if (user.email_confirmed_at) {
        console.log('✅ البريد الإلكتروني مؤكد بالفعل - تخطي التحقق');
        return { isVerified: true, shouldBlock: false };
      }
      
      // Only check email verification for regular users without confirmed email
      console.log('🔍 التحقق من تأكيد البريد الإلكتروني في قاعدة البيانات...');
      
      // Add timeout to the verification check
      const verificationPromise = supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification check timeout')), 2000); // 2 second timeout
      });
      
      const { data, error } = await Promise.race([verificationPromise, timeoutPromise]) as any;
      
      if (error) {
        console.log('⚠️ خطأ في التحقق من تأكيد البريد الإلكتروني:', error);
        // If we can't verify, allow access but log the issue
        return { isVerified: true, shouldBlock: false };
      }
      
      const isVerified = data?.email_verified || user.email_confirmed_at;
      console.log('✅ حالة تأكيد البريد الإلكتروني:', isVerified ? 'مؤكد' : 'غير مؤكد');
      
      return { isVerified: !!isVerified, shouldBlock: false };
    } catch (error) {
      console.error('❌ خطأ في التحقق من تأكيد البريد الإلكتروني:', error);
      // If verification fails, allow access but log the issue
      return { isVerified: true, shouldBlock: false };
    }
  };

  // دالة لتسجيل الخروج القسري للمستخدمين غير المؤكدين
  const forceSignOutUnverified = async () => {
    try {
      console.log('🚪 تسجيل الخروج القسري للمستخدم غير المؤكد...');
      
      // Add timeout to the sign out process
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 3000); // 3 second timeout
      });
      
      await Promise.race([signOutPromise, timeoutPromise]);
      
      console.log('✅ تم تسجيل الخروج بنجاح');
      
      // تنظيف الحالة
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        hasNotifications: false,
      });
      
      // تنظيف localStorage
      localStorage.removeItem('manuallySignedOut');
      sessionStorage.clear();
      
    } catch (error) {
      console.error('❌ خطأ في تسجيل الخروج القسري:', error);
      // Force clear state even if sign out fails
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        hasNotifications: false,
      });
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
    
    // Clear local state
    setAuthState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      hasNotifications: false,
    });
    
    // Clear all storage
    localStorage.removeItem('justLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('openServiceRequest');
    localStorage.removeItem('pendingServiceRequest');
    
    // Clear Supabase session
    const supabaseKeys = Object.keys(localStorage);
    supabaseKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // Mark that user has manually signed out
    localStorage.setItem('manuallySignedOut', 'true');
    
    console.log('✅ Simple sign out completed');
  };

  // Check if user can access protected pages
  const canAccessProtectedPages = () => {
    if (!authState.user) return false;
    
    // Admin and moderator can always access
    const isAdmin = authState.profile?.role === 'admin';
    const isModerator = authState.profile?.role === 'moderator';
    
    if (isAdmin || isModerator) return true;
    
    // Regular users must have verified email
    return authState.user.email_confirmed_at !== null;
  };

  // Get verification status for UI
  const getVerificationStatus = () => {
    if (!authState.user) return { isVerified: false, needsVerification: false };
    
    const isAdmin = authState.profile?.role === 'admin';
    const isModerator = authState.profile?.role === 'moderator';
    
    if (isAdmin || isModerator) {
      return { isVerified: true, needsVerification: false };
    }
    
    const isVerified = authState.user.email_confirmed_at !== null;
    return { isVerified, needsVerification: !isVerified };
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string) => {
    try {
      console.log('📧 إعادة إرسال رابط التأكيد إلى:', email);
      
      // استخدام خدمة البريد الجديدة
      const { EmailService } = await import('../services/emailService');
      const result = await EmailService.resendVerificationEmail(email);
      
      if (!result.success) {
        console.error('❌ خطأ في إعادة إرسال البريد الإلكتروني:', result.error);
        return { error: result.error };
      }
      
      console.log('✅ تم إعادة إرسال رابط التأكيد بنجاح');
      return { error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في إعادة إرسال البريد الإلكتروني:', error);
      return { error: error as any };
    }
  };

  // إضافة دالة لتسجيل الدخول عبر Google
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 بدء تسجيل الدخول عبر Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ خطأ في تسجيل الدخول عبر Google:', error);
        return { error };
      }

      console.log('✅ تم بدء عملية تسجيل الدخول عبر Google');
      return { data, error: null };
    } catch (error) {
      console.error('❌ خطأ غير متوقع في تسجيل الدخول عبر Google:', error);
      return { error };
    }
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
    canAccessProtectedPages,
    getVerificationStatus,
    resendVerificationEmail,
    signInWithGoogle,
  };
};
