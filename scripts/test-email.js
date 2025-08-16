#!/usr/bin/env node

/**
 * سكريبت اختبار إرسال البريد الإلكتروني
 * يستخدم لاختبار نظام إرسال البريد الإلكتروني في Tevasul Group
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

async function testEmailSending() {
  console.log('🧪 بدء اختبار إرسال البريد الإلكتروني...\n');

  const testEmail = 'test@example.com';
  const testName = 'Test User';

  try {
    console.log('📧 محاولة إرسال بريد التأكيد...');
    console.log(`📧 البريد الإلكتروني: ${testEmail}`);
    console.log(`👤 الاسم: ${testName}\n`);

    // اختبار إرسال بريد التأكيد
    const { error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
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

async function testResendEmail() {
  console.log('\n🔄 اختبار إعادة إرسال البريد الإلكتروني...\n');

  const testEmail = 'test@example.com';

  try {
    console.log('📧 محاولة إعادة إرسال بريد التأكيد...');
    console.log(`📧 البريد الإلكتروني: ${testEmail}\n`);

    // اختبار إعادة إرسال البريد
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
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

async function checkSMTPConfiguration() {
  console.log('🔧 فحص إعدادات SMTP...\n');

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
}

async function main() {
  console.log('🚀 Tevasul Group - اختبار نظام البريد الإلكتروني\n');
  console.log('=' .repeat(50));

  // فحص الإعدادات
  await checkSMTPConfiguration();
  
  console.log('\n' + '=' .repeat(50));

  // اختبار إرسال البريد
  const emailResult = await testEmailSending();
  
  console.log('\n' + '=' .repeat(50));

  // اختبار إعادة إرسال البريد
  const resendResult = await testResendEmail();

  console.log('\n' + '=' .repeat(50));
  console.log('📊 نتائج الاختبار:');
  console.log(`📧 إرسال البريد: ${emailResult ? '✅ نجح' : '❌ فشل'}`);
  console.log(`🔄 إعادة الإرسال: ${resendResult ? '✅ نجح' : '❌ فشل'}`);

  if (emailResult && resendResult) {
    console.log('\n🎉 جميع الاختبارات نجحت! نظام البريد الإلكتروني يعمل بشكل صحيح.');
  } else {
    console.log('\n⚠️ بعض الاختبارات فشلت. راجع الإعدادات أعلاه.');
  }

  console.log('\n📖 للمزيد من المعلومات، راجع ملف EMAIL_SETUP_GUIDE.md');
}

// تشغيل الاختبار
main().catch(console.error);

