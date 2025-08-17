const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://fctvityawavmuethxxix.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleModerator() {
  console.log('🧪 Testing simple moderator addition...');
  
  try {
    // Test data - use a unique email
    const testModerator = {
      email: `test-moderator-${Date.now()}@example.com`,
      full_name: 'Test Moderator'
    };
    
    console.log('📝 Test moderator data:', testModerator);
    
    // Insert into moderators table without user_id (simplest case)
    const moderatorData = {
      email: testModerator.email,
      full_name: testModerator.full_name
    };
    
    console.log('📝 Inserting moderator data:', moderatorData);
    
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
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSimpleModerator();
