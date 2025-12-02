// =====================================
// 🧠 Parent Contacts API
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
const actionItemSchema = z.object({
  id: z.string(),
  item: z.string(),
  responsible: z.string(),
  deadline: z.string().optional(),
  completed: z.boolean().optional(),
})

const createContactSchema = z.object({
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  counseling_record_id: z.string().uuid().optional(),
  counselor_id: z.string().uuid().optional(),
  contact_date: z.string(),
  contact_type: z.enum(['phone', 'in_person', 'email', 'message', 'video_call']),
  parent_name: z.string().optional(),
  parent_relation: z.string().optional(),
  purpose: z.string().min(5, 'هدف تماس را مشخص کنید'),
  discussion_summary: z.string().min(20, 'خلاصه گفتگو باید حداقل ۲۰ کاراکتر باشد'),
  parent_concerns: z.string().optional(),
  agreements_made: z.string().optional(),
  action_items: z.array(actionItemSchema).optional(),
  follow_up_needed: z.boolean().default(false),
  follow_up_date: z.string().optional(),
  follow_up_note: z.string().optional(),
})

// ==========================================
// GET - List Parent Contacts
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const student_id = searchParams.get('student_id')
    const record_id = searchParams.get('record_id')
    const follow_up = searchParams.get('follow_up')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('parent_contacts')
      .select(`
        *,
        student:students!parent_contacts_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        ),
        counselor:profiles!parent_contacts_counselor_id_fkey(
          id,
          full_name
        )
      `)
      .order('contact_date', { ascending: false })
      .limit(limit)
    
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (record_id) {
      query = query.eq('counseling_record_id', record_id)
    }
    if (follow_up === 'true') {
      query = query.eq('follow_up_needed', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('خطا در دریافت تماس‌ها:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت تماس‌ها' },
        { status: 500 }
      )
    }
    
    // Transform data
    const contacts = data?.map(contact => ({
      ...contact,
      student: contact.student ? {
        id: contact.student.id,
        full_name: contact.student.profiles?.full_name || 'نامشخص',
        grade: contact.student.grade,
        avatar_url: contact.student.profiles?.avatar_url,
      } : null,
    })) || []
    
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST - Create New Contact
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const result = createContactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const contactData = result.data
    
    // Create contact
    const { data: newContact, error: insertError } = await supabase
      .from('parent_contacts')
      .insert(contactData)
      .select()
      .single()
    
    if (insertError) {
      console.error('خطا در ثبت تماس:', insertError)
      return NextResponse.json(
        { error: 'خطا در ثبت تماس' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'تماس با موفقیت ثبت شد',
      contact: newContact,
    }, { status: 201 })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}



