import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import StudentsTable from './StudentsTable'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// =====================================
// Helper: ایجاد Supabase Client
// =====================================

function getSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // در Server Component ممکن است set کار نکند
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // در Server Component ممکن است remove کار نکند
          }
        },
      },
    }
  )
}

// =====================================
// دریافت لیست دانش‌آموزان
// =====================================

async function getStudents() {
  const supabase = getSupabaseClient()
  
  // بررسی احراز هویت
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }
  
  // بررسی نقش کاربر
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (userError || !userData || userData.role !== 'teacher') {
    redirect('/dashboard')
  }
  
  // دریافت لیست دانش‌آموزان
  // معلم فقط دانش‌آموزان کلاس‌های خودش را می‌بیند
  const { data: teacherClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id)
  
  if (!teacherClasses || teacherClasses.length === 0) {
    return { students: [], message: 'شما هنوز کلاسی ندارید' }
  }
  
  const classIds = teacherClasses.map(c => c.id)
  
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      grade,
      created_at,
      user:users!students_user_id_fkey (
        id,
        full_name,
        email
      ),
      class:classes!students_class_id_fkey (
        id,
        name,
        academic_year
      )
    `)
    .in('class_id', classIds)
    .order('created_at', { ascending: false })
  
  if (studentsError) {
    console.error('❌ خطای دریافت دانش‌آموزان:', studentsError)
    return { students: [], error: 'خطا در دریافت دانش‌آموزان' }
  }
  
  return { students: students || [] }
}

// =====================================
// Page Component (Server Component)
// =====================================

export default async function TeacherStudentsPage() {
  const { students, message, error } = await getStudents()
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card>
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive text-lg mb-4">{error}</p>
              <p className="text-muted-foreground">
                لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید
              </p>
            </div>
          ) : message ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{message}</p>
            </div>
          ) : (
            <StudentsTable initialStudents={students} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================
// Loading Component
// =====================================

export function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================
// Metadata
// =====================================

export const metadata = {
  title: 'دانش‌آموزان | هوشاگر',
  description: 'مدیریت دانش‌آموزان کلاس‌های خود',
}












