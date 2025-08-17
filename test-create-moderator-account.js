// Test script to verify moderator account creation
// Run this in the browser console to test the new feature

async function testCreateModeratorAccount() {
  console.log('🧪 Testing moderator account creation...');
  
  try {
    // Test 1: Check if create-moderator function exists
    console.log('📋 Test 1: Checking create-moderator function...');
    
    const testEmail = `test-moderator-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    const testName = 'Test Moderator Account';
    
    console.log('📝 Test data:', {
      email: testEmail,
      password: '***hidden***',
      full_name: testName
    });
    
    // Test 2: Try to create moderator account
    console.log('📋 Test 2: Creating moderator account...');
    
    const { data: authData, error: authError } = await supabase.functions.invoke('create-moderator', {
      body: {
        email: testEmail,
        password: testPassword,
        full_name: testName
      }
    });
    
    if (authError) {
      console.error('❌ Error creating moderator account:', authError);
      console.error('❌ Error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      return;
    }
    
    console.log('✅ Moderator account created successfully:', authData);
    
    // Test 3: Check if user was created in auth
    console.log('📋 Test 3: Verifying user in auth...');
    
    if (authData?.user) {
      console.log('✅ User created in auth:', {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at
      });
    }
    
    // Test 4: Check if profile was created
    console.log('📋 Test 4: Checking profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (profileError) {
      console.error('❌ Error checking profile:', profileError);
    } else {
      console.log('✅ Profile created:', {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role
      });
    }
    
    // Test 5: Check if moderator record was created
    console.log('📋 Test 5: Checking moderator record...');
    
    const { data: moderatorData, error: moderatorError } = await supabase
      .from('moderators')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (moderatorError) {
      console.error('❌ Error checking moderator record:', moderatorError);
    } else {
      console.log('✅ Moderator record created:', {
        id: moderatorData.id,
        email: moderatorData.email,
        full_name: moderatorData.full_name,
        user_id: moderatorData.user_id
      });
    }
    
    // Test 6: Try to sign in with the new account
    console.log('📋 Test 6: Testing sign in with new account...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('❌ Error signing in:', signInError);
    } else {
      console.log('✅ Sign in successful:', {
        user: signInData.user?.email,
        session: !!signInData.session
      });
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log('🚪 Signed out after test');
    }
    
    // Test 7: Clean up test data
    console.log('📋 Test 7: Cleaning up test data...');
    
    // Delete moderator record
    await supabase
      .from('moderators')
      .delete()
      .eq('email', testEmail);
    
    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('email', testEmail);
    
    console.log('🧹 Test data cleaned up');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCreateModeratorAccount();
