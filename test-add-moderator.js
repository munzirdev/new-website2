const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://fctvityawavmuethxxix.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddModerator() {
  console.log('🧪 Testing moderator addition...');
  
  try {
    // Test data
    const testModerator = {
      email: 'test-moderator@example.com',
      full_name: 'Test Moderator'
    };
    
    console.log('📝 Test moderator data:', testModerator);
    
    // First, check if user exists in profiles
    console.log('🔍 Checking if user exists in profiles...');
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', testModerator.email)
      .single();
    
    console.log('🔍 Profile search result:', { existingUser, userError });
    
    let userId = null;
    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Found existing user in profiles:', existingUser);
    } else {
      console.log('ℹ️ User not found in profiles, will create moderator without user_id');
    }
    
    // Prepare moderator data
    const moderatorData = {
      email: testModerator.email,
      full_name: testModerator.full_name
    };
    
    // Add user_id only if we found a valid user
    if (userId) {
      moderatorData.user_id = userId;
    }
    
    console.log('📝 Final moderator data to insert:', moderatorData);
    
    // Insert into moderators table
    const { data: moderatorResult, error: moderatorError } = await supabase
      .from('moderators')
      .insert(moderatorData)
      .select()
      .single();
    
    if (moderatorError) {
      console.error('❌ Error adding moderator:', moderatorError);
      console.error('❌ Error details:', {
        message: moderatorError.message,
        details: moderatorError.details,
        hint: moderatorError.hint,
        code: moderatorError.code
      });
      return;
    }
    
    console.log('✅ Moderator added successfully:', moderatorResult);
    
    // If user exists, update their role to moderator
    if (userId) {
      console.log('🔄 Updating existing user role to moderator...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'moderator',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (profileError) {
        console.error('⚠️ Warning: Could not update user profile:', profileError);
      } else {
        console.log('✅ User profile updated to moderator role');
      }
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAddModerator();
