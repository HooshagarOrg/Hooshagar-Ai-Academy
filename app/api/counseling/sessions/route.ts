// =====================================
// 🧠 Counseling Sessions API
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
const attendeeSchema = z.object({
  name: z.string(),
  relation: z.string().optional(),
  attended: z.boolean(),
})

const createSessionSchema = z.object({
  counseling_record_id: z.string().uuid('شناسه پرونده نامعتبر است'),
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  counselor_id: z.string().uuid().optional(),
  session_date: z.string(),
  duration_minutes: z.number().min(15).max(180).default(45),
  session_type: z.enum(['individual', 'group', 'family', 'crisis', 'follow_up']),
  attendees: z.array(attendeeSchema).optional(),
  topics_discussed: z.array(z.string()).min(1, 'حداقل یک موضوع انتخاب کنید'),
  session_notes: z.string().min(10, 'یادداشت جلسه باید حداقل ۱۰ کاراکتر باشد'),
  student_mood: z.string().optional(),
  student_cooperation: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  interventions_used: z.array(z.string()).optional(),
  homework: z.string().optional(),
  progress_rating: z.number().min(1).max(5).optional(),
  progress_notes: z.string().optional(),
  next_session_planned: z.boolean().default(true),
  next_session_date: z.string().optional(),
  next_session_goals: z.string().optional(),
})

// ==========================================
// GET - List Sessions
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const record_id = searchParams.get('record_id')
    const student_id = searchParams.get('student_id')
    const counselor_id = searchParams.get('counselor_id')
    const date = searchParams.get('date') // For getting today's sessions
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('counseling_sessions')
      .select(`
        *,
        student:students!counseling_sessions_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        ),
        record:counseling_records!counseling_sessions_counseling_record_id_fkey(
          id,
          issue_categories,
          priority_level
        )
      `)
      .order('session_date', { ascending: false })
      .limit(limit)
    
    if (record_id) {
      query = query.eq('counseling_record_id', record_id)
    }
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (counselor_id) {
      query = query.eq('counselor_id', counselor_id)
    }
    if (date) {
      // Filter by date (for today's sessions)
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`
      query = query.gte('session_date', startOfDay).lte('session_date', endOfDay)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('خطا در دریافت جلسات:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت جلسات' },
        { status: 500 }
      )
    }
    
    // Transform data
    const sessions = data?.map(session => ({
      ...session,
      student: session.student ? {
        id: session.student.id,
        full_name: session.student.profiles?.full_name || 'نامشخص',
        grade: session.student.grade,
        avatar_url: session.student.profiles?.avatar_url,
      } : null,
    })) || []
    
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST - Create New Session
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const result = createSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const sessionData = result.data
    
    // Get the next session number for this record
    const { data: lastSession } = await supabase
      .from('counseling_sessions')
      .select('session_number')
      .eq('counseling_record_id', sessionData.counseling_record_id)
      .order('session_number', { ascending: false })
      .limit(1)
      .single()
    
    const nextSessionNumber = (lastSession?.session_number || 0) + 1
    
    // Create session
    const { data: newSession, error: insertError } = await supabase
      .from('counseling_sessions')
      .insert({
        ...sessionData,
        session_number: nextSessionNumber,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('خطا در ایجاد جلسه:', insertError)
      return NextResponse.json(
        { error: 'خطا در ثبت جلسه' },
        { status: 500 }
      )
    }
    
    // Update record's updated_at
    await supabase
      .from('counseling_records')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionData.counseling_record_id)
    
    return NextResponse.json({
      message: 'جلسه با موفقیت ثبت شد',
      session: newSession,
    }, { status: 201 })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

