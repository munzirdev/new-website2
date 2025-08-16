import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 بدء معالجة Auth Callback...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('خطأ في معالجة تسجيل الدخول:', error);
          setError('حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
          setLoading(false);
          return;
        }

        if (data.session) {
          console.log('✅ تم تسجيل الدخول بنجاح:', data.session.user.email);
          console.log('👤 معرف المستخدم:', data.session.user.id);
          console.log('🔗 مزود المصادقة:', data.session.user.user_metadata?.provider || 'email');
          
          // التحقق من وجود ملف شخصي
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('خطأ في جلب الملف الشخصي:', profileError);
          }

          // إنشاء ملف شخصي إذا لم يكن موجوداً
          if (!profile) {
            // استخراج بيانات Google بشكل أفضل
            const googleData = data.session.user.user_metadata;
            
            // طباعة جميع البيانات المتوفرة للتشخيص
            console.log('🔍 جميع بيانات user_metadata:', googleData);
            console.log('🔍 بيانات المستخدم الكاملة:', data.session.user);
            
            // محاولة استخراج الاسم بطرق مختلفة
            let fullName = '';
            
            // 1. محاولة من user_metadata
            if (googleData?.full_name) {
              fullName = googleData.full_name;
              console.log('✅ تم العثور على الاسم من full_name:', fullName);
            } else if (googleData?.name) {
              fullName = googleData.name;
              console.log('✅ تم العثور على الاسم من name:', fullName);
            } else if (googleData?.display_name) {
              fullName = googleData.display_name;
              console.log('✅ تم العثور على الاسم من display_name:', fullName);
            } else if (googleData?.given_name && googleData?.family_name) {
              fullName = `${googleData.given_name} ${googleData.family_name}`;
              console.log('✅ تم العثور على الاسم من given_name + family_name:', fullName);
            } else if (googleData?.given_name) {
              fullName = googleData.given_name;
              console.log('✅ تم العثور على الاسم من given_name فقط:', fullName);
            } else {
              // إذا لم نجد أي اسم، استخدم "مستخدم جديد" بدلاً من البريد الإلكتروني
              fullName = 'مستخدم جديد';
              console.log('⚠️ لم يتم العثور على اسم، استخدام "مستخدم جديد"');
            }
            
            const avatarUrl = googleData?.avatar_url || 
                            googleData?.picture || 
                            googleData?.photoURL || 
                            '';

            console.log('📋 بيانات Google المستخرجة:', {
              fullName,
              avatarUrl,
              email: data.session.user.email,
              provider: googleData?.provider || 'unknown',
              user_metadata_keys: Object.keys(googleData || {})
            });

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.session.user.id,
                  full_name: fullName,
                  email: data.session.user.email,
                  avatar_url: avatarUrl,
                  updated_at: new Date().toISOString(),
                }
              ]);

            if (insertError) {
              console.error('خطأ في إنشاء الملف الشخصي:', insertError);
            } else {
              console.log('✅ تم إنشاء الملف الشخصي بنجاح مع بيانات Google');
            }
          } else {
            // تحديث الملف الشخصي الموجود إذا كان من Google
            const googleData = data.session.user.user_metadata;
            if (googleData?.provider === 'google') {
              // تحديث الاسم إذا كان متوفراً
              let updatedName = profile.full_name;
              if (googleData?.full_name && profile.full_name !== googleData.full_name) {
                updatedName = googleData.full_name;
                console.log('✅ تحديث الاسم من Google:', updatedName);
              } else if (googleData?.name && profile.full_name !== googleData.name) {
                updatedName = googleData.name;
                console.log('✅ تحديث الاسم من Google:', updatedName);
              } else if (googleData?.given_name && googleData?.family_name) {
                const newName = `${googleData.given_name} ${googleData.family_name}`;
                if (profile.full_name !== newName) {
                  updatedName = newName;
                  console.log('✅ تحديث الاسم من Google:', updatedName);
                }
              }

              // تحديث الصورة إذا كانت متوفرة
              const updatedAvatarUrl = googleData?.avatar_url || profile.avatar_url;

              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  full_name: updatedName,
                  avatar_url: updatedAvatarUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', data.session.user.id);

              if (updateError) {
                console.error('خطأ في تحديث الملف الشخصي من Google:', updateError);
              } else {
                console.log('✅ تم تحديث الملف الشخصي من Google:', { name: updatedName, avatar: updatedAvatarUrl });
              }
            }
          }

          // التوجيه إلى الصفحة الرئيسية
          console.log('🔄 التوجيه إلى الصفحة الرئيسية...');
          setTimeout(() => {
            console.log('✅ تم التوجيه إلى الصفحة الرئيسية');
            navigate('/', { replace: true });
          }, 1000);
        } else {
          console.log('❌ لا توجد جلسة نشطة، التوجيه إلى الصفحة الرئيسية...');
          setError('فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
          setLoading(false);
          // التوجيه الفوري إلى الصفحة الرئيسية
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('خطأ غير متوقع:', error);
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري معالجة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تسجيل الدخول</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return null;
};
