import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET: دریافت پرونده سلامت
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    
    const studentId = searchParams.get('studentId')
    const schoolId = searchParams.get('schoolId')
    
    let query = supabase.from('student_health_records').select(`
      *,
      students (
        id,
        full_name,
        class_id,
        classes (name)
      )
    `)
    
    if (studentId) {
      query = query.eq('student_id', studentId).single()
    } else if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching health records:', error)
      return NextResponse.json({ success: false, error: 'خطا در دریافت پرونده‌ها' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}

// POST: ایجاد پرونده سلامت
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    const {
      studentId,
      schoolId,
      bloodType,
      chronicDiseases,
      allergies,
      medications,
      sportsRestrictions,
      specialNeeds,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      familyDoctorName,
      familyDoctorPhone,
      insuranceCompany,
      insuranceNumber,
    } = body
    
    const { data, error } = await supabase
      .from('student_health_records')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        blood_type: bloodType,
        chronic_diseases: chronicDiseases || [],
        allergies: allergies || {},
        medications: medications || [],
        sports_restrictions: sportsRestrictions || [],
        special_needs: specialNeeds,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        emergency_contact_relation: emergencyContactRelation,
        family_doctor_name: familyDoctorName,
        family_doctor_phone: familyDoctorPhone,
        insurance_company: insuranceCompany,
        insurance_number: insuranceNumber,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating health record:', error)
      return NextResponse.json({ success: false, error: 'خطا در ایجاد پرونده' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}

// PATCH: بروزرسانی پرونده سلامت
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'شناسه پرونده الزامی است' }, { status: 400 })
    }
    
    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, unknown> = {}
    const fieldMapping: Record<string, string> = {
      bloodType: 'blood_type',
      chronicDiseases: 'chronic_diseases',
      allergies: 'allergies',
      medications: 'medications',
      sportsRestrictions: 'sports_restrictions',
      specialNeeds: 'special_needs',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      emergencyContactRelation: 'emergency_contact_relation',
      familyDoctorName: 'family_doctor_name',
      familyDoctorPhone: 'family_doctor_phone',
      insuranceCompany: 'insurance_company',
      insuranceNumber: 'insurance_number',
    }
    
    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMapping[key]
      if (dbField) {
        dbUpdates[dbField] = value
      }
    }
    
    dbUpdates['updated_at'] = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('student_health_records')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating health record:', error)
      return NextResponse.json({ success: false, error: 'خطا در بروزرسانی پرونده' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}

























