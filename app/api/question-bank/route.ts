import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ═══════════════════════════════════════
// GET: دریافت سوالات از بانک
// ═══════════════════════════════════════

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const gradeLevel = searchParams.get('grade_level')
    const difficulty = searchParams.get('difficulty')
    const questionType = searchParams.get('question_type')
    const chapter = searchParams.get('chapter')
    const topic = searchParams.get('topic')
    const tags = searchParams.get('tags')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // ساخت کوئری
    let query = supabase
      .from('question_bank')
      .select(`
        id,
        question_text,
        question_type,
        subject,
        grade_level,
        chapter,
        topic,
        difficulty,
        options,
        correct_answer,
        points,
        explanation,
        tags,
        usage_count,
        correct_rate,
        is_verified,
        created_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // فیلترها
    if (subject) {
      query = query.eq('subject', subject)
    }
    if (gradeLevel) {
      query = query.eq('grade_level', parseInt(gradeLevel))
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (questionType) {
      query = query.eq('question_type', questionType)
    }
    if (chapter) {
      query = query.eq('chapter', chapter)
    }
    if (topic) {
      query = query.eq('topic', topic)
    }
    if (tags) {
      query = query.contains('tags', [tags])
    }
    if (search) {
      query = query.ilike('question_text', `%${search}%`)
    }

    // صفحه‌بندی
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('خطای دریافت سوالات:', error)
      return NextResponse.json({ error: 'خطا در دریافت سوالات' }, { status: 500 })
    }

    return NextResponse.json({
      questions: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

// ═══════════════════════════════════════
// POST: افزودن سوال به بانک
// ═══════════════════════════════════════

const createQuestionSchema = z.object({
  question_text: z.string().min(10, 'متن سوال باید حداقل 10 کاراکتر باشد').max(2000),
  question_type: z.enum([
    'multiple_choice',
    'true_false',
    'short_answer',
    'essay',
    'matching',
    'fill_blank',
    'numerical',
    'code'
  ]),
  subject: z.string().min(1),
  grade_level: z.number().int().min(1).max(12),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    is_correct: z.boolean()
  })).optional(),
  correct_answer: z.string().optional(),
  correct_answers: z.array(z.string()).optional(),
  points: z.number().min(0.25).max(20).default(1),
  explanation: z.string().max(1000).optional(),
  hint: z.string().max(500).optional(),
  tags: z.array(z.string()).default([])
})

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // بررسی دسترسی معلم
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    // اعتبارسنجی داده‌ها
    const body = await request.json()
    const result = createQuestionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        error: 'داده‌های نامعتبر',
        details: result.error.issues
      }, { status: 400 })
    }

    // ایجاد سوال
    const { data: question, error } = await supabase
      .from('question_bank')
      .insert({
        ...result.data,
        is_verified: false,
        is_active: true,
        usage_count: 0,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('خطای ایجاد سوال:', error)
      return NextResponse.json({ error: 'خطا در ایجاد سوال' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'سوال با موفقیت اضافه شد',
      question_id: question.id
    }, { status: 201 })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

