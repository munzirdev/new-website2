// Test script to diagnose moderator creation issue
// Run this in the browser console to test the moderator creation

async function testModeratorCreation() {
  console.log('🧪 Testing moderator creation...');
  
  try {
    // Test 1: Check if profiles table exists and is accessible
    console.log('📋 Test 1: Checking profiles table...');
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
    } else {
      console.log('✅ Profiles table accessible');
    }
    
    // Test 2: Check if moderators table exists and is accessible
    console.log('📋 Test 2: Checking moderators table...');
    const { data: moderatorsTest, error: moderatorsError } = await supabase
      .from('moderators')
      .select('count')
      .limit(1);
    
    if (moderatorsError) {
      console.error('❌ Moderators table error:', moderatorsError);
    } else {
      console.log('✅ Moderators table accessible');
    }
    
    // Test 3: Check if user_profiles table exists (should not exist)
    console.log('📋 Test 3: Checking if user_profiles table exists...');
    try {
      const { data: userProfilesTest, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (userProfilesError) {
        console.log('✅ user_profiles table does not exist or is not accessible (expected)');
      } else {
        console.warn('⚠️ user_profiles table exists and is accessible (unexpected)');
      }
    } catch (error) {
      console.log('✅ user_profiles table does not exist (expected)');
    }
    
         // Test 4: Try to insert a test moderator record
     console.log('📋 Test 4: Testing moderator insertion...');
     const testEmail = `test-${Date.now()}@example.com`;
     const { data: insertTest, error: insertError } = await supabase
       .from('moderators')
       .insert({
         email: testEmail,
         full_name: 'Test Moderator',
         user_id: null
         // Note: created_by is omitted to avoid foreign key constraint
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
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testModeratorCreation();
