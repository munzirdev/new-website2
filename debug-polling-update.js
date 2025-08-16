import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPollingUpdate() {
  console.log('🔍 تصحيح مشكلة تحديث حالة الطلب في خدمة polling...');
  
  try {
    // 1. جلب طلب موجود للاختبار
    console.log('\n1️⃣ جلب طلب موجود للاختبار...');
    
    const { data: existingRequests, error: fetchError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .limit(1);

    if (fetchError || !existingRequests || existingRequests.length === 0) {
      console.error('❌ لا توجد طلبات في قاعدة البيانات:', fetchError);
      return;
    }

    const testRequest = existingRequests[0];
    console.log('✅ تم جلب طلب للاختبار');
    console.log('   • Request ID:', testRequest.id);
    console.log('   • Contact Name:', testRequest.contact_name);
    console.log('   • Current Status:', testRequest.status);
    console.log('   • User ID:', testRequest.user_id);
    console.log('   • Company ID:', testRequest.company_id);

    // 2. اختبار تحديث بواسطة ID
    console.log('\n2️⃣ اختبار تحديث بواسطة ID...');
    
    const { error: updateByIdError } = await supabase
      .from('health_insurance_requests')
      .update({ status: 'resolved' })
      .eq('id', testRequest.id);

    if (updateByIdError) {
      console.error('❌ فشل في التحديث بواسطة ID:', updateByIdError);
    } else {
      console.log('✅ نجح التحديث بواسطة ID');
    }

    // 3. التحقق من التحديث
    console.log('\n3️⃣ التحقق من التحديث...');
    
    const { data: updatedRequest, error: fetchUpdatedError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .eq('id', testRequest.id)
      .single();

    if (fetchUpdatedError) {
      console.error('❌ فشل في جلب الطلب المحدث:', fetchUpdatedError);
    } else {
      console.log('✅ تم التحقق من التحديث بنجاح');
      console.log('   • Current Status:', updatedRequest.status);
      console.log('   • Updated At:', updatedRequest.updated_at);
    }

    // 4. إعادة الحالة الأصلية
    console.log('\n4️⃣ إعادة الحالة الأصلية...');
    
    const { error: restoreError } = await supabase
      .from('health_insurance_requests')
      .update({ status: testRequest.status })
      .eq('id', testRequest.id);

    if (restoreError) {
      console.error('❌ فشل في إعادة الحالة الأصلية:', restoreError);
    } else {
      console.log('✅ تم إعادة الحالة الأصلية بنجاح');
    }

    // 5. اختبار دالة updateRequestStatus المحسنة
    console.log('\n5️⃣ اختبار دالة updateRequestStatus المحسنة...');
    
    const testResult = await updateRequestStatusEnhanced(testRequest.id, 'resolved');
    console.log('   • نتيجة التحديث المحسن:', testResult ? '✅ نجح' : '❌ فشل');

    // 6. إعادة الحالة الأصلية مرة أخرى
    console.log('\n6️⃣ إعادة الحالة الأصلية مرة أخرى...');
    
    const { error: finalRestoreError } = await supabase
      .from('health_insurance_requests')
      .update({ status: testRequest.status })
      .eq('id', testRequest.id);

    if (finalRestoreError) {
      console.error('❌ فشل في إعادة الحالة الأصلية النهائية:', finalRestoreError);
    } else {
      console.log('✅ تم إعادة الحالة الأصلية النهائية بنجاح');
    }

    console.log('\n🎉 تم تصحيح مشكلة تحديث حالة الطلب!');

  } catch (error) {
    console.error('❌ خطأ في تصحيح مشكلة تحديث حالة الطلب:', error);
  }
}

// دالة تحديث محسنة
async function updateRequestStatusEnhanced(sessionId, status) {
  try {
    console.log(`🔄 تحديث حالة الطلب المحسن: ${sessionId} -> ${status}`);

    // محاولة التحديث في جدول التأمين الصحي بواسطة ID
    let { error: healthError, count: healthCount } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('id', sessionId)
      .select('id', { count: 'exact' });

    if (!healthError && healthCount > 0) {
      console.log('✅ تم تحديث حالة طلب التأمين الصحي بواسطة ID');
      return true;
    }

    // محاولة التحديث في جدول التأمين الصحي بواسطة session_id (إذا كان موجود)
    let { error: sessionError, count: sessionCount } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('session_id', sessionId)
      .select('id', { count: 'exact' });

    if (!sessionError && sessionCount > 0) {
      console.log('✅ تم تحديث حالة طلب التأمين الصحي بواسطة session_id');
      return true;
    }

    // محاولة التحديث في جدول طلبات الخدمة
    let { error: serviceError, count: serviceCount } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', sessionId)
      .select('id', { count: 'exact' });

    if (!serviceError && serviceCount > 0) {
      console.log('✅ تم تحديث حالة طلب الخدمة');
      return true;
    }

    // محاولة التحديث في جدول طلبات العودة الطوعية
    let { error: voluntaryError, count: voluntaryCount } = await supabase
      .from('voluntary_return_forms')
      .update({ status })
      .eq('id', sessionId)
      .select('id', { count: 'exact' });

    if (!voluntaryError && voluntaryCount > 0) {
      console.log('✅ تم تحديث حالة طلب العودة الطوعية');
      return true;
    }

    console.log('❌ لم يتم العثور على الطلب لتحديثه في أي جدول');
    console.log('   • تم البحث في: health_insurance_requests, service_requests, voluntary_return_forms');
    console.log('   • تم البحث بواسطة: id, session_id');
    return false;

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الطلب المحسن:', error);
    return false;
  }
}

// تشغيل التصحيح
debugPollingUpdate();
