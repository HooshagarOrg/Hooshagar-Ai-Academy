import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET: دریافت ویزیت‌های بهداری
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    
    const studentId = searchParams.get('studentId')
    const schoolId = searchParams.get('schoolId')
    const outcome = searchParams.get('outcome')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('health_visits')
      .select(`
        *,
        students (
          id,
          full_name,
          class_id,
          classes (name)
        )
      `)
      .order('visit_date', { ascending: false })
      .limit(limit)
    
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    if (outcome) {
      query = query.eq('outcome', outcome)
    }
    
    if (startDate) {
      query = query.gte('visit_date', startDate)
    }
    
    if (endDate) {
      query = query.lte('visit_date', endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching visits:', error)
      return NextResponse.json({ success: false, error: 'خطا در دریافت ویزیت‌ها' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}

// POST: ثبت ویزیت جدید
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    const {
      studentId,
      schoolId,
      symptoms,
      temperature,
      bloodPressure,
      pulseRate,
      diagnosis,
      treatmentGiven,
      medicationGiven,
      restTimeMinutes,
      severity,
      outcome,
      notes,
      parentNotified,
      attendedBy,
    } = body
    
    const { data, error } = await supabase
      .from('health_visits')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        symptoms: symptoms || [],
        temperature,
        blood_pressure: bloodPressure,
        pulse_rate: pulseRate,
        diagnosis,
        treatment_given: treatmentGiven,
        medication_given: medicationGiven || [],
        rest_time_minutes: restTimeMinutes,
        severity,
        outcome,
        notes,
        parent_notified: parentNotified || false,
        parent_notified_at: parentNotified ? new Date().toISOString() : null,
        attended_by: attendedBy,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating visit:', error)
      return NextResponse.json({ success: false, error: 'خطا در ثبت ویزیت' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}

// PATCH: بروزرسانی ویزیت
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    const { id, parentNotified, parentResponse, ...otherUpdates } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'شناسه ویزیت الزامی است' }, { status: 400 })
    }
    
    const updates: Record<string, unknown> = {}
    
    if (parentNotified !== undefined) {
      updates['parent_notified'] = parentNotified
      if (parentNotified) {
        updates['parent_notified_at'] = new Date().toISOString()
      }
    }
    
    if (parentResponse) {
      updates['parent_response'] = parentResponse
    }
    
    const fieldMapping: Record<string, string> = {
      diagnosis: 'diagnosis',
      outcome: 'outcome',
      notes: 'notes',
      severity: 'severity',
      treatmentGiven: 'treatment_given',
    }
    
    for (const [key, value] of Object.entries(otherUpdates)) {
      const dbField = fieldMapping[key]
      if (dbField) {
        updates[dbField] = value
      }
    }
    
    const { data, error } = await supabase
      .from('health_visits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating visit:', error)
      return NextResponse.json({ success: false, error: 'خطا در بروزرسانی ویزیت' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}




