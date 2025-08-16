import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fetch from 'node-fetch';

dotenv.config();

// إعداد Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// دالة لجلب إعدادات التيليجرام
async function getTelegramConfig() {
  try {
    const { data, error } = await supabase
      .from('telegram_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching Telegram config:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getTelegramConfig:', error);
    return null;
  }
}

// دالة لإرسال ملف إلى التيليجرام
async function sendTelegramFile(chatId, fileData, caption) {
  const config = await getTelegramConfig();
  
  if (!config || !config.is_enabled || !config.bot_token) {
    console.log('Telegram bot is disabled or not configured');
    return false;
  }

  try {
    const isImage = fileData.type.startsWith('image/');
    const endpoint = isImage ? 'sendPhoto' : 'sendDocument';

    console.log('🔄 إرسال ملف إلى التيليجرام:', {
      endpoint,
      fileName: fileData.name,
      fileType: fileData.type,
      isImage
    });

    // تحويل Base64 إلى Buffer
    const buffer = Buffer.from(fileData.data, 'base64');
    
    // إنشاء FormData لإرسال الملف
    const form = new FormData();
    
    form.append('chat_id', chatId);
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    
    // إضافة الملف
    const fileName = fileData.name || `file.${isImage ? 'jpg' : 'pdf'}`;
    form.append(isImage ? 'photo' : 'document', buffer, {
      filename: fileName,
      contentType: fileData.type
    });

    const response = await fetch(`https://api.telegram.org/bot${config.bot_token}/${endpoint}`, {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ تم إرسال الملف إلى التيليجرام بنجاح');
      return true;
    } else {
      console.error('❌ فشل في إرسال الملف إلى التيليجرام:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending Telegram file:', error);
    return false;
  }
}

// دالة لجلب الملف من قاعدة البيانات
async function getFileFromDatabase(fileUrl) {
  try {
    if (fileUrl.startsWith('base64://')) {
      const fileId = fileUrl.replace('base64://', '');
      
      // محاولة جلب الملف من file_attachments أولاً
      let { data: attachmentData, error } = await supabase
        .from('file_attachments')
        .select('file_data, file_type, file_name')
        .eq('id', fileId)
        .single();
      
      if (error || !attachmentData) {
        // محاولة جلب الملف من service_requests
        const { data: requestData, error: requestError } = await supabase
          .from('service_requests')
          .select('file_data, file_name')
          .eq('id', fileId)
          .single();
        
        if (requestError || !requestData || !requestData.file_data) {
          console.error('File not found in database');
          return null;
        }
        
        return {
          data: requestData.file_data,
          type: getFileTypeFromName(requestData.file_name),
          name: requestData.file_name
        };
      }
      
      return {
        data: attachmentData.file_data,
        type: attachmentData.file_type,
        name: attachmentData.file_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting file from database:', error);
    return null;
  }
}

// دالة لتحديد نوع الملف من اسمه
function getFileTypeFromName(fileName) {
  const fileNameLower = fileName.toLowerCase();
  if (fileNameLower.endsWith('.pdf')) {
    return 'application/pdf';
  } else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else if (fileNameLower.endsWith('.png')) {
    return 'image/png';
  } else if (fileNameLower.endsWith('.gif')) {
    return 'image/gif';
  } else if (fileNameLower.endsWith('.txt')) {
    return 'text/plain';
  } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
    return 'application/msword';
  }
  return 'application/octet-stream';
}

// دالة الاختبار الرئيسية
async function testFileUpload() {
  console.log('🧪 بدء اختبار إرسال الملفات...');
  
  // جلب إعدادات التيليجرام
  const config = await getTelegramConfig();
  if (!config) {
    console.error('❌ لم يتم العثور على إعدادات التيليجرام');
    return;
  }
  
  console.log('📋 إعدادات التيليجرام:', {
    hasBotToken: !!config.bot_token,
    hasChatId: !!config.admin_chat_id,
    isEnabled: config.is_enabled
  });
  
  // البحث عن ملف في قاعدة البيانات
  console.log('🔍 البحث عن ملفات في قاعدة البيانات...');
  
  // محاولة جلب ملف من file_attachments
  const { data: attachments, error: attachmentsError } = await supabase
    .from('file_attachments')
    .select('id, file_name, file_type')
    .limit(1);
  
  if (attachments && attachments.length > 0) {
    console.log('📎 تم العثور على ملف في file_attachments:', attachments[0]);
    
    const fileUrl = `base64://${attachments[0].id}`;
    const fileData = await getFileFromDatabase(fileUrl);
    
    if (fileData) {
      const caption = `🧪 اختبار إرسال ملف\n\n📎 ${fileData.name}\n⏰ ${new Date().toLocaleString('ar-SA')}`;
      
      const success = await sendTelegramFile(config.admin_chat_id, fileData, caption);
      
      if (success) {
        console.log('✅ تم اختبار إرسال الملف بنجاح!');
      } else {
        console.log('❌ فشل في اختبار إرسال الملف');
      }
    } else {
      console.log('❌ لم يتم العثور على بيانات الملف');
    }
  } else {
    console.log('📭 لم يتم العثور على ملفات في file_attachments');
    
    // محاولة جلب ملف من service_requests
    const { data: requests, error: requestsError } = await supabase
      .from('service_requests')
      .select('id, file_name')
      .not('file_data', 'is', null)
      .limit(1);
    
    if (requests && requests.length > 0) {
      console.log('📎 تم العثور على ملف في service_requests:', requests[0]);
      
      const fileUrl = `base64://${requests[0].id}`;
      const fileData = await getFileFromDatabase(fileUrl);
      
      if (fileData) {
        const caption = `🧪 اختبار إرسال ملف\n\n📎 ${fileData.name}\n⏰ ${new Date().toLocaleString('ar-SA')}`;
        
        const success = await sendTelegramFile(config.admin_chat_id, fileData, caption);
        
        if (success) {
          console.log('✅ تم اختبار إرسال الملف بنجاح!');
        } else {
          console.log('❌ فشل في اختبار إرسال الملف');
        }
      } else {
        console.log('❌ لم يتم العثور على بيانات الملف');
      }
    } else {
      console.log('📭 لم يتم العثور على ملفات في service_requests');
      console.log('💡 يرجى رفع ملف أولاً ثم تشغيل الاختبار مرة أخرى');
    }
  }
}

// تشغيل الاختبار
testFileUpload().catch(console.error);
