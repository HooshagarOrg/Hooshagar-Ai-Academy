'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User, Smartphone, GraduationCap, Shield,
  Loader2, Eye, EyeOff, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TermsAcceptanceNotice } from '@/components/auth/terms-acceptance-notice'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [activeTab, setActiveTab] = useState('staff')

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
  // ورود با کد ۱۰ رقمی (کد ملی / موبایل) + رمز
  // ==========================================
  const handleCodeLogin = async (
    loginCode: string,
    password: string,
  ) => {
    const supabase = createClient()
    const { data: rpcData, error: rpcError } = await supabase.rpc('user_login_by_code', {
      p_login_code: loginCode,
      p_password: password,
    })

    if (rpcError) {
      toast.error('خطای اتصال به سرور. لطفاً دوباره تلاش کنید.')
      return false
    }

    const rpc = rpcData as {
      success: boolean
      error?: string
      email?: string
      password?: string
      full_name?: string
      role?: string
      must_change_password?: boolean
    }

    if (!rpc.success) {
      const msgs: Record<string, string> = {
        user_not_found: 'کد ورود یافت نشد',
        wrong_password: 'رمز ورود اشتباه است',
        no_password: 'رمز ورود تنظیم نشده — با مدرسه تماس بگیرید',
        invalid_input: 'کد ورود باید ۱۰ رقم باشد',
      }
      toast.error(msgs[rpc.error ?? ''] || 'کد یا رمز اشتباه است')
      return false
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: rpc.email!,
      password: rpc.password!,
    })

    if (signInError) {
      toast.error('خطا در ورود به سیستم')
      return false
    }

    toast.success(`خوش آمدید! ${rpc.full_name || ''}`)
    redirectByRole(rpc.role, rpc.must_change_password)
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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'otp', phone, otp }),
    })
    const data = await response.json()
    if (!response.ok || !data.success || !data.credentials) {
      toast.error(data.error || 'کد تأیید نامعتبر است')
      return
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.credentials.email,
      password: data.credentials.password,
    })
    if (signInError) {
      toast.error('خطا در ورود به سیستم')
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
      // کد ۱۰ رقمی → ورود مستقیم از مرورگر
      if (/^\d{10}$/.test(username)) {
        await handleCodeLogin(username, password)
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'staff',
          username,
          password,
        }),
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('ورود موفق')
        redirectByRole(data.role, data.must_change_password)
      } else {
        toast.error(data.error || 'نام کاربری یا رمز عبور اشتباه است')
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          method: 'student_pin',
          student_number: studentNumber,
          pin,
        }),
      })

      const data = await response.json() as {
        success?: boolean
        error?: string
        redirect?: string
        credentials?: { email: string; password: string }
        student_info?: { full_name?: string }
      }

      if (!response.ok || !data.success) {
        toast.error(data.error || 'کد دانش‌آموزی یا رمز اشتباه است')
        return
      }

      // اگر credentials برگشت → server-side signIn ناموفق بود، مرورگر تلاش می‌کند
      if (data.credentials) {
        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.credentials.email,
          password: data.credentials.password,
        })
        if (signInError) {
          toast.error('خطا در ورود به سیستم. لطفاً دوباره تلاش کنید.')
          return
        }
      }
      // اگر credentials نبود → server-side موفق شد و کوکی‌ها set شده‌اند

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
              <TabsList className="mb-6 grid w-full grid-cols-4 rounded-xl border border-[#E2E8F0] bg-[#F4F7FC] p-1">
                <TabsTrigger
                  value="staff"
                  className="gap-1 rounded-lg text-xs text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#3B82F6] data-[state=active]:shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  کارکنان
                </TabsTrigger>
                <TabsTrigger
                  value="parent"
                  className="gap-1 rounded-lg text-xs text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#10B981] data-[state=active]:shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  والدین
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="gap-1 rounded-lg text-xs text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#F59E0B] data-[state=active]:shadow-sm"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  دانش‌آموز
                </TabsTrigger>
                <TabsTrigger
                  value="sms"
                  className="gap-1 rounded-lg text-xs text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  پیامک
                </TabsTrigger>
              </TabsList>

              {/* ===== تب کارکنان ===== */}
              <TabsContent value="staff" className="space-y-1">
                <p className="text-xs text-muted-foreground mb-4 bg-brand-cyan/10 rounded-xl p-3 border border-brand-cyan/20">
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
                      className="text-left"
                      dir="ltr"
            />
          </div>

          <div className="space-y-2">
                    <div className="flex items-center justify-between">
            <Label htmlFor="password">رمز عبور</Label>
                      <Link href="/help" className="text-xs text-muted-foreground hover:text-primary">
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
                        className="text-left pl-10"
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

                  <Button type="submit" className="hf-btn-primary w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </Button>
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
                <p className="text-xs text-muted-foreground mb-4 bg-brand-green/10 rounded-xl p-3 border border-brand-green/20">
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
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <Button type="submit" className="hf-btn-primary w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </Button>
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
                <p className="text-xs text-muted-foreground mb-4 bg-brand-orange/10 rounded-xl p-3 border border-brand-orange/20">
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

                  <Button type="submit" className="hf-btn-primary w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
          </Button>
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
                <p className="text-xs text-muted-foreground mb-4 rounded-xl border border-[#E9D5FF] bg-[#F5F3FF] p-3">
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
                    <Button type="submit" className="hf-btn-primary w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />ارسال کد...</> : 'دریافت کد تأیید'}
                    </Button>
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
                    <Button type="submit" className="hf-btn-primary w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال تأیید...</> : 'تأیید و ورود'}
                    </Button>
                    {otpTimer === 0 && (
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                        ارسال مجدد کد
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => { setOtpSent(false); setOtpPhone('') }}
                      disabled={isLoading}
                    >
                      تغییر شماره موبایل
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

      <div className="mt-6 flex flex-col gap-3 border-t border-[#E2E8F0] pt-5">
        <TermsAcceptanceNotice />
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3 text-brand-green" />
          <span>ورود شما با امنیت بالا محافظت می‌شود</span>
        </div>
        <div className="text-center">
          <Link href="/help" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            راهنما و پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  )
}
