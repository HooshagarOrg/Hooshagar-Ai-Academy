import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// خروج از حساب کاربری
// GET و POST هر دو پشتیبانی می‌شوند
// ============================================

async function handleLogout(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }

  // پاک کردن کوکی‌های Supabase
  const response = NextResponse.redirect(new URL('/login', request.url))

  // پاک کردن همه کوکی‌های مربوط به Supabase
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
  ]

  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    })
  })

  // پاک کردن همه کوکی‌های sb-*
  request.cookies.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
      })
    }
  })

  return response
}

export async function GET(request: NextRequest) {
  return handleLogout(request)
}

export async function POST(request: NextRequest) {
  return handleLogout(request)
}
