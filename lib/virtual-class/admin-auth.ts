import { createClient } from '@/lib/supabase/server'

export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'platform_admin') {
    return { supabase, user: null, profile: null }
  }

  return { supabase, user, profile }
}
