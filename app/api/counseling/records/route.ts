// =====================================
// 🧠 Counseling Records API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { COUNSELING_API_ROLES } from '@/lib/security/sensitive-api-roles'
import { z } from 'zod'

// ==========================================
// Validation Schemas
// ==========================================
const goalSchema = z.object({
  id: z.string(),
  goal: z.string().min(3, 'هدف باید حداقل ۳ کاراکتر باشد'),
  target_date: z.string(),
  status: z.enum(['pending', 'in_progress', 'achieved', 'cancelled']),
  progress: z.number().min(0).max(100),
  notes: z.string().optional(),
})

const createRecordSchema = z.object({
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  issue_categories: z.array(z.string()).min(1, 'حداقل یک دسته‌بندی انتخاب کنید'),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']),
  summary: z.string().optional(),
  initial_assessment: z.string().optional(),
  goals: z.array(goalSchema).optional(),
})

// ==========================================
// GET - List/Filter Records
// ==========================================
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')
      const priority = searchParams.get('priority')
      const category = searchParams.get('category')
      const search = searchParams.get('search')
      const school_id = searchParams.get('school_id')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      let query = supabase
        .from('counseling_records')
        .select(`
        *,
        student:students!counseling_records_student_id_fkey(
          id,
          user_id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        ),
        sessions:counseling_sessions(count)
      `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }
      if (priority) {
        query = query.eq('priority_level', priority)
      }
      if (category) {
        query = query.contains('issue_categories', [category])
      }
      if (school_id) {
        query = query.eq('school_id', school_id)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('خطا در دریافت پرونده‌ها:', error)
        return NextResponse.json(
          { error: 'خطا در دریافت پرونده‌های مشاوره' },
          { status: 500 }
        )
      }

      const records = data?.map(record => ({
        ...record,
        student: record.student ? {
          id: record.student.id,
          full_name: record.student.profiles?.full_name || 'نامشخص',
          grade: record.student.grade,
          avatar_url: record.student.profiles?.avatar_url,
        } : null,
        sessions_count: record.sessions?.[0]?.count || 0,
      })) || []

      const filteredRecords = search
        ? records.filter(r =>
            r.student?.full_name?.includes(search) ||
            r.summary?.includes(search)
          )
        : records

      return NextResponse.json({
        records: filteredRecords,
        total: count,
      })
    } catch (error) {
      console.error('خطای سرور:', error)
      return NextResponse.json(
        { error: 'خطای داخلی سرور' },
        { status: 500 }
      )
    }
  }, { roles: COUNSELING_API_ROLES })
}

// ==========================================
// POST - Create New Record
// ==========================================
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const body = await req.json()

      const result = createRecordSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'داده‌های نامعتبر', details: result.error.issues },
          { status: 400 }
        )
      }

      const { student_id, issue_categories, priority_level, summary, initial_assessment, goals } = result.data

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', student_id)
        .single()

      if (studentError || !student) {
        return NextResponse.json(
          { error: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        )
      }

      const { data: existingRecord } = await supabase
        .from('counseling_records')
        .select('id')
        .eq('student_id', student_id)
        .eq('status', 'active')
        .single()

      if (existingRecord) {
        return NextResponse.json(
          { error: 'این دانش‌آموز پرونده فعال دارد', record_id: existingRecord.id },
          { status: 409 }
        )
      }

      const { data: newRecord, error: insertError } = await supabase
        .from('counseling_records')
        .insert({
          student_id,
          school_id: student.school_id,
          counselor_id: body.counselor_id,
          issue_categories,
          priority_level,
          summary,
          initial_assessment,
          goals: goals || [],
        })
        .select()
        .single()

      if (insertError) {
        console.error('خطا در ایجاد پرونده:', insertError)
        return NextResponse.json(
          { error: 'خطا در ایجاد پرونده مشاوره' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'پرونده با موفقیت ایجاد شد',
        record: newRecord,
      }, { status: 201 })
    } catch (error) {
      console.error('خطای سرور:', error)
      return NextResponse.json(
        { error: 'خطای داخلی سرور' },
        { status: 500 }
      )
    }
  }, { roles: COUNSELING_API_ROLES })
}
