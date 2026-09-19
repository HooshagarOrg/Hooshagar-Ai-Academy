import { getRoleHomePath } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getDefaultRouteForRole(role: string): string {
  return getRoleHomePath(role)
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
        const defaultRoute = getDefaultRouteForRole(profile.role)
        return NextResponse.redirect(new URL(defaultRoute, request.url))
      }
    }
  }

  // پیش‌فرض: به dashboard عمومی
  return NextResponse.redirect(new URL('/dashboard', request.url))
}





































































