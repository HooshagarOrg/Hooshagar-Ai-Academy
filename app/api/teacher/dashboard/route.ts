import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkTimetableCompleteness } from '@/lib/timetable/completeness'
import { ensureSchoolBellSlots } from '@/lib/timetable/seed'
import { toLocalIsoDate } from '@/lib/date/jalali-school'
import type { SchoolWeekday } from '@/lib/timetable/defaults'

/**
 * GET /api/teacher/dashboard
 * پشتیبانی چند کلاس راهنما + بنر برنامهٔ ناقص
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const classIdParam = searchParams.get('class_id')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'دسترسی فقط برای معلمان' },
        { status: 403 }
      )
    }

    const { data: teacherClasses, error: classError } = await supabase
      .from('classes')
      .select('id, name, grade, academic_year, school_id')
      .eq('teacher_id', user.id)
      .order('grade', { ascending: true })
      .limit(20)

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 })
    }

    const classes = teacherClasses || []
    if (classes.length === 0) {
      return NextResponse.json({
        success: true,
        teacher: { name: profile.full_name, class: null, classes: [] },
        students: [],
        stats: {
          totalStudents: 0,
          presentToday: 0,
          attendanceRate: 0,
          averageGrade: 0,
          upcomingExams: 0,
        },
        recentGrades: [],
        alerts: [],
        timetableIncomplete: false,
      })
    }

    const selected =
      classes.find((c) => c.id === classIdParam) ?? classes[0]!

    const todayStr = toLocalIsoDate(new Date())

    const [
      { data: students, error: studentsError },
      { count: upcomingExamsCount },
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name, grade, user_id')
        .eq('class_id', selected.id)
        .order('full_name', { ascending: true })
        .limit(200),
      supabase
        .from('exams')
        .select('id', { count: 'exact', head: true })
        .gte('exam_date', todayStr)
        .in('status', ['scheduled', 'published', 'active']),
    ])

    if (studentsError) {
      return NextResponse.json(
        { error: 'خطا در دریافت دانش‌آموزان' },
        { status: 500 }
      )
    }

    const studentIds = students?.map((s) => s.id) || []

    const [gradesResult, attendanceResult] =
      studentIds.length > 0
        ? await Promise.all([
            supabase
              .from('grades')
              .select('student_id, score, subject, exam_date, exam_type')
              .in('student_id', studentIds)
              .order('exam_date', { ascending: false })
              .limit(100),
            supabase
              .from('attendance')
              .select('student_id, status')
              .in('student_id', studentIds)
              .eq('date', todayStr),
          ])
        : [
            { data: [] as { student_id: string; score: number; subject: string; exam_date: string; exam_type: string }[], error: null },
            { data: [] as { student_id: string; status: string }[], error: null },
          ]

    const allGrades = gradesResult.data
    const todayAttendance = attendanceResult.data

    const lastGradeMap = new Map<string, { score: number; subject: string }>()
    if (allGrades) {
      for (const grade of allGrades) {
        if (!lastGradeMap.has(grade.student_id)) {
          lastGradeMap.set(grade.student_id, {
            score: grade.score,
            subject: grade.subject,
          })
        }
      }
    }

    const attendanceMap = new Map<string, string>()
    if (todayAttendance) {
      todayAttendance.forEach((a) => {
        attendanceMap.set(a.student_id, a.status)
      })
    }

    const studentsWithData =
      students?.map((student) => {
        const lastGrade = lastGradeMap.get(student.id)
        const attendance = attendanceMap.get(student.id) || 'unknown'
        const needsAttention =
          (lastGrade && lastGrade.score < 14) || attendance === 'absent'
        return {
          id: student.id,
          name: student.full_name,
          grade: student.grade,
          lastScore: lastGrade?.score || null,
          lastSubject: lastGrade?.subject || null,
          attendance,
          needsAttention,
        }
      }) || []

    const totalStudents = studentsWithData.length
    const presentToday = studentsWithData.filter(
      (s) => s.attendance === 'present'
    ).length
    const gradesWithScore = studentsWithData
      .filter((s) => s.lastScore !== null)
      .map((s) => s.lastScore!)
    const averageGrade =
      gradesWithScore.length > 0
        ? gradesWithScore.reduce((sum, score) => sum + score, 0) /
          gradesWithScore.length
        : 0

    const recentGrades =
      allGrades?.slice(0, 5).map((g) => {
        const student = students?.find((s) => s.id === g.student_id)
        return {
          id: g.student_id + g.exam_date,
          studentName: student?.full_name || 'نامشخص',
          subject: g.subject,
          score: g.score,
          type: g.exam_type,
          date: g.exam_date,
        }
      }) || []

    const alerts = studentsWithData
      .filter((s) => s.needsAttention)
      .slice(0, 5)
      .map((s) => {
        if (s.lastScore !== null && s.lastScore < 14) {
          return {
            id: s.id,
            type: 'grade_drop',
            student: s.name,
            message: `نمره ${s.lastSubject}: ${s.lastScore} از 20`,
            badgeText: 'افت نمره',
            badgeColor: 'bg-red-500/20 text-red-400 border-red-500/50',
            borderColor: 'border-red-500/50 bg-red-500/10',
            score: s.lastScore,
          }
        }
        if (s.attendance === 'absent') {
          return {
            id: s.id,
            type: 'absence',
            student: s.name,
            message: 'غایب در روز جاری',
            badgeText: 'غیبت',
            badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            borderColor: 'border-orange-500/50 bg-orange-500/10',
          }
        }
        return null
      })
      .filter((a) => a !== null)

    // بنر برنامهٔ ناقص (نه اعلان تکراری)
    let timetableIncomplete = false
    try {
      const schoolId = selected.school_id
      if (schoolId) {
        const bells = await ensureSchoolBellSlots(supabase, schoolId)
        const { data: versions } = await supabase
          .from('class_timetable_versions')
          .select('id, effective_from, effective_to, status')
          .eq('class_id', selected.id)
          .order('effective_from', { ascending: false })
          .limit(5)

        const active =
          (versions || []).find((v) => {
            if (v.effective_from > todayStr) return false
            if (v.effective_to !== null && v.effective_to < todayStr) return false
            return true
          }) ?? versions?.[0]

        if (!active) {
          timetableIncomplete = true
        } else {
          const { data: slots } = await supabase
            .from('class_timetable_slots')
            .select('weekday, slot_index, subject_id, teacher_id')
            .eq('version_id', active.id)
          const result = checkTimetableCompleteness({
            grade: selected.grade,
            bells: bells.map((b) => ({
              slot_index: b.slot_index,
              kind: b.kind as 'lesson' | 'recess' | 'arrival',
            })),
            slots: (slots || []).map((s) => ({
              weekday: s.weekday as SchoolWeekday,
              slot_index: s.slot_index,
              subject_id: s.subject_id,
              teacher_id: s.teacher_id,
            })),
          })
          timetableIncomplete = !result.complete
        }
      }
    } catch {
      // بنر اختیاری — خطا نباید داشبورد را بشکند
    }

    // اعلان یک‌باره به مدیر (idempotent)
    if (
      timetableIncomplete &&
      selected.school_id &&
      selected.name
    ) {
      try {
        const { maybeNotifyIncompleteTimetable } = await import(
          '@/lib/timetable/incomplete-notify'
        )
        await maybeNotifyIncompleteTimetable({
          supabase,
          schoolId: selected.school_id,
          classId: selected.id,
          className: selected.name,
          grade: selected.grade,
        })
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      success: true,
      teacher: {
        name: profile.full_name,
        class: {
          id: selected.id,
          name: selected.name,
          grade: selected.grade,
          academicYear: selected.academic_year,
        },
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          academicYear: c.academic_year,
        })),
      },
      students: studentsWithData,
      stats: {
        totalStudents,
        presentToday,
        attendanceRate:
          totalStudents > 0
            ? Math.round((presentToday / totalStudents) * 100)
            : 0,
        averageGrade: Math.round(averageGrade * 10) / 10,
        upcomingExams: upcomingExamsCount || 0,
      },
      recentGrades,
      alerts,
      timetableIncomplete,
    })
  } catch (error: unknown) {
    console.error('Teacher dashboard error:', error)
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطای سرور', details: message },
      { status: 500 }
    )
  }
}
