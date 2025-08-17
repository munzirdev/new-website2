// Test Health Insurance Request Submission Fix
// Run this in browser console on the health insurance page

console.log('🧪 Testing Health Insurance Request Submission...');

// Test 1: Check if profiles table is accessible
console.log('📋 Test 1: Checking profiles table access...');
try {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(1);
  
  if (profilesError) {
    console.error('❌ Profiles table error:', profilesError);
  } else {
    console.log('✅ Profiles table accessible:', profiles);
  }
} catch (error) {
  console.error('❌ Profiles table access failed:', error);
}

// Test 2: Check if health_insurance_requests table is accessible
console.log('📋 Test 2: Checking health_insurance_requests table access...');
try {
  const { data: requests, error: requestsError } = await supabase
    .from('health_insurance_requests')
    .select('id, contact_name, status')
    .limit(1);
  
  if (requestsError) {
    console.error('❌ Health insurance requests table error:', requestsError);
  } else {
    console.log('✅ Health insurance requests table accessible:', requests);
  }
} catch (error) {
  console.error('❌ Health insurance requests table access failed:', error);
}

// Test 3: Check current user profile
console.log('📋 Test 3: Checking current user profile...');
try {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log('✅ User authenticated:', user.id);
    
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.warn('⚠️ User profile not found, attempting to create...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم جديد',
          phone: user.user_metadata?.phone || null,
          country_code: user.user_metadata?.country_code || '+90',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create user profile:', createError);
      } else {
        console.log('✅ User profile created successfully:', newProfile);
      }
    } else {
      console.log('✅ User profile found:', userProfile);
    }
  } else {
    console.log('ℹ️ No authenticated user (guest mode)');
  }
} catch (error) {
  console.error('❌ User profile check failed:', error);
}

// Test 4: Test health insurance request submission (if user is authenticated)
console.log('📋 Test 4: Testing health insurance request submission...');
try {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Get sample data for testing
    const { data: companies } = await supabase
      .from('insurance_companies')
      .select('id')
      .limit(1);
    
    const { data: ageGroups } = await supabase
      .from('age_groups')
      .select('id')
      .limit(1);
    
    if (companies && companies.length > 0 && ageGroups && ageGroups.length > 0) {
      const testData = {
        company_id: companies[0].id,
        age_group_id: ageGroups[0].id,
        duration_months: 12,
        calculated_price: 1500.00,
        contact_name: 'Test User',
        contact_email: 'test@example.com',
        contact_phone: '+905349627241',
        additional_notes: 'Test request from console',
        status: 'pending',
        user_id: user.id
      };
      
      console.log('🔄 Submitting test request...');
      const { data, error } = await supabase
        .from('health_insurance_requests')
        .insert(testData)
        .select();
      
      if (error) {
        console.error('❌ Test request failed:', error);
      } else {
        console.log('✅ Test request successful:', data);
      }
    } else {
      console.log('ℹ️ No companies or age groups available for testing');
    }
  } else {
    console.log('ℹ️ Skipping test request (guest mode)');
  }
} catch (error) {
  console.error('❌ Test request failed:', error);
}

console.log('🏁 Health Insurance Request Tests Complete!');
