'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Smartphone, GraduationCap, ArrowLeft, Shield, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const router = useRouter()

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'password',
          email,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ ورود موفق!')
        window.location.replace('/dashboard')
      } else {
        toast.error(data.error || 'ایمیل یا رمز عبور اشتباه است')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('خطای اتصال به سرور')
      setIsLoading(false)
    }
  }

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone') as string
    
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          purpose: 'login',
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ کد تأیید ارسال شد')
        setOtpSent(true)
        setOtpPhone(phone)
      } else {
        toast.error(data.error || 'خطا در ارسال کد')
      }
    } catch (error) {
      console.error('OTP error:', error)
      toast.error('خطای اتصال به سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const otp = formData.get('otp') as string
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'otp',
          phone: otpPhone,
          otp,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ ورود موفق!')
        window.location.replace('/dashboard')
      } else {
        toast.error(data.error || 'کد تأیید نامعتبر است')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('خطای اتصال به سرور')
      setIsLoading(false)
    }
  }

  // Student PIN Login
  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const studentNumber = formData.get('student_number') as string
    const pin = formData.get('pin') as string
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'student_pin',
          student_number: studentNumber,
          pin,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ ورود موفق!')
        window.location.replace('/dashboard')
      } else {
        toast.error(data.error || 'کد دانش‌آموزی یا رمز اشتباه است')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('خطای اتصال به سرور')
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            بازگشت به صفحه اصلی
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-l from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            ورود به هوشاگر
          </h1>
          <p className="text-muted-foreground">
            روش ورود خود را انتخاب کنید
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="password" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="password" className="gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">رمز عبور</span>
                </TabsTrigger>
                <TabsTrigger value="otp" className="gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">کد یکبار مصرف</span>
                </TabsTrigger>
                <TabsTrigger value="student" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">دانش‌آموز</span>
                </TabsTrigger>
              </TabsList>

              {/* Password Tab */}
              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@school.com"
                      required
                      disabled={isLoading}
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
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ورود...
                      </>
                    ) : (
                      'ورود'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* OTP Tab */}
              <TabsContent value="otp">
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
                        className="text-left"
                        dir="ltr"
                        pattern="09[0-9]{9}"
                      />
                      <p className="text-xs text-muted-foreground">
                        کد تأیید به این شماره ارسال می‌شود
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          در حال ارسال...
                        </>
                      ) : (
                        'دریافت کد تأیید'
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">کد تأیید</Label>
                      <Input
                        id="otp"
                        name="otp"
                        type="text"
                        placeholder="123456"
                        required
                        disabled={isLoading}
                        className="text-center text-2xl tracking-widest"
                        dir="ltr"
                        maxLength={6}
                        pattern="[0-9]{6}"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        کد ارسال شده به {otpPhone} را وارد کنید
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          در حال تأیید...
                        </>
                      ) : (
                        'تأیید و ورود'
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setOtpSent(false)}
                      disabled={isLoading}
                    >
                      تغییر شماره موبایل
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* Student Tab */}
              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_number">کد دانش‌آموزی</Label>
                    <Input
                      id="student_number"
                      name="student_number"
                      type="text"
                      placeholder="STU-12345678"
                      required
                      disabled={isLoading}
                      className="text-left"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      کد دانش‌آموزی خود را از کارت فعال‌سازی پیدا کنید
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pin">رمز عبور (PIN)</Label>
                    <Input
                      id="pin"
                      name="pin"
                      type="password"
                      placeholder="••••"
                      required
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest"
                      dir="ltr"
                      maxLength={4}
                      pattern="[0-9]{4}"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        در حال ورود...
                      </>
                    ) : (
                      'ورود'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t pt-6">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>ورود شما با امنیت بالا محافظت می‌شود</span>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                حساب کاربری ندارید؟{' '}
                <Link
                  href="/activate"
                  className="text-primary hover:underline font-medium"
                >
                  فعال‌سازی حساب
                </Link>
              </p>
              
              <Link
                href="/help"
                className="text-sm text-muted-foreground hover:text-primary inline-block"
              >
                راهنما و پشتیبانی
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
