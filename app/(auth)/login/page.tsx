'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User, Smartphone, GraduationCap, Shield,
  Loader2, Eye, EyeOff, KeyRound,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TermsAcceptanceNotice } from '@/components/auth/terms-acceptance-notice'
import { TurnstileWidget } from '@/components/auth/turnstile-widget'
import { createClient } from '@/lib/supabase/client'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [activeTab, setActiveTab] = useState('staff')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const roleRoutes: Record<string, string> = {
    parent: '/parent',
    teacher: '/teacher',
    principal: '/principal',
    student: '/student',
    admin: '/admin',
    platform_admin: '/admin',
    counselor: '/counselor',
    health_vp: '/health-vp',
    educational_vp: '/educational-vp',
    financial_vp: '/financial-vp',
    disciplinary_vp: '/discipline-vp',
    evaluation_vp: '/evaluation-vp',
  }

  const redirectByRole = (role?: string, mustChange?: boolean) => {
    if (mustChange) {
      window.location.replace('/change-password')
      return
    }
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    window.location.replace(redirect || roleRoutes[role || ''] || '/dashboard')
  }

  const handleLoginApiError = (data: {
    error?: string
    error_code?: string
    require_captcha?: boolean
  }): void => {
    if (data.require_captcha && TURNSTILE_SITE_KEY) {
      setRequireCaptcha(true)
      setCaptchaToken(null)
    }
    toast.error(data.error || 'ورود ناموفق بود')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'session_expired') {
      toast.message('نشست شما منقضی شده. لطفاً دوباره وارد شوید.')
    }
    const legacyCookies = [
      'sb-hooshagar-supabase-proxy-auth-token',
      'sb-qcplgczxdbjsjrorkprm-auth-token',
    ]
    legacyCookies.forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0`
    })
  }, [])

  // ==========================================
  // ورود با کد ۱۰ رقمی (کد ملی / موبایل) + رمز — از API سرور
  // ==========================================
  const handleCodeLogin = async (
    loginCode: string,
    password: string,
  ) => {
    if (requireCaptcha && TURNSTILE_SITE_KEY && !captchaToken) {
      toast.error('لطفاً تأیید امنیتی را کامل کنید')
      return false
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        method: 'login_code',
        login_code: loginCode,
        password,
        captcha_token: captchaToken || undefined,
      }),
    })
    const data = await response.json() as {
      success?: boolean
      error?: string
      error_code?: string
      require_captcha?: boolean
      role?: string
      must_change_password?: boolean
      full_name?: string
      redirect?: string
    }

    if (!response.ok || !data.success) {
      handleLoginApiError(data)
      return false
    }

    toast.success(`خوش آمدید! ${data.full_name || ''}`)
    if (data.redirect) {
      window.location.replace(data.redirect)
    } else {
      redirectByRole(data.role, data.must_change_password)
    }
    return true
  }

  // ==========================================
  // ورود با OTP پیامکی (مشترک برای همه نقش‌ها)
  // ==========================================
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone') as string

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, purpose: 'login' }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('کد تأیید ارسال شد')
        setOtpSent(true)
        setOtpPhone(phone)
        let t = 120
        setOtpTimer(t)
        const interval = setInterval(() => {
          t -= 1
          setOtpTimer(t)
          if (t <= 0) clearInterval(interval)
        }, 1000)
      } else {
        toast.error(data.error || 'خطا در ارسال کد')
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  const completeOtpSignIn = async (
    phone: string,
    otp: string,
    supabase: ReturnType<typeof createClient>
  ) => {
    const { data: rpcData, error: rpcError } = await supabase.rpc('otp_login_verify', {
      p_phone: phone,
      p_otp: otp,
    })

    if (!rpcError) {
      const rpc = rpcData as {
        success: boolean
        error?: string
        email?: string
        password?: string
        full_name?: string
        role?: string
        must_change_password?: boolean
      }
      if (rpc.success && rpc.email && rpc.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: rpc.email,
          password: rpc.password,
        })
        if (signInError) {
          toast.error('خطا در ورود به سیستم')
          return
        }
        toast.success(`خوش آمدید! ${rpc.full_name || ''}`)
        redirectByRole(rpc.role, rpc.must_change_password)
        return
      }
      const otpMsgs: Record<string, string> = {
        invalid_otp: 'کد تأیید نامعتبر یا منقضی شده',
        user_not_found: 'کاربری با این شماره یافت نشد',
        ambiguous_phone: 'این شماره برای چند حساب ثبت شده',
        student_no_phone: 'ورود پیامکی برای دانش‌آموز فعال نیست — از PIN استفاده کنید',
        no_password: 'رمز ورود تنظیم نشده — با مدرسه تماس بگیرید',
      }
      if (!rpc.success) {
        toast.error(otpMsgs[rpc.error ?? ''] || 'خطا در تأیید کد')
        return
      }
    }

    // fallback سرور
    if (requireCaptcha && TURNSTILE_SITE_KEY && !captchaToken) {
      toast.error('لطفاً تأیید امنیتی را کامل کنید')
      return
    }
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        method: 'otp',
        phone,
        otp,
        captcha_token: captchaToken || undefined,
      }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) {
      handleLoginApiError(data)
      return
    }
    toast.success(`خوش آمدید! ${data.full_name || ''}`)
    redirectByRole(data.role, data.must_change_password)
  }

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const otp = formData.get('otp') as string

    try {
      const supabase = createClient()
      await completeOtpSignIn(otpPhone, otp, supabase)
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // روش 1: ورود کارکنان (username یا کد ۱۰ رقمی + رمز)
  // ==========================================
  const handleStaffLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const username = (formData.get('username') as string)?.trim()
    const password = formData.get('password') as string

    try {
      if (/^\d{10}$/.test(username)) {
        await handleCodeLogin(username, password)
        return
      }

      if (requireCaptcha && TURNSTILE_SITE_KEY && !captchaToken) {
        toast.error('لطفاً تأیید امنیتی را کامل کنید')
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          method: 'staff',
          username,
          password,
          captcha_token: captchaToken || undefined,
        }),
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('ورود موفق')
        redirectByRole(data.role, data.must_change_password)
      } else {
        handleLoginApiError(data)
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // ورود والدین: کد ۱۰ رقمی + رمز
  // ==========================================
  const handleParentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const code = (formData.get('login_code') as string)?.replace(/\D/g, '')
    const password = formData.get('password') as string

    try {
      if (code.length !== 10) {
        toast.error('کد ورود باید ۱۰ رقم باشد (کد ملی یا موبایل بدون صفر)')
        return
      }
      await handleCodeLogin(code, password)
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // ورود دانش‌آموز — از API سرور (بدون RPC مستقیم مرورگر به Supabase)
  // ==========================================
  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const studentNumber = (formData.get('student_number') as string)?.trim()
    const pin = (formData.get('pin') as string)?.trim()

    if (!studentNumber || !pin) {
      toast.error('کد دانش‌آموزی و رمز ورود الزامی است')
      setIsLoading(false)
      return
    }

    try {
      if (requireCaptcha && TURNSTILE_SITE_KEY && !captchaToken) {
        toast.error('لطفاً تأیید امنیتی را کامل کنید')
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          method: 'student_pin',
          student_number: studentNumber,
          pin,
          captcha_token: captchaToken || undefined,
        }),
      })

      const data = await response.json() as {
        success?: boolean
        error?: string
        error_code?: string
        require_captcha?: boolean
        redirect?: string
        student_info?: { full_name?: string }
      }

      if (!response.ok || !data.success) {
        handleLoginApiError(data)
        return
      }

      toast.success(`خوش آمدید! ${data.student_info?.full_name || ''}`)
      window.location.replace(data.redirect || '/student')
    } catch {
      toast.error('خطای اتصال به سرور. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full" dir="rtl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="lp-auth-tabs mb-6 h-auto w-full bg-transparent p-1">
                <TabsTrigger value="staff" className="lp-auth-tab">
                  <User className="w-3.5 h-3.5" />
                  کارکنان
                </TabsTrigger>
                <TabsTrigger value="parent" className="lp-auth-tab">
                  <User className="w-3.5 h-3.5" />
                  والدین
                </TabsTrigger>
                <TabsTrigger value="student" className="lp-auth-tab">
                  <GraduationCap className="w-3.5 h-3.5" />
                  دانش‌آموز
                </TabsTrigger>
                <TabsTrigger value="sms" className="lp-auth-tab">
                  <Smartphone className="w-3.5 h-3.5" />
                  پیامک
                </TabsTrigger>
              </TabsList>

              {requireCaptcha && TURNSTILE_SITE_KEY ? (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="mb-2 text-center text-xs text-[var(--lux-text-muted)]">
                    به‌خاطر تلاش‌های ناموفق، تأیید امنیتی لازم است
                  </p>
                  <TurnstileWidget
                    siteKey={TURNSTILE_SITE_KEY}
                    onToken={setCaptchaToken}
                  />
                </div>
              ) : null}

              {/* ===== تب کارکنان ===== */}
              <TabsContent value="staff" className="space-y-1">
                <p className="lp-auth-hint">
                  نام کاربری لاتین یا کد ۱۰ رقمی (کد ملی / موبایل بدون صفر) + رمز عبور
                </p>
                <form onSubmit={handleStaffLogin} className="space-y-4">
          <div className="space-y-2">
                    <Label htmlFor="username">نام کاربری / کد ورود</Label>
            <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="username یا 1234567890"
              required
              disabled={isLoading}
                      autoComplete="username"
                      className="lp-input-dark text-left"
                      dir="ltr"
            />
          </div>

          <div className="space-y-2">
                    <div className="flex items-center justify-between">
            <Label htmlFor="password">رمز عبور</Label>
                      <Link href="/forgot-password" className="text-xs text-[var(--lux-text-muted)] hover:text-[var(--lux-primary)]">
                        فراموشی رمز؟
                      </Link>
                    </div>
                    <div className="relative">
            <Input
              id="password"
              name="password"
                        type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              disabled={isLoading}
                        autoComplete="current-password"
                        className="lp-input-dark text-left pl-10"
                      dir="ltr"
            />
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
          </div>

                  <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-[#3B82F6] hover:underline"
                    onClick={() => setActiveTab('sms')}
                  >
                    ورود با پیامک
                  </button>
                </form>
              </TabsContent>

              {/* ===== تب والدین ===== */}
              <TabsContent value="parent" className="space-y-1">
                <p className="lp-auth-hint">
                  کد ۱۰ رقمی (کد ملی یا موبایل بدون صفر اول) + رمز عبور
                </p>
                <form onSubmit={handleParentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login_code">کد ورود</Label>
                    <Input
                      id="login_code"
                      name="login_code"
                      type="text"
                      inputMode="numeric"
                      placeholder="2112112111 یا 9399654875"
                      required
                      disabled={isLoading}
                      className="text-left font-mono tracking-widest"
                      dir="ltr"
                      maxLength={11}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent_password">رمز عبور</Label>
                    <Input
                      id="parent_password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••"
                      required
                      disabled={isLoading}
                      className="lp-input-dark text-left"
                      dir="ltr"
                    />
                  </div>
                  <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-[#10B981] hover:underline"
                    onClick={() => setActiveTab('sms')}
                  >
                    ورود با پیامک
                  </button>
                </form>
              </TabsContent>

              {/* ===== تب دانش‌آموز ===== */}
              <TabsContent value="student" className="space-y-1">
                <p className="lp-auth-hint">
                  کد دانش‌آموزی یا کد ملی ۱۰ رقمی + PIN
                </p>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_number">کد دانش‌آموزی / کد ملی</Label>
                    <Input
                      id="student_number"
                      name="student_number"
                      type="text"
                      placeholder="1234567890"
                      required
                      disabled={isLoading}
                      className="text-left font-mono"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      کد دانش‌آموزی را از کارت فعال‌سازی مدرسه پیدا کنید
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="pin">رمز (PIN)</Label>
                    </div>
                    <Input
                      id="pin"
                      name="pin"
                      type="password"
                      inputMode="numeric"
                      placeholder="••••"
                      required
                      disabled={isLoading}
                      className="text-center text-3xl tracking-[0.5em]"
                      dir="ltr"
                      maxLength={6}
                      pattern="[0-9]{4,6}"
                    />
                  </div>

                  <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
          </button>
                  <button
                    type="button"
                    className="w-full text-xs text-[#F59E0B] hover:underline"
                    onClick={() => setActiveTab('sms')}
                  >
                    ورود با پیامک (اگر موبایل اختصاصی دارید)
                  </button>
                </form>
              </TabsContent>

              {/* ===== تب ورود با پیامک (مشترک) ===== */}
              <TabsContent value="sms" className="space-y-1">
                <p className="lp-auth-hint">
                  والدین و کارکنان: شماره ثبت‌شده در مدرسه. دانش‌آموز: فقط اگر موبایل اختصاصی در سیستم ثبت شده باشد.
                </p>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">شماره موبایل</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="09123456789"
                        required
                        disabled={isLoading}
                        className="text-left text-lg tracking-widest"
                        dir="ltr"
                        pattern="09[0-9]{9}"
                        maxLength={11}
                      />
                    </div>
                    <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />ارسال کد...</> : 'دریافت کد تأیید'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="otp">کد تأیید ۶ رقمی</Label>
                        {otpTimer > 0 && (
                          <span className="text-xs text-muted-foreground">{otpTimer} ثانیه</span>
                        )}
                      </div>
                      <Input
                        id="otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="۱۲۳۴۵۶"
                        required
                        disabled={isLoading}
                        className="text-center text-3xl tracking-[0.5em] font-mono"
                        dir="ltr"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        ارسال شده به {otpPhone}
                      </p>
                    </div>
                    <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال تأیید...</> : 'تأیید و ورود'}
                    </button>
                    {otpTimer === 0 && (
                      <button
                        type="button"
                        className="lux-btn-ghost w-full"
                        onClick={() => setOtpSent(false)}
                      >
                        ارسال مجدد کد
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-full text-xs text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]"
                      onClick={() => { setOtpSent(false); setOtpPhone('') }}
                      disabled={isLoading}
                    >
                      تغییر شماره موبایل
                    </button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

      <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(232,236,244,0.1)] pt-5">
        <TermsAcceptanceNotice />
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--lux-text-muted)]">
          <Shield className="w-3 h-3 text-[var(--lux-success)]" />
          <span>ورود شما با امنیت بالا محافظت می‌شود</span>
        </div>
        <div className="text-center">
          <Link href="/help" className="text-xs text-[var(--lux-text-muted)] hover:text-[var(--lux-primary)] transition-colors">
            راهنما و پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  )
}
