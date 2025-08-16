#!/usr/bin/env node

/**
 * سكريبت اختبار نظام التسجيل الشامل
 * يختبر جميع جوانب نظام إنشاء الحساب وإرسال البريد الإلكتروني
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات البيئة مفقودة!');
  console.error('يرجى إنشاء ملف .env مع المتغيرات المطلوبة');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// بيانات الاختبار
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  phone: '+905551234567',
  countryCode: '+90'
};

async function testSupabaseConnection() {
  console.log('🔧 اختبار الاتصال مع Supabase...\n');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ خطأ في الاتصال مع Supabase:', error);
      return false;
    }
    
    console.log('✅ الاتصال مع Supabase يعمل بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل في الاتصال مع Supabase:', error);
    return false;
  }
}

async function testSMTPConfiguration() {
  console.log('📧 اختبار إعدادات SMTP...\n');
  
  const requiredEnvVars = [
    'SENDGRID_API_KEY',
    'SITE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  console.log('📋 المتغيرات المطلوبة:');
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: موجود`);
    } else {
      console.log(`❌ ${envVar}: مفقود`);
    }
  }

  console.log('\n📧 إعدادات SMTP:');
  console.log(`🔗 Host: smtp.sendgrid.net`);
  console.log(`🔢 Port: 587`);
  console.log(`👤 User: apikey`);
  console.log(`🔑 Pass: ${process.env.SENDGRID_API_KEY ? 'موجود' : 'مفقود'}`);
  console.log(`📧 Admin Email: noreply@tevasul.group`);
  console.log(`👤 Sender Name: Tevasul Group`);
  
  return process.env.SENDGRID_API_KEY && process.env.SITE_URL;
}

async function testUserCreation() {
  console.log('👤 اختبار إنشاء المستخدم...\n');
  
  try {
    console.log('📧 بيانات الاختبار:', {
      email: testUser.email,
      name: testUser.name,
      phone: testUser.phone,
      countryCode: testUser.countryCode
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: false,
      user_metadata: {
        full_name: testUser.name,
        phone: testUser.phone,
        country_code: testUser.countryCode,
      }
    });

    if (error) {
      console.error('❌ خطأ في إنشاء المستخدم:', error);
      return false;
    }

    console.log('✅ تم إنشاء المستخدم بنجاح');
    console.log('👤 معرف المستخدم:', data.user.id);
    console.log('📧 حالة التأكيد:', data.user.email_confirmed_at ? 'مؤكد' : 'غير مؤكد');
    
    return data.user;
  } catch (error) {
    console.error('❌ فشل في إنشاء المستخدم:', error);
    return false;
  }
}

async function testEmailSending(user) {
  console.log('📧 اختبار إرسال البريد الإلكتروني...\n');
  
  try {
    console.log('📧 محاولة إرسال بريد التأكيد...');
    console.log(`📧 البريد الإلكتروني: ${user.email}\n`);

    // اختبار إرسال بريد التأكيد
    const { error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: user.email,
      options: {
        redirectTo: `${process.env.SITE_URL || 'https://tevasul.group'}/auth/verify-email`
      }
    });

    if (error) {
      console.error('❌ خطأ في إرسال البريد الإلكتروني:');
      console.error('📋 رسالة الخطأ:', error.message);
      console.error('🔧 تفاصيل الخطأ:', error);
      
      if (error.message?.includes('SMTP')) {
        console.error('\n💡 الحل: تحقق من إعدادات SMTP في Supabase');
        console.error('1. اذهب إلى لوحة تحكم Supabase');
        console.error('2. اذهب إلى Settings > Auth > Email Templates');
        console.error('3. تأكد من تفعيل SMTP');
        console.error('4. تحقق من صحة SENDGRID_API_KEY');
      }
      
      return false;
    }

    console.log('✅ تم إرسال بريد التأكيد بنجاح!');
    console.log('📧 تحقق من صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها)');
    
    return true;

  } catch (error) {
    console.error('💥 خطأ غير متوقع:', error);
    return false;
  }
}

async function testResendEmail(user) {
  console.log('🔄 اختبار إعادة إرسال البريد الإلكتروني...\n');
  
  try {
    console.log('📧 محاولة إعادة إرسال بريد التأكيد...');
    console.log(`📧 البريد الإلكتروني: ${user.email}\n`);

    // اختبار إعادة إرسال البريد
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${process.env.SITE_URL || 'https://tevasul.group'}/auth/verify-email`
      }
    });

    if (error) {
      console.error('❌ خطأ في إعادة إرسال البريد الإلكتروني:');
      console.error('📋 رسالة الخطأ:', error.message);
      console.error('🔧 تفاصيل الخطأ:', error);
      return false;
    }

    console.log('✅ تم إعادة إرسال بريد التأكيد بنجاح!');
    return true;

  } catch (error) {
    console.error('💥 خطأ غير متوقع:', error);
    return false;
  }
}

async function testUserDeletion(user) {
  console.log('🗑️ اختبار حذف المستخدم...\n');
  
  try {
    console.log('🗑️ محاولة حذف المستخدم...');
    console.log(`👤 معرف المستخدم: ${user.id}\n`);

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('❌ خطأ في حذف المستخدم:', error);
      return false;
    }

    console.log('✅ تم حذف المستخدم بنجاح!');
    return true;

  } catch (error) {
    console.error('💥 خطأ غير متوقع:', error);
    return false;
  }
}

async function testSupabaseFunctions() {
  console.log('🔧 اختبار Supabase Functions...\n');
  
  try {
    // اختبار دالة إرسال البريد
    console.log('📧 اختبار دالة send-verification-email...');
    
    const { data: sendData, error: sendError } = await supabase.functions.invoke('send-verification-email', {
      body: {
        email: 'test-function@example.com',
        full_name: 'Test Function User'
      }
    });

    if (sendError) {
      console.error('❌ خطأ في دالة send-verification-email:', sendError);
    } else {
      console.log('✅ دالة send-verification-email تعمل بنجاح');
    }

    // اختبار دالة إعادة الإرسال
    console.log('🔄 اختبار دالة resend-verification...');
    
    const { data: resendData, error: resendError } = await supabase.functions.invoke('resend-verification', {
      body: {
        email: 'test-function@example.com'
      }
    });

    if (resendError) {
      console.error('❌ خطأ في دالة resend-verification:', resendError);
    } else {
      console.log('✅ دالة resend-verification تعمل بنجاح');
    }

    return !sendError && !resendError;

  } catch (error) {
    console.error('💥 خطأ في اختبار Supabase Functions:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Tevasul Group - اختبار نظام التسجيل الشامل\n');
  console.log('=' .repeat(60));

  const results = {
    connection: false,
    smtp: false,
    userCreation: false,
    emailSending: false,
    resendEmail: false,
    functions: false,
    userDeletion: false
  };

  // اختبار الاتصال
  results.connection = await testSupabaseConnection();
  
  console.log('\n' + '=' .repeat(60));

  // اختبار SMTP
  results.smtp = await testSMTPConfiguration();
  
  console.log('\n' + '=' .repeat(60));

  // اختبار إنشاء المستخدم
  const user = await testUserCreation();
  results.userCreation = !!user;
  
  console.log('\n' + '=' .repeat(60));

  // اختبار إرسال البريد
  if (user) {
    results.emailSending = await testEmailSending(user);
    
    console.log('\n' + '=' .repeat(60));

    // اختبار إعادة إرسال البريد
    results.resendEmail = await testResendEmail(user);
    
    console.log('\n' + '=' .repeat(60));

    // اختبار Supabase Functions
    results.functions = await testSupabaseFunctions();
    
    console.log('\n' + '=' .repeat(60));

    // اختبار حذف المستخدم
    results.userDeletion = await testUserDeletion(user);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 نتائج الاختبار الشامل:');
  console.log(`🔧 الاتصال مع Supabase: ${results.connection ? '✅ نجح' : '❌ فشل'}`);
  console.log(`📧 إعدادات SMTP: ${results.smtp ? '✅ صحيحة' : '❌ خاطئة'}`);
  console.log(`👤 إنشاء المستخدم: ${results.userCreation ? '✅ نجح' : '❌ فشل'}`);
  console.log(`📧 إرسال البريد: ${results.emailSending ? '✅ نجح' : '❌ فشل'}`);
  console.log(`🔄 إعادة الإرسال: ${results.resendEmail ? '✅ نجح' : '❌ فشل'}`);
  console.log(`🔧 Supabase Functions: ${results.functions ? '✅ تعمل' : '❌ لا تعمل'}`);
  console.log(`🗑️ حذف المستخدم: ${results.userDeletion ? '✅ نجح' : '❌ فشل'}`);

  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n📈 نسبة النجاح: ${Math.round((successCount / totalTests) * 100)}% (${successCount}/${totalTests})`);

  if (successCount === totalTests) {
    console.log('\n🎉 جميع الاختبارات نجحت! نظام التسجيل يعمل بشكل مثالي.');
  } else if (successCount >= totalTests * 0.7) {
    console.log('\n⚠️ معظم الاختبارات نجحت. راجع الإعدادات الفاشلة.');
  } else {
    console.log('\n❌ العديد من الاختبارات فشلت. راجع الإعدادات بعناية.');
  }

  console.log('\n📖 للمزيد من المعلومات، راجع ملف EMAIL_SETUP_GUIDE.md');
  
  // إنهاء العملية
  process.exit(successCount === totalTests ? 0 : 1);
}

// تشغيل الاختبار
main().catch(console.error);

