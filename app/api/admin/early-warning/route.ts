import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'
import { gatewayCallAI } from '@/lib/ai/gateway'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

type AlertRow = {
  student_id: string
  full_name: string
  grade: number | null
  reason: string
  metric: string
  severity: 'medium' | 'high'
}

/**
 * GET /api/admin/early-warning
 * دانش‌آموزان با غیبت بالا یا میانگین نمرهٔ پایین — بدون عدد ساختگی
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ alerts: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const month = new Date().toISOString().slice(0, 7) + '-01'
      const alerts: AlertRow[] = []

      let studentsQuery = ctx.supabase
        .from('students')
        .select('id, full_name, grade')
        .eq('status', 'active')
        .limit(500)

      if (ctx.schoolId) studentsQuery = studentsQuery.eq('school_id', ctx.schoolId)

      const { data: students, error: studentsError } = await studentsQuery
      if (studentsError) {
        return NextResponse.json({ alerts: [], error: studentsError.message }, { status: 500 })
      }

      const studentIds = (students || []).map((s) => s.id)
      if (studentIds.length === 0) {
        return NextResponse.json({ alerts: [], month, message: 'دانش‌آموزی ثبت نشده' })
      }

      const { data: attendanceStats } = await ctx.supabase
        .from('attendance_monthly_stats')
        .select('student_id, attendance_percentage, absent_days, total_days')
        .eq('month', month)
        .in('student_id', studentIds)

      for (const row of attendanceStats || []) {
        const student = students?.find((s) => s.id === row.student_id)
        if (!student) continue
        const pct = row.attendance_percentage ?? 100
        const absent = row.absent_days ?? 0
        if (pct < 75 || absent >= 5) {
          alerts.push({
            student_id: student.id,
            full_name: student.full_name || 'دانش‌آموز',
            grade: student.grade,
            reason: absent >= 5 ? 'غیبت مکرر این ماه' : 'درصد حضور پایین',
            metric: absent >= 5 ? `${absent} روز غیبت` : `${pct}% حضور`,
            severity: pct < 60 || absent >= 8 ? 'high' : 'medium',
          })
        }
      }

      const { data: grades } = await ctx.supabase
        .from('grades')
        .select('student_id, score, max_score')
        .in('student_id', studentIds)
        .gte('exam_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .limit(2000)

      const gradeAgg = new Map<string, { sum: number; count: number }>()
      for (const g of grades || []) {
        const max = g.max_score && g.max_score > 0 ? g.max_score : 20
        const pct = (Number(g.score) / max) * 100
        const cur = gradeAgg.get(g.student_id) || { sum: 0, count: 0 }
        cur.sum += pct
        cur.count += 1
        gradeAgg.set(g.student_id, cur)
      }

      for (const [studentId, agg] of gradeAgg) {
        if (agg.count < 2) continue
        const avg = agg.sum / agg.count
        if (avg >= 55) continue
        const student = students?.find((s) => s.id === studentId)
        if (!student) continue
        if (alerts.some((a) => a.student_id === studentId)) continue
        alerts.push({
          student_id: student.id,
          full_name: student.full_name || 'دانش‌آموز',
          grade: student.grade,
          reason: 'میانگین نمرهٔ پایین (۶۰ روز اخیر)',
          metric: `${Math.round(avg)}%`,
          severity: avg < 45 ? 'high' : 'medium',
        })
      }

      alerts.sort((a, b) => (a.severity === 'high' ? -1 : 1))

      return NextResponse.json({
        alerts,
        month,
        total: alerts.length,
      })
    },
    { roles: ADMIN_PLUS_PRINCIPAL, rateLimit: 'api_default' }
  )
}

/**
 * POST /api/admin/early-warning — تحلیل AI برای یک دانش‌آموز
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const body = await request.json()
      const studentId = body?.student_id as string | undefined
      const reason = body?.reason as string | undefined
      const metric = body?.metric as string | undefined

      if (!studentId || !reason) {
        return NextResponse.json({ error: 'student_id و reason الزامی است' }, { status: 400 })
      }

      const prompt = `به‌عنوان مشاور مدرسه، برای والدین و معلم یک هشدار کوتاه و عملی بنویس.
دانش‌آموز: شناسه ${studentId}
مشکل: ${reason}
شاخص: ${metric || '—'}
فقط ۳ جمله فارسی؛ بدون تشخیص پزشکی؛ پیشنهاد اقدام مشخص.`

      try {
        const result = await gatewayCallAI(ctx.userId, 'early_warning', prompt)
        return NextResponse.json({
          analysis: result.content,
          model: result.model,
          provider: result.provider,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'تحلیل AI ناموفق بود'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL, rateLimit: 'api_default' }
  )
}
