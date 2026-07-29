import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'
import { uploadToArvan, generateSchoolLogoPath } from '@/lib/arvan-storage'
import { getSupabaseServerUrl } from '@/lib/supabase/resolve-url'

const BRANDING_ROLES: AllowedRole[] = [...ADMIN_ROLES, 'principal']

const updateSchema = z.object({
  school_id: z.string().uuid(),
  settings: z.record(z.unknown()),
})

async function resolveSchoolId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requested?: string | null
): Promise<string | null> {
  if (requested) return requested
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', userId)
    .maybeSingle()
  return profile?.school_id ?? null
}

/**
 * GET /api/admin/school-branding?school_id=
 * خواندن برای هر کاربر احراز‌هویت‌شده (مدرسهٔ خودش)
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = await createClient()
    const schoolId = await resolveSchoolId(
      supabase,
      ctx.userId,
      new URL(request.url).searchParams.get('school_id')
    )
    if (!schoolId) {
      return NextResponse.json({ error: 'مدرسه مشخص نشده است' }, { status: 400 })
    }

    // غیر ادمین فقط مدرسهٔ خودش را ببیند
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('id', ctx.userId)
      .maybeSingle()

    const isAdmin = profile?.role && ADMIN_ROLES.includes(profile.role as AllowedRole)
    if (!isAdmin && profile?.school_id && profile.school_id !== schoolId) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { data, error } = await supabase.rpc('get_school_branding', {
      p_school_id: schoolId,
    })

    if (error) {
      console.error('[school-branding GET]', error.message)
      return NextResponse.json({ error: 'دریافت برندینگ ناموفق بود' }, { status: 500 })
    }

    return NextResponse.json({ success: true, school_id: schoolId, branding: data })
  })
}

/**
 * PATCH /api/admin/school-branding
 */
export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const parsed = updateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: parsed.error.issues },
          { status: 400 }
        )
      }

      const supabase = await createClient()
      const schoolId = await resolveSchoolId(supabase, ctx.userId, parsed.data.school_id)
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نشده است' }, { status: 400 })
      }

      const { data, error } = await supabase.rpc('update_school_branding', {
        p_school_id: schoolId,
        p_settings: parsed.data.settings,
      })

      if (error) {
        // platform_admin ممکن است school_id نداشته باشد — به‌روزرسانی مستقیم با service role
        if (ctx.role === 'platform_admin' || ctx.role === 'admin') {
          const admin = createAdminClient(
            getSupabaseServerUrl(),
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
          const s = parsed.data.settings as Record<string, unknown>
          const { error: updErr } = await admin
            .from('schools')
            .update({
              name: s.name as string | undefined,
              description: s.description as string | undefined,
              logo_url: (s.logo_url as string | null | undefined) ?? undefined,
              favicon_url: (s.favicon_url as string | null | undefined) ?? undefined,
              primary_color: s.primary_color as string | undefined,
              secondary_color: s.secondary_color as string | undefined,
              text_color: s.text_color as string | undefined,
              background_color: s.background_color as string | undefined,
              show_name_in_header: s.show_name_in_header as boolean | undefined,
              show_name_in_sidebar: s.show_name_in_sidebar as boolean | undefined,
              show_name_in_login: s.show_name_in_login as boolean | undefined,
              logo_size_in_sidebar: s.logo_size_in_sidebar as string | undefined,
              footer_text: s.footer_text as string | undefined,
              phone: s.phone as string | undefined,
              email: s.email as string | undefined,
              website: s.website as string | undefined,
              address: s.address as string | undefined,
              postal_code: s.postal_code as string | undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', schoolId)
          if (updErr) {
            console.error('[school-branding PATCH admin]', updErr.message)
            return NextResponse.json({ error: 'ذخیره برندینگ ناموفق بود' }, { status: 500 })
          }
          return NextResponse.json({ success: true, updated: true })
        }
        console.error('[school-branding PATCH]', error.message)
        return NextResponse.json({ error: 'ذخیره برندینگ ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ success: true, updated: data })
    },
    { roles: BRANDING_ROLES }
  )
}

/**
 * POST /api/admin/school-branding — آپلود لوگو به آروان
 * multipart: school_id, file
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const form = await request.formData()
      const schoolIdRaw = form.get('school_id')
      const file = form.get('file')

      if (typeof schoolIdRaw !== 'string' || !(file instanceof File)) {
        return NextResponse.json({ error: 'school_id و file الزامی است' }, { status: 400 })
      }

      const supabase = await createClient()
      const schoolId = await resolveSchoolId(supabase, ctx.userId, schoolIdRaw)
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نشده است' }, { status: 400 })
      }

      if (file.size > 1 * 1024 * 1024) {
        return NextResponse.json({ error: 'حداکثر حجم لوگو ۱ مگابایت است' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const path = generateSchoolLogoPath(schoolId)
      const uploaded = await uploadToArvan(buffer, path, file.type || 'image/png')
      if (!uploaded.success || !uploaded.url) {
        return NextResponse.json(
          { error: uploaded.error ?? 'آپلود لوگو ناموفق بود' },
          { status: 500 }
        )
      }

      const { error } = await supabase.rpc('update_school_branding', {
        p_school_id: schoolId,
        p_settings: { logo_url: uploaded.url },
      })

      if (error) {
        console.error('[school-branding logo]', error.message)
        return NextResponse.json({ error: 'ذخیره آدرس لوگو ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ success: true, url: uploaded.url, path: uploaded.path })
    },
    { roles: BRANDING_ROLES }
  )
}
