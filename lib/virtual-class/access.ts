import type { SkyroomAccess } from '@/lib/types/virtual-class.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface JoinAccessResult {
  allowed: boolean
  access: SkyroomAccess
  reason?: string
}

export async function resolveVirtualClassJoinAccess(
  supabase: SupabaseClient,
  userId: string,
  role: string,
  virtualClass: {
    class_id: string
    teacher_id: string | null
  }
): Promise<JoinAccessResult> {
  if (role === 'platform_admin') {
    return { allowed: true, access: 3 }
  }

  if (virtualClass.teacher_id === userId) {
    return { allowed: true, access: 3 }
  }

  const { data: student } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (student?.class_id === virtualClass.class_id) {
    return { allowed: true, access: 1 }
  }

  const { data: child } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('parent_id', userId)
    .eq('class_id', virtualClass.class_id)
    .maybeSingle()

  if (child) {
    return { allowed: true, access: 1 }
  }

  return { allowed: false, access: 1, reason: 'شما به این کلاس مجازی دسترسی ندارید' }
}

export function isWithinSessionWindow(
  startsAt: string,
  endsAt: string,
  bufferMinutes: number,
  now = new Date()
): boolean {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const bufferMs = bufferMinutes * 60 * 1000
  const t = now.getTime()
  return t >= start.getTime() - bufferMs && t <= end.getTime() + bufferMs
}

export function computeLoginTtlSeconds(endsAt: string, extraMinutes = 30): number {
  const end = new Date(endsAt).getTime()
  const now = Date.now()
  const diffSec = Math.floor((end - now) / 1000) + extraMinutes * 60
  return Math.min(Math.max(diffSec, 300), 7200)
}
