import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

/** DELETE — پاک‌سازی cache پاسخ‌های AI (فقط ادمین) */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient()

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
  }, { roles: ADMIN_ROLES })
}
