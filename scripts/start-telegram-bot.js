#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🤖 بدء تشغيل بوت التلقرام...');

// التحقق من وجود متغيرات البيئة المطلوبة
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ متغيرات البيئة المطلوبة مفقودة:', missingVars);
  console.error('يرجى إضافة هذه المتغيرات إلى ملف .env');
  process.exit(1);
}

// تشغيل البوت
const botProcess = spawn('node', [path.join(__dirname, '../server/telegramBot.js')], {
  stdio: 'inherit',
  env: process.env
});

// معالجة إيقاف العملية
botProcess.on('close', (code) => {
  console.log(`🛑 تم إيقاف بوت التلقرام مع الكود: ${code}`);
  process.exit(code);
});

botProcess.on('error', (error) => {
  console.error('❌ خطأ في تشغيل البوت:', error);
  process.exit(1);
});

// معالجة إيقاف التطبيق
process.on('SIGINT', () => {
  console.log('🛑 إيقاف البوت...');
  botProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 إيقاف البوت...');
  botProcess.kill('SIGTERM');
});
