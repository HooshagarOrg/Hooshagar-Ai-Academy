import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { PromotionResult } from '@/lib/types/academic.types'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const promoteSchema = z.object({
  academic_year_id: z.string().uuid(),
})

const ACADEMIC_YEAR_ROLES: AllowedRole[] = [...ADMIN_ROLES, 'principal']

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createServerClient()
        const body = await request.json()
        const { academic_year_id } = promoteSchema.parse(body)

        const { data, error } = await supabase.rpc('auto_promote_students', {
          p_academic_year_id: academic_year_id,
        })

        if (error) throw error

        const result = (data as PromotionResult[])[0]

        return NextResponse.json({
          success: true,
          data: result,
          message: `ارتقای خودکار با موفقیت انجام شد. ${result.promoted_count} نفر ارتقا یافتند و ${result.failed_count} نفر مردود شدند.`,
        })
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'داده‌های نامعتبر', details: error.errors },
            { status: 400 },
          )
        }
        const message = error instanceof Error ? error.message : 'خطای سرور'
        console.error('خطا در API ارتقا:', error)
        return NextResponse.json({ success: false, error: message }, { status: 500 })
      }
    },
    { roles: ACADEMIC_YEAR_ROLES, rateLimit: 'admin_action' },
  )
}
