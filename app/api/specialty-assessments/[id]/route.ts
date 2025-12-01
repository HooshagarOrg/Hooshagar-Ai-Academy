// =====================================
// 🎨 Specialty Assessment Detail API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ==========================================
// GET - Get Single Assessment
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    
    if (!type || !['music', 'art', 'sports', 'stem'].includes(type)) {
      return NextResponse.json(
        { error: 'نوع ارزیابی مشخص نشده یا نامعتبر است' },
        { status: 400 }
      )
    }
    
    const tableName = `${type}_assessments`
    
    const { data: assessment, error } = await supabase
      .from(tableName)
      .select(`
        *,
        student:students!${tableName}_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url, phone)
        ),
        teacher:profiles!${tableName}_teacher_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !assessment) {
      return NextResponse.json(
        { error: 'ارزیابی یافت نشد' },
        { status: 404 }
      )
    }
    
    // Transform data
    const transformedAssessment = {
      ...assessment,
      student: assessment.student ? {
        id: assessment.student.id,
        full_name: assessment.student.profiles?.full_name || 'نامشخص',
        grade: assessment.student.grade,
        avatar_url: assessment.student.profiles?.avatar_url,
      } : null,
    }
    
    return NextResponse.json({ assessment: transformedAssessment })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// PUT - Update Assessment
// ==========================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    // Remove fields that shouldn't be updated
    const { id: _id, student_id, school_id, created_at, ...updateData } = body
    
    const { data: updatedAssessment, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('خطا در بروزرسانی ارزیابی:', error)
      return NextResponse.json(
        { error: 'خطا در بروزرسانی ارزیابی' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'ارزیابی با موفقیت بروزرسانی شد',
      assessment: updatedAssessment,
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// DELETE - Delete Assessment
// ==========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    
    if (!type || !['music', 'art', 'sports', 'stem'].includes(type)) {
      return NextResponse.json(
        { error: 'نوع ارزیابی مشخص نشده یا نامعتبر است' },
        { status: 400 }
      )
    }
    
    const tableName = `${type}_assessments`
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('خطا در حذف ارزیابی:', error)
      return NextResponse.json(
        { error: 'خطا در حذف ارزیابی' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'ارزیابی با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

