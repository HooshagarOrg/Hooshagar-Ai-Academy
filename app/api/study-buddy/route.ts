import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openrouterKey = process.env.OPENROUTER_API_KEY!
const googleApiKey = process.env.GOOGLE_API_KEY

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // درخواست در دقیقه
const RATE_LIMIT_WINDOW = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

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
  supabase: any,
  embedding: number[],
  grade?: number,
  subject?: string
) {
  try {
    // استفاده از تابع search_study_materials
    const { data, error } = await supabase.rpc('search_study_materials', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
      filter_grade: grade || null,
      filter_subject: subject || null
    })

    if (error) {
      console.error('Search error:', error)
      // اگر تابع وجود نداشت، جستجوی ساده
      const { data: fallbackData } = await supabase
        .from('study_materials')
        .select('id, title, content, grade, subject')
        .eq(grade ? 'grade' : 'id', grade || supabase.auth.user()?.id)
        .limit(5)
      
      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error('Search materials error:', error)
    return []
  }
}

// تولید پاسخ با Gemini
async function generateAnswer(question: string, context: string): Promise<string> {
  const prompt = `
شما یک دستیار درسی هوشمند و صبور هستید که به دانش‌آموزان ایرانی کمک می‌کنید.

**سوال دانش‌آموز:**
${question}

**منابع درسی مرتبط:**
${context}

**قوانین پاسخ‌دهی:**
- پاسخ را به فارسی ساده و روان بنویسید
- مفاهیم را با مثال توضیح دهید
- اگر منابع کافی نیست، از دانش عمومی خود استفاده کنید
- پاسخ باید آموزشی و دوستانه باشد
- از اعداد انگلیسی (0-9) استفاده کنید
- فرمول‌ها را واضح بنویسید

**پاسخ:**
`

  const modelsToTry = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.5-flash',
    'google/gemini-pro',
  ]

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Hooshagar Study Buddy'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }
    } catch (error) {
      console.warn(`Model ${model} failed:`, error)
      continue
    }
  }

  return 'متأسفانه در حال حاضر نمی‌توانم به سوال شما پاسخ دهم. لطفاً دوباره تلاش کنید.'
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌های شما زیاد است. لطفاً یک دقیقه صبر کنید.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    console.log('📚 Study Buddy request:', body)

    const { question, studentId, grade, subject } = studyBuddySchema.parse(body)

    const supabase = createClient(supabaseUrl, supabaseKey)

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
    const answer = await generateAnswer(question, context)

    // 4. ذخیره در chat_history
    if (studentId) {
      try {
        await supabase.from('chat_history').insert({
          user_id: studentId,
          question,
          answer,
          sources: sources.slice(0, 3).map((s: any) => ({
            id: s.id,
            title: s.title,
            similarity: s.similarity
          }))
        })
        console.log('💾 Saved to chat_history')
      } catch (saveError) {
        console.warn('Could not save to chat_history:', saveError)
      }
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
}













