/**
 * هوشاگر - Send Weekly SMS
 * 
 * این Edge Function هر ساعت (8-14) اجرا می‌شود
 * و پیامک‌های آماده در صف را ارسال می‌کند
 * 
 * محدودیت‌ها:
 * - فقط در ساعت اداری (8 صبح تا 2 بعدازظهر)
 * - Rate limiting: 1 پیامک در ثانیه
 * - Batch size: 50 پیامک در هر اجرا
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY')!
    const KAVENEGAR_SENDER = Deno.env.get('KAVENEGAR_SENDER') || '10008663'
    const BATCH_SIZE = 50

    console.log('📤 Starting SMS sending...')

    // Check office hours (8-14 Tehran time)
    const now = new Date()
    const tehranTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }))
    const currentHour = tehranTime.getHours()

    if (currentHour < 8 || currentHour >= 14) {
      console.log(`⏸ Outside office hours (${currentHour}:00). Skipping.`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Outside office hours (8-14)',
          current_hour: currentHour 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get pending SMS
    const { data: smsQueue, error: fetchError } = await supabase
      .from('weekly_sms_queue')
      .select(`
        id,
        parent_id,
        student_id,
        sms_text,
        sms_tone,
        scheduled_at,
        retry_count,
        profiles!parent_id (
          id,
          phone,
          full_name
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .limit(BATCH_SIZE)

    if (fetchError) throw fetchError

    console.log(`📊 Found ${smsQueue?.length || 0} SMS to send`)

    let sent = 0
    let failed = 0

    for (const sms of smsQueue || []) {
      const startTime = Date.now()

      // Update to sending
      await supabase
        .from('weekly_sms_queue')
        .update({ status: 'sending' })
        .eq('id', sms.id)

      try {
        const phoneNumber = sms.profiles.phone

        if (!phoneNumber) {
          throw new Error('Phone number not found')
        }

        // Send via Kavenegar
        const response = await fetch(
          `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/sms/send.json`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              receptor: phoneNumber,
              message: sms.sms_text,
              sender: KAVENEGAR_SENDER
            })
          }
        )

        const result = await response.json()
        const deliveryTime = Date.now() - startTime

        if (result.return?.status === 200 && result.entries?.length > 0) {
          const entry = result.entries[0]
          const messageId = entry.messageid

          // Update to sent
          await supabase
            .from('weekly_sms_queue')
            .update({
              status: 'sent',
              sent_at: now.toISOString(),
              delivery_status: 'delivered',
              provider_message_id: messageId.toString()
            })
            .eq('id', sms.id)

          // Log delivery
          await supabase
            .from('sms_delivery_log')
            .insert({
              related_queue_id: sms.id,
              related_queue_type: 'weekly',
              user_id: sms.parent_id,
              phone_number: phoneNumber,
              sms_text: sms.sms_text,
              sms_type: `weekly_${sms.sms_tone}`,
              provider_name: 'kavenegar',
              provider_response: result,
              delivery_time_ms: deliveryTime,
              cost: entry.cost || 0,
              status: 'delivered'
            })

          // Update preferences stats
          await supabase.rpc('increment_sms_count', {
            p_user_id: sms.parent_id
          })

          sent++
          console.log(`✅ SMS sent to ${phoneNumber} (${deliveryTime}ms)`)
        } else {
          throw new Error(result.return?.message || 'Unknown Kavenegar error')
        }
      } catch (error: any) {
        console.error(`❌ Failed to send SMS ${sms.id}:`, error.message)

        // Update to failed or retry
        const newRetryCount = (sms.retry_count || 0) + 1
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending'

        await supabase
          .from('weekly_sms_queue')
          .update({
            status: newStatus,
            error_message: error.message,
            retry_count: newRetryCount
          })
          .eq('id', sms.id)

        // Log failed delivery
        await supabase
          .from('sms_delivery_log')
          .insert({
            related_queue_id: sms.id,
            related_queue_type: 'weekly',
            user_id: sms.parent_id,
            phone_number: sms.profiles.phone || 'unknown',
            sms_text: sms.sms_text,
            sms_type: `weekly_${sms.sms_tone}`,
            provider_name: 'kavenegar',
            status: 'failed',
            error_message: error.message
          })

        failed++
      }

      // Rate limiting: 1 SMS per second
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`✅ Sent: ${sent}, Failed: ${failed}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        failed,
        office_hour: currentHour
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

