import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider'
import { DashboardSessionPending } from '@/components/layout/dashboard-session-pending'
import { DEFAULT_UI_THEME, isUiTheme, type UiTheme } from '@/lib/theme/constants'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <DashboardSessionPending />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id, ui_theme')
    .eq('id', user.id)
    .maybeSingle()

  let schoolName: string | undefined
  if (profile?.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .maybeSingle()
    schoolName = school?.name
  }

  const role = profile?.role || 'student'
  const userName = profile?.full_name || user.email?.split('@')[0] || 'کاربر'
  const initialTheme: UiTheme = isUiTheme(profile?.ui_theme) ? profile.ui_theme : DEFAULT_UI_THEME

  let contextLabel: string | undefined
  if (role === 'parent') {
    const { data: children } = await supabase
      .from('students')
      .select('full_name, grade')
      .eq('parent_id', user.id)
      .order('full_name', { ascending: true })
      .limit(3)

    if (children && children.length > 0) {
      const first = children[0]
      const firstLabel = first.grade
        ? `${first.full_name} · پایه ${first.grade}`
        : first.full_name
      contextLabel =
        children.length === 1
          ? `فرزند: ${firstLabel}`
          : `فرزند: ${firstLabel} و ${children.length - 1} نفر دیگر`
    }
  }

  return (
    <DashboardThemeProvider initialTheme={initialTheme}>
      <DashboardShell
        role={role}
        userName={userName}
        schoolName={schoolName}
        contextLabel={contextLabel}
      >
        {children}
      </DashboardShell>
    </DashboardThemeProvider>
  )
}
