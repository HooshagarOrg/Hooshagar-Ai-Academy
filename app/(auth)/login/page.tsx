'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Lock, Sparkles, GraduationCap } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ خوش آمدید!')
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

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -z-10" />
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] -z-10" />

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-8">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>

          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-l from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ورود به هوشاگر
            </CardTitle>
            <CardDescription className="text-base mt-2">
              پلتفرم هوشمند مدیریت مدارس
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                ایمیل
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@school.com"
                  required
                  disabled={isLoading}
                  className="pr-10 h-11 border-2 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                رمز عبور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pr-10 h-11 border-2 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-muted-foreground">مرا به خاطر بسپار</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                فراموشی رمز عبور
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-l from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-purple-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                'ورود به سیستم'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">یا</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-sm text-center text-muted-foreground">
              حساب کاربری ندارید؟{' '}
              <Link
                href="/register"
                className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
              >
                ثبت‌نام کنید
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
