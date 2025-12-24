/**
 * API Route: Financial SMS (Debt Reminder & Thank You)
 * 
 * معاون مالی می‌تواند:
 * 1. یادآوری بدهی به بدهکاران
 * 2. تشکر به خوش‌حساب‌ها
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const FinancialSmsSchema = z.object({
  type: z.enum(['debt_reminder', 'thank_you']),
  student_ids: z.array(z.string().uuid()).min(1),
  custom_message: z.string().max(300).optional()
})

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
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'financial_vp'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    // Validate input
    const body = await req.json()
    const validated = FinancialSmsSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: validated.error.issues },
        { status: 400 }
      )
    }

    const data = validated.data

    logger.info('Creating financial SMS', {
      context: 'notification-financial',
      type: data.type,
      count: data.student_ids.length,
      financial_vp_id: user.id
    })

    let queued = 0
    let skipped = 0

    for (const studentId of data.student_ids) {
      // Get student and parent info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          parent_id,
          school_id,
          profiles!students_parent_id_fkey (
            id,
            phone,
            full_name
          )
        `)
        .eq('id', studentId)
        .single()

      if (studentError || !student || !student.profiles) {
        skipped++
        continue
      }

      const parent = student.profiles
      if (!parent.phone) {
        skipped++
        continue
      }

      // Get financial data
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('amount, due_date, status')
        .eq('student_id', studentId)
        .eq('transaction_type', 'tuition')
        .order('created_at', { ascending: false })

      const studentName = `${student.first_name} ${student.last_name}`
      let smsText = ''
      let amount = 0
      let dueDate = null

      if (data.type === 'debt_reminder') {
        // Calculate debt
        const debt = transactions?.filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        if (debt === 0) {
          skipped++
          continue
        }

        amount = debt
        dueDate = transactions?.find(t => t.status === 'pending')?.due_date

        if (data.custom_message) {
          smsText = `💰 ${data.custom_message}\nhooshagar.com`
        } else {
          const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('fa-IR') : 'نامشخص'
          smsText = `💰 یادآوری پرداخت\nبدهی ${studentName}: ${debt.toLocaleString('fa-IR')} تومان\nمهلت: ${dueDateStr}\nپرداخت: hooshagar.com`
        }
      } else {
        // Thank you
        if (data.custom_message) {
          smsText = `🙏 ${data.custom_message}\nhooshagar.com`
        } else {
          smsText = `🙏 تشکر از شما\nپرداخت شهریه ${studentName} با موفقیت انجام شد.\nسپاسگزاریم.\nhooshagar.com`
        }
      }

      // Queue SMS (send immediately)
      const { error: insertError } = await supabase
        .from('financial_sms_queue')
        .insert({
          parent_id: parent.id,
          student_id: student.id,
          school_id: student.school_id,
          sms_type: data.type,
          amount: amount || null,
          due_date: dueDate,
          sms_text: smsText,
          scheduled_at: new Date().toISOString(),
          status: 'pending',
          created_by: user.id
        })

      if (insertError) {
        logger.error('Failed to queue financial SMS', {
          context: 'notification-financial',
          error: insertError.message,
          student_id: studentId
        })
        skipped++
      } else {
        queued++

        // Also create in-app notification
        await supabase.rpc('create_in_app_notification', {
          p_user_id: parent.id,
          p_title: data.type === 'debt_reminder' ? 'یادآوری پرداخت' : 'تشکر از پرداخت',
          p_message: smsText,
          p_type: 'financial',
          p_link_url: '/parent/financial'
        })
      }
    }

    logger.info('Financial SMS queued successfully', {
      context: 'notification-financial',
      queued,
      skipped
    })

    return NextResponse.json({
      success: true,
      queued,
      skipped
    })

  } catch (error: any) {
    logger.error('Error in financial SMS API', {
      context: 'notification-financial',
      error: error.message
    })
    Sentry.captureException(error, {
      tags: { feature: 'notification-financial' }
    })
    return NextResponse.json(
      { error: 'خطا در ارسال پیامک مالی' },
      { status: 500 }
    )
  }
}

