import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security/api-guard';
import { asOne } from '@/lib/supabase/relation';

/**
 * GET /api/student/dashboard
 * دریافت داده‌های داشبورد دانش‌آموز
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
    const supabase = ctx.supabase;
    const userId = ctx.userId;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        grade,
        class_id,
        classes (
          id,
          name,
          grade
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'اطلاعات دانش‌آموز یافت نشد' },
        { status: 404 }
      );
    }

    // 4–6. XP، نمرات، حضور و تکالیف (موازی پس از دانستن student.id)
    const today = new Date().toISOString().split('T')[0];

    const [
      { data: xpData },
      { data: grades },
      { data: todayAttendance },
      { data: homeworkRows },
      { data: classStudents },
    ] = await Promise.all([
      supabase
        .from('talent_garden')
        .select('total_xp, level, coins, current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('grades')
        .select('id, subject, score, exam_type, exam_date')
        .eq('student_id', student.id)
        .order('exam_date', { ascending: false })
        .limit(20),
      supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('homework_submissions')
        .select('id, subject, title, due_date, submission_status')
        .eq('student_id', student.id)
        .in('submission_status', ['pending', 'late', 'not_submitted'])
        .order('due_date', { ascending: true })
        .limit(5),
      student.class_id
        ? supabase
            .from('students')
            .select('user_id')
            .eq('class_id', student.class_id)
            .limit(200)
        : Promise.resolve({ data: null as { user_id: string | null }[] | null }),
    ]);

    const xp = {
      ...(xpData || {
        total_xp: 0,
        level: 1,
        coins: 0,
        current_streak: 0,
        longest_streak: 0,
      }),
      rank: 0,
      total_students: 0,
    };

    // 7. محاسبه میانگین نمرات
    const totalGrades = grades?.length || 0;
    const averageGrade =
      totalGrades > 0
        ? grades!.reduce((sum, g) => sum + g.score, 0) / totalGrades
        : 0;

    // 8. آخرین 5 نمره
    const recentGrades = grades?.slice(0, 5).map((g) => ({
      id: g.id,
      subject: g.subject,
      score: g.score,
      type: g.exam_type,
      date: g.exam_date,
    })) || [];

    // 9. رتبه در کلاس با دو COUNT به‌جای کشیدن همهٔ ردیف‌های XP
    if (classStudents && classStudents.length > 0) {
      const userIds = classStudents.map((s) => s.user_id).filter(Boolean) as string[];

      if (userIds.length > 0) {
        const myXp = xpData?.total_xp ?? 0
        const [{ count: totalStudents }, { count: higher }] = await Promise.all([
          supabase
            .from('talent_garden')
            .select('user_id', { count: 'exact', head: true })
            .in('user_id', userIds),
          supabase
            .from('talent_garden')
            .select('user_id', { count: 'exact', head: true })
            .in('user_id', userIds)
            .gt('total_xp', myXp),
        ])

        xp.total_students = totalStudents ?? 0
        xp.rank = xp.total_students > 0 ? (higher ?? 0) + 1 : 0
      }
    }

    // 10. پاسخ نهایی
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.full_name,
        grade: student.grade,
        class: asOne(student.classes)?.name || 'نامشخص',
      },
      xp: {
        total: xp.total_xp,
        level: xp.level,
        coins: xp.coins,
        currentStreak: xp.current_streak,
        longestStreak: xp.longest_streak,
        rank: xp.rank || 0,
        totalStudents: xp.total_students || 0,
      },
      grades: {
        average: Math.round(averageGrade * 10) / 10,
        total: totalGrades,
        recent: recentGrades,
      },
      attendance: {
        today: todayAttendance?.status || 'unknown',
      },
      homework: (homeworkRows || []).map((h) => ({
        id: h.id,
        subject: h.subject,
        title: h.title,
        due_date: h.due_date,
        status: h.submission_status,
      })),
      schedule: await (async () => {
        if (!student.class_id) return []
        try {
          const { toLocalIsoDate } = await import('@/lib/date/jalali-school')
          const { resolveSchoolDay } = await import('@/lib/timetable/school-day')
          const {
            pickEffectiveVersion,
            resolveDayPeriods,
          } = await import('@/lib/timetable/resolve')
          const {
            ensureNationalHolidays,
            ensureSchoolBellSlots,
          } = await import('@/lib/timetable/seed')

          const { data: cls } = await supabase
            .from('classes')
            .select('id, school_id, grade')
            .eq('id', student.class_id)
            .maybeSingle()
          if (!cls?.school_id) return []

          try {
            await ensureNationalHolidays(supabase)
          } catch {
            /* ignore */
          }

          const today = new Date()
          const todayIso = toLocalIsoDate(today)
          const { data: calendarDays } = await supabase
            .from('academic_calendar_days')
            .select('on_date, kind, title')
            .eq('on_date', todayIso)
            .or(`school_id.is.null,school_id.eq.${cls.school_id}`)

          const dayStatus = resolveSchoolDay(
            today,
            (calendarDays || []).map((d) => ({
              on_date: d.on_date,
              kind: d.kind as 'official_holiday' | 'school_closure' | 'exam_note',
              title: d.title,
            }))
          )
          if (!dayStatus.isSchoolDay) {
            return [
              {
                id: 'holiday',
                title: dayStatus.reason === 'weekend' ? 'تعطیل هفتگی' : (dayStatus.title || 'تعطیل'),
                subject: 'تعطیل',
                progress: 0,
              },
            ]
          }

          const bells = await ensureSchoolBellSlots(supabase, cls.school_id)
          const { data: versions } = await supabase
            .from('class_timetable_versions')
            .select(
              'id, class_id, school_id, academic_year, effective_from, effective_to, status'
            )
            .eq('class_id', student.class_id)
          const version = pickEffectiveVersion(versions || [], todayIso)
          if (!version) return []

          const { data: slots } = await supabase
            .from('class_timetable_slots')
            .select('weekday, slot_index, subject_id, teacher_id, school_subjects(name)')
            .eq('version_id', version.id)
            .eq('weekday', dayStatus.weekday)

          type SlotRow = {
            weekday: number
            slot_index: number
            subject_id: string | null
            teacher_id: string | null
            school_subjects: { name: string } | { name: string }[] | null
          }

          const mapped = ((slots || []) as unknown as SlotRow[]).map((s) => {
            const sub = Array.isArray(s.school_subjects)
              ? s.school_subjects[0]
              : s.school_subjects
            return {
              weekday: s.weekday as 0 | 1 | 2 | 3 | 4,
              slot_index: s.slot_index,
              subject_id: s.subject_id,
              teacher_id: s.teacher_id,
              subject_name: sub?.name ?? null,
              teacher_name: null as string | null,
            }
          })

          const periods = resolveDayPeriods(
            bells.map((b) => ({
              slot_index: b.slot_index,
              kind: b.kind as 'lesson' | 'recess' | 'arrival',
              starts_at: String(b.starts_at).slice(0, 5),
              ends_at: String(b.ends_at).slice(0, 5),
              label: b.label,
            })),
            mapped,
            dayStatus.weekday
          )

          return periods.map((p) => ({
            id: `${p.slot_index}`,
            title:
              p.kind === 'lesson'
                ? p.subject_name || p.label
                : p.kind === 'recess'
                  ? 'تفریح'
                  : 'ورود',
            subject: p.label,
            progress: p.kind === 'lesson' && p.subject_name ? 100 : 0,
            starts_at: p.starts_at,
            ends_at: p.ends_at,
            kind: p.kind,
          }))
        } catch {
          return []
        }
      })(),
    });
    },
    { roles: ['student'] }
  );
}

