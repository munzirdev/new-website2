// Test script to verify service_requests table is working
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://fctvityawavmuethxxix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testServiceRequests() {
  console.log('🧪 Testing service_requests table...');

  try {
    // Test 1: Check if service_requests table exists
    console.log('📋 Test 1: Checking if service_requests table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'service_requests');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ service_requests table exists:', tables);
    }

    // Test 2: Try to insert a test record
    console.log('📋 Test 2: Trying to insert a test record...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      service_type: 'translation',
      title: 'Test Request',
      description: 'This is a test request',
      priority: 'medium',
      status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('service_requests')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
      console.log('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Successfully inserted test record:', insertData);
      
      // Clean up: delete the test record
      if (insertData && insertData[0]) {
        const { error: deleteError } = await supabase
          .from('service_requests')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('❌ Error deleting test record:', deleteError);
        } else {
          console.log('✅ Successfully deleted test record');
        }
      }
    }

    // Test 3: Check profiles table
    console.log('📋 Test 3: Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Error checking profiles table:', profilesError);
    } else {
      console.log('✅ profiles table is accessible, found', profiles?.length || 0, 'records');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testServiceRequests();
