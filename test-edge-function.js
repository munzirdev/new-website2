import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test script to verify Edge Function is working
// Run this in the browser console

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function...');
  
  try {
    // Test 1: Check if function exists
    console.log('📋 Test 1: Checking if create-moderator function exists...');
    
    const testData = {
      email: `test-edge-${Date.now()}@example.com`,
      password: 'test123456',
      full_name: 'Test Edge Function'
    };
    
    console.log('📝 Test data:', {
      email: testData.email,
      password: '***hidden***',
      full_name: testData.full_name
    });
    
    // Test 2: Try to invoke the function
    console.log('📋 Test 2: Invoking create-moderator function...');
    
    const { data, error } = await supabase.functions.invoke('create-moderator', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Edge Function error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        details: error.details
      });
      
      // Check if it's a CORS error
      if (error.message?.includes('CORS') || error.message?.includes('cors')) {
        console.log('🔧 This looks like a CORS issue. Check the Edge Function CORS headers.');
      }
      
      // Check if it's a deployment issue
      if (error.message?.includes('Failed to send') || error.message?.includes('fetch')) {
        console.log('🔧 This looks like a deployment issue. Check if the Edge Function is deployed.');
      }
      
      return;
    }
    
    console.log('✅ Edge Function successful:', data);
    
    // Test 3: Clean up test data
    console.log('📋 Test 3: Cleaning up test data...');
    
    if (data?.user?.id) {
      // Delete the test user from auth (this would need admin privileges)
      console.log('ℹ️ Test user created with ID:', data.user.id);
      console.log('ℹ️ Manual cleanup may be needed in Supabase Dashboard');
    }
    
    console.log('🎉 Edge Function test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// Run the test
testEdgeFunction();
