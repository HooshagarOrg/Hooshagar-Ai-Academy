import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider'
import { redirect } from 'next/navigation'
import { DEFAULT_UI_THEME, isUiTheme, type UiTheme } from '@/lib/theme/constants'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id, ui_theme')
    .eq('id', user.id)
    .single()

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
  const initialTheme: UiTheme = isUiTheme(profile?.ui_theme) ? profile.ui_theme : DEFAULT_UI_THEME

  return (
    <DashboardThemeProvider initialTheme={initialTheme}>
      <DashboardShell
        role={role}
        userName={userName}
        schoolName={schoolName}
      >
        {children}
      </DashboardShell>
    </DashboardThemeProvider>
  )
}
