/**
 * API Route: Admin Broadcast SMS
 * 
 * ادمین می‌تواند پیامک موردی به گروهی از کاربران ارسال کند
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const BroadcastSchema = z.object({
  title: z.string().min(3).max(255),
  message: z.string().min(10).max(500),
  target_role: z.enum(['parent', 'teacher', 'all']),
  target_grade: z.number().int().min(1).max(12).optional(),
  target_class_id: z.string().uuid().optional(),
  send_sms: z.boolean().default(true),
  scheduled_at: z.string().datetime().optional()
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

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    // Validate input
    const body = await req.json()
    const validated = BroadcastSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: validated.error.issues },
        { status: 400 }
      )
    }

    const data = validated.data

    logger.info('Creating broadcast message', {
      context: 'notification-broadcast',
      admin_id: user.id,
      target_role: data.target_role
    })

    // Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('admin_broadcast_sms')
      .insert({
        admin_id: user.id,
        school_id: profile.school_id,
        target_role: data.target_role,
        target_grade: data.target_grade,
        target_class_id: data.target_class_id,
        title: data.title,
        message_text: data.message,
        status: data.scheduled_at ? 'scheduled' : 'sending',
        scheduled_at: data.scheduled_at || new Date().toISOString()
      })
      .select()
      .single()

    if (broadcastError) throw broadcastError

    // Get recipients based on filters
    let query = supabase
      .from('profiles')
      .select('id, phone, full_name')
      .eq('is_active', true)
      .not('phone', 'is', null)

    if (profile.school_id) {
      query = query.eq('school_id', profile.school_id)
    }

    if (data.target_role !== 'all') {
      query = query.eq('role', data.target_role)
    } else {
      query = query.in('role', ['parent', 'teacher'])
    }

    // Additional filters for parents
    if (data.target_role === 'parent' && (data.target_grade || data.target_class_id)) {
      // Need to join with students
      const { data: students } = await supabase
        .from('students')
        .select('parent_id')
        .eq('is_active', true)
        .then(res => {
          if (data.target_grade) {
            return supabase
              .from('students')
              .select('parent_id')
              .eq('is_active', true)
              .eq('grade', data.target_grade)
          }
          if (data.target_class_id) {
            return supabase
              .from('students')
              .select('parent_id')
              .eq('is_active', true)
              .eq('class_id', data.target_class_id)
          }
          return res
        })

      const parentIds = [...new Set(students?.map(s => s.parent_id).filter(Boolean))]
      query = query.in('id', parentIds)
    }

    const { data: recipients, error: recipientsError } = await query

    if (recipientsError) throw recipientsError

    logger.info('Found recipients', {
      context: 'notification-broadcast',
      count: recipients?.length || 0
    })

    // Insert recipients
    const recipientRecords = (recipients || []).map(recipient => ({
      broadcast_id: broadcast.id,
      user_id: recipient.id,
      phone_number: recipient.phone,
      status: 'pending'
    }))

    if (recipientRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('broadcast_recipients')
        .insert(recipientRecords)

      if (insertError) throw insertError
    }

    // Update broadcast with counts
    await supabase
      .from('admin_broadcast_sms')
      .update({
        total_recipients: recipientRecords.length
      })
      .eq('id', broadcast.id)

    // Send in-app notifications immediately
    for (const recipient of recipients || []) {
      await supabase.rpc('create_in_app_notification', {
        p_user_id: recipient.id,
        p_title: data.title,
        p_message: data.message,
        p_type: 'message',
        p_link_url: null
      })
    }

    logger.info('Broadcast created successfully', {
      context: 'notification-broadcast',
      broadcast_id: broadcast.id,
      recipients: recipientRecords.length
    })

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
      recipients: recipientRecords.length
    })

  } catch (error: any) {
    logger.error('Error in broadcast API', {
      context: 'notification-broadcast',
      error: error.message
    })
    Sentry.captureException(error, {
      tags: { feature: 'notification-broadcast' }
    })
    return NextResponse.json(
      { error: 'خطا در ارسال پیام گروهی' },
      { status: 500 }
    )
  }
}

// GET: List broadcasts
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 })
    }

    const { data: broadcasts } = await supabase
      .from('admin_broadcast_sms')
      .select('*, profiles!admin_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ broadcasts: broadcasts || [] })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    )
  }
}

