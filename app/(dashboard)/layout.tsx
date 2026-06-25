import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // استفاده از getSession به جای getUser تا از network call به Auth سرور جلوگیری شود
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  // دریافت پروفایل کاربر
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  // دریافت نام مدرسه
  let schoolName: string | undefined
  if (profile?.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .single()
    schoolName = school?.name
  }

  const role = profile?.role || 'student'
  const userName = profile?.full_name || user.email?.split('@')[0] || 'کاربر'

  return (
    <DashboardShell
      role={role}
      userName={userName}
      schoolName={schoolName}
    >
      {children}
    </DashboardShell>
  )
}
