// =====================================
// 🧠 Counseling Record Detail API
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
const goalSchema = z.object({
  id: z.string(),
  goal: z.string().min(3),
  target_date: z.string(),
  status: z.enum(['pending', 'in_progress', 'achieved', 'cancelled']),
  progress: z.number().min(0).max(100),
  notes: z.string().optional(),
})

const updateRecordSchema = z.object({
  issue_categories: z.array(z.string()).min(1).optional(),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['active', 'closed', 'referred']).optional(),
  summary: z.string().optional(),
  initial_assessment: z.string().optional(),
  goals: z.array(goalSchema).optional(),
  closed_date: z.string().optional(),
  is_referred: z.boolean().optional(),
  referred_to: z.string().optional(),
  referral_reason: z.string().optional(),
  referral_date: z.string().optional(),
  referral_outcome: z.string().optional(),
})

// ==========================================
// GET - Get Single Record with All Relations
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get record with all related data
    const { data: record, error } = await supabase
      .from('counseling_records')
      .select(`
        *,
        student:students!counseling_records_student_id_fkey(
          id,
          user_id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url, phone)
        ),
        counselor:profiles!counseling_records_counselor_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !record) {
      return NextResponse.json(
        { error: 'پرونده یافت نشد' },
        { status: 404 }
      )
    }
    
    // Get sessions
    const { data: sessions } = await supabase
      .from('counseling_sessions')
      .select('*')
      .eq('counseling_record_id', id)
      .order('session_number', { ascending: false })
    
    // Get psychological tests
    const { data: tests } = await supabase
      .from('psychological_tests')
      .select('*')
      .eq('counseling_record_id', id)
      .order('test_date', { ascending: false })
    
    // Get behavioral observations
    const { data: observations } = await supabase
      .from('behavioral_observations')
      .select('*')
      .eq('counseling_record_id', id)
      .order('observation_date', { ascending: false })
    
    // Get parent contacts
    const { data: contacts } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('counseling_record_id', id)
      .order('contact_date', { ascending: false })
    
    // Transform student data
    const transformedRecord = {
      ...record,
      student: record.student ? {
        id: record.student.id,
        full_name: record.student.profiles?.full_name || 'نامشخص',
        grade: record.student.grade,
        avatar_url: record.student.profiles?.avatar_url,
        phone: record.student.profiles?.phone,
      } : null,
      sessions: sessions || [],
      tests: tests || [],
      observations: observations || [],
      parent_contacts: contacts || [],
      sessions_count: sessions?.length || 0,
      last_session_date: sessions?.[0]?.session_date || null,
    }
    
    return NextResponse.json({ record: transformedRecord })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// PUT - Update Record
// ==========================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    // Validate input
    const result = updateRecordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }
    
    // Check if record exists
    const { data: existingRecord, error: findError } = await supabase
      .from('counseling_records')
      .select('id, status')
      .eq('id', id)
      .single()
    
    if (findError || !existingRecord) {
      return NextResponse.json(
        { error: 'پرونده یافت نشد' },
        { status: 404 }
      )
    }
    
    // Handle status change to closed
    const updateData: Record<string, unknown> = { ...result.data }
    if (result.data.status === 'closed' && existingRecord.status !== 'closed') {
      updateData.closed_date = new Date().toISOString().split('T')[0]
    }
    
    // Update record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('counseling_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('خطا در بروزرسانی پرونده:', updateError)
      return NextResponse.json(
        { error: 'خطا در بروزرسانی پرونده' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'پرونده با موفقیت بروزرسانی شد',
      record: updatedRecord,
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
// DELETE - Delete Record (soft delete by closing)
// ==========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Soft delete by setting status to closed
    const { error } = await supabase
      .from('counseling_records')
      .update({
        status: 'closed',
        closed_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
    
    if (error) {
      console.error('خطا در بستن پرونده:', error)
      return NextResponse.json(
        { error: 'خطا در بستن پرونده' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'پرونده با موفقیت بسته شد',
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

