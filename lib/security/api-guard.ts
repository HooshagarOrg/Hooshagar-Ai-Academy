/**
 * API Guard — محافظ یکپارچه برای تمام API Routes
 * احراز هویت + نقش + Rate Limit را در یک wrapper انجام می‌دهد
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit, RATE_LIMIT_CONFIGS } from './rate-limiter'

// ============================================
// تایپ‌ها
// ============================================
export type AllowedRole =
  | 'platform_admin' | 'admin' | 'principal' | 'teacher' | 'parent' | 'student'
  | 'counselor' | 'health_vp' | 'educational_vp' | 'financial_vp' | 'disciplinary_vp'
  | 'evaluation_vp' | 'art_teacher' | 'sports_teacher' | 'secretary' | 'librarian'
  | 'security' | 'maintenance'

export interface AuthContext {
  userId: string
  role: AllowedRole
  schoolId: string | null
  email: string | null
}

export interface GuardOptions {
  /** نقش‌های مجاز (اگر خالی باشد، فقط احراز هویت بررسی می‌شود) */
  roles?: AllowedRole[]
  /** کلید rate limiting */
  rateLimit?: keyof typeof RATE_LIMIT_CONFIGS | null
  /** غیرفعال کردن rate limiting */
  skipRateLimit?: boolean
}

// ============================================
// تابع اصلی Guard
// ============================================
export async function withAuth(
  request: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
  options: GuardOptions = {}
): Promise<NextResponse> {
  // 1. Rate Limiting
  if (!options.skipRateLimit) {
    const scope = options.rateLimit || 'api_default'
    const rateLimitResponse = applyRateLimit(request, scope)
    if (rateLimitResponse) return rateLimitResponse
  }

  // 2. احراز هویت
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'احراز هویت الزامی است', error_code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // 3. دریافت پروفایل
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, school_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'پروفایل کاربر یافت نشد', error_code: 'PROFILE_NOT_FOUND' },
      { status: 403 }
    )
  }

  // 4. بررسی نقش
  if (options.roles && options.roles.length > 0) {
    if (!options.roles.includes(profile.role as AllowedRole)) {
      return NextResponse.json(
        {
          error: 'دسترسی غیرمجاز',
          error_code: 'FORBIDDEN',
          required_roles: options.roles,
        },
        { status: 403 }
      )
    }
  }

  // 5. اجرای handler
  const ctx: AuthContext = {
    userId: user.id,
    role: profile.role as AllowedRole,
    schoolId: profile.school_id ?? null,
    email: profile.email ?? user.email ?? null,
  }

  return handler(ctx)
}

// ============================================
// هلپرهای از پیش تعریف‌شده برای نقش‌های رایج
// ============================================
export const ADMIN_ROLES: AllowedRole[] = ['admin', 'platform_admin']
export const STAFF_ROLES: AllowedRole[] = [
  'admin', 'platform_admin', 'principal', 'teacher',
  'counselor', 'health_vp', 'educational_vp', 'financial_vp',
  'disciplinary_vp', 'evaluation_vp', 'art_teacher', 'sports_teacher',
  'secretary', 'librarian', 'security', 'maintenance',
]
export const TEACHER_AND_ABOVE: AllowedRole[] = [
  'teacher', 'principal', 'admin', 'platform_admin',
]

// ============================================
// error Response استاندارد
// ============================================
export function errorResponse(
  message: string,
  status: number,
  code?: string,
  details?: unknown
): NextResponse {
  const body: Record<string, unknown> = { error: message }
  if (code) body.error_code = code
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}

export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
