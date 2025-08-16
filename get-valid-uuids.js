import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getValidUUIDs() {
  console.log('🔍 جلب UUIDs صحيحة من الجداول المرتبطة...');
  
  try {
    // جلب user_id صحيح
    console.log('\n1️⃣ جلب user_id صحيح...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.log('❌ لا يمكن الوصول لجدول users:', usersError.message);
    } else if (users && users.length > 0) {
      console.log('✅ تم جلب user_id:', users[0].id);
    } else {
      console.log('📭 جدول users فارغ');
    }

    // جلب company_id صحيح
    console.log('\n2️⃣ جلب company_id صحيح...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (companiesError) {
      console.log('❌ لا يمكن الوصول لجدول companies:', companiesError.message);
    } else if (companies && companies.length > 0) {
      console.log('✅ تم جلب company_id:', companies[0].id);
    } else {
      console.log('📭 جدول companies فارغ');
    }

    // جلب age_group_id صحيح
    console.log('\n3️⃣ جلب age_group_id صحيح...');
    const { data: ageGroups, error: ageGroupsError } = await supabase
      .from('age_groups')
      .select('id')
      .limit(1);

    if (ageGroupsError) {
      console.log('❌ لا يمكن الوصول لجدول age_groups:', ageGroupsError.message);
    } else if (ageGroups && ageGroups.length > 0) {
      console.log('✅ تم جلب age_group_id:', ageGroups[0].id);
    } else {
      console.log('📭 جدول age_groups فارغ');
    }

    // محاولة إنشاء سجل بسيط بدون UUIDs
    console.log('\n4️⃣ محاولة إنشاء سجل بسيط...');
    
    const simpleRecord = {
      contact_name: 'اختبار Polling',
      contact_email: 'polling.test@example.com',
      contact_phone: '+905551234567',
      additional_notes: 'طلب تجريبي لاختبار خدمة polling',
      status: 'pending',
      duration_months: 12,
      calculated_price: 1500,
      customer_age: 25,
      birth_date: '1998-05-15',
      submission_date: new Date().toISOString(),
      insurance_offer_confirmed: false
    };

    const { data: inserted, error: insertError } = await supabase
      .from('health_insurance_requests')
      .insert([simpleRecord])
      .select()
      .single();

    if (insertError) {
      console.error('❌ فشل في إنشاء السجل البسيط:', insertError);
    } else {
      console.log('✅ تم إنشاء السجل البسيط بنجاح');
      console.log('   • ID:', inserted.id);
      console.log('   • Contact Name:', inserted.contact_name);
      console.log('   • Status:', inserted.status);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

getValidUUIDs();
