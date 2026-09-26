'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User,
  Users,
  Smartphone,
  GraduationCap,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Hash,
  AlertTriangle,
  Sparkles,
  UserCheck,
  Check,
  ArrowRight,
  Info,
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

type LoginTab = 'parent' | 'staff' | 'student' | 'sms'

interface TabConfig {
  id: LoginTab
  label: string
  subtitle: string
  badge: string
  panelTitle: string
  panelDescription: string
  testId: string
  Icon: typeof User
  colorClass: {
    activeBorder: string
    activeBg: string
    activeGlow: string
    iconBg: string
    iconColor: string
    badgeClass: string
  }
}

const LOGIN_TABS: TabConfig[] = [
  {
    id: 'parent',
    label: 'والدین و اولیا',
    subtitle: 'کد ملی یا شماره همراه',
    badge: 'پرتال خانواده',
    panelTitle: 'ورود اولیای گرامی',
    panelDescription: 'مشاهده کارنامه، نمرات، حضور و غیاب، تکالیف و ارتباط با مدرسه',
    testId: 'login-tab-parent',
    Icon: Users,
    colorClass: {
      activeBorder: 'border-amber-500/70',
      activeBg: 'bg-amber-500/15',
      activeGlow: 'shadow-[0_8px_24px_rgba(245,158,11,0.22)]',
      iconBg: 'bg-amber-500/25',
      iconColor: 'text-amber-300',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  },
  {
    id: 'staff',
    label: 'کادر مدرسه و معلمان',
    subtitle: 'نام کاربری سازمانی',
    badge: 'مدیران و دبیران',
    panelTitle: 'ورود کادر آموزشی و اداری',
    panelDescription: 'مخصوص مدیر، معاونان و معلمان با دسترسی کامل به میز کار مدرسه',
    testId: 'login-tab-staff',
    Icon: UserCheck,
    colorClass: {
      activeBorder: 'border-indigo-500/70',
      activeBg: 'bg-indigo-500/15',
      activeGlow: 'shadow-[0_8px_24px_rgba(139,124,255,0.25)]',
      iconBg: 'bg-indigo-500/25',
      iconColor: 'text-indigo-200',
      badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
    },
  },
  {
    id: 'student',
    label: 'دانش‌آموزان',
    subtitle: 'کد دانش‌آموزی + PIN',
    badge: 'پرتال یادگیری',
    panelTitle: 'ورود دانش‌آموزان عزیز',
    panelDescription: 'دسترسی به باغ استعداد، آزمون‌ها، تکالیف و ارتقای سطح XP',
    testId: 'login-tab-student',
    Icon: GraduationCap,
    colorClass: {
      activeBorder: 'border-cyan-500/70',
      activeBg: 'bg-cyan-500/15',
      activeGlow: 'shadow-[0_8px_24px_rgba(84,210,255,0.22)]',
      iconBg: 'bg-cyan-500/25',
      iconColor: 'text-cyan-200',
      badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
    },
  },
  {
    id: 'sms',
    label: 'ورود با پیامک (OTP)',
    subtitle: 'کد تأیید ۶ رقمی',
    badge: 'بدون نیاز به رمز',
    panelTitle: 'ورود سریع با پیامک',
    panelDescription: 'ارسال کد یکبارمصرف به شماره همراه ثبت‌شده در پرونده مدرسه',
    testId: 'login-tab-sms',
    Icon: Smartphone,
    colorClass: {
      activeBorder: 'border-emerald-500/70',
      activeBg: 'bg-emerald-500/15',
      activeGlow: 'shadow-[0_8px_24px_rgba(16,185,129,0.22)]',
      iconBg: 'bg-emerald-500/25',
      iconColor: 'text-emerald-300',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  },
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [activeTab, setActiveTab] = useState<LoginTab>('parent')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaStamp, setCaptchaStamp] = useState(0)

  // متغیرهای فرم جهت تشخیص هوشمند اشتباه نقش
  const [staffUsername, setStaffUsername] = useState('')
  const [parentCode, setParentCode] = useState('')

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
    if (data.require_captcha) {
      setRequireCaptcha(true)
      setCaptchaToken(null)
      setCaptchaAnswer('')
      setCaptchaStamp(Date.now())
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
    portal: 'parent' | 'staff',
  ) => {
    if (requireCaptcha && !captchaAnswer.trim() && !(TURNSTILE_SITE_KEY && captchaToken)) {
      toast.error('کد تصویر امنیتی را وارد کنید')
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
        portal,
        captcha_token: captchaToken || undefined,
        captcha_answer: captchaAnswer.trim() || undefined,
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
    if (requireCaptcha && !captchaAnswer.trim() && !(TURNSTILE_SITE_KEY && captchaToken)) {
      toast.error('کد تصویر امنیتی را وارد کنید')
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
        captcha_answer: captchaAnswer.trim() || undefined,
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
    const username = ((formData.get('username') as string) || staffUsername).trim()
    const password = formData.get('password') as string

    try {
      if (/^\d{10}$/.test(username)) {
        await handleCodeLogin(username, password, 'staff')
        return
      }

      if (requireCaptcha && !captchaAnswer.trim() && !(TURNSTILE_SITE_KEY && captchaToken)) {
        toast.error('کد تصویر امنیتی را وارد کنید')
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
        captcha_answer: captchaAnswer.trim() || undefined,
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
    const code = ((formData.get('login_code') as string) || parentCode).replace(/\D/g, '')
    const password = formData.get('password') as string

    try {
      if (code.length !== 10) {
        toast.error('کد ورود باید ۱۰ رقم باشد (کد ملی یا موبایل بدون صفر)')
        return
      }
      await handleCodeLogin(code, password, 'parent')
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
      if (requireCaptcha && !captchaAnswer.trim() && !(TURNSTILE_SITE_KEY && captchaToken)) {
        toast.error('کد تصویر امنیتی را وارد کنید')
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
        captcha_answer: captchaAnswer.trim() || undefined,
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

  const currentTab = LOGIN_TABS.find((t) => t.id === activeTab) ?? LOGIN_TABS[0]
  const CurrentIcon = currentTab.Icon

  // تشخیص هوشمند اشتباه در وارد کردن شماره/کد ملی در تب کارکنان
  const isNumericPhoneOrCodeInStaff =
    activeTab === 'staff' &&
    (staffUsername.startsWith('09') || /^\d{10,11}$/.test(staffUsername.trim()))

  // تشخیص هوشمند ورود نام کاربری حروفی در تب والدین
  const isAlphaInParent =
    activeTab === 'parent' &&
    /[a-zA-Z]/.test(parentCode) &&
    parentCode.trim().length >= 3

  return (
    <div className="w-full" dir="rtl" data-testid="login-page">
      <div className="w-full space-y-6">
        
        {/* ── عنوان بالای فرم و انتخاب نقش ── */}
        <div className="text-right">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--lux-gold)]">
              <Sparkles className="h-3.5 w-3.5" />
              مرحله اول: انتخاب نقش در مدرسه
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-[var(--lux-text-muted)]">
              ۴ روش ورود
            </span>
          </div>
          <h1 className="lux-h2 mt-2 text-xl font-black text-white sm:text-2xl">
            شما با چه نقشی وارد می‌شوید؟
          </h1>
          <p className="mt-1 text-xs leading-6 text-[var(--lux-text-muted)]">
            برای پیشگیری از خطای ورود، لطفاً کارت متناسب با جایگاه خود را انتخاب کنید:
          </p>
        </div>

        {/* ── ۴ کارت بزرگ و متمایز انتخاب نقش (شبکه ۲ در ۲) ── */}
        <div
          className="grid grid-cols-2 gap-3"
          role="tablist"
          aria-label="روش ورود به سامانه"
          data-testid="login-tabs"
        >
          {LOGIN_TABS.map(({ id, label, subtitle, badge, testId, Icon, colorClass }) => {
            const isSelected = activeTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`login-tab-${id}`}
                aria-controls={`login-panel-${id}`}
                aria-selected={isSelected}
                data-state={isSelected ? 'active' : 'inactive'}
                data-tab={id}
                data-testid={testId}
                onClick={() => switchTab(id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-right transition-all duration-200 ${
                  isSelected
                    ? `${colorClass.activeBorder} ${colorClass.activeBg} ${colorClass.activeGlow} scale-[1.02]`
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {/* نشانگر رادیویی گوشه بالا */}
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? `${colorClass.iconBg} ${colorClass.iconColor}`
                        : 'bg-white/5 text-[var(--lux-text-muted)] group-hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                      isSelected
                        ? colorClass.badgeClass
                        : 'border-white/5 bg-white/5 text-[var(--lux-text-muted)]'
                    }`}
                  >
                    {badge}
                  </span>
                </div>

                {/* متون کارت */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-white/90'}`}>
                      {label}
                    </p>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-5 text-[var(--lux-text-muted)]">
                    {subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── بنر تأیید نقش فعال ── */}
        <div
          className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${currentTab.colorClass.activeBorder} ${currentTab.colorClass.activeBg}`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${currentTab.colorClass.iconBg} ${currentTab.colorClass.iconColor}`}
          >
            <CurrentIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-right">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-[var(--lux-gold)]">
                مرحله دوم
              </span>
              <span className="text-sm font-black text-white">
                {currentTab.panelTitle}
              </span>
            </div>
            <p className="mt-0.5 hidden text-xs leading-6 text-[var(--lux-text-muted)] sm:block">
              {currentTab.panelDescription}
            </p>
          </div>
        </div>

        {/* ── کپچا در صورت فعال بودن ── */}
        {requireCaptcha ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
            <p className="text-center text-xs leading-6 text-[var(--lux-text-muted)]">
              به‌خاطر تلاش‌های ناموفق مکرر، تأیید امنیتی الزامی است
            </p>
            <div className="flex flex-col items-center gap-2">
              {/* کادر محلی — بدون وابستگی به Cloudflare که در ایران گاهی باز نمی‌شود */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/auth/login/captcha?t=${captchaStamp}`}
                alt="کد امنیتی"
                width={220}
                height={72}
                className="rounded-xl border border-white/10"
              />
              <button
                type="button"
                className="text-xs text-[var(--lux-gold)]"
                onClick={() => {
                  setCaptchaAnswer('')
                  setCaptchaStamp(Date.now())
                }}
              >
                کد جدید
              </button>
              <Input
                inputMode="numeric"
                autoComplete="off"
                placeholder="کد ۵ رقمی تصویر"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="max-w-[220px] text-center tracking-[0.3em]"
                aria-label="کد تأیید امنیتی"
              />
            </div>
            {TURNSTILE_SITE_KEY ? (
              <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onToken={setCaptchaToken} />
            ) : null}
          </div>
        ) : null}

        {/* ── پنل‌های فرم ورود ── */}
        <div key={activeTab} className="lp-auth-panel">
          
          {/* ========================================== */}
          {/* ۱. تب والدین و اولیا (پیش‌فرض هوشمند)       */}
          {/* ========================================== */}
          <div
            role="tabpanel"
            id="login-panel-parent"
            aria-labelledby="login-tab-parent"
            hidden={activeTab !== 'parent'}
            className="space-y-4"
          >
            <form onSubmit={handleParentLogin} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="flex items-center gap-1.5 text-xs font-black text-white" htmlFor="login_code">
                  <Hash className="h-3.5 w-3.5 text-amber-400" />
                  کد ملی ۱۰ رقمی یا شماره همراه ولی
                </label>
                <Input
                  id="login_code"
                  name="login_code"
                  type="text"
                  inputMode="numeric"
                  placeholder="مثال: 09123456789 یا 0012345678"
                  required
                  disabled={isLoading}
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  className="lp-input-dark text-left font-mono tracking-wider focus:border-amber-400 focus:ring-amber-400/20"
                  dir="ltr"
                  maxLength={11}
                  data-testid="login-parent-code"
                />
                <p className="text-[11px] text-[var(--lux-text-muted)]">
                  کد ملی یا شماره همراه ثبت‌شده در پرونده مدرسه هنگام ثبت‌نام دانش‌آموز
                </p>

                {/* هشدار هوشمند ورود حروف انگلیسی در تب والدین */}
                {isAlphaInParent && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/15 p-2.5 text-xs text-indigo-200">
                    <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-indigo-300">نام کاربری حروفی/انگلیسی وارد شده است</p>
                      <p className="text-[11px] text-indigo-200/80">
                        اگر معلم یا از کادر اداری مدرسه هستید، لطفاً به بخش کادر مدرسه بروید:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStaffUsername(parentCode)
                          switchTab('staff')
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 font-black text-indigo-300 underline underline-offset-4 hover:text-white"
                      >
                        👈 انتقال به بخش کادر مدرسه با همین نام کاربری
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-black text-white" htmlFor="parent_password">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    رمز عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('sms')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    رمز ندارید؟ ورود با پیامک
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="parent_password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="lp-input-dark text-left pl-10 focus:border-amber-400 focus:ring-amber-400/20"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)] hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="lux-btn-accent w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-black text-black shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin text-black" />
                    در حال ورود به پرتال اولیا...
                  </>
                ) : (
                  'ورود به پرتال اولیا'
                )}
              </button>

              {/* تغییر سریع نقش در پایین فرم */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => switchTab('staff')}
                  className="text-indigo-400 hover:underline"
                >
                  معلم یا کادر مدرسه هستید؟ کلیک کنید
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('sms')}
                  className="text-emerald-400 hover:underline"
                >
                  ورود سریع بدون رمز
                </button>
              </div>
            </form>
          </div>

          {/* ========================================== */}
          {/* ۲. تب کادر مدرسه و معلمان                  */}
          {/* ========================================== */}
          <div
            role="tabpanel"
            id="login-panel-staff"
            aria-labelledby="login-tab-staff"
            hidden={activeTab !== 'staff'}
            className="space-y-4"
          >
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="lp-auth-credentials-box space-y-4">
                <p className="text-xs font-bold text-indigo-200/90 leading-6">
                  نام کاربری و رمز عبور را در کادر زیر وارد کنید.
                </p>
                <div className="space-y-1.5 text-right">
                  <label className="flex items-center gap-1.5 text-sm font-black text-white" htmlFor="username">
                    <User className="h-4 w-4 text-indigo-300" />
                    نام کاربری
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="مثال: admin یا username دبیر"
                    required
                    disabled={isLoading}
                    autoComplete="username"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    className="lp-input-dark lp-input-emphasis text-left text-base focus:border-indigo-400 focus:ring-indigo-400/30"
                    dir="ltr"
                    data-testid="login-username"
                  />

                  {/* هشدار هوشمند ورود شماره یا کد ملی در تب کارکنان */}
                  {isNumericPhoneOrCodeInStaff && (
                    <div className="mt-2.5 rounded-xl border border-amber-500/50 bg-amber-500/20 p-3 text-xs leading-6 text-amber-200">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-1" />
                        <div className="flex-1">
                          <p className="font-extrabold text-amber-300 text-sm">
                            آیا از اولیا و والدین دانش‌آموزان هستید؟
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setParentCode(staffUsername)
                              switchTab('parent')
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-black hover:bg-amber-400 transition-colors shadow-md"
                          >
                            انتقال به بخش والدین
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-sm font-black text-white" htmlFor="password">
                      <Lock className="h-4 w-4 text-indigo-300" />
                      رمز عبور
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-indigo-300 hover:text-white hover:underline shrink-0"
                    >
                      فراموشی رمز؟
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="رمز عبور خود را وارد کنید"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="lp-input-dark lp-input-emphasis text-left text-base pl-10 focus:border-indigo-400 focus:ring-indigo-400/30"
                      dir="ltr"
                      data-testid="login-password"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--lux-text-muted)] hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="lux-btn-accent w-full bg-gradient-to-r from-indigo-500 to-purple-600 font-black text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500"
                disabled={isLoading}
                data-testid="login-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin text-white" />
                    در حال ورود همکاران...
                  </>
                ) : (
                  'ورود به پنل کادر مدرسه'
                )}
              </button>

              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => switchTab('parent')}
                  className="text-amber-400 hover:underline"
                >
                  ولی دانش‌آموز هستید؟ کلیک کنید
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('sms')}
                  className="text-emerald-400 hover:underline"
                >
                  ورود با پیامک یکبارمصرف
                </button>
              </div>
            </form>
          </div>

          {/* ========================================== */}
          {/* ۳. تب دانش‌آموز                            */}
          {/* ========================================== */}
          <div
            role="tabpanel"
            id="login-panel-student"
            aria-labelledby="login-tab-student"
            hidden={activeTab !== 'student'}
            className="space-y-4"
          >
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="flex items-center gap-1.5 text-xs font-black text-white" htmlFor="student_number">
                  <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                  کد دانش‌آموزی یا کد ملی
                </label>
                <Input
                  id="student_number"
                  name="student_number"
                  type="text"
                  placeholder="مثال: 1234567890"
                  required
                  disabled={isLoading}
                  className="lp-input-dark text-left font-mono tracking-wider focus:border-cyan-400 focus:ring-cyan-400/20"
                  dir="ltr"
                  data-testid="login-student-number"
                />
                <p className="text-[11px] text-[var(--lux-text-muted)]">
                  کد دانش‌آموزی را از کارت فعال‌سازی مدرسه یا ناظم دریافت کنید
                </p>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="flex items-center gap-1.5 text-xs font-black text-white" htmlFor="pin">
                  <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                  رمز ورود (PIN ۴ تا ۶ رقمی)
                </label>
                <Input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  required
                  disabled={isLoading}
                  className="lp-input-dark text-center font-mono text-3xl tracking-[0.5em] focus:border-cyan-400 focus:ring-cyan-400/20"
                  dir="ltr"
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  data-testid="login-student-pin"
                />
                <p className="text-[11px] text-[var(--lux-text-muted)]">
                  رمز پیش‌فرض روی کارت فعال‌سازی درج شده است
                </p>
              </div>

              <button
                type="submit"
                data-testid="login-submit-student"
                className="lux-btn-accent w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-black text-black shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin text-black" />
                    در حال ورود دانش‌آموز...
                  </>
                ) : (
                  'ورود به پرتال دانش‌آموز'
                )}
              </button>

              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => switchTab('parent')}
                  className="text-amber-400 hover:underline"
                >
                  ورود اولیای دانش‌آموز
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('sms')}
                  className="text-emerald-400 hover:underline"
                >
                  ورود با پیامک (موبایل اختصاصی)
                </button>
              </div>
            </form>
          </div>

          {/* ========================================== */}
          {/* ۴. تب ورود سریع با پیامک (OTP)             */}
          {/* ========================================== */}
          <div
            role="tabpanel"
            id="login-panel-sms"
            aria-labelledby="login-tab-sms"
            hidden={activeTab !== 'sms'}
            className="space-y-4"
          >
            {!otpSent ? (
              <form key="sms-phone-form" onSubmit={handleSendOtp} className="space-y-4" autoComplete="on">
                <div className="space-y-1.5 text-right">
                  <label className="flex items-center gap-1.5 text-xs font-black text-white" htmlFor="login-phone">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                    شماره همراه ثبت‌شده در مدرسه
                  </label>
                  <Input
                    id="login-phone"
                    data-testid="login-phone"
                    name="phone"
                    type="tel"
                    placeholder="09123456789"
                    required
                    disabled={isLoading}
                    className="lp-input-dark text-left font-mono text-lg tracking-widest focus:border-emerald-400 focus:ring-emerald-400/20"
                    dir="ltr"
                    pattern="09[0-9]{9}"
                    maxLength={11}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  <p className="text-[11px] text-[var(--lux-text-muted)]">
                    کد تأیید ۶ رقمی از طریق پیامک به این شماره ارسال خواهد شد
                  </p>
                </div>

                <button
                  type="submit"
                  className="lux-btn-accent w-full bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-black shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin text-black" />
                      در حال ارسال کد تأیید...
                    </>
                  ) : (
                    'دریافت کد تأیید پیامکی'
                  )}
                </button>
              </form>
            ) : (
              <form key="sms-otp-form" onSubmit={handleVerifyOtp} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-black text-white" htmlFor="login-otp">
                      <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                      کد تأیید ۶ رقمی پیامک‌شده
                    </label>
                    {otpTimer > 0 && (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                        {otpTimer} ثانیه تا ارسال مجدد
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
                    className="lp-input-dark text-center font-mono text-3xl tracking-[0.5em] focus:border-emerald-400 focus:ring-emerald-400/20"
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
                  <p className="text-center text-xs text-[var(--lux-text-muted)]">
                    پیامک به شماره <span className="font-mono text-white" dir="ltr">{otpPhone}</span> ارسال شد.
                  </p>
                </div>

                <button
                  type="submit"
                  data-testid="login-otp-submit"
                  className="lux-btn-accent w-full bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-black shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin text-black" />
                      در حال بررسی کد...
                    </>
                  ) : (
                    'تأیید کد و ورود به سامانه'
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  {otpTimer === 0 ? (
                    <button
                      type="button"
                      className="text-xs font-bold text-emerald-400 hover:underline"
                      onClick={() => {
                        setOtpCode('')
                        setOtpSent(false)
                      }}
                    >
                      ارسال مجدد کد پیامکی
                    </button>
                  ) : <span />}
                  <button
                    type="button"
                    className="text-xs text-[var(--lux-text-muted)] hover:text-white"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpPhone('')
                      setOtpCode('')
                    }}
                    disabled={isLoading}
                  >
                    تغییر شماره همراه
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs">
              <button
                type="button"
                onClick={() => switchTab('parent')}
                className="text-amber-400 hover:underline"
              >
                ورود والدین با رمز عبور
              </button>
              <button
                type="button"
                onClick={() => switchTab('staff')}
                className="text-indigo-400 hover:underline"
              >
                ورود کادر مدرسه با رمز
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── فوتر و امنیت ── */}
      <div className="mt-6 flex flex-col gap-2.5 border-t border-white/[0.08] pt-4 text-center">
        <TermsAcceptanceNotice />
        <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--lux-text-muted)]">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span>ورود امن و رمزنگاری‌شده با گواهی SSL و محافظت ضد نفوذ</span>
        </div>
        <div>
          <Link
            href="/help"
            className="text-xs text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-secondary)]"
          >
            نیاز به راهنمایی دارید؟ مرکز پشتیبانی و سوالات متداول
          </Link>
        </div>
      </div>
    </div>
  )
}
