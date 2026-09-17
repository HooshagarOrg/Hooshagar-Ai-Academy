import type { SupabaseClient } from '@supabase/supabase-js'
import type { TeacherConflict } from '@/lib/timetable/conflicts'

/** اعلان سیستم به مدیر / ادمین / معاون آموزشی مدرسه — بدون تکرار برای همان کلید */
export async function notifySchoolStaffSystem(params: {
  supabase: SupabaseClient
  schoolId: string
  title: string
  message: string
  actionUrl: string
  kind: 'timetable_conflict' | 'timetable_incomplete'
  dedupeKey: string
}): Promise<void> {
  const { data: staff } = await params.supabase
    .from('profiles')
    .select('id')
    .eq('school_id', params.schoolId)
    .in('role', ['principal', 'admin', 'educational_vp', 'platform_admin'])
    .limit(50)

  const targets = staff || []
  if (targets.length === 0) return

  for (const user of targets) {
    const { data: existing } = await params.supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('notification_type', 'system')
      .contains('notification_data', {
        kind: params.kind,
        dedupe_key: params.dedupeKey,
      })
      .limit(1)
      .maybeSingle()

    if (existing) continue

    await params.supabase.rpc('create_notification', {
      p_user_id: user.id,
      p_type: 'system',
      p_title: params.title,
      p_message: params.message,
      p_data: {
        kind: params.kind,
        dedupe_key: params.dedupeKey,
      },
      p_action_url: params.actionUrl,
      p_priority: params.kind === 'timetable_conflict' ? 'high' : 'normal',
    })
  }
}

export function formatConflictsMessage(conflicts: TeacherConflict[]): string {
  return conflicts
    .slice(0, 5)
    .map((c) => {
      const classes = c.class_names.length
        ? c.class_names.join(' و ')
        : c.class_ids.join(', ')
      return `${c.teacher_name || 'معلم'} — زنگ ${c.slot_index} روز ${c.weekday}: ${classes}`
    })
    .join('؛ ')
}
