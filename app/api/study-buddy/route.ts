import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'
import { gatewayCallAI } from '@/lib/ai/gateway'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const openrouterKey = process.env.OPENROUTER_API_KEY!
const googleApiKey  = process.env.GOOGLE_API_KEY

export const maxDuration = 60

const studyBuddySchema = z.object({
  question: z.string().min(3, 'سوال باید حداقل 3 کاراکتر باشد'),
  studentId: z.string().uuid().optional(),
  grade: z.number().int().min(1).max(12).optional(),
  subject: z.string().optional(),
})

// گرفتن embedding از Gemini
async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    // اول با Google API مستقیم امتحان می‌کنیم
    if (googleApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data.embedding?.values || null
      }
    }

    // اگر نشد، با OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/text-embedding-004',
        input: text
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.data?.[0]?.embedding || null
    }

    return null
  } catch (error) {
    console.error('Embedding error:', error)
    return null
  }
}

// جستجوی similarity در دیتابیس
async function searchMaterials(
  supabase: SupabaseClient,
  embedding: number[],
  grade?: number,
  subject?: string
) {
  try {
    const { data, error } = await supabase.rpc('search_study_materials', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
      filter_grade: grade || null,
      filter_subject: subject || null,
    })

    if (error) {
      console.error('Search error:', error)
      let query = supabase
        .from('study_materials')
        .select('id, title, content, grade, subject')
        .limit(5)
      if (grade) query = query.eq('grade', grade)
      if (subject) query = query.eq('subject', subject)
      const { data: fallbackData } = await query
      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error('Search materials error:', error)
    return []
  }
}

// تولید پاسخ با gateway
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
${context}

**قوانین پاسخ‌دهی:**
- پاسخ را به فارسی ساده و روان بنویسید
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
  return withAuth(request, async (ctx) => {
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
          { status: 403 },
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
        { status: 403 },
      )
    }

    const historyUserId = ctx.userId

    // 1. گرفتن embedding از سوال
    console.log('🔍 Getting embedding...')
    const embedding = await getEmbedding(question)

    let sources: any[] = []
    let context = ''

    // 2. جستجوی similarity (اگر embedding موجود باشد)
    if (embedding) {
      console.log('🔎 Searching materials...')
      sources = await searchMaterials(supabase, embedding, grade, subject)
      
      if (sources.length > 0) {
        context = sources
          .slice(0, 3)
          .map((s: any, i: number) => `[منبع ${i + 1}] ${s.title}:\n${s.content}`)
          .join('\n\n')
      }
    }

    // اگر منبعی پیدا نشد
    if (!context) {
      context = 'منبع خاصی در دیتابیس یافت نشد. لطفاً از دانش عمومی خود استفاده کنید.'
    }

    // 3. تولید پاسخ با Gemini
    console.log('🤖 Generating answer...')
    const answer = await generateAnswer(ctx.userId, question, context)

    // 4. ذخیره در chat_history
    try {
      await supabase.from('chat_history').insert({
        user_id: historyUserId,
        question,
        answer,
        sources: sources.slice(0, 3).map((s: { id: string; title: string; similarity?: number }) => ({
          id: s.id,
          title: s.title,
          similarity: s.similarity,
        })),
      })
        console.log('💾 Saved to chat_history')
      } catch (saveError) {
        console.warn('Could not save to chat_history:', saveError)
      }

    // 5. برگرداندن پاسخ
    return NextResponse.json({
      success: true,
      answer,
      sources: sources.slice(0, 3).map((s: any) => ({
        title: s.title,
        content: s.content?.substring(0, 200) + '...',
        similarity: s.similarity
      }))
    })

  } catch (error: any) {
    console.error('❌ Study Buddy error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  }, { roles: AI_USER_ROLES, rateLimit: 'ai_heavy' })
}


























































