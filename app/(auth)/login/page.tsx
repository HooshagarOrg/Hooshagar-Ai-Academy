'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User, Users, Smartphone, GraduationCap, Shield,
  Loader2, Eye, EyeOff, KeyRound, Lock, Hash,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TermsAcceptanceNotice } from '@/components/auth/terms-acceptance-notice'
import { getRoleHomePath } from '@/lib/auth/roles'
import dynamic from 'next/dynamic'

const TurnstileWidget = dynamic(
  () => import('@/components/auth/turnstile-widget').then((m) => m.TurnstileWidget),
  { ssr: false },
)

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

type LoginTab = 'staff' | 'parent' | 'student' | 'sms'

const LOGIN_TABS: Array<{
  id: LoginTab
  label: string
  hint: string
  panelTitle: string
  testId: string
  Icon: typeof User
}> = [
  {
    id: 'staff',
    label: 'کارکنان',
    hint: 'معلم، مدیر، معاون',
    panelTitle: 'ورود کارکنان',
    testId: 'login-tab-staff',
    Icon: User,
  },
  {
    id: 'parent',
    label: 'والدین',
    hint: 'کد ملی یا موبایل',
    panelTitle: 'ورود والدین',
    testId: 'login-tab-parent',
    Icon: Users,
  },
  {
    id: 'student',
    label: 'دانش‌آموز',
    hint: 'کد دانش‌آموزی + PIN',
    panelTitle: 'ورود دانش‌آموز',
    testId: 'login-tab-student',
    Icon: GraduationCap,
  },
  {
    id: 'sms',
    label: 'پیامک',
    hint: 'کد ۶ رقمی موبایل',
    panelTitle: 'ورود با پیامک',
    testId: 'login-tab-sms',
    Icon: Smartphone,
  },
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [activeTab, setActiveTab] = useState<LoginTab>('staff')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const redirectByRole = (role?: string, mustChange?: boolean) => {
    if (mustChange) {
      window.location.replace('/change-password')
      return
    }
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    window.location.replace(redirect || getRoleHomePath(role || '') || '/dashboard')
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
    const tab = params.get('tab')
    if (tab === 'staff' || tab === 'parent' || tab === 'student' || tab === 'sms') {
      setActiveTab(tab)
    }
    const legacyCookies = [
      'sb-hooshagar-supabase-proxy-auth-token',
      'sb-qcplgczxdbjsjrorkprm-auth-token',
    ]
    legacyCookies.forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0`
    })
  }, [])

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
        setOtpCode('')
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
  ) => {
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
    const fromInput = String(formData.get('otp') ?? '').replace(/\D/g, '').slice(0, 6)
    const otp = fromInput || otpCode.replace(/\D/g, '').slice(0, 6)

    if (!/^\d{6}$/.test(otp)) {
      toast.error('کد تأیید باید ۶ رقم باشد')
      setIsLoading(false)
      return
    }

    try {
      await completeOtpSignIn(otpPhone, otp)
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

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

  const switchTab = (id: LoginTab) => {
    setActiveTab(id)
    setShowPassword(false)
  }

  const activeRole = LOGIN_TABS.find((tab) => tab.id === activeTab) ?? LOGIN_TABS[0]
  const ActiveIcon = activeRole.Icon

  return (
    <div className="w-full" dir="rtl" data-testid="login-page">
      <div className="w-full">
        <div className="mb-5 text-center sm:text-right">
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-[var(--lux-gold)]">
            مرحله ۱ از ۲
          </p>
          <h1 className="lux-h2 mt-1.5 text-xl leading-snug sm:text-2xl">
            اول نقش خود را انتخاب کنید
          </h1>
          <p className="mt-1.5 text-xs leading-7 text-[var(--lux-text-muted)] sm:text-sm">
            کارکنان، والدین و دانش‌آموز مسیر ورود جدا دارند — اشتباه نگیرید.
          </p>
        </div>

        <div
          className="lp-auth-tabs mb-5"
          role="tablist"
          aria-label="روش ورود"
          data-testid="login-tabs"
        >
          {LOGIN_TABS.map(({ id, label, hint, testId, Icon }) => {
            const selected = activeTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`login-tab-${id}`}
                aria-controls={`login-panel-${id}`}
                aria-selected={selected}
                data-state={selected ? 'active' : 'inactive'}
                data-tab={id}
                className="lp-auth-tab"
                data-testid={testId}
                onClick={() => switchTab(id)}
              >
                <span className="lp-auth-tab-icon-wrap" aria-hidden="true">
                  <Icon className="lp-auth-tab-icon" />
                </span>
                <span className="lp-auth-tab-copy">
                  <span className="lp-auth-tab-label">{label}</span>
                  <span className="lp-auth-tab-hint">{hint}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="lp-auth-role-banner" data-tab={activeTab}>
          <span className="lp-auth-role-banner-icon" aria-hidden="true">
            <ActiveIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[var(--lux-text-muted)]">مرحله ۲ — اطلاعات ورود</p>
            <p className="truncate text-sm font-extrabold text-[var(--lux-text)]">
              {activeRole.panelTitle}
            </p>
          </div>
        </div>

        {requireCaptcha && TURNSTILE_SITE_KEY ? (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="mb-2 text-center text-xs leading-7 text-[var(--lux-text-muted)]">
              به‌خاطر تلاش‌های ناموفق، تأیید امنیتی لازم است
            </p>
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onToken={setCaptchaToken}
            />
          </div>
        ) : null}

        <div key={activeTab} className="lp-auth-panel">
          {/* ===== تب کارکنان ===== */}
          <div
            role="tabpanel"
            id="login-panel-staff"
            aria-labelledby="login-tab-staff"
            hidden={activeTab !== 'staff'}
            className="space-y-1"
          >
            <p className="lp-auth-hint">
              نام کاربری لاتین یا کد ۱۰ رقمی و رمز عبور
            </p>
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="lp-auth-field">
                <label className="lp-auth-label" htmlFor="username">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  نام کاربری / کد ورود
                </label>
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
                  data-testid="login-username"
                />
              </div>

              <div className="lp-auth-field">
                <div className="flex items-center justify-between gap-2">
                  <label className="lp-auth-label" htmlFor="password">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    رمز عبور
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-secondary)]"
                  >
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
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-text)]"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="lux-btn-accent w-full" disabled={isLoading} data-testid="login-submit">
                {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
              </button>
              <button
                type="button"
                className="lp-auth-alt"
                onClick={() => switchTab('sms')}
              >
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                ورود با پیامک
              </button>
            </form>
          </div>

          {/* ===== تب والدین ===== */}
          <div
            role="tabpanel"
            id="login-panel-parent"
            aria-labelledby="login-tab-parent"
            hidden={activeTab !== 'parent'}
            className="space-y-1"
          >
            <p className="lp-auth-hint">
              کد ملی یا موبایل بدون صفر، به‌همراه رمز عبور
            </p>
            <form onSubmit={handleParentLogin} className="space-y-4">
              <div className="lp-auth-field">
                <label className="lp-auth-label" htmlFor="login_code">
                  <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                  کد ورود
                </label>
                <Input
                  id="login_code"
                  name="login_code"
                  type="text"
                  inputMode="numeric"
                  placeholder="2112112111 یا 9399654875"
                  required
                  disabled={isLoading}
                  className="lp-input-dark text-left font-mono tracking-widest"
                  dir="ltr"
                  maxLength={11}
                  data-testid="login-parent-code"
                />
              </div>
              <div className="lp-auth-field">
                <label className="lp-auth-label" htmlFor="parent_password">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  رمز عبور
                </label>
                <div className="relative">
                  <Input
                    id="parent_password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••"
                    required
                    disabled={isLoading}
                    className="lp-input-dark text-left pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-text)]"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
              </button>
              <button
                type="button"
                className="lp-auth-alt"
                onClick={() => switchTab('sms')}
              >
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                ورود با پیامک
              </button>
            </form>
          </div>

          {/* ===== تب دانش‌آموز ===== */}
          <div
            role="tabpanel"
            id="login-panel-student"
            aria-labelledby="login-tab-student"
            hidden={activeTab !== 'student'}
            className="space-y-1"
          >
            <p className="lp-auth-hint">
              کد دانش‌آموزی یا کد ملی، به‌همراه PIN
            </p>
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="lp-auth-field">
                <label className="lp-auth-label" htmlFor="student_number">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  کد دانش‌آموزی / کد ملی
                </label>
                <Input
                  id="student_number"
                  name="student_number"
                  type="text"
                  placeholder="1234567890"
                  required
                  disabled={isLoading}
                  className="lp-input-dark text-left font-mono"
                  dir="ltr"
                  data-testid="login-student-number"
                />
                <p className="text-xs leading-7 text-[var(--lux-text-muted)]">
                  کد دانش‌آموزی را از کارت فعال‌سازی مدرسه پیدا کنید
                </p>
              </div>

              <div className="lp-auth-field">
                <label className="lp-auth-label" htmlFor="pin">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  رمز (PIN)
                </label>
                <Input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  required
                  disabled={isLoading}
                  className="lp-input-dark text-center text-3xl tracking-[0.5em]"
                  dir="ltr"
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  data-testid="login-student-pin"
                />
              </div>

              <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
              </button>
              <button
                type="button"
                className="lp-auth-alt"
                onClick={() => switchTab('sms')}
              >
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                ورود با پیامک (اگر موبایل اختصاصی دارید)
              </button>
            </form>
          </div>

          {/* ===== تب ورود با پیامک ===== */}
          <div
            role="tabpanel"
            id="login-panel-sms"
            aria-labelledby="login-tab-sms"
            hidden={activeTab !== 'sms'}
            className="space-y-1"
          >
            <p className="lp-auth-hint">
              شماره ثبت‌شده در مدرسه. دانش‌آموز فقط با موبایل اختصاصی.
            </p>
            {!otpSent ? (
              <form key="sms-phone-form" onSubmit={handleSendOtp} className="space-y-4" autoComplete="on">
                <div className="lp-auth-field">
                  <label className="lp-auth-label" htmlFor="login-phone">
                    <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                    شماره موبایل
                  </label>
                  <Input
                    id="login-phone"
                    data-testid="login-phone"
                    name="phone"
                    type="tel"
                    placeholder="09123456789"
                    required
                    disabled={isLoading}
                    className="lp-input-dark text-left text-lg tracking-widest"
                    dir="ltr"
                    pattern="09[0-9]{9}"
                    maxLength={11}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <button type="submit" className="lux-btn-accent w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />ارسال کد...</> : 'دریافت کد تأیید'}
                </button>
              </form>
            ) : (
              <form key="sms-otp-form" onSubmit={handleVerifyOtp} className="space-y-4" autoComplete="off">
                <div className="lp-auth-field">
                  <div className="flex items-center justify-between gap-2">
                    <label className="lp-auth-label" htmlFor="login-otp">
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      کد تأیید ۶ رقمی
                    </label>
                    {otpTimer > 0 && (
                      <span className="rounded-full bg-[rgba(84,210,255,0.1)] px-2.5 py-0.5 text-xs font-bold text-[var(--lux-secondary)]">
                        {otpTimer} ثانیه
                      </span>
                    )}
                  </div>
                  <Input
                    id="login-otp"
                    data-testid="login-otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="------"
                    required
                    disabled={isLoading}
                    className="lp-input-dark text-center font-mono text-3xl tracking-[0.5em]"
                    dir="ltr"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                  <p className="text-center text-xs leading-7 text-[var(--lux-text-muted)]">
                    ارسال شده به{' '}
                    <span className="font-mono text-[var(--lux-text)]" dir="ltr">
                      {otpPhone}
                    </span>
                  </p>
                </div>
                <button
                  type="submit"
                  data-testid="login-otp-submit"
                  className="lux-btn-accent w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال تأیید...</> : 'تأیید و ورود'}
                </button>
                {otpTimer === 0 && (
                  <button
                    type="button"
                    className="lux-btn-ghost w-full"
                    onClick={() => { setOtpCode(''); setOtpSent(false) }}
                  >
                    ارسال مجدد کد
                  </button>
                )}
                <button
                  type="button"
                  className="lp-auth-alt"
                  onClick={() => { setOtpSent(false); setOtpPhone(''); setOtpCode('') }}
                  disabled={isLoading}
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 border-t border-[rgba(232,236,244,0.1)] pt-4">
        <TermsAcceptanceNotice />
        <div className="flex items-center justify-center gap-2 text-xs leading-7 text-[var(--lux-text-muted)]">
          <Shield className="h-3.5 w-3.5 text-[var(--lux-success)]" aria-hidden="true" />
          <span>ورود شما با امنیت بالا محافظت می‌شود</span>
        </div>
        <div className="text-center">
          <Link
            href="/help"
            className="text-xs text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-secondary)]"
          >
            راهنما و پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  )
}
