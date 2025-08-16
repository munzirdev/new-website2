// Simple Email Verification Test
console.log('🧪 اختبار بسيط لنظام التحقق من البريد الإلكتروني');

// Test URL parsing
function testUrlParsing() {
  console.log('\n1️⃣ اختبار تحليل الروابط:');
  
  // Test different URL formats
  const testUrls = [
    'https://tevasul.group/auth/verify-email',
    'https://tevasul.group/auth/verify-email?token=abc123&type=signup',
    'https://tevasul.group/auth/verify-email?access_token=xyz789&refresh_token=def456',
    'https://tevasul.group/auth/verify-email?error=invalid_token',
    'https://tevasul.group/auth/verify-email#access_token=xyz789&refresh_token=def456'
  ];
  
  testUrls.forEach((url, index) => {
    console.log(`\nاختبار ${index + 1}: ${url}`);
    
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const hash = urlObj.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    
    console.log('  معاملات URL:', {
      token: params.get('token'),
      type: params.get('type'),
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      error: params.get('error')
    });
    
    console.log('  معاملات Hash:', {
      access_token: hashParams.get('access_token'),
      refresh_token: hashParams.get('refresh_token'),
      type: hashParams.get('type')
    });
  });
}

// Test verification logic
function testVerificationLogic() {
  console.log('\n2️⃣ اختبار منطق التحقق:');
  
  const scenarios = [
    {
      name: 'رابط بدون معاملات',
      params: {},
      session: null,
      expected: 'error'
    },
    {
      name: 'رابط مع token و type',
      params: { token: 'abc123', type: 'signup' },
      session: null,
      expected: 'verify_otp'
    },
    {
      name: 'رابط مع access_token و refresh_token',
      params: { access_token: 'xyz789', refresh_token: 'def456' },
      session: null,
      expected: 'verify_session'
    },
    {
      name: 'جلسة موجودة مع بريد مؤكد',
      params: {},
      session: { user: { email: 'test@example.com', email_confirmed_at: '2024-01-01' } },
      expected: 'success'
    },
    {
      name: 'جلسة موجودة مع بريد غير مؤكد',
      params: {},
      session: { user: { email: 'test@example.com', email_confirmed_at: null } },
      expected: 'pending'
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\nسيناريو ${index + 1}: ${scenario.name}`);
    console.log(`  المعاملات:`, scenario.params);
    console.log(`  الجلسة:`, scenario.session ? 'موجودة' : 'غير موجودة');
    console.log(`  النتيجة المتوقعة: ${scenario.expected}`);
    
    // Simulate verification logic
    let result = 'unknown';
    
    if (scenario.session?.user?.email_confirmed_at) {
      result = 'success';
    } else if (scenario.session?.user && !scenario.session.user.email_confirmed_at) {
      result = 'pending';
    } else if (scenario.params.token && scenario.params.type === 'signup') {
      result = 'verify_otp';
    } else if (scenario.params.access_token && scenario.params.refresh_token) {
      result = 'verify_session';
    } else if (!scenario.params.token && !scenario.params.access_token && !scenario.session) {
      result = 'error';
    }
    
    console.log(`  النتيجة الفعلية: ${result}`);
    console.log(`  ✅ ${result === scenario.expected ? 'صحيح' : '❌ خطأ'}`);
  });
}

// Run tests
testUrlParsing();
testVerificationLogic();

console.log('\n🎉 انتهى الاختبار البسيط!');
console.log('\n💡 نصائح:');
console.log('• تأكد من أن الرابط يحتوي على المعاملات الصحيحة');
console.log('• تحقق من أن المستخدم لم يفتح الرابط من قبل');
console.log('• تأكد من أن الرابط لم ينتهي صلاحيته');
console.log('• تحقق من إعدادات SMTP في Supabase');
