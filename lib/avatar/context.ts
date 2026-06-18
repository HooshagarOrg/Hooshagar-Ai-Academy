/**
 * زمینه کاربر برای آواتار هوشیار — همه نقش‌ها
 */

import { createClient } from '@/lib/supabase/server'
import { asOne } from '@/lib/supabase/relation'
import { getFirstName } from '@/lib/avatar/greeting'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type AppSupabase = SupabaseClient<Database>

export interface AvatarHomeworkItem {
  subject: string
  title: string
  dueDate: string | null
  status: string
}

export interface AvatarUserContext {
  userId: string
  role: string
  fullName: string
  firstName: string
  schoolName: string | null
  /** فقط دانش‌آموز */
  studentId?: string
  grade?: number | null
  className?: string
  totalXp?: number
  level?: number
  coins?: number
  currentStreak?: number
  todayAttendance?: string
  pendingHomework?: AvatarHomeworkItem[]
}

const ROLE_LABELS: Record<string, string> = {
  student: 'دانش‌آموز',
  parent: 'والد',
  teacher: 'معلم',
  principal: 'مدیر مدرسه',
  admin: 'مدیر سیستم',
  platform_admin: 'مدیر پلتفرم',
  counselor: 'مشاور',
}

export async function loadAvatarUserContext(
  userId: string,
  existingClient?: AppSupabase
): Promise<AvatarUserContext | null> {
  const supabase = existingClient ?? (await createClient())

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id')
    .eq('id', userId)
    .single()

  if (!profile?.role) return null

  const fullName = profile.full_name?.trim() || 'کاربر'
  const firstName = getFirstName(fullName)

  let schoolName: string | null = null
  if (profile.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .single()
    schoolName = school?.name ?? null
  }

  const base: AvatarUserContext = {
    userId,
    role: profile.role,
    fullName,
    firstName,
    schoolName,
  }

  if (profile.role !== 'student') {
    return base
  }

  const { data: student } = await supabase
    .from('students')
    .select(`
      id,
      full_name,
      grade,
      class_id,
      classes ( name )
    `)
    .eq('user_id', userId)
    .single()

  if (!student) {
    return base
  }

  const today = new Date().toISOString().split('T')[0]

  const [{ data: xpData }, { data: attendance }, { data: homeworkRows }] = await Promise.all([
    supabase
      .from('talent_garden')
      .select('total_xp, level, coins, current_streak')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('attendance')
      .select('status')
      .eq('student_id', student.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('homework_submissions')
      .select('subject, title, due_date, submission_status')
      .eq('student_id', student.id)
      .in('submission_status', ['pending', 'late', 'not_submitted'])
      .order('due_date', { ascending: true })
      .limit(5),
  ])

  return {
    ...base,
    fullName: student.full_name || fullName,
    firstName: getFirstName(student.full_name || fullName),
    studentId: student.id,
    grade: student.grade,
    className: asOne(student.classes)?.name || 'نامشخص',
    totalXp: xpData?.total_xp ?? 0,
    level: xpData?.level ?? 1,
    coins: xpData?.coins ?? 0,
    currentStreak: xpData?.current_streak ?? 0,
    todayAttendance: attendance?.status ?? 'unknown',
    pendingHomework: (homeworkRows ?? []).map((h) => ({
      subject: h.subject,
      title: h.title,
      dueDate: h.due_date,
      status: h.submission_status,
    })),
  }
}

export function buildAvatarSystemPrompt(ctx: AvatarUserContext): string {
  const roleLabel = ROLE_LABELS[ctx.role] ?? ctx.role

  let roleContext = `نقش: ${roleLabel}\nنام: ${ctx.fullName}`
  if (ctx.schoolName) roleContext += `\nمدرسه: ${ctx.schoolName}`

  if (ctx.role === 'student' && ctx.studentId) {
    const homeworkSummary =
      !ctx.pendingHomework || ctx.pendingHomework.length === 0
        ? 'تکلیف معوقی ندارد.'
        : ctx.pendingHomework
            .map(
              (h) =>
                `- ${h.subject}: ${h.title}${h.dueDate ? ` (موعد: ${h.dueDate})` : ''}`
            )
            .join('\n')

    const attendanceLabel =
      ctx.todayAttendance === 'present'
        ? 'حاضر'
        : ctx.todayAttendance === 'absent'
          ? 'غایب'
          : ctx.todayAttendance === 'late'
            ? 'تأخیر'
            : 'ثبت نشده'

    roleContext += `
پایه: ${ctx.grade ?? 'نامشخص'}
کلاس: ${ctx.className ?? 'نامشخص'}
XP: ${ctx.totalXp ?? 0} | سطح: ${ctx.level ?? 1} | سکه: ${ctx.coins ?? 0} | استریک: ${ctx.currentStreak ?? 0} روز
حضور امروز: ${attendanceLabel}
تکالیف معوق:
${homeworkSummary}`
  }

  return `تو «هوشیار» هستی — دستیار گفتگویی کاربران در اپ هوشاگر.
قوانین:
- همیشه فارسی محاوره‌ای و دوستانه صحبت کن.
- کوتاه جواب بده (حداکثر ۳–۴ جمله مگر کاربر جزئیات بخواهد).
- فقط درباره مدرسه، آموزش و امکانات هوشاگر کمک کن.
- اگر سوال خارج از حوزه بود، مودبانه بگو فقط در زمینه مدرسه کمک می‌کنی.
- اعداد را با رقم انگلیسی بنویس.

اطلاعات کاربر:
${roleContext}`
}

/** @deprecated از loadAvatarUserContext استفاده کنید */
export const loadStudentAvatarContext = loadAvatarUserContext
