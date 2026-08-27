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
import { fetchAllPaged } from '@/lib/supabase/paginate'

/** سقف ردیف در هر رفت‌و‌برگشت — برودکست مدرسه‌گستر چند هزار گیرنده دارد. */
const INSERT_CHUNK_SIZE = 500
/** سقف شناسه در یک .in() تا طول URL از حد PostgREST نگذرد. */
const FILTER_CHUNK_SIZE = 300

function chunked<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const BroadcastSchema = z.object({
  title: z.string().min(3).max(255),
  message: z.string().min(10).max(500),
  target_role: z.enum(['parent', 'teacher', 'all']),
  target_grade: z.number().int().min(1).max(12).optional(),
  target_class_id: z.string().uuid().optional(),
  /** فاز A: پیامک برودکست غیرفعال — فقط اعلان داخل‌برنامه */
  send_sms: z.boolean().default(false),
  scheduled_at: z.string().datetime().optional()
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
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
    // فاز A: هرگز پیامک برودکست صف/ارسال نشود
    const sendSms = false
    if (validated.data.send_sms) {
      logger.info('Broadcast SMS requested but disabled in phase A', {
        context: 'notification-broadcast',
        admin_id: user.id,
      })
    }

    logger.info('Creating broadcast message', {
      context: 'notification-broadcast',
      admin_id: user.id,
      target_role: data.target_role,
      send_sms: sendSms,
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
    const buildRecipientQuery = () => {
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

      return query
    }

    // فیلتر پایه/کلاس فقط برای والدین — شناسه‌ها صفحه‌به‌صفحه خوانده می‌شوند
    let parentIdFilter: string[] | null = null
    if (data.target_role === 'parent' && (data.target_grade || data.target_class_id)) {
      const { data: students, error: studentsError } = await fetchAllPaged<{
        parent_id: string | null
      }>((from, to) => {
        let studentQuery = supabase
          .from('students')
          .select('parent_id')
          .eq('is_active', true)

        if (data.target_grade) {
          studentQuery = studentQuery.eq('grade', data.target_grade)
        } else if (data.target_class_id) {
          studentQuery = studentQuery.eq('class_id', data.target_class_id)
        }

        return studentQuery.range(from, to)
      })

      if (studentsError) throw new Error(studentsError)
      parentIdFilter = [
        ...new Set(students.map(s => s.parent_id).filter((id): id is string => Boolean(id))),
      ]
    }

    // خواندن گیرندگان: بدون صفحه‌بندی، سقف ۱۰۰۰ ردیفی PostgREST
    // برودکست مدرسه‌گستر را بی‌صدا نصف می‌کرد.
    const recipients: Array<{ id: string; phone: string | null; full_name: string | null }> = []
    const idChunks: Array<string[] | null> =
      parentIdFilter === null ? [null] : chunked(parentIdFilter, FILTER_CHUNK_SIZE)

    for (const idChunk of idChunks) {
      if (idChunk && idChunk.length === 0) continue
      const { data: page, error: pageError } = await fetchAllPaged<{
        id: string
        phone: string | null
        full_name: string | null
      }>((from, to) => {
        const query = buildRecipientQuery().range(from, to)
        return idChunk ? query.in('id', idChunk) : query
      })
      if (pageError) throw new Error(pageError)
      recipients.push(...page)
    }

    logger.info('Found recipients', {
      context: 'notification-broadcast',
      count: recipients.length
    })

    // Insert recipients (فقط برای اعلان داخلی — SMS صف نمی‌شود)
    const recipientRecords = recipients.map(recipient => ({
      broadcast_id: broadcast.id,
      user_id: recipient.id,
      phone_number: recipient.phone,
      status: 'cancelled',
    }))

    for (const chunk of chunked(recipientRecords, INSERT_CHUNK_SIZE)) {
      const { error: insertError } = await supabase
        .from('broadcast_recipients')
        .insert(chunk)

      if (insertError) throw insertError
    }

    // Update broadcast with counts
    await supabase
      .from('admin_broadcast_sms')
      .update({
        total_recipients: recipientRecords.length
      })
      .eq('id', broadcast.id)

    // Send in-app notifications immediately (یک RPC به‌ازای هر دسته)
    const recipientIds = recipients.map(r => r.id)
    for (const chunk of chunked(recipientIds, INSERT_CHUNK_SIZE)) {
      const { error: notifyError } = await supabase.rpc(
        'create_in_app_notifications_bulk',
        {
          p_user_ids: chunk,
          p_title: data.title,
          p_message: data.message,
          p_type: 'message',
          p_link_url: null,
        }
      )
      if (notifyError) throw notifyError
    }

    logger.info('Broadcast created successfully', {
      context: 'notification-broadcast',
      broadcast_id: broadcast.id,
      recipients: recipientRecords.length
    })

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
      recipients: recipientRecords.length,
      sms_enabled: false,
      message: 'اعلان داخل برنامه ارسال شد. پیامک گروهی فعلاً غیرفعال است.',
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
    const supabase = await createServerSupabaseClient()
    
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

