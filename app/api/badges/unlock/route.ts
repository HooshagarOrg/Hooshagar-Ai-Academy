import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, STAFF_ROLES, type AllowedRole } from '@/lib/security/api-guard'
import { logError, logInfo } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const unlockSchema = z.object({
  studentId: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  badgeId: z.string().uuid('شناسه نشان نامعتبر است'),
})

async function assertStudentAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: AllowedRole,
  userId: string,
  studentId: string,
): Promise<NextResponse | null> {
  if (role === 'student') {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (!student || student.id !== studentId) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }
    return null
  }

  if (role === 'parent') {
    const { data: child } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('parent_id', userId)
      .single()
    if (!child) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }
    return null
  }

  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  return null
}

/**
 * POST /api/badges/unlock
 * Unlock یک Badge برای دانش‌آموز (فقط خود دانش‌آموز، والد، یا staff)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (ctx) => {
    try {
      const body = await req.json()
      const { studentId, badgeId } = unlockSchema.parse(body)

      const supabase = await createClient()
      const accessDenied = await assertStudentAccess(supabase, ctx.role, ctx.userId, studentId)
      if (accessDenied) return accessDenied

      const { data, error } = await supabase.rpc('check_and_award_badge', {
        p_student_id: studentId,
        p_badge_id: badgeId,
      })

      if (error) {
        logError('Failed to unlock badge', error)
        Sentry.captureException(error, {
          tags: { action: 'badge_unlock', studentId, badgeId },
        })
        return NextResponse.json({ error: 'باز کردن نشان ناموفق بود' }, { status: 500 })
      }

      if (!data || !data.success) {
        return NextResponse.json(
          {
            success: false,
            message: data?.message || 'شرایط دریافت نشان برآورده نشده است',
          },
          { status: 400 },
        )
      }

      logInfo('Badge unlocked successfully', {
        studentId,
        badgeId,
        badgeName: data.badge?.name_fa,
      })

      return NextResponse.json({
        success: true,
        message: 'نشان با موفقیت دریافت شد! 🎉',
        badge: data.badge,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'داده‌های نامعتبر', details: error.errors }, { status: 400 })
      }
      logError('Badge unlock error', error)
      Sentry.captureException(error, { tags: { action: 'badge_unlock' } })
      return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
    }
  }, {})
}
