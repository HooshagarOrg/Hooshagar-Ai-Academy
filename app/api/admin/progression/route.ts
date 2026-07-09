import { NextRequest, NextResponse } from 'next/server'
import { asOne } from '@/lib/supabase/relation'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()

        const { searchParams } = new URL(request.url)
        const grade = searchParams.get('grade')
        const schoolId = searchParams.get('school_id')
        const type = searchParams.get('type') || 'eligible'

        if (type === 'history') {
          const { data: history, error } = await supabase
            .from('student_progression_history')
            .select(`
              *,
              students!inner(
                id,
                profiles!inner(full_name)
              )
            `)
            .order('progression_date', { ascending: false })
            .limit(100)

          if (error) throw error

          return NextResponse.json({ history: history || [] })
        }

        let query = supabase
          .from('students')
          .select(`
            id,
            student_number,
            grade,
            school_id,
            can_login,
            profiles!inner(full_name, phone),
            classes(name)
          `)
          .eq('status', 'active')
          .lt('grade', 12)

        if (grade) query = query.eq('grade', parseInt(grade))
        if (schoolId) query = query.eq('school_id', schoolId)

        const { data: students, error } = await query

        if (error) throw error

        const studentIds = (students || []).map(s => s.id)

        let gradesData: Record<string, number> = {}
        if (studentIds.length > 0) {
          const { data: grades } = await supabase
            .from('grades')
            .select('student_id, score')
            .in('student_id', studentIds)

          if (grades) {
            const groupedGrades = grades.reduce((acc: Record<string, number[]>, g) => {
              if (!acc[g.student_id]) acc[g.student_id] = []
              acc[g.student_id].push(g.score)
              return acc
            }, {})

            gradesData = Object.fromEntries(
              Object.entries(groupedGrades).map(([id, scores]) => [
                id,
                Math.round(scores.reduce((s, g) => s + g, 0) / scores.length * 10) / 10
              ])
            )
          }
        }

        const result = (students || []).map(s => ({
          id: s.id,
          student_number: s.student_number,
          full_name: asOne(s.profiles)?.full_name || 'نامشخص',
          phone: asOne(s.profiles)?.phone as string | undefined,
          grade: s.grade,
          class_name: asOne(s.classes)?.name,
          avg_grade: gradesData[s.id] || 0,
          eligible: (gradesData[s.id] || 0) >= 10,
        }))

        const summary = {
          total: result.length,
          eligible: result.filter(s => s.eligible).length,
          not_eligible: result.filter(s => !s.eligible).length,
        }

        return NextResponse.json({ students: result, summary })
      } catch (error) {
        console.error('خطا در دریافت اطلاعات ارتقاء:', error)
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createClient()

        const body = await request.json()
        const { student_ids, academic_year, mode } = body

        if (!academic_year) {
          return NextResponse.json({ error: 'سال تحصیلی الزامی است' }, { status: 400 })
        }

        let targetStudentIds: string[] = student_ids || []

        if (mode === 'all_eligible' || mode === 'all') {
          const { data: students } = await supabase
            .from('students')
            .select('id, grade')
            .eq('status', 'active')
            .lt('grade', 12)

          if (students) {
            if (mode === 'all') {
              targetStudentIds = students.map(s => s.id)
            } else {
              const { data: grades } = await supabase
                .from('grades')
                .select('student_id, score')
                .in('student_id', students.map(s => s.id))

              if (grades) {
                const avgGrades = grades.reduce((acc: Record<string, number[]>, g) => {
                  if (!acc[g.student_id]) acc[g.student_id] = []
                  acc[g.student_id].push(g.score)
                  return acc
                }, {})

                targetStudentIds = students
                  .filter(s => {
                    const scores = avgGrades[s.id] || []
                    const avg = scores.length > 0
                      ? scores.reduce((a, b) => a + b, 0) / scores.length
                      : 0
                    return avg >= 10
                  })
                  .map(s => s.id)
              }
            }
          }
        }

        if (targetStudentIds.length === 0) {
          return NextResponse.json({ error: 'دانش‌آموزی برای ارتقاء انتخاب نشده' }, { status: 400 })
        }

        const { data: result, error } = await supabase.rpc('promote_students_batch', {
          p_student_ids: targetStudentIds,
          p_academic_year: academic_year,
          p_created_by: ctx.userId,
          p_progression_type: 'normal',
        })

        if (error) {
          const results = []
          let successCount = 0
          let failCount = 0

          for (const studentId of targetStudentIds) {
            try {
              const { data: student } = await supabase
                .from('students')
                .select('id, grade, school_id')
                .eq('id', studentId)
                .single()

              if (!student || student.grade >= 12) {
                failCount++
                continue
              }

              const { data: grades } = await supabase
                .from('grades')
                .select('score')
                .eq('student_id', studentId)

              const avgGrade = grades && grades.length > 0
                ? grades.reduce((s, g) => s + g.score, 0) / grades.length
                : 0

              await supabase
                .from('student_progression_history')
                .insert({
                  student_id: studentId,
                  from_grade: student.grade,
                  to_grade: student.grade + 1,
                  academic_year,
                  progression_type: 'normal',
                  status: 'completed',
                  performance_summary: {
                    avg_grade: Math.round(avgGrade * 10) / 10,
                    progression_date: new Date().toISOString(),
                  },
                  created_by: ctx.userId,
                })

              await supabase
                .from('students')
                .update({
                  grade: student.grade + 1,
                  class_id: null,
                })
                .eq('id', studentId)

              results.push({ student_id: studentId, success: true, new_grade: student.grade + 1 })
              successCount++
            } catch {
              results.push({ student_id: studentId, success: false })
              failCount++
            }
          }

          return NextResponse.json({
            success: true,
            total: targetStudentIds.length,
            promoted: successCount,
            failed: failCount,
            results,
          })
        }

        return NextResponse.json({
          success: true,
          result,
        })
      } catch (error) {
        console.error('خطا در ارتقاء دانش‌آموزان:', error)
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES }
  )
}
