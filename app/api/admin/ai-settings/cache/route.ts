import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** DELETE — پاک‌سازی cache پاسخ‌های AI (فقط ادمین) */
export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error, count } = await supabase
      .from('ai_response_cache')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    return NextResponse.json({
      success: true,
      deleted: count ?? 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Clear AI cache:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
