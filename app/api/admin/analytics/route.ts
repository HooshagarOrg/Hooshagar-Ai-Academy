import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { fetchAllPaged } from '@/lib/supabase/paginate'

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
        gradesPage,
        gamPage,
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
        fetchAllPaged<{ score: number; max_score: number | null; subject: string }>((from, to) =>
          supabase.from('grades').select('score, max_score, subject').range(from, to)
        ),
        fetchAllPaged<{ xp: number | null; level: number | null }>((from, to) =>
          supabase.from('talent_garden').select('xp, level').range(from, to)
        ),
      ])

      if (gradesPage.error) {
        return NextResponse.json({ error: gradesPage.error }, { status: 500 })
      }
      if (gamPage.error) {
        return NextResponse.json({ error: gamPage.error }, { status: 500 })
      }

      const gradesData = gradesPage.data
      const avgScore = gradesData.length > 0
        ? gradesData.reduce((sum, g) => sum + ((g.score / (g.max_score || 20)) * 20), 0) / gradesData.length
        : 0
      const passingRate = gradesData.length > 0
        ? (gradesData.filter(g => (g.score / (g.max_score || 20)) >= 0.6).length / gradesData.length) * 100
        : 0

      const subjectMap: Record<string, { total: number; count: number }> = {}
      for (const g of gradesData) {
        if (!subjectMap[g.subject]) subjectMap[g.subject] = { total: 0, count: 0 }
        subjectMap[g.subject].total += (g.score / (g.max_score || 20)) * 20
        subjectMap[g.subject].count++
      }
      const subjectAverages = Object.entries(subjectMap)
        .map(([subject, { total, count }]) => ({ subject, avg: total / count }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10)

      const totalAttendance = attendanceTotalRes.count ?? 0
      const absentCount = absentRes.count ?? 0
      const attendanceRate = totalAttendance > 0
        ? ((totalAttendance - absentCount) / totalAttendance) * 100
        : 0

      const gamData = gamPage.data
      const totalXP = gamData.reduce((sum, g) => sum + (g.xp || 0), 0)
      const avgLevel = gamData.length > 0
        ? gamData.reduce((sum, g) => sum + (g.level || 1), 0) / gamData.length
        : 0

      return NextResponse.json({
        overview: {
          total_students: studentsRes.count ?? 0,
          total_teachers: teachersRes.count ?? 0,
          total_parents: parentsRes.count ?? 0,
          total_schools: schoolsRes.count ?? 0,
        },
        grades: {
          average_score: Math.round(avgScore * 10) / 10,
          total_grades: gradesData.length,
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
          active_users: gamData.filter(g => (g.xp || 0) > 0).length,
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

