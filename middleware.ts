import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  | 'art_teacher'
  | 'sports_teacher'

interface UserProfile {
  id: string
  role: UserRole
  school_id: string | null
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
]

// مسیرهایی که middleware نباید بررسی کند
const EXCLUDED_ROUTES = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/_vercel',
]

// ============================================
// تنظیم دسترسی نقش‌ها به مسیرها
// ============================================
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // مدیر پلتفرم و ادمین
  '/admin': ['admin', 'platform_admin'],

  // مدیر مدرسه
  '/principal': ['principal', 'admin', 'platform_admin'],

  // معلم
  '/teacher': ['teacher', 'principal', 'admin', 'platform_admin'],

  // والدین
  '/parent': ['parent'],

  // دانش‌آموز
  '/student': ['student'],

  // مشاور
  '/counselor': ['counselor', 'principal', 'admin', 'platform_admin'],

  // معاون بهداشت
  '/health-vp': ['health_vp', 'principal', 'admin', 'platform_admin'],

  // معاون پرورشی
  '/educational-vp': ['educational_vp', 'principal', 'admin', 'platform_admin'],

  // معاون مالی
  '/financial-vp': ['financial_vp', 'principal', 'admin', 'platform_admin'],

  // معاون انضباطی
  '/disciplinary-vp': ['disciplinary_vp', 'principal', 'admin', 'platform_admin'],

  // معلم هنر
  '/art-teacher': ['art_teacher', 'principal', 'admin', 'platform_admin'],

  // معلم ورزش
  '/sports-teacher': ['sports_teacher', 'principal', 'admin', 'platform_admin'],

  // داشبورد عمومی - همه نقش‌ها دسترسی دارند
  '/dashboard': [
    'admin',
    'platform_admin',
    'principal',
    'teacher',
    'parent',
    'student',
    'counselor',
    'health_vp',
    'educational_vp',
    'financial_vp',
    'disciplinary_vp',
    'art_teacher',
    'sports_teacher',
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
    disciplinary_vp: '/disciplinary-vp',
    art_teacher: '/art-teacher',
    sports_teacher: '/sports-teacher',
  }
  return roleRoutes[role] || '/dashboard'
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 4. دریافت session کاربر
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 5. مسیرهای عمومی - اگر لاگین است، redirect به داشبورد مربوطه
  if (isPublicRoute(pathname)) {
    if (session) {
      // دریافت پروفایل کاربر
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role) {
        const defaultRoute = getDefaultRouteForRole(profile.role as UserRole)
        return NextResponse.redirect(new URL(defaultRoute, request.url))
      }
    }
    return response
  }

  // 6. مسیرهای محافظت شده - بررسی session
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 7. دریافت پروفایل کاربر
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, school_id')
    .eq('id', session.user.id)
    .single()

  // اگر پروفایل یافت نشد
  if (profileError || !profile) {
    console.error('Profile not found:', profileError)
    // خروج از حساب و redirect به login
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=profile_not_found', request.url))
  }

  const userProfile = profile as UserProfile
  const userRole = userProfile.role

  // 8. بررسی RBAC
  const allowedRoles = getAllowedRoles(pathname)

  if (allowedRoles !== null) {
    // اگر نقش کاربر در لیست مجاز نیست
    if (!allowedRoles.includes(userRole)) {
      console.warn(`Access denied: ${userRole} tried to access ${pathname}`)

      // redirect به داشبورد مربوط به نقش کاربر
      const defaultRoute = getDefaultRouteForRole(userRole)

      // جلوگیری از infinite loop
      if (pathname === defaultRoute) {
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
      }

      const redirectUrl = new URL(defaultRoute, request.url)
      redirectUrl.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 9. بررسی دسترسی مبتنی بر مدرسه (School-Based Access)
  // platform_admin به همه مدارس دسترسی دارد
  if (userRole !== 'platform_admin' && userRole !== 'admin') {
    // اگر کاربر school_id ندارد
    if (!userProfile.school_id) {
      console.warn(`User ${userProfile.id} has no school_id`)
      // اجازه دسترسی به داشبورد عمومی
      if (!pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(
          new URL('/dashboard?error=no_school_assigned', request.url)
        )
      }
    }

    // بررسی school_id در URL parameters (اگر وجود دارد)
    const schoolIdParam = request.nextUrl.searchParams.get('school_id')
    if (schoolIdParam && schoolIdParam !== userProfile.school_id) {
      console.warn(
        `School access denied: User school ${userProfile.school_id}, requested ${schoolIdParam}`
      )
      return NextResponse.redirect(
        new URL(`${pathname}?error=school_access_denied`, request.url)
      )
    }
  }

  // 10. افزودن headers برای استفاده در صفحات
  response.headers.set('x-user-role', userRole)
  response.headers.set('x-user-id', userProfile.id)
  if (userProfile.school_id) {
    response.headers.set('x-school-id', userProfile.school_id)
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}


















