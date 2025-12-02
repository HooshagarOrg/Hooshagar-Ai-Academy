// =====================================
// 🎨 Specialty Assessments API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ==========================================
// GET - List Assessments by Type
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // music, art, sports, stem
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
      .select(`
        *,
        student:students!${tableName}_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        ),
        teacher:profiles!${tableName}_teacher_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
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
    
    // Transform data
    const assessments = data?.map(assessment => ({
      ...assessment,
      student: assessment.student ? {
        id: assessment.student.id,
        full_name: assessment.student.profiles?.full_name || 'نامشخص',
        grade: assessment.student.grade,
        avatar_url: assessment.student.profiles?.avatar_url,
      } : null,
    })) || []
    
    return NextResponse.json({ assessments })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST - Create New Assessment
// ==========================================
export async function POST(req: NextRequest) {
  try {
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
    
    // Get student's school_id
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
    
    // Create assessment
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
}



