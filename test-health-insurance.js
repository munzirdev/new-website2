// Test script to verify health insurance data
// Run this with: node test-health-insurance.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHealthInsuranceData() {
  console.log('🔍 Testing Health Insurance Data...\n');

  try {
    // Test companies
    console.log('1. Testing Insurance Companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('insurance_companies')
      .select('*')
      .eq('is_active', true);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
    } else {
      console.log(`✅ Found ${companies?.length || 0} companies`);
      if (companies && companies.length > 0) {
        console.log('   Sample companies:', companies.slice(0, 3).map(c => c.name));
      }
    }

    // Test age groups
    console.log('\n2. Testing Age Groups...');
    const { data: ageGroups, error: ageGroupsError } = await supabase
      .from('age_groups')
      .select('*')
      .eq('is_active', true);

    if (ageGroupsError) {
      console.error('❌ Error fetching age groups:', ageGroupsError);
    } else {
      console.log(`✅ Found ${ageGroups?.length || 0} age groups`);
      if (ageGroups && ageGroups.length > 0) {
        console.log('   Sample age groups:', ageGroups.slice(0, 3).map(ag => `${ag.name} (${ag.min_age}-${ag.max_age})`));
      }
    }

    // Test pricing data
    console.log('\n3. Testing Pricing Data...');
    const { data: pricing, error: pricingError } = await supabase
      .from('health_insurance_pricing')
      .select(`
        *,
        insurance_companies(name),
        age_groups(name)
      `)
      .eq('is_active', true);

    if (pricingError) {
      console.error('❌ Error fetching pricing:', pricingError);
    } else {
      console.log(`✅ Found ${pricing?.length || 0} pricing records`);
      if (pricing && pricing.length > 0) {
        console.log('   Sample pricing:', pricing.slice(0, 3).map(p => 
          `${p.insurance_companies?.name} - ${p.age_groups?.name} - ${p.duration_months} months - ${p.price_try} TRY`
        ));
      }
    }

    // Test requests
    console.log('\n4. Testing Health Insurance Requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .limit(5);

    if (requestsError) {
      console.error('❌ Error fetching requests:', requestsError);
    } else {
      console.log(`✅ Found ${requests?.length || 0} requests`);
    }

    // Test RPC function
    console.log('\n5. Testing RPC Function...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_health_insurance_pricing');

    if (rpcError) {
      console.error('❌ Error calling RPC function:', rpcError);
    } else {
      console.log(`✅ RPC function returned ${rpcData?.length || 0} records`);
    }

    console.log('\n🎉 Health Insurance Data Test Complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testHealthInsuranceData();
