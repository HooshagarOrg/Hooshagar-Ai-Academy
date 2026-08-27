import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider'
import { DashboardSessionPending } from '@/components/layout/dashboard-session-pending'
import { DEFAULT_UI_THEME, isUiTheme, type UiTheme } from '@/lib/theme/constants'
import { getProfileCached } from '@/lib/cache/profile-cache'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerStore = await headers()
  const headerUserId = headerStore.get('x-user-id')
  const headerRole = headerStore.get('x-user-role')
  const headerSchoolId = headerStore.get('x-school-id')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <DashboardSessionPending />
  }

  // نقش/مدرسه از middleware (پس از strip هدر جعلی) — نام و تم از کش پروفایل
  const profile = await getProfileCached(user.id, async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, role, school_id, email, full_name, ui_theme')
      .eq('id', user.id)
      .maybeSingle()
    if (!data) return null
    return {
      id: data.id,
      role: data.role,
      school_id: data.school_id ?? null,
      email: data.email ?? null,
      full_name: data.full_name ?? null,
      ui_theme: data.ui_theme ?? null,
    }
  })

  const role = headerRole || profile?.role || 'student'
  const schoolId = headerSchoolId || profile?.school_id || null
  const userName =
    profile?.full_name || user.email?.split('@')[0] || 'کاربر'
  const initialTheme: UiTheme = isUiTheme(profile?.ui_theme)
    ? profile.ui_theme
    : DEFAULT_UI_THEME

  let schoolName: string | undefined
  if (schoolId) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .maybeSingle()
    schoolName = school?.name
  }

  let contextLabel: string | undefined
  if (role === 'parent') {
    const parentId = headerUserId || user.id
    const { data: children } = await supabase
      .from('students')
      .select('full_name, grade')
      .eq('parent_id', parentId)
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
