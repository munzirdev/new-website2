// Test script to verify user_profiles issue is fixed
// Run this in the browser console after applying the fix

async function testUserProfilesFix() {
  console.log('🧪 Testing user_profiles fix...');
  
  try {
    // Test 1: Verify user_profiles table is gone
    console.log('📋 Test 1: Checking if user_profiles table is removed...');
    try {
      const { data: userProfilesTest, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (userProfilesError && userProfilesError.message.includes('does not exist')) {
        console.log('✅ user_profiles table successfully removed (expected)');
      } else {
        console.warn('⚠️ user_profiles table still exists (unexpected)');
      }
    } catch (error) {
      console.log('✅ user_profiles table successfully removed (expected)');
    }
    
    // Test 2: Verify profiles table works
    console.log('📋 Test 2: Checking profiles table...');
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
    } else {
      console.log('✅ Profiles table working correctly');
    }
    
    // Test 3: Verify moderators table works
    console.log('📋 Test 3: Checking moderators table...');
    const { data: moderatorsTest, error: moderatorsError } = await supabase
      .from('moderators')
      .select('count')
      .limit(1);
    
    if (moderatorsError) {
      console.error('❌ Moderators table error:', moderatorsError);
    } else {
      console.log('✅ Moderators table working correctly');
    }
    
    // Test 4: Test moderator insertion (simulate the actual operation)
    console.log('📋 Test 4: Testing moderator insertion...');
    const testEmail = `test-fix-${Date.now()}@example.com`;
    const { data: insertTest, error: insertError } = await supabase
      .from('moderators')
      .insert({
        email: testEmail,
        full_name: 'Test Fix Moderator'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Moderator insertion error:', insertError);
      console.error('❌ Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Moderator insertion successful:', insertTest);
      
      // Clean up test record
      await supabase
        .from('moderators')
        .delete()
        .eq('email', testEmail);
      console.log('🧹 Test record cleaned up');
    }
    
    // Test 5: Test moderator insertion with user_id (if user exists)
    console.log('📋 Test 5: Testing moderator insertion with user_id...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const testEmail2 = `test-fix-user-${Date.now()}@example.com`;
        const { data: insertTest2, error: insertError2 } = await supabase
          .from('moderators')
          .insert({
            email: testEmail2,
            full_name: 'Test Fix Moderator with User',
            user_id: user.id
          })
          .select()
          .single();
        
        if (insertError2) {
          console.error('❌ Moderator insertion with user_id error:', insertError2);
        } else {
          console.log('✅ Moderator insertion with user_id successful:', insertTest2);
          
          // Clean up test record
          await supabase
            .from('moderators')
            .delete()
            .eq('email', testEmail2);
          console.log('🧹 Test record with user_id cleaned up');
        }
      } else {
        console.log('ℹ️ No authenticated user, skipping user_id test');
      }
    } catch (error) {
      console.log('ℹ️ Could not test with user_id:', error.message);
    }
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserProfilesFix();
