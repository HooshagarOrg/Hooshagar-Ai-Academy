'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User, Smartphone, GraduationCap, ArrowLeft, Shield,
  Loader2, Eye, EyeOff, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TermsAcceptanceNotice } from '@/components/auth/terms-acceptance-notice'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)

  // ==========================================
  // روش 1: ورود کارکنان (username + رمز)
  // ==========================================
  const handleStaffLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'staff',
          username: formData.get('username') as string,
          password: formData.get('password') as string,
        }),
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('ورود موفق')
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        window.location.replace(data.redirect || redirect || '/dashboard')
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
  // روش 2: ارسال OTP
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
        // تایمر 120 ثانیه
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

  // ==========================================
  // روش 2: تأیید OTP
  // ==========================================
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'otp',
          phone: otpPhone,
          otp: formData.get('otp') as string,
        }),
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('ورود موفق')
        window.location.replace(data.redirect || '/dashboard')
      } else {
        toast.error(data.error || 'کد تأیید نامعتبر است')
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // روش 3: ورود دانش‌آموز با کد + PIN
  // ==========================================
  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'student_pin',
          student_number: formData.get('student_number') as string,
          pin: formData.get('pin') as string,
        }),
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(`خوش آمدید! ${data.student_info?.full_name || ''}`)
        window.location.replace('/student')
      } else {
        toast.error(data.error || 'کد دانش‌آموزی یا رمز اشتباه است')
      }
    } catch {
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full" dir="rtl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        بازگشت به خانه
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold">ورود به هوشاگر</h1>
        <p className="text-sm text-muted-foreground mt-1">نقش خود را انتخاب کنید</p>
      </div>

      <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/80 p-1 rounded-xl border border-white/[0.06]">
                <TabsTrigger value="staff" className="rounded-lg text-xs gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground">
                  <User className="w-3.5 h-3.5" />
                  کارکنان
                </TabsTrigger>
                <TabsTrigger value="otp" className="rounded-lg text-xs gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Smartphone className="w-3.5 h-3.5" />
                  والدین
                </TabsTrigger>
                <TabsTrigger value="student" className="rounded-lg text-xs gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  دانش‌آموز
                </TabsTrigger>
              </TabsList>

              {/* ===== تب کارکنان ===== */}
              <TabsContent value="staff" className="space-y-1">
                <p className="text-xs text-muted-foreground mb-4 bg-brand-cyan/10 rounded-xl p-3 border border-brand-cyan/20">
                  مدیران، معلمان و کارکنان مدرسه از این بخش وارد شوند.
                </p>
                <form onSubmit={handleStaffLogin} className="space-y-4">
          <div className="space-y-2">
                    <Label htmlFor="username">نام کاربری</Label>
            <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="نام کاربری تعریف‌شده توسط ادمین"
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

                  <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </Button>
                </form>
              </TabsContent>

              {/* ===== تب والدین (OTP) ===== */}
              <TabsContent value="otp" className="space-y-1">
                <p className="text-xs text-muted-foreground mb-4 bg-brand-green/10 rounded-xl p-3 border border-brand-green/20">
                  والدین با شماره موبایل ثبت‌شده وارد شوند. کد تأیید پیامک می‌شود.
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
                    <Button type="submit" className="w-full bg-gradient-to-l from-brand-green to-brand-cyan text-white hover:opacity-95" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />ارسال کد...</> : 'دریافت کد تأیید'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="otp">کد تأیید ۶ رقمی</Label>
                        {otpTimer > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {otpTimer} ثانیه
                          </Badge>
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

                    <Button type="submit" className="w-full bg-gradient-to-l from-brand-green to-brand-cyan text-white hover:opacity-95" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال تأیید...</> : 'تأیید و ورود'}
                    </Button>

                    {otpTimer === 0 && (
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                        ارسال مجدد کد
                      </Button>
                    )}
                    <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setOtpSent(false)} disabled={isLoading}>
                      تغییر شماره موبایل
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* ===== تب دانش‌آموز ===== */}
              <TabsContent value="student" className="space-y-1">
                <p className="text-xs text-muted-foreground mb-4 bg-brand-orange/10 rounded-xl p-3 border border-brand-orange/20">
                  دانش‌آموزان با کد دانش‌آموزی و رمز (PIN) خود وارد شوند.
                </p>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_number">کد دانش‌آموزی</Label>
                    <Input
                      id="student_number"
                      name="student_number"
                      type="text"
                      placeholder="1403-001-0001"
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

                  <Button type="submit" className="w-full bg-gradient-to-l from-brand-orange to-brand-yellow text-space font-medium hover:opacity-95" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
          </Button>
                </form>
              </TabsContent>
            </Tabs>

      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 mt-6">
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
