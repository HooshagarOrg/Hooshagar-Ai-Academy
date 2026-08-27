import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { withAuth } from '@/lib/security/api-guard'

const postSchema = z.object({
  receiver_id: z.string().uuid('گیرنده نامعتبر است'),
  content: z.string().trim().min(1, 'متن پیام الزامی است').max(5000),
  subject: z.string().trim().max(200).optional().nullable(),
  parent_message_id: z.string().uuid().optional().nullable(),
})

const patchSchema = z.object({
  message_id: z.string().uuid().optional(),
  mark_all_read: z.boolean().optional(),
  peer_id: z.string().uuid().optional(),
})

// ============================================
// GET: لیست پیام‌ها
// type: inbox | sent | all | conversation
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = ctx.supabase
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') || 'all'
      const withUser = searchParams.get('with')
      const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 200)

      let query = supabase
        .from('messages_direct')
        .select(`
          id,
          sender_id,
          receiver_id,
          subject,
          content,
          parent_message_id,
          is_read,
          read_at,
          created_at,
          sender:profiles!messages_direct_sender_id_fkey(id, full_name, role),
          receiver:profiles!messages_direct_receiver_id_fkey(id, full_name, role)
        `)
        .order('created_at', { ascending: type === 'conversation' })
        .limit(limit)

      if (type === 'inbox') {
        query = query.eq('receiver_id', ctx.userId)
      } else if (type === 'sent') {
        query = query.eq('sender_id', ctx.userId)
      } else if (type === 'conversation' && withUser) {
        query = query.or(
          `and(sender_id.eq.${ctx.userId},receiver_id.eq.${withUser}),` +
            `and(sender_id.eq.${withUser},receiver_id.eq.${ctx.userId})`
        )
      } else {
        // all
        query = query.or(`sender_id.eq.${ctx.userId},receiver_id.eq.${ctx.userId}`)
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ messages: [], error: error.message }, { status: 500 })
      }

      const { count: unreadCount } = await supabase
        .from('messages_direct')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', ctx.userId)
        .eq('is_read', false)

      return NextResponse.json({
        messages: data || [],
        unread_count: unreadCount || 0,
        current_user_id: ctx.userId,
      })
    },
    { rateLimit: 'api_default' }
  )
}

// ============================================
// POST: ارسال پیام
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const parsed = postSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر',
          },
          { status: 400 }
        )
      }

      const { receiver_id, content, subject, parent_message_id } = parsed.data
      if (receiver_id === ctx.userId) {
        return NextResponse.json({ error: 'نمی‌توانید به خودتان پیام بفرستید' }, { status: 400 })
      }

      const supabase = ctx.supabase

      // گیرنده باید در همان مدرسه باشد (در صورت امکان)
      if (ctx.schoolId) {
        const admin = createServiceClient()
        const { data: receiver } = await admin
          .from('profiles')
          .select('id, school_id')
          .eq('id', receiver_id)
          .maybeSingle()
        if (!receiver) {
          return NextResponse.json({ error: 'گیرنده یافت نشد' }, { status: 404 })
        }
        if (receiver.school_id && receiver.school_id !== ctx.schoolId) {
          return NextResponse.json({ error: 'ارسال پیام فقط داخل همان مدرسه مجاز است' }, { status: 403 })
        }
      }

      const { data, error } = await supabase
        .from('messages_direct')
        .insert({
          sender_id: ctx.userId,
          receiver_id,
          subject: subject || null,
          content,
          parent_message_id: parent_message_id || null,
          is_read: false,
        })
        .select(`
          id,
          sender_id,
          receiver_id,
          subject,
          content,
          is_read,
          created_at
        `)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: data })
    },
    { rateLimit: 'api_default' }
  )
}

// ============================================
// PATCH: علامت‌گذاری خوانده‌شده
// ============================================
export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const parsed = patchSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'داده‌های نامعتبر' }, { status: 400 })
      }

      const { message_id, mark_all_read, peer_id } = parsed.data
      const supabase = ctx.supabase
      const readAt = new Date().toISOString()

      if (mark_all_read) {
        const { error } = await supabase
          .from('messages_direct')
          .update({ is_read: true, read_at: readAt })
          .eq('receiver_id', ctx.userId)
          .eq('is_read', false)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      if (peer_id) {
        const { error } = await supabase
          .from('messages_direct')
          .update({ is_read: true, read_at: readAt })
          .eq('receiver_id', ctx.userId)
          .eq('sender_id', peer_id)
          .eq('is_read', false)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      if (!message_id) {
        return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 })
      }

      const { error } = await supabase
        .from('messages_direct')
        .update({ is_read: true, read_at: readAt })
        .eq('id', message_id)
        .eq('receiver_id', ctx.userId)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { rateLimit: 'api_default' }
  )
}

// ============================================
// DELETE: حذف پیام
// ============================================
export async function DELETE(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id || !z.string().uuid().safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 })
      }

      const supabase = ctx.supabase
      const { error } = await supabase
        .from('messages_direct')
        .delete()
        .eq('id', id)
        .or(`sender_id.eq.${ctx.userId},receiver_id.eq.${ctx.userId}`)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    { rateLimit: 'api_default' }
  )
}
