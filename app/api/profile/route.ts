import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { isUiTheme } from '@/lib/theme/constants'
import { invalidateProfileCache } from '@/lib/cache/profile-cache'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { data, error } = await ctx.supabase
        .from('profiles')
        .select('full_name, email, role, school_id, ui_theme')
        .eq('id', ctx.userId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'دریافت پروفایل ناموفق بود' }, { status: 500 })
      }

      let school_name: string | null = null
      if (data.school_id) {
        const { data: school } = await ctx.supabase
          .from('schools')
          .select('name')
          .eq('id', data.school_id)
          .single()
        school_name = school?.name ?? null
      }

      return NextResponse.json({
        full_name: data.full_name,
        email: data.email ?? ctx.email,
        role: data.role,
        school_name,
        ui_theme: isUiTheme(data.ui_theme) ? data.ui_theme : 'dark',
      })
    },
    { skipRateLimit: false },
  )
}

const patchSchema = z.object({
  ui_theme: z.enum(['light', 'warm', 'dark']),
})

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const parsed = patchSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'داده نامعتبر', details: parsed.error.issues }, { status: 400 })
      }

      const { error } = await ctx.supabase
        .from('profiles')
        .update({ ui_theme: parsed.data.ui_theme })
        .eq('id', ctx.userId)

      if (error) {
        return NextResponse.json({ error: 'ذخیره تم ناموفق بود' }, { status: 500 })
      }

      await invalidateProfileCache(ctx.userId)

      return NextResponse.json({ success: true, ui_theme: parsed.data.ui_theme })
    },
    { skipRateLimit: false },
  )
}
