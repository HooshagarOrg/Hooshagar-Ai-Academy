import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth, type AuthContext } from '@/lib/security/api-guard'
import { STUDY_MATERIALS_ROLES } from '@/lib/security/sensitive-api-roles'
import { getTextEmbedding } from '@/lib/ai/embeddings'

export const maxDuration = 60

const SUBJECTS = [
  'math',
  'science',
  'persian',
  'english',
  'social',
  'quran',
  'arabic',
  'physics',
  'chemistry',
  'biology',
] as const

const materialSchema = z.object({
  title: z.string().min(3, 'عنوان باید حداقل ۳ کاراکتر باشد').max(200),
  content: z.string().min(20, 'محتوا باید حداقل ۲۰ کاراکتر باشد').max(20000),
  grade: z.number().int().min(1).max(12),
  subject: z.enum(SUBJECTS),
  school_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const bulkSchema = z.object({
  materials: z.array(materialSchema).min(1).max(20),
  school_id: z.string().uuid().nullable().optional(),
})

function resolveSchoolId(
  ctx: AuthContext,
  requested?: string | null
): string | null {
  if (ctx.role === 'platform_admin' || ctx.role === 'admin') {
    return requested === undefined ? ctx.schoolId : requested
  }
  return ctx.schoolId
}

/**
 * GET /api/admin/study-materials
 * لیست مواد RAG مدرسه (یا سراسری)
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)
      const grade = searchParams.get('grade')
      const subject = searchParams.get('subject')
      const scope = searchParams.get('scope') // school | global | all
      const limit = Math.min(Number(searchParams.get('limit') || 50), 100)

      let query = supabase
        .from('study_materials')
        .select('id, title, grade, subject, school_id, is_active, created_at, metadata')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (grade) query = query.eq('grade', Number(grade))
      if (subject) query = query.eq('subject', subject)

      if (scope === 'global') {
        query = query.is('school_id', null)
      } else if (scope === 'school' && ctx.schoolId) {
        query = query.eq('school_id', ctx.schoolId)
      } else if (ctx.role !== 'platform_admin' && ctx.role !== 'admin' && ctx.schoolId) {
        query = query.or(`school_id.eq.${ctx.schoolId},school_id.is.null`)
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ error: 'خطا در دریافت مواد درسی' }, { status: 500 })
      }

      return NextResponse.json({ success: true, materials: data || [], count: data?.length ?? 0 })
    },
    { roles: STUDY_MATERIALS_ROLES }
  )
}

/**
 * POST /api/admin/study-materials
 * ingest یک یا چند ماده درسی با embedding
 *
 * body:
 *   { title, content, grade, subject, school_id? }
 *   یا { materials: [...], school_id? }
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const supabase = await createClient()

        const isBulk = Array.isArray(body?.materials)
        const items = isBulk
          ? bulkSchema.parse(body).materials.map((m) => ({
              ...m,
              school_id:
                m.school_id !== undefined
                  ? m.school_id
                  : resolveSchoolId(ctx, body.school_id),
            }))
          : [
              {
                ...materialSchema.parse(body),
                school_id: resolveSchoolId(
                  ctx,
                  body.school_id === undefined ? undefined : body.school_id
                ),
              },
            ]

        if (
          ctx.role !== 'platform_admin' &&
          ctx.role !== 'admin' &&
          !ctx.schoolId
        ) {
          return NextResponse.json(
            { error: 'مدرسه کاربر مشخص نیست' },
            { status: 400 }
          )
        }

        const results: Array<{
          title: string
          success: boolean
          id?: string
          error?: string
        }> = []

        for (const item of items) {
          const schoolId = resolveSchoolId(ctx, item.school_id)

          if (
            ctx.role !== 'platform_admin' &&
            ctx.role !== 'admin' &&
            schoolId !== ctx.schoolId
          ) {
            results.push({
              title: item.title,
              success: false,
              error: 'فقط می‌توانید برای مدرسه خودتان محتوا اضافه کنید',
            })
            continue
          }

          const embedding = await getTextEmbedding(
            `${item.title}\n\n${item.content}`
          )

          if (!embedding) {
            results.push({
              title: item.title,
              success: false,
              error: 'تولید embedding ناموفق بود',
            })
            continue
          }

          const { data, error } = await supabase
            .from('study_materials')
            .insert({
              title: item.title,
              content: item.content,
              grade: item.grade,
              subject: item.subject,
              school_id: schoolId,
              created_by: ctx.userId,
              embedding,
              is_active: true,
              metadata: {
                ...(item.metadata || {}),
                ingested_at: new Date().toISOString(),
                ingested_by: ctx.userId,
                embedding_model: 'gemini-embedding-001',
              },
            })
            .select('id, title')
            .single()

          if (error) {
            results.push({ title: item.title, success: false, error: error.message })
          } else {
            results.push({ title: item.title, success: true, id: data.id })
          }
        }

        const ok = results.filter((r) => r.success).length
        return NextResponse.json({
          success: ok > 0,
          ingested: ok,
          failed: results.length - ok,
          results,
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'داده‌های نامعتبر', details: error.errors },
            { status: 400 }
          )
        }
        console.error('study-materials ingest error:', error)
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: STUDY_MATERIALS_ROLES, rateLimit: 'ai_general' }
  )
}
