import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyRecaptcha } from '@/lib/recaptcha'
import rateLimit from '@/lib/rate-limit'

// Rate limiter: 5 تلاش در دقیقه
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // 1. Rate Limiting
    // ==========================================
    const userIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'anonymous'
    
    try {
      await limiter.check(5, userIP)
    } catch {
      console.warn('⚠️ Rate limit exceeded for IP:', userIP)
      return NextResponse.json(
        { 
          success: false, 
          error: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً ۱ دقیقه صبر کنید.' 
        },
        { status: 429 }
      )
    }
    
    // ==========================================
    // 2. Parse Request Body
    // ==========================================
    const { email, password, recaptcha_token } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      )
    }
    
    // ==========================================
    // 3. reCAPTCHA Verification
    // ==========================================
    if (!recaptcha_token) {
      console.warn('⚠️ No reCAPTCHA token provided')
      return NextResponse.json(
        { 
          success: false, 
          error: 'خطا در تأیید reCAPTCHA. لطفاً صفحه را رفرش کنید.' 
        },
        { status: 400 }
      )
    }
    
    const recaptchaResult = await verifyRecaptcha(recaptcha_token, 0.5)
    
    if (!recaptchaResult.success) {
      console.warn('❌ reCAPTCHA verification failed:', recaptchaResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'خطا در تأیید reCAPTCHA. لطفاً دوباره تلاش کنید.' 
        },
        { status: 400 }
      )
    }
    
    console.log('✅ reCAPTCHA verified with score:', recaptchaResult.score)
    console.log('📧 Login attempt:', email)
    
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // در API route ممکن است set کار نکند
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // در API route ممکن است remove کار نکند
            }
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ Login error:', error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    console.log('✅ Login successful!')
    
    return NextResponse.json({ 
      success: true,
      user: data.user
    })
    
  } catch (err: any) {
    console.error('💥 API error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'خطای سرور' },
      { status: 500 }
    )
  }
}
