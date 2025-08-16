import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// إعداد Supabase مع service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanTelegramConfig() {
  console.log('🧹 تنظيف جدول telegram_config...');
  
  try {
    // جلب جميع السجلات
    const { data: configs, error: fetchError } = await supabase
      .from('telegram_config')
      .select('*');
    
    if (fetchError) {
      console.error('❌ خطأ في جلب السجلات:', fetchError);
      return;
    }
    
    console.log(`📊 تم العثور على ${configs.length} سجلات`);
    
    if (configs.length <= 1) {
      console.log('✅ الجدول نظيف بالفعل');
      return;
    }
    
    // حذف جميع السجلات ما عدا الأول
    const idsToDelete = configs.slice(1).map(config => config.id);
    console.log(`🗑️ حذف ${idsToDelete.length} سجلات:`, idsToDelete);
    
    const { error: deleteError } = await supabase
      .from('telegram_config')
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      console.error('❌ خطأ في حذف السجلات:', deleteError);
      return;
    }
    
    console.log('✅ تم حذف السجلات الزائدة بنجاح');
    
    // التحقق من النتيجة
    const { data: remainingConfigs, error: verifyError } = await supabase
      .from('telegram_config')
      .select('*');
    
    if (verifyError) {
      console.error('❌ خطأ في التحقق من النتيجة:', verifyError);
      return;
    }
    
    console.log(`✅ تم تنظيف الجدول، باقي ${remainingConfigs.length} سجل`);
    console.log('📋 السجل المتبقي:', remainingConfigs[0]);
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف الجدول:', error);
  }
}

cleanTelegramConfig().catch(console.error);
