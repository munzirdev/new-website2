const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح مشاكل النشر على Netlify...');

try {
  // Step 1: Check if netlify.toml exists
  const netlifyConfigPath = path.join(__dirname, 'netlify.toml');
  if (!fs.existsSync(netlifyConfigPath)) {
    console.log('❌ ملف netlify.toml غير موجود');
    console.log('📝 إنشاء ملف netlify.toml...');
    
    const netlifyConfig = `[build]
  # Build command for Vite React project
  command = "npm run build"
  
  # Publish directory (where Vite outputs the built files)
  publish = "dist"
  
  # Environment variables (these will be set in Netlify dashboard)
  [build.environment]
    NODE_VERSION = "18"

# Redirects for React Router (SPA)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers for security and performance
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.jpg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.svg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Don't cache HTML files
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Pragma = "no-cache"
`;
    
    fs.writeFileSync(netlifyConfigPath, netlifyConfig);
    console.log('✅ تم إنشاء ملف netlify.toml');
  } else {
    console.log('✅ ملف netlify.toml موجود');
  }

  // Step 2: Check package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('📦 معلومات package.json:');
    console.log('- اسم المشروع:', packageJson.name);
    console.log('- الإصدار:', packageJson.version);
    console.log('- نوع المشروع:', packageJson.type || 'CommonJS');
    
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('✅ سكريبت البناء موجود:', packageJson.scripts.build);
    } else {
      console.log('❌ سكريبت البناء غير موجود في package.json');
    }
  }

  // Step 3: Build the project
  console.log('🔨 بناء المشروع...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 4: Check dist folder
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ مجلد dist موجود');
    const files = fs.readdirSync(distPath);
    console.log('📁 الملفات في dist:', files);
    
    // Check for index.html
    if (files.includes('index.html')) {
      console.log('✅ index.html موجود');
    } else {
      console.log('❌ index.html غير موجود');
    }
  } else {
    console.log('❌ مجلد dist غير موجود');
  }

  // Step 5: Create deployment instructions
  console.log('\n📋 تعليمات النشر على Netlify:');
  console.log('1. اذهب إلى netlify.com');
  console.log('2. اختر "Deploy manually"');
  console.log('3. اسحب مجلد dist إلى Netlify');
  console.log('4. أضف Environment Variables:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY');
  console.log('5. أضف Custom Domain (إذا كان مطلوب)');
  console.log('6. انتظر انتشار DNS (24-48 ساعة)');

  console.log('\n🔧 إعدادات Netlify المطلوبة:');
  console.log('- Build command: npm run build');
  console.log('- Publish directory: dist');
  console.log('- Node version: 18');

  console.log('\n✅ تم إصلاح مشاكل النشر على Netlify!');

} catch (error) {
  console.error('❌ خطأ في إصلاح مشاكل النشر:', error.message);
  process.exit(1);
}
