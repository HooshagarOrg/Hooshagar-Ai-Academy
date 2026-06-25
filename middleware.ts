import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseMiddlewareUrl } from '@/lib/supabase/resolve-url'
import {
  supabaseAuthCookieOptions,
  clearLegacyAuthCookies,
  LEGACY_SUPABASE_AUTH_COOKIES,
} from '@/lib/supabase/auth-cookie'

// ============================================
// تایپ‌ها
// ============================================
type UserRole =
  | 'admin'
  | 'platform_admin'
  | 'principal'
  | 'teacher'
  | 'parent'
  | 'student'
  | 'counselor'
  | 'health_vp'
  | 'educational_vp'
  | 'financial_vp'
  | 'disciplinary_vp'
  | 'evaluation_vp'
  | 'art_teacher'
  | 'sports_teacher'
  | 'secretary'
  | 'librarian'
  | 'security'
  | 'maintenance'

type EducationStage = 'preschool' | 'elementary' | 'middle_school' | 'high_school' | 'vocational' | 'technical'

// مسیرهایی که حداقل پایه تحصیلی نیاز دارند
const GRADE_RESTRICTED_ROUTES: Record<string, { min_grade: number; stages: EducationStage[] }> = {
  '/student/konkur':         { min_grade: 10, stages: ['high_school', 'vocational', 'technical'] },
  '/student/konkur-roadmap': { min_grade: 10, stages: ['high_school', 'vocational', 'technical'] },
  '/student/field-selection':{ min_grade: 9,  stages: ['middle_school', 'high_school', 'vocational', 'technical'] },
  '/student/future-compass': { min_grade: 8,  stages: ['middle_school', 'high_school', 'vocational', 'technical'] },
  '/student/ai-guidance':    { min_grade: 7,  stages: ['middle_school', 'high_school', 'vocational', 'technical'] },
}

// ============================================
// مسیرهای عمومی (بدون نیاز به احراز هویت)
// ============================================
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
]

// مسیرهایی که middleware نباید بررسی کند
const EXCLUDED_ROUTES = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/logo.png',
  '/images',
  '/videos',
  '/brand',
  '/fonts',
  '/templates',
  '/_vercel',
]

// ============================================
// تنظیم دسترسی نقش‌ها به مسیرها
// ============================================
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/admin':           ['admin', 'platform_admin'],
  '/principal':       ['principal', 'admin', 'platform_admin'],
  '/teacher':         ['teacher', 'principal', 'admin', 'platform_admin'],
  '/parent':          ['parent'],
  '/student':         ['student'],
  '/counselor':       ['counselor', 'principal', 'admin', 'platform_admin'],
  '/health-vp':       ['health_vp', 'principal', 'admin', 'platform_admin'],
  '/educational-vp':  ['educational_vp', 'principal', 'admin', 'platform_admin'],
  '/financial-vp':    ['financial_vp', 'principal', 'admin', 'platform_admin'],
  '/discipline-vp':   ['disciplinary_vp', 'principal', 'admin', 'platform_admin'],
  '/evaluation-vp':   ['evaluation_vp', 'principal', 'admin', 'platform_admin'],
  '/art-teacher':     ['art_teacher', 'principal', 'admin', 'platform_admin'],
  '/sports-teacher':  ['sports_teacher', 'principal', 'admin', 'platform_admin'],
  '/secretary':       ['secretary', 'principal', 'admin', 'platform_admin'],
  '/librarian':       ['librarian', 'principal', 'admin', 'platform_admin'],
  '/security':        ['security', 'principal', 'admin', 'platform_admin'],
  '/maintenance':     ['maintenance', 'principal', 'admin', 'platform_admin'],
  '/dashboard': [
    'admin', 'platform_admin', 'principal', 'teacher', 'parent', 'student',
    'counselor', 'health_vp', 'educational_vp', 'financial_vp', 'disciplinary_vp',
    'evaluation_vp', 'art_teacher', 'sports_teacher', 'secretary', 'librarian',
    'security', 'maintenance',
  ],
}

// ============================================
// هلپر: بررسی مسیرهای مستثنی
// ============================================
function isExcludedRoute(pathname: string): boolean {
  return EXCLUDED_ROUTES.some(
    (route) => pathname.startsWith(route) || pathname === route
  )
}

// ============================================
// هلپر: بررسی مسیرهای عمومی
// ============================================
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}?`)
  )
}

// ============================================
// هلپر: دریافت نقش‌های مجاز برای مسیر
// ============================================
function getAllowedRoles(pathname: string): UserRole[] | null {
  // بررسی مسیرهای دقیق
  for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return roles
    }
  }
  return null
}

// ============================================
// هلپر: دریافت URL پیش‌فرض بر اساس نقش
// ============================================
function getDefaultRouteForRole(role: UserRole): string {
  const roleRoutes: Record<UserRole, string> = {
    admin: '/admin',
    platform_admin: '/admin',
    principal: '/principal',
    teacher: '/teacher',
    parent: '/parent',
    student: '/student',
    counselor: '/counselor',
    health_vp: '/health-vp',
    educational_vp: '/educational-vp',
    financial_vp: '/financial-vp',
    disciplinary_vp: '/discipline-vp',
    evaluation_vp: '/evaluation-vp',
    art_teacher: '/art-teacher',
    sports_teacher: '/sports-teacher',
    secretary: '/secretary',
    librarian: '/librarian',
    security: '/security',
    maintenance: '/maintenance',
  }
  return roleRoutes[role] || '/dashboard'
}

// ============================================
// هلپر: بررسی محدودیت مقطع تحصیلی
// ============================================
function checkGradeRestriction(
  pathname: string,
  grade_level: number | null,
  education_stage: EducationStage | null
): boolean {
  for (const [route, restriction] of Object.entries(GRADE_RESTRICTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!grade_level || !education_stage) return false
      if (grade_level < restriction.min_grade) return false
      if (!restriction.stages.includes(education_stage)) return false
    }
  }
  return true
}

// ============================================
// Middleware اصلی
// ============================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. مسیرهای مستثنی - عبور بدون بررسی
  if (isExcludedRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. ایجاد Response برای مدیریت کوکی‌ها
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 3. ایجاد Supabase Client
  const supabase = createServerClient(
    getSupabaseMiddlewareUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseAuthCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 4. دریافت session از JWT کوکی — بدون network call به Auth API
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // حذف کوکی‌های legacy
  if (!user) {
    response = clearLegacyAuthCookies(response)
    for (const legacyName of LEGACY_SUPABASE_AUTH_COOKIES) {
      if (request.cookies.has(legacyName)) {
        response.cookies.set(legacyName, '', { path: '/', maxAge: 0 })
      }
    }
  }

  // استخراج role از JWT claims (user_metadata یا app_metadata)
  const jwtRole = (
    user?.user_metadata?.role ??
    user?.app_metadata?.role
  ) as UserRole | undefined

  // 5. مسیرهای عمومی - اگر لاگین است، redirect به داشبورد
  if (isPublicRoute(pathname)) {
    if (user && jwtRole) {
      const defaultRoute = getDefaultRouteForRole(jwtRole)
      return NextResponse.redirect(new URL(defaultRoute, request.url))
    }
    return response
  }

  // 6. مسیرهای محافظت شده - بررسی auth
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 7. تعیین نقش کاربر
  // اولویت: JWT claims → DB query (fallback)
  let userRole: UserRole
  let userId = user.id
  let schoolId: string | null = null

  if (jwtRole) {
    userRole = jwtRole
  } else {
    // fallback به DB (برای کاربرانی که role در JWT ندارند)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile?.role) {
      // نمی‌توان نقش را تعیین کرد — redirect به login
      return NextResponse.redirect(new URL('/login?error=profile_not_found', request.url))
    }
    userRole = profile.role as UserRole
    schoolId = profile.school_id ?? null
    userId = profile.id
  }

  // 8. Redirect از /dashboard به role-based dashboard
  if (pathname === '/dashboard') {
    const defaultRoute = getDefaultRouteForRole(userRole)
    return NextResponse.redirect(new URL(defaultRoute, request.url))
  }

  // 9. بررسی RBAC
  const allowedRoles = getAllowedRoles(pathname)

  if (allowedRoles !== null && !allowedRoles.includes(userRole)) {
    console.warn(`Access denied: ${userRole} tried to access ${pathname}`)
    const defaultRoute = getDefaultRouteForRole(userRole)
    if (pathname === defaultRoute) {
      return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
    }
    const redirectUrl = new URL(defaultRoute, request.url)
    redirectUrl.searchParams.set('error', 'access_denied')
    return NextResponse.redirect(redirectUrl)
  }

  // 10. بررسی محدودیت مقطع تحصیلی برای دانش‌آموزان
  if (userRole === 'student' && Object.keys(GRADE_RESTRICTED_ROUTES).some(r => pathname.startsWith(r))) {
    const { data: studentData } = await supabase
      .from('students')
      .select('grade, education_stage')
      .eq('user_id', user.id)
      .single()

    const gradeAllowed = checkGradeRestriction(
      pathname,
      studentData?.grade ?? null,
      (studentData?.education_stage ?? null) as EducationStage | null
    )

    if (!gradeAllowed) {
      const redirectUrl = new URL('/student', request.url)
      redirectUrl.searchParams.set('error', 'grade_not_allowed')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 11. افزودن headers برای استفاده در صفحات
  response.headers.set('x-user-role', userRole)
  response.headers.set('x-user-id', userId)
  if (schoolId) {
    response.headers.set('x-school-id', schoolId)
  }

  return response
}

// ============================================
// تنظیم matcher برای middleware
// ============================================
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mp4|webm|woff2)$).*)',
  ],
}

















































