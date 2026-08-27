import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const supabase = await createClient()

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysIso = thirtyDaysAgo.toISOString()

      const [
        studentsRes,
        teachersRes,
        parentsRes,
        schoolsRes,
        badgesRes,
        examsCountRes,
        recentExamsRes,
        attendanceTotalRes,
        absentRes,
        gradesOverviewRes,
        subjectAveragesRes,
        gardenRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('user_badges').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysIso),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('status', 'absent'),
        supabase.rpc('grades_overview').maybeSingle(),
        supabase.rpc('grades_subject_averages', { p_limit: 10 }),
        supabase.rpc('talent_garden_overview').maybeSingle(),
      ])

      if (gradesOverviewRes.error) {
        return NextResponse.json(
          { error: gradesOverviewRes.error.message },
          { status: 500 }
        )
      }
      if (gardenRes.error) {
        return NextResponse.json({ error: gardenRes.error.message }, { status: 500 })
      }

      const gradesOverview = gradesOverviewRes.data as {
        total_grades: number
        average_score: number
        passing_rate: number
      } | null
      const totalGrades = Number(gradesOverview?.total_grades ?? 0)
      const avgScore = Number(gradesOverview?.average_score ?? 0)
      const passingRate = Number(gradesOverview?.passing_rate ?? 0)

      const subjectAverages = (
        (subjectAveragesRes.data || []) as Array<{ subject: string; avg: number }>
      ).map((row) => ({ subject: row.subject, avg: Number(row.avg) }))

      const totalAttendance = attendanceTotalRes.count ?? 0
      const absentCount = absentRes.count ?? 0
      const attendanceRate = totalAttendance > 0
        ? ((totalAttendance - absentCount) / totalAttendance) * 100
        : 0

      const garden = gardenRes.data as {
        total_xp: number
        active_users: number
        avg_level: number
      } | null
      const totalXP = Number(garden?.total_xp ?? 0)
      const activeUsers = Number(garden?.active_users ?? 0)
      const avgLevel = Number(garden?.avg_level ?? 0)

      return NextResponse.json({
        overview: {
          total_students: studentsRes.count ?? 0,
          total_teachers: teachersRes.count ?? 0,
          total_parents: parentsRes.count ?? 0,
          total_schools: schoolsRes.count ?? 0,
        },
        grades: {
          average_score: Math.round(avgScore * 10) / 10,
          total_grades: totalGrades,
          passing_rate: Math.round(passingRate * 10) / 10,
          subject_averages: subjectAverages,
        },
        attendance: {
          average_rate: Math.round(attendanceRate * 10) / 10,
          total_records: totalAttendance,
          absent_count: absentCount,
        },
        gamification: {
          total_xp_awarded: totalXP,
          active_users: activeUsers,
          badges_awarded: badgesRes.count ?? 0,
          avg_level: Math.round(avgLevel * 10) / 10,
        },
        exams: {
          total_exams: examsCountRes.count ?? 0,
          avg_pass_rate: 0,
          recent_count: recentExamsRes.count ?? 0,
        },
      })
    },
    { roles: ['platform_admin', 'admin', 'principal'] }
  )
}

