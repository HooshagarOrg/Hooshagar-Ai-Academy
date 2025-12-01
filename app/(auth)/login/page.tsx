'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA هنوز بارگذاری نشده است. لطفاً کمی صبر کنید.')
      return
    }
    
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      // دریافت token از reCAPTCHA
      const recaptchaToken = await executeRecaptcha('login')
      
      // ارسال به API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          recaptcha_token: recaptchaToken,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ ورود موفق!')
        // Full page reload to ensure cookies are sent
        window.location.replace('/dashboard')
      } else {
        toast.error(data.error || 'خطا در ورود')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('خطای غیرمنتظره')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ورود به سیستم</CardTitle>
        <CardDescription>
          برای دسترسی به پنل خود وارد شوید
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* ایمیل */}
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@school.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* رمز عبور */}
          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'در حال ورود...' : 'ورود'}
          </Button>

          {/* reCAPTCHA Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>این سایت توسط Google reCAPTCHA محافظت می‌شود</span>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            حساب کاربری ندارید؟{' '}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              ثبت‌نام کنید
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
