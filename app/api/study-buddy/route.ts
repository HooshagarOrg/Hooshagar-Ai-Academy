import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'
import { gatewayCallAI } from '@/lib/ai/gateway'
import { getTextEmbedding } from '@/lib/ai/embeddings'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const maxDuration = 60

const studyBuddySchema = z.object({
  question: z.string().min(3, 'سوال باید حداقل 3 کاراکتر باشد'),
  studentId: z.string().uuid().optional(),
  grade: z.number().int().min(1).max(12).optional(),
  subject: z.string().optional(),
})

async function searchMaterials(
  supabase: SupabaseClient,
  embedding: number[],
  options: {
    grade?: number
    subject?: string
    schoolId?: string | null
  }
) {
  try {
    const { data, error } = await supabase.rpc('search_study_materials', {
      query_embedding: embedding,
      match_threshold: 0.72,
      match_count: 5,
      filter_grade: options.grade || null,
      filter_subject: options.subject || null,
      filter_school_id: options.schoolId || null,
    })

    if (error) {
      console.error('Search error:', error)
      let query = supabase
        .from('study_materials')
        .select('id, title, content, grade, subject, school_id')
        .eq('is_active', true)
        .limit(5)
      if (options.grade) query = query.eq('grade', options.grade)
      if (options.subject) query = query.eq('subject', options.subject)
      if (options.schoolId) {
        query = query.or(`school_id.eq.${options.schoolId},school_id.is.null`)
      }
      const { data: fallbackData } = await query
      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error('Search materials error:', error)
    return []
  }
}

async function generateAnswer(
  userId: string,
  question: string,
  context: string
): Promise<string> {
  const prompt = `
شما یک دستیار درسی هوشمند و صبور هستید که به دانش‌آموزان ایرانی کمک می‌کنید.

**سوال دانش‌آموز:**
${question}

**منابع درسی مرتبط:**
${context || 'منبع خاصی یافت نشد. اگر مطمئن نیستید بگویید و از دانش عمومی کمک بگیرید.'}

**قوانین پاسخ‌دهی:**
- پاسخ را به فارسی ساده و روان بنویسید
- اگر منابع کافی نیست، صادقانه بگویید و پاسخ کلی کوتاه بدهید
- از اعداد انگلیسی (0-9) استفاده کنید

**پاسخ:**
`

  const response = await gatewayCallAI(userId, 'study_buddy', prompt, {
    maxTokens: 1500,
    temperature: 0.7,
  })

  return response.content
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const { question, studentId, grade, subject } = studyBuddySchema.parse(body)

        const supabase = await createClient()

        if (ctx.role === 'student' && studentId) {
          const { data: ownStudent } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', ctx.userId)
            .single()
          if (!ownStudent || ownStudent.id !== studentId) {
            return NextResponse.json(
              { error: 'دسترسی غیرمجاز', error_code: 'FORBIDDEN' },
              { status: 403 }
            )
          }
        } else if (studentId && STAFF_ROLES.includes(ctx.role)) {
          const { data: targetStudent } = await supabase
            .from('students')
            .select('id')
            .eq('id', studentId)
            .single()
          if (!targetStudent) {
            return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
          }
        } else if (studentId && !STAFF_ROLES.includes(ctx.role)) {
          return NextResponse.json(
            { error: 'دسترسی غیرمجاز', error_code: 'FORBIDDEN' },
            { status: 403 }
          )
        }

        const historyUserId = ctx.userId
        const schoolId = ctx.schoolId

        const embedding = await getTextEmbedding(question)

        let sources: Array<{
          id: string
          title: string
          content?: string
          similarity?: number
          school_id?: string | null
        }> = []
        let context = ''

        if (embedding) {
          sources = await searchMaterials(supabase, embedding, {
            grade,
            subject,
            schoolId,
          })

          if (sources.length > 0) {
            context = sources
              .slice(0, 3)
              .map(
                (s, i) =>
                  `[منبع ${i + 1}${s.school_id ? ' — مدرسه' : ' — سراسری'}] ${s.title}:\n${s.content}`
              )
              .join('\n\n')
          }
        }

        if (!context) {
          context =
            'منبع خاصی در پایگاه دانش مدرسه یافت نشد. لطفاً پاسخ کلی و کوتاه بدهید و پیشنهاد کنید از معلم یا جزوه کمک بگیرند.'
        }

        const answer = await generateAnswer(ctx.userId, question, context)

        try {
          await supabase.from('chat_history').insert({
            user_id: historyUserId,
            question,
            answer,
            sources: sources.slice(0, 3).map((s) => ({
              id: s.id,
              title: s.title,
              similarity: s.similarity,
              school_id: s.school_id ?? null,
            })),
          })
        } catch (saveError) {
          console.warn('Could not save to chat_history:', saveError)
        }

        return NextResponse.json({
          success: true,
          answer,
          sources: sources.slice(0, 3).map((s) => ({
            title: s.title,
            content: s.content ? s.content.substring(0, 200) + '...' : '',
            similarity: s.similarity,
            scope: s.school_id ? 'school' : 'global',
          })),
          rag: {
            school_id: schoolId,
            sources_found: sources.length,
            embedding_ok: Boolean(embedding),
          },
        })
      } catch (error: unknown) {
        console.error('Study Buddy error:', error)
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        const message = error instanceof Error ? error.message : 'خطای سرور'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_heavy' }
  )
}
