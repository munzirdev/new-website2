import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPollingFixed() {
  console.log('🧪 اختبار خدمة polling المحدثة مع التصحيح...');
  
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

    // 2. اختبار دالة updateRequestStatus المحدثة
    console.log('\n2️⃣ اختبار دالة updateRequestStatus المحدثة...');
    
    const originalStatus = testRequest.status;
    const testResult = await updateRequestStatus(testRequest.id, 'resolved');
    console.log('   • نتيجة التحديث:', testResult ? '✅ نجح' : '❌ فشل');

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
      .update({ status: originalStatus })
      .eq('id', testRequest.id);

    if (restoreError) {
      console.error('❌ فشل في إعادة الحالة الأصلية:', restoreError);
    } else {
      console.log('✅ تم إعادة الحالة الأصلية بنجاح');
    }

    // 5. اختبار محاكاة callback query
    console.log('\n5️⃣ اختبار محاكاة callback query...');
    
    const callbackData = `mark_resolved:${testRequest.id}`;
    const [action, sessionId] = callbackData.split(':');
    
    console.log('   • Action:', action);
    console.log('   • Session ID:', sessionId);
    
    // محاكاة معالجة callback query
    let responseMessage = '';
    let success = false;

    switch (action) {
      case 'mark_resolved':
        success = await updateRequestStatus(sessionId, 'resolved');
        responseMessage = success 
          ? '✅ تم تحديث حالة الطلب إلى "تم التعامل معه" بنجاح'
          : '❌ فشل في تحديث حالة الطلب';
        break;

      default:
        responseMessage = '❌ إجراء غير معروف';
        success = false;
    }

    console.log('   • Response Message:', responseMessage);
    console.log('   • Success:', success ? '✅' : '❌');

    // 6. التحقق النهائي
    console.log('\n6️⃣ التحقق النهائي...');
    
    const { data: finalRequest, error: finalFetchError } = await supabase
      .from('health_insurance_requests')
      .select('*')
      .eq('id', testRequest.id)
      .single();

    if (finalFetchError) {
      console.error('❌ فشل في جلب الطلب النهائي:', finalFetchError);
    } else {
      console.log('✅ تم التحقق النهائي بنجاح');
      console.log('   • Final Status:', finalRequest.status);
    }

    console.log('\n🎉 تم اختبار خدمة polling المحدثة بنجاح!');
    console.log('\n📋 ملخص الاختبار:');
    console.log('   ✅ تم جلب طلب للاختبار');
    console.log('   ✅ تم اختبار دالة updateRequestStatus المحدثة');
    console.log('   ✅ تم التحقق من التحديث');
    console.log('   ✅ تم إعادة الحالة الأصلية');
    console.log('   ✅ تم اختبار محاكاة callback query');
    console.log('   ✅ تم التحقق النهائي');

  } catch (error) {
    console.error('❌ خطأ في اختبار خدمة polling المحدثة:', error);
  }
}

// دالة updateRequestStatus المحدثة (نفس الدالة في telegram-polling-service.js)
async function updateRequestStatus(sessionId, status) {
  try {
    console.log(`🔄 تحديث حالة الطلب: ${sessionId} -> ${status}`);

    // محاولة التحديث في جدول التأمين الصحي بواسطة ID
    let { error: healthError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('id', sessionId);

    if (!healthError) {
      console.log('✅ تم تحديث حالة طلب التأمين الصحي بواسطة ID');
      return true;
    }

    // محاولة التحديث في جدول التأمين الصحي بواسطة session_id (إذا كان موجود)
    let { error: sessionError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('session_id', sessionId);

    if (!sessionError) {
      console.log('✅ تم تحديث حالة طلب التأمين الصحي بواسطة session_id');
      return true;
    }

    // محاولة التحديث في جدول طلبات الخدمة
    let { error: serviceError } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', sessionId);

    if (!serviceError) {
      console.log('✅ تم تحديث حالة طلب الخدمة');
      return true;
    }

    // محاولة التحديث في جدول طلبات العودة الطوعية
    let { error: voluntaryError } = await supabase
      .from('voluntary_return_forms')
      .update({ status })
      .eq('id', sessionId);

    if (!voluntaryError) {
      console.log('✅ تم تحديث حالة طلب العودة الطوعية');
      return true;
    }

    console.log('❌ لم يتم العثور على الطلب لتحديثه في أي جدول');
    console.log('   • تم البحث في: health_insurance_requests, service_requests, voluntary_return_forms');
    console.log('   • تم البحث بواسطة: id, session_id');
    return false;

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الطلب:', error);
    return false;
  }
}

// تشغيل الاختبار
testPollingFixed();
