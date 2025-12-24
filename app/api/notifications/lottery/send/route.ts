/**
 * API Route: Send Lottery Result SMS
 * 
 * وقتی قرعه‌کشی تمام شد، این API نتایج را به خانواده‌ها پیامک می‌کند
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      )
    }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { lottery_id } = body

    if (!lottery_id) {
      return NextResponse.json(
        { error: 'lottery_id الزامی است' },
        { status: 400 }
      )
    }

    logger.info('Starting lottery SMS generation', {
      context: 'notification-lottery',
      lottery_id,
      admin_id: user.id
    })

    // Get lottery results
    const { data: results, error: resultsError } = await supabase
      .from('class_registrations')
      .select(`
        id,
        student_id,
        status,
        assigned_class_id,
        students!inner (
          id,
          first_name,
          last_name,
          parent_id,
          profiles!students_parent_id_fkey (
            id,
            phone,
            full_name
          )
        ),
        classes (
          name
        )
      `)
      .eq('lottery_id', lottery_id)
      .in('status', ['accepted', 'rejected', 'waitlist'])

    if (resultsError) throw resultsError

    let queued = 0
    let skipped = 0

    for (const result of results || []) {
      const student = result.students
      const parent = student.profiles

      if (!parent || !parent.phone) {
        skipped++
        continue
      }

      // Check if already queued
      const { data: existing } = await supabase
        .from('lottery_sms_queue')
        .select('id')
        .eq('lottery_id', lottery_id)
        .eq('parent_id', parent.id)
        .eq('student_id', student.id)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      // Generate SMS text
      const studentName = `${student.first_name} ${student.last_name}`
      let smsText = ''

      if (result.status === 'accepted') {
        const className = result.classes?.name || 'کلاس مشخص نشده'
        smsText = `🎉 نتیجه قرعه‌کشی\n${studentName} در کلاس ${className} پذیرفته شد.\nمشاهده: hooshagar.com`
      } else if (result.status === 'waitlist') {
        smsText = `⏳ نتیجه قرعه‌کشی\n${studentName} در لیست انتظار قرار گرفت.\nمشاهده: hooshagar.com`
      } else {
        smsText = `📋 نتیجه قرعه‌کشی\nمتأسفانه ${studentName} در این دوره پذیرفته نشد.\nاطلاعات بیشتر: hooshagar.com`
      }

      // Queue SMS (send immediately)
      const { error: insertError } = await supabase
        .from('lottery_sms_queue')
        .insert({
          lottery_id,
          parent_id: parent.id,
          student_id: student.id,
          result_type: result.status,
          assigned_class_name: result.classes?.name,
          sms_text: smsText,
          scheduled_at: new Date().toISOString(), // Send now
          status: 'pending'
        })

      if (insertError) {
        logger.error('Failed to queue lottery SMS', {
          context: 'notification-lottery',
          error: insertError.message,
          parent_id: parent.id
        })
      } else {
        queued++

        // Also create in-app notification
        await supabase.rpc('create_in_app_notification', {
          p_user_id: parent.id,
          p_title: 'نتیجه قرعه‌کشی',
          p_message: `نتیجه قرعه‌کشی ${studentName} اعلام شد.`,
          p_type: 'lottery',
          p_link_url: '/parent/lottery'
        })
      }
    }

    logger.info('Lottery SMS queued successfully', {
      context: 'notification-lottery',
      queued,
      skipped
    })

    return NextResponse.json({
      success: true,
      queued,
      skipped
    })

  } catch (error: any) {
    logger.error('Error in lottery SMS API', {
      context: 'notification-lottery',
      error: error.message
    })
    Sentry.captureException(error, {
      tags: { feature: 'notification-lottery' }
    })
    return NextResponse.json(
      { error: 'خطا در ارسال پیامک قرعه‌کشی' },
      { status: 500 }
    )
  }
}

