/**
 * API Route: ارسال پیامک
 * POST /api/sms/send
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { sendSMS } from '@/lib/kavenegar'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت ناموفق' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      recipients, // array of {phone, name, student_id}
      message,
      template_id,
      scheduled_at
    } = body

    // بررسی دسترسی
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'platform_admin', 'principal', 'teacher', 'financial_vp'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    // بررسی محدودیت روزانه
    const { data: settings } = await supabase
      .from('school_sms_settings')
      .select('daily_sms_limit, monthly_sms_budget')
      .eq('school_id', profile.school_id)
      .single()

    // شمارش پیامک‌های امروز
    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount } = await supabase
      .from('sms_logs')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .gte('created_at', today)

    if (settings && todayCount && todayCount >= settings.daily_sms_limit) {
      return NextResponse.json(
        { success: false, error: `محدودیت روزانه (${settings.daily_sms_limit} پیامک) به پایان رسیده` },
        { status: 429 }
      )
    }

    const results = []
    const errors = []

    for (const recipient of recipients) {
      try {
        let finalMessage = message

        // جایگزینی متغیرها
        if (recipient.student_id && message.includes('{')) {
          const { data: replacedMessage } = await supabase.rpc('replace_sms_variables', {
            p_template: message,
            p_student_id: recipient.student_id
          })
          finalMessage = replacedMessage || message
        }

        // ارسال فوری یا زمان‌بندی شده
        let smsStatus = 'pending'
        let providerMessageId = null
        let providerStatus = null
        let sentAt = null

        if (!scheduled_at) {
          // ارسال فوری
          const smsResult = await sendSMS(recipient.phone, finalMessage)
          
          if (smsResult.success) {
            smsStatus = 'sent'
            providerMessageId = smsResult.messageId
            providerStatus = smsResult.status
            sentAt = new Date().toISOString()
          } else {
            smsStatus = 'failed'
            errors.push({
              phone: recipient.phone,
              error: smsResult.error
            })
          }
        }

        // ثبت لاگ
        const { data: log, error: logError } = await supabase
          .from('sms_logs')
          .insert({
            school_id: profile.school_id,
            sent_by: user.id,
            recipient_phone: recipient.phone,
            recipient_name: recipient.name,
            recipient_type: 'parent',
            student_id: recipient.student_id || null,
            message: finalMessage,
            template_id: template_id || null,
            status: smsStatus,
            cost: 200, // هزینه تقریبی هر پیامک (200 تومان)
            provider: 'kavenegar',
            provider_message_id: providerMessageId,
            provider_status: providerStatus,
            scheduled_at: scheduled_at || null,
            sent_at: sentAt
          })
          .select()
          .single()

        if (!logError) {
          results.push({
            phone: recipient.phone,
            status: smsStatus,
            log_id: log.id
          })
        }

        // بروزرسانی شمارنده الگو
        if (template_id && smsStatus !== 'failed') {
          await supabase.rpc('increment', {
            table_name: 'sms_templates',
            column_name: 'usage_count',
            row_id: template_id
          })
        }

      } catch (err: any) {
        console.error('خطا در ارسال پیامک:', err)
        errors.push({
          phone: recipient.phone,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: scheduled_at 
        ? 'پیامک‌ها برای ارسال زمان‌بندی شدند'
        : `${results.filter(r => r.status === 'sent').length} پیامک ارسال شد`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      total: recipients.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: errors.length
    })

  } catch (error) {
    console.error('❌ Error in SMS send:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

