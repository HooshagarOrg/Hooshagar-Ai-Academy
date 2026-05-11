import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

// ============================================
// GET: سلامت جریان داده در سیستم
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const supabase = await createClient()

      // اجرای تابع SQL
      const { data: stats } = await supabase.rpc('get_data_flow_stats')

      // یافتن نقاط ضعف
      const issues: { severity: 'high' | 'medium' | 'low'; title: string; detail: string; count: number }[] = []

      if (stats) {
        const s = stats as Record<string, number>

        if (s.orphan_students > 0) {
          issues.push({
            severity: 'high',
            title: 'دانش‌آموزان بدون حساب کاربری',
            detail: 'این دانش‌آموزان نمی‌توانند وارد سیستم شوند یا در آزمون شرکت کنند.',
            count: s.orphan_students,
          })
        }

        if (s.orphan_parents > 0) {
          issues.push({
            severity: 'medium',
            title: 'والدین بدون فرزند',
            detail: 'این والدین به هیچ دانش‌آموزی متصل نیستند و نمرات/گزارشی دریافت نمی‌کنند.',
            count: s.orphan_parents,
          })
        }

        const studentsWithoutParent = (s.students_total || 0) - (s.students_with_parent || 0)
        if (studentsWithoutParent > 0) {
          issues.push({
            severity: 'medium',
            title: 'دانش‌آموزان بدون والد',
            detail: 'والدین این دانش‌آموزان به سامانه دسترسی ندارند.',
            count: studentsWithoutParent,
          })
        }

        if (s.teachers_total === 0) {
          issues.push({
            severity: 'high',
            title: 'هیچ معلمی ثبت نشده',
            detail: 'بدون معلم، ثبت نمره و آزمون ممکن نیست.',
            count: 0,
          })
        }
      }

      // بررسی اتصال جداول مهم
      const checks: { table: string; ok: boolean; count: number }[] = []
      const tables = ['profiles', 'students', 'grades', 'exams', 'classes', 'messages_direct']
      for (const t of tables) {
        const { count, error } = await supabase
          .from(t)
          .select('id', { count: 'exact', head: true })
        checks.push({ table: t, ok: !error, count: count || 0 })
      }

      return NextResponse.json({
        stats: stats || {},
        issues,
        tables: checks,
      })
    },
    { roles: ADMIN_ROLES, rateLimit: 'api_default' }
  )
}
