import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client-v2'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

export const maxDuration = 60

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * POST /api/ai/test — فقط ادمین (غیرفعال در production)
 */
export async function POST(req: NextRequest) {
  if (isProduction()) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }

  return withAuth(
    req,
    async (ctx) => {
      try {
        const body = await req.json()
        const { capability, prompt } = body

        if (!capability || !prompt) {
          return NextResponse.json(
            { error: 'فیلدهای capability و prompt الزامی هستند' },
            { status: 400 }
          )
        }

        const result = await callAI({
          capability,
          prompt,
          userId: ctx.userId,
        })

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          data: {
            content: result.content,
            model_used: result.model_used,
            tier_used: result.tier_used,
            tokens: result.tokens,
            response_time_ms: result.response_time_ms,
          },
        })
      } catch {
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES, rateLimit: 'ai_heavy' }
  )
}

/**
 * GET /api/ai/test — فقط ادمین
 */
export async function GET(req: NextRequest) {
  if (isProduction()) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }

  return withAuth(
    req,
    async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('ai_model_configs')
          .select('capability_key, capability_name, capability_description')
          .eq('is_active', true)
          .order('priority')

        if (error) throw error

        return NextResponse.json({ success: true, capabilities: data })
      } catch {
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES }
  )
}
