// =====================================
// 🎨 Specialty Assessments API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { SPECIALTY_API_ROLES } from '@/lib/security/sensitive-api-roles'

// ==========================================
// GET - List Assessments by Type
// ==========================================
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(req.url)
      const type = searchParams.get('type')
      const student_id = searchParams.get('student_id')
      const school_id = searchParams.get('school_id')
      const semester = searchParams.get('semester')
      const academic_year = searchParams.get('academic_year')
      const limit = parseInt(searchParams.get('limit') || '50')

      if (!type || !['music', 'art', 'sports', 'stem'].includes(type)) {
        return NextResponse.json(
          { error: 'نوع ارزیابی مشخص نشده یا نامعتبر است' },
          { status: 400 }
        )
      }

      const tableName = `${type}_assessments`

      let query = supabase
        .from(tableName)
        .select('*')
        .order('assessment_date', { ascending: false })
        .limit(limit)

      if (student_id) {
        query = query.eq('student_id', student_id)
      }
      if (school_id) {
        query = query.eq('school_id', school_id)
      }
      if (semester) {
        query = query.eq('semester', semester)
      }
      if (academic_year) {
        query = query.eq('academic_year', academic_year)
      }

      const { data, error } = await query

      if (error) {
        console.error('خطا در دریافت ارزیابی‌ها:', error)
        return NextResponse.json(
          { error: 'خطا در دریافت ارزیابی‌ها' },
          { status: 500 }
        )
      }

      const assessments = data ?? []

      return NextResponse.json({ assessments })
    } catch (error) {
      console.error('خطای سرور:', error)
      return NextResponse.json(
        { error: 'خطای داخلی سرور' },
        { status: 500 }
      )
    }
  }, { roles: SPECIALTY_API_ROLES })
}

// ==========================================
// POST - Create New Assessment
// ==========================================
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(req.url)
      const type = searchParams.get('type')

      if (!type || !['music', 'art', 'sports', 'stem'].includes(type)) {
        return NextResponse.json(
          { error: 'نوع ارزیابی مشخص نشده یا نامعتبر است' },
          { status: 400 }
        )
      }

      const body = await req.json()
      const tableName = `${type}_assessments`

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', body.student_id)
        .single()

      if (studentError || !student) {
        return NextResponse.json(
          { error: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        )
      }

      const { data: newAssessment, error: insertError } = await supabase
        .from(tableName)
        .insert({
          ...body,
          school_id: student.school_id,
        })
        .select()
        .single()

      if (insertError) {
        console.error('خطا در ثبت ارزیابی:', insertError)
        return NextResponse.json(
          { error: 'خطا در ثبت ارزیابی' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'ارزیابی با موفقیت ثبت شد',
        assessment: newAssessment,
      }, { status: 201 })
    } catch (error) {
      console.error('خطای سرور:', error)
      return NextResponse.json(
        { error: 'خطای داخلی سرور' },
        { status: 500 }
      )
    }
  }, { roles: SPECIALTY_API_ROLES })
}
