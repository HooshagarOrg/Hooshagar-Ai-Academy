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

export interface AvatarChildSummary {
  name: string
  grade: number | null
  className: string
  averageGrade?: number | null
}

export interface AvatarUserContext {
  userId: string
  role: string
  fullName: string
  firstName: string
  schoolName: string | null
  /** دانش‌آموز */
  studentId?: string
  grade?: number | null
  className?: string
  totalXp?: number
  level?: number
  coins?: number
  currentStreak?: number
  todayAttendance?: string
  pendingHomework?: AvatarHomeworkItem[]
  /** والد */
  children?: AvatarChildSummary[]
  unreadNotifications?: number
  latestReportTitle?: string | null
  /** معلم */
  teacherClassName?: string
  studentCount?: number
  todayPresentCount?: number
  todayAbsentCount?: number
  todayLateCount?: number
  pendingHomeworkToGrade?: number
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

async function loadStudentContext(
  supabase: AppSupabase,
  userId: string,
  base: AvatarUserContext
): Promise<AvatarUserContext> {
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

  if (!student) return base

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
    fullName: student.full_name || base.fullName,
    firstName: getFirstName(student.full_name || base.fullName),
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

async function loadParentContext(
  supabase: AppSupabase,
  userId: string,
  base: AvatarUserContext
): Promise<AvatarUserContext> {
  const { data: childrenRows } = await supabase
    .from('students')
    .select('id, full_name, grade, classes ( name )')
    .eq('parent_id', userId)
    .limit(5)

  const children: AvatarChildSummary[] = []
  for (const child of childrenRows ?? []) {
    const { data: grades } = await supabase
      .from('grades')
      .select('score')
      .eq('student_id', child.id)
      .order('exam_date', { ascending: false })
      .limit(10)

    const avg =
      grades && grades.length > 0
        ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
        : null

    children.push({
      name: child.full_name,
      grade: child.grade,
      className: asOne(child.classes)?.name || 'نامشخص',
      averageGrade: avg !== null ? Math.round(avg * 10) / 10 : null,
    })
  }

  const [{ count: unreadCount }, { data: latestReport }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
    supabase
      .from('parent_reports')
      .select('summary, report_type, published_at')
      .eq('parent_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    ...base,
    children,
    unreadNotifications: unreadCount ?? 0,
    latestReportTitle: latestReport?.summary?.slice(0, 120) ?? null,
  }
}

async function loadTeacherContext(
  supabase: AppSupabase,
  userId: string,
  base: AvatarUserContext
): Promise<AvatarUserContext> {
  const { data: teacherClass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', userId)
    .limit(1)
    .maybeSingle()

  if (!teacherClass) {
    return { ...base, teacherClassName: 'بدون کلاس', studentCount: 0 }
  }

  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('class_id', teacherClass.id)

  const studentIds = (students ?? []).map((s) => s.id)
  const today = new Date().toISOString().split('T')[0]

  const [{ data: todayAttendance }, { count: pendingCount }] = await Promise.all([
    studentIds.length > 0
      ? supabase
          .from('attendance')
          .select('status')
          .in('student_id', studentIds)
          .eq('date', today)
      : Promise.resolve({ data: [] as { status: string }[] }),
    studentIds.length > 0
      ? supabase
          .from('homework_submissions')
          .select('id', { count: 'exact', head: true })
          .in('student_id', studentIds)
          .eq('submission_status', 'submitted')
      : Promise.resolve({ count: 0 }),
  ])

  const attendanceRows = todayAttendance ?? []
  const present = attendanceRows.filter((a) => a.status === 'present').length
  const absent = attendanceRows.filter((a) => a.status === 'absent').length
  const late = attendanceRows.filter((a) => a.status === 'late').length

  return {
    ...base,
    teacherClassName: teacherClass.name,
    studentCount: studentIds.length,
    todayPresentCount: present,
    todayAbsentCount: absent,
    todayLateCount: late,
    pendingHomeworkToGrade: pendingCount ?? 0,
  }
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

  if (profile.role === 'student') {
    return loadStudentContext(supabase, userId, base)
  }

  if (profile.role === 'parent') {
    return loadParentContext(supabase, userId, base)
  }

  if (profile.role === 'teacher') {
    return loadTeacherContext(supabase, userId, base)
  }

  return base
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

  if (ctx.role === 'parent') {
    const childrenSummary =
      !ctx.children || ctx.children.length === 0
        ? 'فرزندی ثبت نشده.'
        : ctx.children
            .map(
              (c) =>
                `- ${c.name} | پایه ${c.grade ?? '؟'} | کلاس ${c.className}${c.averageGrade != null ? ` | میانگین نمره: ${c.averageGrade}` : ''}`
            )
            .join('\n')

    roleContext += `
فرزندان:
${childrenSummary}
اعلان خوانده‌نشده: ${ctx.unreadNotifications ?? 0}
آخرین گزارش: ${ctx.latestReportTitle ?? 'گزارش جدیدی نیست'}`
  }

  if (ctx.role === 'teacher') {
    roleContext += `
کلاس: ${ctx.teacherClassName ?? 'نامشخص'}
تعداد دانش‌آموز: ${ctx.studentCount ?? 0}
حضور امروز: ${ctx.todayPresentCount ?? 0} حاضر، ${ctx.todayAbsentCount ?? 0} غایب، ${ctx.todayLateCount ?? 0} تأخیر
تکالیف منتظر تصحیح: ${ctx.pendingHomeworkToGrade ?? 0}`
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
