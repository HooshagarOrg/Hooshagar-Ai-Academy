// =====================================
// 🧠 Psychological Tests API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ==========================================
// Validation Schema
// ==========================================
const createTestSchema = z.object({
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  counseling_record_id: z.string().uuid().optional(),
  test_name: z.string().min(2, 'نام آزمون باید حداقل ۲ کاراکتر باشد'),
  test_type: z.enum([
    'intelligence', 'personality', 'aptitude', 'interest', 
    'achievement', 'behavioral', 'emotional', 'anxiety', 
    'depression', 'career'
  ]),
  test_date: z.string(),
  administered_by: z.string().uuid().optional(),
  raw_scores: z.record(z.unknown()).optional(),
  standard_scores: z.record(z.unknown()).optional(),
  percentile_ranks: z.record(z.unknown()).optional(),
  iq_score: z.number().min(40).max(200).optional(),
  interpretation: z.string().min(20, 'تفسیر باید حداقل ۲۰ کاراکتر باشد'),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  recommendations: z.string().optional(),
  report_url: z.string().url().optional(),
})

// ==========================================
// GET - List Tests
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const student_id = searchParams.get('student_id')
    const record_id = searchParams.get('record_id')
    const test_type = searchParams.get('test_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('psychological_tests')
      .select(`
        *,
        student:students!psychological_tests_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        ),
        administrator:profiles!psychological_tests_administered_by_fkey(
          id,
          full_name
        )
      `)
      .order('test_date', { ascending: false })
      .limit(limit)
    
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (record_id) {
      query = query.eq('counseling_record_id', record_id)
    }
    if (test_type) {
      query = query.eq('test_type', test_type)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('خطا در دریافت آزمون‌ها:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت آزمون‌ها' },
        { status: 500 }
      )
    }
    
    // Transform data
    const tests = data?.map(test => ({
      ...test,
      student: test.student ? {
        id: test.student.id,
        full_name: test.student.profiles?.full_name || 'نامشخص',
        grade: test.student.grade,
        avatar_url: test.student.profiles?.avatar_url,
      } : null,
    })) || []
    
    return NextResponse.json({ tests })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST - Create New Test Record
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const result = createTestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const testData = result.data
    
    // Create test record
    const { data: newTest, error: insertError } = await supabase
      .from('psychological_tests')
      .insert(testData)
      .select()
      .single()
    
    if (insertError) {
      console.error('خطا در ثبت آزمون:', insertError)
      return NextResponse.json(
        { error: 'خطا در ثبت آزمون' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'آزمون با موفقیت ثبت شد',
      test: newTest,
    }, { status: 201 })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}







