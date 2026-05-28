import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const BRANCH_BY_FIELD_ID: Record<string, string> = {
  '1': 'math_physics',
  '2': 'experimental',
  '3': 'humanities',
  '4': 'art',
}

async function resolveFieldIds(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  branches: string[]
) {
  const { data: fields } = await supabase
    .from('field_of_study')
    .select('id, branch')
    .in('branch', branches.filter(Boolean))

  const byBranch = new Map(
    (fields || []).map((f) => [f.branch, f.id])
  )
  return branches.map((b) => byBranch.get(b) || null)
}

/** GET — وضعیت انتخاب رشته دانش‌آموز */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
    }

    const { data: selection } = await supabase
      .from('field_selection')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ success: true, selection, student_id: student.id })
  } catch (error) {
    console.error('field-selection GET:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** POST — ثبت ۳ اولویت انتخاب رشته */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    const body = await req.json()
    const { student_id, first, second, third, academic_year } = body

    if (!student_id || !first || !second || !third) {
      return NextResponse.json(
        { error: 'student_id و سه اولویت الزامی است' },
        { status: 400 }
      )
    }

    const branches = [first, second, third].map(
      (id: string) => BRANCH_BY_FIELD_ID[id] || id
    )
    const [firstId, secondId, thirdId] = await resolveFieldIds(supabase, branches)

    const year =
      academic_year ||
      `${new Date().getFullYear() - 621}-${new Date().getFullYear() - 620}`

    const { data: existing } = await supabase
      .from('field_selection')
      .select('id')
      .eq('student_id', student_id)
      .eq('academic_year', year)
      .maybeSingle()

    const payload = {
      student_id,
      first_choice_id: firstId,
      second_choice_id: secondId,
      third_choice_id: thirdId,
      status: 'submitted' as const,
      academic_year: year,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = existing
      ? await supabase
          .from('field_selection')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()
      : await supabase.from('field_selection').insert(payload).select().single()

    if (error) {
      console.error('field-selection submit:', error)
      return NextResponse.json({ error: 'خطا در ثبت انتخاب' }, { status: 500 })
    }

    return NextResponse.json({ success: true, selection: data })
  } catch (error) {
    console.error('field-selection POST:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
