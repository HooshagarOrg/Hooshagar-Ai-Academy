import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'

// ============================================
// GET: لیست پیام‌ها
// با پشتیبانی از: inbox / sent / conversation با کاربر مشخص
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') || 'inbox' // inbox | sent | conversation
      const withUser = searchParams.get('with')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

      let query = supabase
        .from('messages_direct')
        .select(`
          *,
          sender:profiles!messages_direct_sender_id_fkey(id, full_name, role),
          receiver:profiles!messages_direct_receiver_id_fkey(id, full_name, role)
        `)
        .order('created_at', { ascending: false })
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
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ messages: [], error: error.message })
      }

      // تعداد پیام‌های خوانده‌نشده
      const { count: unreadCount } = await supabase
        .from('messages_direct')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', ctx.userId)
        .eq('is_read', false)

      return NextResponse.json({
        messages: data || [],
        unread_count: unreadCount || 0,
      })
    },
    {}
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
      const { receiver_id, subject, content, parent_message_id } = body

      if (!receiver_id || !content) {
        return NextResponse.json({ error: 'گیرنده و متن پیام الزامی است' }, { status: 400 })
      }

      const supabase = await createClient()
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
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: data })
    },
    {}
  )
}

// ============================================
// PATCH: علامت‌گذاری به‌عنوان خوانده‌شده
// ============================================
export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const { message_id, mark_all_read } = body

      const supabase = await createClient()

      if (mark_all_read) {
        const { error } = await supabase
          .from('messages_direct')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('receiver_id', ctx.userId)
          .eq('is_read', false)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ success: true })
      }

      if (!message_id) return NextResponse.json({ error: 'شناسه پیام الزامی' }, { status: 400 })

      const { error } = await supabase
        .from('messages_direct')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', message_id)
        .eq('receiver_id', ctx.userId)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    {}
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
      if (!id) return NextResponse.json({ error: 'شناسه پیام الزامی' }, { status: 400 })

      const supabase = await createClient()
      const { error } = await supabase
        .from('messages_direct')
        .delete()
        .eq('id', id)
        .or(`sender_id.eq.${ctx.userId},receiver_id.eq.${ctx.userId}`)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    },
    {}
  )
}
