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
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* لوگو و عنوان */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت
          </Link>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">ه</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">هوشاگر</h1>
          <p className="text-muted-foreground text-sm">سامانه هوشمند مدیریت مدارس</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="staff" className="rounded-lg text-xs gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="w-3.5 h-3.5" />
                  کارکنان
                </TabsTrigger>
                <TabsTrigger value="otp" className="rounded-lg text-xs gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Smartphone className="w-3.5 h-3.5" />
                  والدین
                </TabsTrigger>
                <TabsTrigger value="student" className="rounded-lg text-xs gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  دانش‌آموز
                </TabsTrigger>
              </TabsList>

              {/* ===== تب کارکنان ===== */}
              <TabsContent value="staff" className="space-y-1">
                <p className="text-xs text-muted-foreground mb-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
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

                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </Button>
                </form>
              </TabsContent>

              {/* ===== تب والدین (OTP) ===== */}
              <TabsContent value="otp" className="space-y-1">
                <p className="text-xs text-muted-foreground mb-4 bg-green-50 rounded-lg p-3 border border-green-100">
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
                    <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600" disabled={isLoading}>
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

                    <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600" disabled={isLoading}>
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
                <p className="text-xs text-muted-foreground mb-4 bg-orange-50 rounded-lg p-3 border border-orange-100">
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

                  <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال ورود...</> : 'ورود'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t pt-5 bg-gray-50/50 rounded-b-xl">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3 text-green-500" />
              <span>ورود شما با امنیت بالا محافظت می‌شود</span>
            </div>
            <div className="text-center">
              <Link href="/help" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                راهنما و پشتیبانی
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
