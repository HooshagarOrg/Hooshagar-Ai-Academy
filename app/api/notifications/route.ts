/**
 * API Route: In-App Notifications
 * 
 * GET: دریافت لیست اعلان‌ها
 * PATCH: خواندن اعلان
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('in_app_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      has_more: (count || 0) > offset + limit
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اعلان‌ها' },
      { status: 500 }
    )
  }
}

