import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ═══════════════════════════════════════
// GET: دریافت لیست امتحانات
// ═══════════════════════════════════════

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')
    const gradeLevel = searchParams.get('grade_level')
    const classId = searchParams.get('class_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // ساخت کوئری
    let query = supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        subject,
        grade_level,
        exam_date,
        start_time,
        end_time,
        status,
        total_points,
        auto_grade,
        created_at
      `, { count: 'exact' })
      .order('exam_date', { ascending: false })

    // فیلترها
    if (status) {
      query = query.eq('status', status)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }
    if (gradeLevel) {
      query = query.eq('grade_level', parseInt(gradeLevel))
    }
    if (classId) {
      query = query.eq('class_id', classId)
    }

    // صفحه‌بندی
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('خطای دریافت امتحانات:', error)
      return NextResponse.json({ error: 'خطا در دریافت امتحانات' }, { status: 500 })
    }

    return NextResponse.json({
      exams: data,
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
// POST: ایجاد امتحان جدید
// ═══════════════════════════════════════

const createExamSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  subject: z.string().min(1),
  grade_level: z.number().int().min(1).max(12),
  class_id: z.string().uuid().optional(),
  exam_date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  exam_config: z.object({
    shuffle_questions: z.boolean().default(false),
    shuffle_options: z.boolean().default(false),
    show_score_immediately: z.boolean().default(true),
    allow_review: z.boolean().default(true),
    negative_marking: z.boolean().default(false),
    negative_score: z.number().default(0.25),
    passing_score: z.number().min(0).max(100).default(50),
    time_limit_minutes: z.number().min(5).max(300).default(60),
    questions_per_page: z.number().min(1).max(20).default(1),
    calculator_allowed: z.boolean().default(false)
  }).optional(),
  auto_grade: z.boolean().default(true),
  difficulty_distribution: z.object({
    easy: z.number().min(0),
    medium: z.number().min(0),
    hard: z.number().min(0)
  }).optional(),
  question_ids: z.array(z.string().uuid()).optional()
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
    const result = createExamSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        error: 'داده‌های نامعتبر',
        details: result.error.issues
      }, { status: 400 })
    }

    const { question_ids, ...examData } = result.data

    // ایجاد امتحان
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        ...examData,
        status: 'draft',
        total_points: 0,
        created_by: user.id
      })
      .select()
      .single()

    if (examError) {
      console.error('خطای ایجاد امتحان:', examError)
      return NextResponse.json({ error: 'خطا در ایجاد امتحان' }, { status: 500 })
    }

    // اگر سوالاتی انتخاب شده، آن‌ها را به امتحان اضافه کن
    if (question_ids && question_ids.length > 0) {
      // دریافت سوالات از بانک
      const { data: bankQuestions, error: bankError } = await supabase
        .from('question_bank')
        .select('*')
        .in('id', question_ids)

      if (bankError || !bankQuestions) {
        console.error('خطای دریافت سوالات:', bankError)
        return NextResponse.json({ error: 'خطا در دریافت سوالات' }, { status: 500 })
      }

      // کپی سوالات به امتحان
      const examQuestions = bankQuestions.map((q, index) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        correct_answers: q.correct_answers,
        points: q.points,
        question_order: index + 1,
        explanation: q.explanation,
        attachments: q.attachments
      }))

      const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(examQuestions)

      if (questionsError) {
        console.error('خطای افزودن سوالات:', questionsError)
      }

      // بروزرسانی نمره کل و تعداد استفاده
      const totalPoints = bankQuestions.reduce((sum, q) => sum + (q.points || 0), 0)
      await supabase
        .from('exams')
        .update({ total_points: totalPoints })
        .eq('id', exam.id)

      // افزایش usage_count در بانک سوالات
      for (const qId of question_ids) {
        await supabase
          .from('question_bank')
          .update({ usage_count: supabase.rpc('increment', { x: 1 }) })
          .eq('id', qId)
      }
    }

    return NextResponse.json({
      message: 'امتحان با موفقیت ایجاد شد',
      exam_id: exam.id
    }, { status: 201 })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

