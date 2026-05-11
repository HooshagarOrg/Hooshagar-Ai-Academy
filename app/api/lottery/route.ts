import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

// ============================================
// GET: لیست دوره‌های ثبت‌نام / کلاس‌ها / نتایج
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'periods' // periods | classes | preferences | results
    const periodId = searchParams.get('period_id')

    if (type === 'periods') {
      const { data, error } = await supabase
        .from('registration_periods')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ periods: data })
    }

    if (type === 'classes' && periodId) {
      const { data, error } = await supabase
        .from('lottery_classes')
        .select('*, profiles!lottery_classes_teacher_id_fkey(full_name)')
        .eq('period_id', periodId)
        .order('class_name')
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ classes: data })
    }

    if (type === 'results' && periodId) {
      const { data, error } = await supabase
        .from('lottery_results')
        .select(`
          *,
          students(full_name, student_number),
          lottery_classes(class_name, teacher_name)
        `)
        .eq('period_id', periodId)
        .order('status')
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ results: data })
    }

    if (type === 'my_preferences' && periodId) {
      // دانش‌آموز: اولویت‌های خودش
      const { data: student } = await supabase
        .from('students').select('id').eq('user_id', ctx.userId).single()
      if (!student) return NextResponse.json({ preferences: [] })
      const { data } = await supabase
        .from('lottery_preferences')
        .select('*, lottery_classes(class_name, teacher_name, capacity, enrolled_count)')
        .eq('period_id', periodId)
        .eq('student_id', student.id)
        .order('priority')
      return NextResponse.json({ preferences: data || [] })
    }

    if (type === 'my_result') {
      // دانش‌آموز/والد: نتیجه قرعه‌کشی
      let studentIds: string[] = []
      if (ctx.role === 'student') {
        const { data: s } = await supabase.from('students').select('id').eq('user_id', ctx.userId).single()
        if (s) studentIds = [s.id]
      } else if (ctx.role === 'parent') {
        const { data: children } = await supabase.from('students').select('id').eq('parent_id', ctx.userId)
        studentIds = (children || []).map(c => c.id)
      }
      const { data } = await supabase
        .from('lottery_results')
        .select('*, registration_periods(title, academic_year), lottery_classes(class_name, teacher_name)')
        .in('student_id', studentIds)
        .order('lottery_run_at', { ascending: false })
      return NextResponse.json({ results: data || [] })
    }

    return NextResponse.json({ error: 'نوع درخواست نامعتبر' }, { status: 400 })
  }, {})
}

// ============================================
// POST: ساخت دوره / کلاس / ثبت اولویت / اجرای قرعه‌کشی
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    const supabase = await createClient()
    const body = await request.json()
    const { action } = body

    // --- ادمین: ساخت دوره ---
    if (action === 'create_period') {
      const { title, academic_year, for_grade, from_grade, start_at, end_at, school_id } = body
      if (!title || !academic_year || !for_grade || !from_grade || !start_at || !end_at) {
        return NextResponse.json({ error: 'فیلدهای الزامی پر نشده' }, { status: 400 })
      }
      const { data, error } = await supabase.from('registration_periods').insert({
        title, academic_year, for_grade, from_grade, start_at, end_at,
        school_id: school_id || null,
        status: 'pending',
        created_by: ctx.userId,
      }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, period: data })
    }

    // --- ادمین: افزودن کلاس به دوره ---
    if (action === 'add_class') {
      const { period_id, teacher_id, teacher_name, grade, class_name, capacity, school_id } = body
      if (!period_id || !teacher_name || !grade || !class_name || !capacity) {
        return NextResponse.json({ error: 'فیلدهای الزامی پر نشده' }, { status: 400 })
      }
      const { data, error } = await supabase.from('lottery_classes').insert({
        period_id, teacher_id: teacher_id || null, teacher_name, grade, class_name,
        capacity, school_id: school_id || null,
      }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, class: data })
    }

    // --- ادمین: باز/بستن دوره ---
    if (action === 'set_period_status') {
      const { period_id, status } = body
      const { error } = await supabase
        .from('registration_periods').update({ status }).eq('id', period_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    // --- دانش‌آموز: ثبت اولویت‌ها ---
    if (action === 'submit_preferences') {
      const { period_id, preferences } = body
      // preferences: [{class_id, priority}]
      if (!period_id || !Array.isArray(preferences) || preferences.length === 0) {
        return NextResponse.json({ error: 'اطلاعات اولویت‌ها ارسال نشده' }, { status: 400 })
      }
      const { data: student } = await supabase
        .from('students').select('id').eq('user_id', ctx.userId).single()
      if (!student) return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })

      // حذف اولویت‌های قبلی
      await supabase.from('lottery_preferences')
        .delete().eq('period_id', period_id).eq('student_id', student.id)

      const rows = preferences.map((p: { class_id: string; priority: number }) => ({
        period_id,
        student_id: student.id,
        class_id: p.class_id,
        priority: p.priority,
      }))
      const { error } = await supabase.from('lottery_preferences').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, message: `${rows.length} اولویت ثبت شد` })
    }

    // --- ادمین: اجرای قرعه‌کشی ---
    if (action === 'run_lottery') {
      const { period_id } = body
      if (!period_id) return NextResponse.json({ error: 'شناسه دوره الزامی' }, { status: 400 })

      const { data, error } = await supabase.rpc('run_lottery', { p_period_id: period_id })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, result: data })
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
  }, {})
}

// ============================================
// DELETE: حذف کلاس یا دوره
// ============================================
export async function DELETE(request: NextRequest) {
  return withAuth(request, async () => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'شناسه الزامی' }, { status: 400 })

    if (type === 'class') {
      const { error } = await supabase.from('lottery_classes').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    } else {
      const { error } = await supabase.from('registration_periods').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }, { roles: ADMIN_PLUS_PRINCIPAL })
}
