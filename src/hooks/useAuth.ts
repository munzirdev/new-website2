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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ خطأ في جلب الجلسة:', error);
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }
        
        console.log('📋 الجلسة الحالية:', session ? 'موجودة' : 'غير موجودة');
        
        if (session?.user) {
          console.log('👤 المستخدم موجود:', session.user.email);
          const profile = await getUserProfile(session.user.id);
          const hasNotifications = await checkForNotifications(session.user.id);
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            hasNotifications,
          });
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
        console.log('🔔 تغيير حالة المصادقة:', event);
        console.log('👤 المستخدم:', session?.user?.email || 'غير موجود');
        console.log('📊 الجلسة:', session ? 'موجودة' : 'غير موجودة');
        
        setAuthState(prev => ({ ...prev, loading: true }));
        
        if (session?.user) {
          console.log('✅ جلسة نشطة - تحديث الحالة...');
          console.log('👤 معرف المستخدم من الجلسة:', session.user.id);
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
    if (authState.user && !authState.profile) {
      console.log('🔄 إعادة جلب الملف الشخصي للمستخدم:', authState.user.id);
      getUserProfile(authState.user.id).then(profile => {
        if (profile) {
          setAuthState(prev => ({ ...prev, profile }));
          console.log('✅ تم تحديث الملف الشخصي:', profile.full_name);
        } else {
          // إذا لم يتم العثور على profile، حاول إنشاؤه من user_metadata
          console.log('🔄 محاولة إنشاء profile من user_metadata...');
          createProfileFromMetadata(authState.user).then(newProfile => {
            if (newProfile) {
              setAuthState(prev => ({ ...prev, profile: newProfile }));
              console.log('✅ تم إنشاء الملف الشخصي من user_metadata:', newProfile.full_name);
            }
          });
        }
      });
    }
  }, [authState.user, authState.profile]);

  // دالة لإنشاء profile من user_metadata
  const createProfileFromMetadata = async (user: any): Promise<UserProfile | null> => {
    try {
      console.log('🔄 إنشاء profile من user_metadata للمستخدم:', user.id);
      console.log('📋 user_metadata:', user.user_metadata);
      
      if (!user.user_metadata) {
        console.log('❌ لا توجد user_metadata');
        return null;
      }

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'مستخدم',
          phone: user.user_metadata.phone || null,
          country_code: user.user_metadata.country_code || '+90',
          role: 'user',
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
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('⏰ انتهت مهلة جلب الملف الشخصي، استخدام الملف الافتراضي');
          resolve(null);
        }, 5000); // 5 second timeout
      });

      const profilePromise = (async () => {
        // محاولة جلب البيانات من قاعدة البيانات مباشرة
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.log('⚠️ لم يتم العثور على الملف الشخصي:', error.message);
          console.log('⚠️ تفاصيل الخطأ:', error);
          
          // محاولة إنشاء ملف شخصي إذا لم يكن موجوداً
          if (error.code === 'PGRST116') { // No rows returned
            console.log('🔄 محاولة إنشاء ملف شخصي جديد...');
            
            // جلب معلومات المستخدم من auth.users
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (user && !userError) {
              console.log('👤 بيانات المستخدم من auth:', user);
              console.log('📋 user_metadata:', user.user_metadata);
              
              // استخدام البيانات من user_metadata أو البيانات الافتراضية
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .upsert({
                  id: userId,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
                  phone: user.user_metadata?.phone || null,
                  country_code: user.user_metadata?.country_code || '+90',
                  role: 'user',
                })
                .select()
                .single();
                
              if (!createError && newProfile) {
                console.log('✅ تم إنشاء ملف شخصي جديد:', newProfile.full_name);
                return newProfile;
              } else {
                console.error('❌ فشل في إنشاء الملف الشخصي:', createError);
                // Return a default profile if creation fails
                return {
                  id: userId,
                  email: user.email || '',
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
                  phone: user.user_metadata?.phone || null,
                  country_code: user.user_metadata?.country_code || '+90',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              }
            }
          }
          
          // Return a default profile if we can't get user data
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            return {
              id: userId,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
              phone: user.user_metadata?.phone || null,
              country_code: user.user_metadata?.country_code || '+90',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
          
          return null;
        }

        console.log('✅ تم جلب الملف الشخصي بنجاح');
        console.log('📋 بيانات الملف الشخصي:', data);
        
        // التحقق من أن البيانات موجودة
        if (data) {
          console.log('📊 تفاصيل البيانات:');
          console.log('- الاسم:', data.full_name);
          console.log('- البريد الإلكتروني:', data.email);
          console.log('- الهاتف:', data.phone);
          console.log('- رمز البلد:', data.country_code);
        }
        
        return data;
      })();

      // Race between timeout and profile loading
      const result = await Promise.race([profilePromise, timeoutPromise]);
      
      if (result === null) {
        // Timeout occurred, return default profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('🔄 إنشاء ملف شخصي افتراضي بسبب انتهاء المهلة');
          return {
            id: userId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
            phone: user.user_metadata?.phone || null,
            country_code: user.user_metadata?.country_code || '+90',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('💥 خطأ في جلب الملف الشخصي:', error);
      // Return a default profile on error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🔄 إنشاء ملف شخصي افتراضي بسبب الخطأ');
        return {
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
          phone: user.user_metadata?.phone || null,
          country_code: user.user_metadata?.country_code || '+90',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return null;
    }
  };

  const checkForNotifications = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔔 فحص الإشعارات للمستخدم:', userId);
      
      // فحص الطلبات التي تم تحديثها خلال آخر 7 أيام (لضمان عدم فقدان الإشعارات)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('service_requests')
        .select('id, status, updated_at, created_at')
        .eq('user_id', userId)
        .gt('updated_at', sevenDaysAgo.toISOString());

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
      console.error('💥 خطأ في فحص الإشعارات:', error);
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
        
        try {
          // Get profile and notifications with timeout protection
          const profile = await getUserProfile(data.user.id);
          const hasNotifications = await checkForNotifications(data.user.id);
          
          const newAuthState = {
            user: data.user,
            profile,
            session: data.session,
            loading: false,
            hasNotifications,
          };
          
          console.log('📊 الحالة الجديدة:', newAuthState);
          console.log('📋 الملف الشخصي:', profile);
          setAuthState(newAuthState);
          console.log('✅ تم تحديث الحالة يدوياً');
          
          // Force a re-render by triggering a state update
          setTimeout(() => {
            console.log('🔄 إعادة تحميل الحالة للتأكد من التحديث...');
            setAuthState(prev => ({ ...prev }));
          }, 100);
        } catch (profileError) {
          console.error('❌ خطأ في جلب الملف الشخصي، استخدام الحالة الافتراضية:', profileError);
          
          // Create a default auth state even if profile loading fails
          const defaultAuthState = {
            user: data.user,
            profile: {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.email?.split('@')[0] || 'مستخدم',
              phone: undefined,
              country_code: '+90',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            session: data.session,
            loading: false,
            hasNotifications: false,
          };
          
          console.log('📊 الحالة الافتراضية:', defaultAuthState);
          setAuthState(defaultAuthState);
          console.log('✅ تم تحديث الحالة بالملف الافتراضي');
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في تسجيل الدخول:', error);
      return { error: error as any };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 تسجيل الخروج...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
        // Even if server sign-out fails, we should clear local state
        console.log('⚠️ فشل تسجيل الخروج من الخادم، لكن سيتم تنظيف الحالة المحلية');
      }
      
      console.log('✅ تم تسجيل الخروج بنجاح');
      return { error: null };
    } catch (error) {
      console.error('💥 خطأ غير متوقع في تسجيل الخروج:', error);
    } finally {
      // Always clear local state regardless of server response
      console.log('🧹 تنظيف الحالة المحلية...');
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        hasNotifications: false,
      });
    }
    
    return { error: null };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    clearNotifications,
  };
};
