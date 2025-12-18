'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { User, Mail, Lock, Users, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react'

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

      if (authError) throw authError

      setSuccess('✅ ثبت‌نام موفق! لطفاً ایمیل خود را چک کنید.')
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Register error:', err)
      
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

  const roleIcons = {
    teacher: Users,
    parent: User,
    student: GraduationCap,
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 -z-10" />
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] -z-10" />

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>

          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-l from-green-600 to-blue-600 bg-clip-text text-transparent">
              ثبت‌نام در هوشاگر
            </CardTitle>
            <CardDescription className="text-base mt-2">
              حساب کاربری خود را ایجاد کنید
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                نام و نام خانوادگی
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="علی احمدی"
                  disabled={isLoading}
                  className="pr-10 h-11 border-2 focus:border-green-500 transition-colors"
                  {...register('full_name')}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                ایمیل
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@school.com"
                  disabled={isLoading}
                  className="pr-10 h-11 border-2 focus:border-green-500 transition-colors"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                رمز عبور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="حداقل ۶ کاراکتر"
                  disabled={isLoading}
                  className="pr-10 h-11 border-2 focus:border-green-500 transition-colors"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                نقش
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value)
                  setValue('role', value as 'teacher' | 'parent' | 'student')
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="نقش خود را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>معلم</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="parent">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>والد</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>دانش‌آموز</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-l from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-green-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  در حال ثبت‌نام...
                </>
              ) : (
                'ثبت‌نام'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">یا</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-700 font-bold hover:underline"
              >
                وارد شوید
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
