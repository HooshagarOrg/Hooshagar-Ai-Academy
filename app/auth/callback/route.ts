import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // دریافت session و profile
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
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
  }

  // پیش‌فرض: به dashboard عمومی
  return NextResponse.redirect(new URL('/dashboard', request.url))
}





































































