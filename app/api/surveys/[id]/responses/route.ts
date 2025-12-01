import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ═══════════════════════════════════════
// POST: ثبت پاسخ نظرسنجی
// ═══════════════════════════════════════

const responseSchema = z.object({
  responses: z.array(z.object({
    question_id: z.string().uuid(),
    answer_value: z.string().optional(),
    answer_rating: z.number().optional(),
    answer_options: z.array(z.string()).optional(),
    answer_ranking: z.array(z.number()).optional()
  }))
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // دریافت پروفایل کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // بررسی نظرسنجی
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, status, is_anonymous, allow_multiple_responses, end_date')
      .eq('id', params.id)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'نظرسنجی یافت نشد' }, { status: 404 })
    }

    // بررسی وضعیت نظرسنجی
    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'نظرسنجی فعال نیست' }, { status: 400 })
    }

    // بررسی تاریخ پایان
    if (new Date(survey.end_date) < new Date()) {
      return NextResponse.json({ error: 'مهلت نظرسنجی به پایان رسیده' }, { status: 400 })
    }

    // بررسی پاسخ تکراری
    if (!survey.allow_multiple_responses) {
      const { data: existingResponse } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', params.id)
        .eq('respondent_id', user.id)
        .limit(1)

      if (existingResponse && existingResponse.length > 0) {
        return NextResponse.json({ error: 'شما قبلاً در این نظرسنجی شرکت کرده‌اید' }, { status: 400 })
      }
    }

    // اعتبارسنجی داده‌ها
    const body = await request.json()
    const result = responseSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        error: 'داده‌های نامعتبر',
        details: result.error.issues
      }, { status: 400 })
    }

    // ثبت پاسخ‌ها
    const responsesData = result.data.responses.map(r => ({
      survey_id: params.id,
      question_id: r.question_id,
      respondent_id: survey.is_anonymous ? null : user.id,
      respondent_role: profile?.role || null,
      answer_value: r.answer_value || null,
      answer_rating: r.answer_rating || null,
      answer_options: r.answer_options || null,
      answer_ranking: r.answer_ranking || null
    }))

    const { error: responseError } = await supabase
      .from('survey_responses')
      .insert(responsesData)

    if (responseError) {
      console.error('خطای ثبت پاسخ:', responseError)
      return NextResponse.json({ error: 'خطا در ثبت پاسخ‌ها' }, { status: 500 })
    }

    // بروزرسانی تعداد پاسخ‌ها
    await supabase.rpc('calculate_survey_statistics', { p_survey_id: params.id })

    // اضافه کردن XP به کاربر (اگر سیستم XP فعال باشد)
    const xpReward = 50
    try {
      await supabase
        .from('talent_garden')
        .update({
          total_xp: supabase.rpc('increment_xp', { amount: xpReward })
        })
        .eq('user_id', user.id)
    } catch (e) {
      // اگر خطا داد، ادامه بده (XP اختیاری است)
    }

    return NextResponse.json({
      message: 'پاسخ‌های شما با موفقیت ثبت شد',
      xp_earned: xpReward
    }, { status: 201 })

  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

// ═══════════════════════════════════════
// GET: دریافت پاسخ‌های نظرسنجی (برای مدیران)
// ═══════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const cookieStore = cookies()
    const supabase = createClient()

    // دریافت کاربر فعلی
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 })
    }

    // بررسی دسترسی مدیر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    // دریافت پاسخ‌ها
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('survey_responses')
      .select(`
        id,
        question_id,
        respondent_role,
        answer_value,
        answer_rating,
        answer_options,
        answer_ranking,
        created_at
      `, { count: 'exact' })
      .eq('survey_id', params.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('خطای دریافت پاسخ‌ها:', error)
      return NextResponse.json({ error: 'خطا در دریافت پاسخ‌ها' }, { status: 500 })
    }

    return NextResponse.json({
      responses: data,
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

