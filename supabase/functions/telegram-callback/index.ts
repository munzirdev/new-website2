import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const callbackQuery = await req.json()
    console.log('🔔 Callback query received:', callbackQuery)

    // Get Telegram configuration
    const { data: config, error: configError } = await supabase
      .from('telegram_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError || !config?.is_enabled || !config?.bot_token || !config?.admin_chat_id) {
      console.error('❌ Telegram not configured:', configError)
      return new Response(
        JSON.stringify({ error: 'Telegram not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { callback_query } = callbackQuery
    if (!callback_query) {
      return new Response(
        JSON.stringify({ error: 'Invalid callback query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, message } = callback_query
    const [action, sessionId] = data.split(':')

    console.log('🔍 Processing callback:', { action, sessionId })

    let responseMessage = ''
    let success = false

    switch (action) {
      case 'mark_resolved':
        success = await updateRequestStatus(supabase, sessionId, 'resolved')
        responseMessage = success 
          ? '✅ تم تحديث حالة الطلب إلى "تم التعامل معه" بنجاح'
          : '❌ فشل في تحديث حالة الطلب'
        break

      case 'view_request':
        responseMessage = '📋 عرض تفاصيل الطلب...'
        success = true
        break

      case 'contact_user':
        responseMessage = '📞 التواصل مع العميل...'
        success = true
        break

      default:
        responseMessage = '❌ إجراء غير معروف'
        success = false
    }

    // Answer callback query
    const answerResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callback_query.id,
        text: responseMessage,
        show_alert: true
      })
    })

    const answerResult = await answerResponse.json()
    
    if (!answerResult.ok) {
      console.error('❌ Failed to answer callback query:', answerResult)
    }

    // If marking as resolved, update the message
    if (action === 'mark_resolved' && success) {
      const updatedText = message.text + '\n\n✅ <b>تم التعامل مع هذا الطلب</b>'
      
      const editResponse = await fetch(`https://api.telegram.org/bot${config.bot_token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: callback_query.message.chat.id,
          message_id: callback_query.message.message_id,
          text: updatedText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '✅ تم التعامل معه', 
                  callback_data: `already_resolved:${sessionId}` 
                }
              ]
            ]
          }
        })
      })

      const editResult = await editResponse.json()
      if (!editResult.ok) {
        console.error('❌ Failed to edit message:', editResult)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Callback processed successfully',
        action,
        sessionId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Callback error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Function to update request status in database
async function updateRequestStatus(supabase: any, sessionId: string, status: string): Promise<boolean> {
  try {
    console.log('🔄 Updating request status:', { sessionId, status })

    // Try to update health insurance request first
    let { error: healthError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('id', sessionId)

    if (!healthError) {
      console.log('✅ Health insurance request status updated')
      return true
    }

    // If not found in health insurance, try service requests
    let { error: serviceError } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', sessionId)

    if (!serviceError) {
      console.log('✅ Service request status updated')
      return true
    }

    // If not found in service requests, try voluntary return forms
    let { error: voluntaryError } = await supabase
      .from('voluntary_return_forms')
      .update({ status })
      .eq('id', sessionId)

    if (!voluntaryError) {
      console.log('✅ Voluntary return form status updated')
      return true
    }

    // If not found in any table, try to find by session_id or other identifiers
    let { error: genericError } = await supabase
      .from('health_insurance_requests')
      .update({ status })
      .eq('session_id', sessionId)

    if (!genericError) {
      console.log('✅ Request status updated by session_id')
      return true
    }

    console.error('❌ Could not find request to update:', { sessionId, status })
    return false

  } catch (error) {
    console.error('❌ Error updating request status:', error)
    return false
  }
}
