'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import { toast } from 'sonner'

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await loginAction(formData)
      
      if (result?.error) {
        toast.error(result.error)
        setIsLoading(false)
      } else {
        toast.success('✅ ورود موفق!')
        // Full page reload to ensure cookies are sent
        window.location.replace('/dashboard')
      }
    } catch (error) {
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
