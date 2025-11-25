'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LogoutButton } from './LogoutButton'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkSession()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            خوش آمدید! 👋
          </CardTitle>
          <CardDescription>
            شما با موفقیت وارد سیستم هوشاگر شدید
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* اطلاعات کاربر */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">ایمیل شما:</p>
            <p className="text-lg font-medium">{user.email}</p>
          </div>

          {/* نمایش metadata اگر وجود داشت */}
          {user.user_metadata?.full_name && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">نام:</p>
              <p className="text-lg font-medium">
                {user.user_metadata.full_name}
              </p>
            </div>
          )}

          {user.user_metadata?.role && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">نقش:</p>
              <p className="text-lg font-medium">
                {user.user_metadata.role === 'teacher' && '👨‍🏫 معلم'}
                {user.user_metadata.role === 'parent' && '👨‍👩‍👧 والد'}
                {user.user_metadata.role === 'student' && '🎓 دانش‌آموز'}
              </p>
            </div>
          )}

          {/* دکمه خروج */}
          <div className="pt-4 border-t">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
