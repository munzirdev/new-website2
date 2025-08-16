#!/usr/bin/env node

/**
 * سكريبت تشخيص شامل لمشاكل Supabase
 * يختبر جميع جوانب النظام ويقدم حلول مفصلة
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ متغيرات البيئة مفقودة!');
  console.error('يرجى إنشاء ملف .env مع المتغيرات المطلوبة');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseEnvironment() {
  console.log('🔧 تشخيص متغيرات البيئة...\n');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'SENDGRID_API_KEY',
    'SITE_URL'
  ];

  const results = {};
  
  for (const envVar of requiredVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: موجود`);
      results[envVar] = true;
    } else {
      console.log(`❌ ${envVar}: مفقود`);
      results[envVar] = false;
    }
  }

  return results;
}

async function diagnoseSupabaseConnection() {
  console.log('\n🔗 تشخيص الاتصال مع Supabase...\n');
  
  try {
    // اختبار الاتصال باستخدام Service Key
    const { data: serviceData, error: serviceError } = await supabase.auth.getSession();
    
    if (serviceError) {
      console.error('❌ خطأ في الاتصال باستخدام Service Key:', serviceError);
      return false;
    }
    
    console.log('✅ الاتصال باستخدام Service Key يعمل');
    
    // اختبار الاتصال باستخدام Anon Key
    const { data: anonData, error: anonError } = await supabaseAnon.auth.getSession();
    
    if (anonError) {
      console.error('❌ خطأ في الاتصال باستخدام Anon Key:', anonError);
      return false;
    }
    
    console.log('✅ الاتصال باستخدام Anon Key يعمل');
    
    return true;
  } catch (error) {
    console.error('❌ فشل في الاتصال مع Supabase:', error);
    return false;
  }
}

async function diagnoseSMTPConfiguration() {
  console.log('\n📧 تشخيص إعدادات SMTP...\n');
  
  try {
    // محاولة إرسال بريد تجريبي
    const testEmail = 'test@example.com';
    
    console.log('📧 محاولة إرسال بريد تجريبي...');
    
    const { error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      options: {
        redirectTo: `${process.env.SITE_URL || 'https://tevasul.group'}/auth/verify-email`
      }
    });

    if (error) {
      console.error('❌ خطأ في إرسال البريد التجريبي:', error);
      
      if (error.message?.includes('SMTP')) {
        console.log('\n💡 المشكلة: إعدادات SMTP غير صحيحة');
        console.log('🔧 الحلول:');
        console.log('1. تحقق من صحة SENDGRID_API_KEY');
        console.log('2. تأكد من تفعيل SMTP في Supabase Dashboard');
        console.log('3. تحقق من إعدادات Sender Authentication في SendGrid');
        console.log('4. تأكد من إضافة نطاق tevasul.group إلى SendGrid');
      } else if (error.status === 500) {
        console.log('\n💡 المشكلة: خطأ في الخادم (500)');
        console.log('🔧 الحلول:');
        console.log('1. تحقق من إعدادات Supabase');
        console.log('2. تأكد من صحة متغيرات البيئة');
        console.log('3. تحقق من سجلات الأخطاء في Supabase Dashboard');
      }
      
      return false;
    }
    
    console.log('✅ إرسال البريد التجريبي نجح');
    return true;
  } catch (error) {
    console.error('❌ فشل في اختبار SMTP:', error);
    return false;
  }
}

async function diagnoseAuthConfiguration() {
  console.log('\n🔐 تشخيص إعدادات المصادقة...\n');
  
  try {
    // اختبار إنشاء مستخدم تجريبي
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };
    
    console.log('👤 محاولة إنشاء مستخدم تجريبي...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: false,
      user_metadata: {
        full_name: testUser.name
      }
    });

    if (error) {
      console.error('❌ خطأ في إنشاء المستخدم التجريبي:', error);
      return false;
    }
    
    console.log('✅ إنشاء المستخدم التجريبي نجح');
    console.log('👤 معرف المستخدم:', data.user.id);
    
    // حذف المستخدم التجريبي
    const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
    
    if (deleteError) {
      console.error('⚠️ خطأ في حذف المستخدم التجريبي:', deleteError);
    } else {
      console.log('✅ حذف المستخدم التجريبي نجح');
    }
    
    return true;
  } catch (error) {
    console.error('❌ فشل في اختبار إعدادات المصادقة:', error);
    return false;
  }
}

async function diagnoseFunctions() {
  console.log('\n🔧 تشخيص Supabase Functions...\n');
  
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
      console.log('✅ دالة send-verification-email تعمل');
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
      console.log('✅ دالة resend-verification تعمل');
    }

    return !sendError && !resendError;
  } catch (error) {
    console.error('❌ فشل في اختبار Supabase Functions:', error);
    return false;
  }
}

async function generateReport(results) {
  console.log('\n📊 تقرير التشخيص الشامل\n');
  console.log('=' .repeat(50));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`📈 نسبة النجاح: ${successRate}% (${passedTests}/${totalTests})`);
  console.log('\n📋 تفاصيل النتائج:');
  
  for (const [test, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  }
  
  console.log('\n🔧 التوصيات:');
  
  if (!results.environment) {
    console.log('1. 🔧 إصلاح متغيرات البيئة:');
    console.log('   - تأكد من وجود جميع المتغيرات المطلوبة في ملف .env');
    console.log('   - تحقق من صحة قيم المتغيرات');
  }
  
  if (!results.connection) {
    console.log('2. 🔗 إصلاح الاتصال مع Supabase:');
    console.log('   - تحقق من صحة SUPABASE_URL');
    console.log('   - تحقق من صحة Service Role Key و Anon Key');
    console.log('   - تأكد من أن المشروع نشط في Supabase Dashboard');
  }
  
  if (!results.smtp) {
    console.log('3. 📧 إصلاح إعدادات SMTP:');
    console.log('   - أنشئ حساب SendGrid');
    console.log('   - احصل على API Key صحيح');
    console.log('   - أضف نطاق tevasul.group إلى SendGrid');
    console.log('   - فعّل SMTP في Supabase Dashboard');
  }
  
  if (!results.auth) {
    console.log('4. 🔐 إصلاح إعدادات المصادقة:');
    console.log('   - تحقق من إعدادات Auth في Supabase Dashboard');
    console.log('   - تأكد من تفعيل Email Confirmations');
    console.log('   - تحقق من إعدادات Site URL');
  }
  
  if (!results.functions) {
    console.log('5. 🔧 إصلاح Supabase Functions:');
    console.log('   - انشر الدوال: npm run deploy:functions');
    console.log('   - تحقق من سجلات الأخطاء في Supabase Dashboard');
    console.log('   - تأكد من إعدادات CORS');
  }
  
  if (successRate === 100) {
    console.log('\n🎉 جميع الاختبارات نجحت! النظام يعمل بشكل مثالي.');
  } else if (successRate >= 80) {
    console.log('\n⚠️ معظم الاختبارات نجحت. راجع التوصيات أعلاه.');
  } else {
    console.log('\n❌ العديد من الاختبارات فشلت. راجع التوصيات بعناية.');
  }
  
  console.log('\n📖 للمزيد من المعلومات، راجع ملف SIGNUP_SYSTEM_FIX.md');
}

async function main() {
  console.log('🔍 Tevasul Group - تشخيص شامل لنظام Supabase\n');
  console.log('=' .repeat(60));

  const results = {
    environment: false,
    connection: false,
    smtp: false,
    auth: false,
    functions: false
  };

  // تشخيص متغيرات البيئة
  const envResults = await diagnoseEnvironment();
  results.environment = Object.values(envResults).every(Boolean);
  
  // تشخيص الاتصال
  results.connection = await diagnoseSupabaseConnection();
  
  // تشخيص SMTP
  results.smtp = await diagnoseSMTPConfiguration();
  
  // تشخيص المصادقة
  results.auth = await diagnoseAuthConfiguration();
  
  // تشخيص Functions
  results.functions = await diagnoseFunctions();

  // إنشاء التقرير
  await generateReport(results);
  
  // إنهاء العملية
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  process.exit(successCount === totalTests ? 0 : 1);
}

// تشغيل التشخيص
main().catch(console.error);

