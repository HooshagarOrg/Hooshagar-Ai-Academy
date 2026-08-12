import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'
import { gatewayCallAIJson, AIQuotaExceededError } from '@/lib/ai/gateway'

export const maxDuration = 60

const TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

const generateSchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1).max(15),
  week_start: z.string().min(8).max(12),
  week_end: z.string().min(8).max(12),
  extra_notes: z.string().max(2000).optional(),
})

const sendSchema = z.object({
  report_id: z.string().uuid(),
})

type WeeklyAi = {
  summary: string
  positive_points: string[]
  improvement_points: string[]
  parent_suggestions: string[]
}

function mondayOfThisWeek(d = new Date()): string {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('weekly_reports')
        .select(
          'id, student_id, week_start, week_end, summary, positive_points, improvement_points, parent_suggestions, sent_to_parent, sent_at, created_at'
        )
        .eq('teacher_id', ctx.userId)
        .order('created_at', { ascending: false })
        .limit(40)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const studentIds = [...new Set((data || []).map((r) => r.student_id))]
      let names = new Map<string, string>()
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('id, full_name')
          .in('id', studentIds)
        for (const s of students || []) names.set(s.id, s.full_name)
      }

      return NextResponse.json({
        reports: (data || []).map((r) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: names.get(r.student_id) || 'دانش‌آموز',
          weekStart: r.week_start,
          weekEnd: r.week_end,
          summary: r.summary,
          positivePoints: r.positive_points,
          improvementPoints: r.improvement_points,
          parentSuggestions: r.parent_suggestions,
          sent: r.sent_to_parent,
        })),
      })
    },
    { roles: TEACHER_ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const parsed = generateSchema.safeParse(await request.json())
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
            { status: 400 }
          )
        }

        const { student_ids, week_start, week_end, extra_notes } = parsed.data
        const supabase = await createClient()

        const { data: students, error: stErr } = await supabase
          .from('students')
          .select('id, full_name, school_id, grade')
          .in('id', student_ids)

        if (stErr) {
          return NextResponse.json({ error: stErr.message }, { status: 500 })
        }

        const created: Array<{
          id: string
          studentId: string
          studentName: string
          summary: string
          positivePoints: string[]
          improvementPoints: string[]
          parentSuggestions: string[]
          notesCount: number
          sent: boolean
        }> = []

        for (const student of students || []) {
          const schoolId = student.school_id || ctx.schoolId
          if (!schoolId) continue

          const { data: behaviors } = await supabase
            .from('behavior_reports')
            .select('report_date, positive_behaviors, negative_behaviors, notes')
            .eq('student_id', student.id)
            .gte('report_date', week_start)
            .lte('report_date', week_end)
            .limit(20)

          const behaviorLines = (behaviors || [])
            .map((b) => {
              const pos = Array.isArray(b.positive_behaviors) ? b.positive_behaviors.join('، ') : ''
              const neg = Array.isArray(b.negative_behaviors) ? b.negative_behaviors.join('، ') : ''
              return `${b.report_date}: مثبت [${pos || '—'}] | نیازمند بهبود [${neg || '—'}]${b.notes ? ` | ${b.notes}` : ''}`
            })
            .join('\n')

          const prompt = `شما معلم پایه ${student.grade ?? ''} در مدرسه ایران هستید.
برای دانش‌آموز «${student.full_name}» یک گزارش هفتگی کوتاه و محترمانه به فارسی بنویسید.
بازه: ${week_start} تا ${week_end}
${behaviorLines ? `گزارش‌های رفتاری همین هفته:\n${behaviorLines}` : 'گزارش رفتاری ثبت‌شده‌ای در این بازه نیست؛ بر اساس روند کلی کلاس بنویسید و حدس نزنید.'}
${extra_notes ? `یادداشت معلم: ${extra_notes}` : ''}

خروجی فقط JSON:
{
  "summary": "۳ تا ۵ جمله خلاصه عملکرد",
  "positive_points": ["نقطه قوت ۱", "نقطه قوت ۲"],
  "improvement_points": ["نکته بهبود ۱"],
  "parent_suggestions": ["پیشنهاد به والدین ۱", "پیشنهاد ۲"]
}`

          const { data: ai } = await gatewayCallAIJson<WeeklyAi>(
            ctx.userId,
            'weekly_report',
            prompt,
            { temperature: 0.5, maxTokens: 1200 }
          )

          const { data: row, error } = await supabase
            .from('weekly_reports')
            .insert({
              student_id: student.id,
              teacher_id: ctx.userId,
              school_id: schoolId,
              week_start,
              week_end,
              summary: ai.summary,
              positive_points: ai.positive_points ?? [],
              improvement_points: ai.improvement_points ?? [],
              parent_suggestions: ai.parent_suggestions ?? [],
              sent_to_parent: false,
            })
            .select('id')
            .single()

          if (error || !row) {
            return NextResponse.json(
              { error: error?.message || 'ذخیره گزارش ناموفق بود' },
              { status: 400 }
            )
          }

          created.push({
            id: row.id,
            studentId: student.id,
            studentName: student.full_name,
            summary: ai.summary,
            positivePoints: ai.positive_points ?? [],
            improvementPoints: ai.improvement_points ?? [],
            parentSuggestions: ai.parent_suggestions ?? [],
            notesCount: (behaviors || []).length,
            sent: false,
          })
        }

        return NextResponse.json({ success: true, reports: created, defaultWeekStart: mondayOfThisWeek() })
      } catch (error: unknown) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { error: error.message, error_code: 'AI_QUOTA_EXCEEDED' },
            { status: 429 }
          )
        }
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'خطا در تولید گزارش' },
          { status: 500 }
        )
      }
    },
    { roles: TEACHER_ROLES, rateLimit: 'ai_generate' }
  )
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const parsed = sendSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json({ error: 'شناسه گزارش نامعتبر است' }, { status: 400 })
      }

      const supabase = await createClient()
      const { error } = await supabase
        .from('weekly_reports')
        .update({ sent_to_parent: true, sent_at: new Date().toISOString() })
        .eq('id', parsed.data.report_id)
        .eq('teacher_id', ctx.userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    },
    { roles: TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
