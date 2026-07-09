import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { AcademicYear, CreateAcademicYearInput } from '@/lib/types/academic.types'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ACADEMIC_YEAR_ROLES: AllowedRole[] = [...ADMIN_ROLES, 'principal']

const createYearSchema = z.object({
  year_name: z.string().min(7).max(9).regex(/^\d{4}-\d{4}$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  auto_promotion_enabled: z.boolean().default(true),
  auto_promotion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createServerClient()
        const { data: years, error } = await supabase
          .from('academic_years')
          .select('*')
          .order('start_date', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          data: years as AcademicYear[],
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'خطای سرور'
        console.error('خطا در دریافت سال‌های تحصیلی:', error)
        return NextResponse.json({ success: false, error: message }, { status: 500 })
      }
    },
    { roles: ACADEMIC_YEAR_ROLES, rateLimit: 'api_default' },
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createServerClient()
        const body = await request.json()
        const validated = createYearSchema.parse(body) as CreateAcademicYearInput

        const { data: newYear, error } = await supabase
          .from('academic_years')
          .insert([validated])
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          data: newYear as AcademicYear,
          message: 'سال تحصیلی با موفقیت ایجاد شد',
        })
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'داده‌های نامعتبر', details: error.errors },
            { status: 400 },
          )
        }
        const message = error instanceof Error ? error.message : 'خطای سرور'
        console.error('خطا در ایجاد سال تحصیلی:', error)
        return NextResponse.json({ success: false, error: message }, { status: 500 })
      }
    },
    { roles: ACADEMIC_YEAR_ROLES, rateLimit: 'admin_action' },
  )
}
