// =====================================
// 🧠 Behavioral Observations API
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
const createObservationSchema = z.object({
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  counseling_record_id: z.string().uuid().optional(),
  observation_date: z.string(),
  observation_time: z.string().optional(),
  duration_minutes: z.number().min(5).max(240).optional(),
  setting: z.string().min(2, 'محیط مشاهده را مشخص کنید'),
  observer_id: z.string().uuid().optional(),
  observer_role: z.string().optional(),
  behaviors_observed: z.array(z.string()).min(1, 'حداقل یک رفتار وارد کنید'),
  behavior_frequency: z.enum(['rare', 'occasional', 'frequent', 'constant']).optional(),
  description: z.string().min(20, 'شرح مشاهده باید حداقل ۲۰ کاراکتر باشد'),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  antecedents: z.string().optional(),
  consequences: z.string().optional(),
  environmental_factors: z.string().optional(),
  student_response: z.string().optional(),
  intervention_applied: z.string().optional(),
  intervention_effectiveness: z.string().optional(),
})

// ==========================================
// GET - List Observations
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const student_id = searchParams.get('student_id')
    const record_id = searchParams.get('record_id')
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('behavioral_observations')
      .select(`
        *,
        student:students!behavioral_observations_student_id_fkey(
          id,
          grade,
          profiles:profiles!students_user_id_fkey(full_name, avatar_url)
        ),
        observer:profiles!behavioral_observations_observer_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .order('observation_date', { ascending: false })
      .limit(limit)
    
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (record_id) {
      query = query.eq('counseling_record_id', record_id)
    }
    if (severity) {
      query = query.eq('severity', severity)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('خطا در دریافت مشاهدات:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت مشاهدات' },
        { status: 500 }
      )
    }
    
    // Transform data
    const observations = data?.map(obs => ({
      ...obs,
      student: obs.student ? {
        id: obs.student.id,
        full_name: obs.student.profiles?.full_name || 'نامشخص',
        grade: obs.student.grade,
        avatar_url: obs.student.profiles?.avatar_url,
      } : null,
    })) || []
    
    return NextResponse.json({ observations })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

// ==========================================
// POST - Create New Observation
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const result = createObservationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const observationData = result.data
    
    // Create observation
    const { data: newObservation, error: insertError } = await supabase
      .from('behavioral_observations')
      .insert(observationData)
      .select()
      .single()
    
    if (insertError) {
      console.error('خطا در ثبت مشاهده:', insertError)
      return NextResponse.json(
        { error: 'خطا در ثبت مشاهده' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'مشاهده با موفقیت ثبت شد',
      observation: newObservation,
    }, { status: 201 })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}

