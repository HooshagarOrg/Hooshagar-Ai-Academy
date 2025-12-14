'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Zod Schema برای اعتبارسنجی
const registerSchema = z.object({
  full_name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(100),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  role: z.enum(['teacher', 'parent', 'student'], {
    required_error: 'لطفاً نقش خود را انتخاب کنید',
  }),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. ثبت‌نام در Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        throw authError
      }

      // ✅ Profile خودکار توسط trigger database ساخته می‌شود (migration 049)
      // نیازی به insert دستی نیست

      // نمایش پیغام موفقیت
      setSuccess('ثبت‌نام موفق! لطفاً ایمیل خود را چک کنید و لینک تأیید را کلیک کنید.')
    } catch (err: any) {
      console.error('خطای ثبت‌نام:', err)
      
      let errorMessage = 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.'
      
      if (err.message?.includes('already registered')) {
        errorMessage = 'این ایمیل قبلاً ثبت شده است'
      } else if (err.message?.includes('password')) {
        errorMessage = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ثبت‌نام در سیستم</CardTitle>
        <CardDescription>
          برای ایجاد حساب کاربری اطلاعات خود را وارد کنید
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* نمایش خطا */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* نمایش موفقیت */}
          {success && (
            <div className="bg-secondary/10 text-secondary px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* نام کامل */}
          <div className="space-y-2">
            <Label htmlFor="full_name">نام و نام خانوادگی</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="علی احمدی"
              disabled={isLoading}
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* ایمیل */}
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@school.com"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* رمز عبور */}
          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              type="password"
              placeholder="حداقل ۶ کاراکتر"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* نقش */}
          <div className="space-y-2">
            <Label htmlFor="role">نقش</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => {
                setSelectedRole(value)
                setValue('role', value as 'teacher' | 'parent' | 'student')
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="نقش خود را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">معلم</SelectItem>
                <SelectItem value="parent">والد</SelectItem>
                <SelectItem value="student">دانش‌آموز</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              وارد شوید
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}


