import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { HEALTH_API_ROLES } from '@/lib/security/sensitive-api-roles'

// GET: دریافت معاینات
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)

      const studentId = searchParams.get('studentId')
      const schoolId = searchParams.get('schoolId')
      const checkupType = searchParams.get('type')
      const needsFollowup = searchParams.get('needsFollowup')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const limit = parseInt(searchParams.get('limit') || '50')

      let query = supabase
        .from('health_checkups')
        .select(`
        *,
        students (
          id,
          full_name,
          class_id,
          classes (name)
        )
      `)
        .order('checkup_date', { ascending: false })
        .limit(limit)

      if (studentId) {
        query = query.eq('student_id', studentId)
      }

      if (schoolId) {
        query = query.eq('school_id', schoolId)
      }

      if (checkupType) {
        query = query.eq('checkup_type', checkupType)
      }

      if (needsFollowup === 'true') {
        query = query.eq('needs_followup', true).eq('followup_completed', false)
      }

      if (startDate) {
        query = query.gte('checkup_date', startDate)
      }

      if (endDate) {
        query = query.lte('checkup_date', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching checkups:', error)
        return NextResponse.json({ success: false, error: 'خطا در دریافت معاینات' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error:', error)
      return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
    }
  }, { roles: HEALTH_API_ROLES })
}

// POST: ثبت معاینه جدید
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      const {
        studentId,
        schoolId,
        checkupDate,
        checkupType,
        visionRightEye,
        visionLeftEye,
        needsGlasses,
        glassesPrescription,
        colorBlindness,
        hearingRightEar,
        hearingLeftEar,
        needsHearingAid,
        dentalCavities,
        dentalTreatmentNeeded,
        dentalHygieneScore,
        heightCm,
        weightKg,
        vaccineName,
        vaccineDoseNumber,
        generalFindings,
        recommendations,
        needsFollowup,
        followupDate,
        followupNote,
        actionsTaken,
        examinedBy,
        examinerTitle,
        attachments,
      } = body

      let bmi = null
      let bmiCategory = null
      if (heightCm && weightKg) {
        bmi = Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 100) / 100
        if (bmi < 18.5) bmiCategory = 'underweight'
        else if (bmi < 25) bmiCategory = 'normal'
        else if (bmi < 30) bmiCategory = 'overweight'
        else bmiCategory = 'obese'
      }

      const { data, error } = await supabase
        .from('health_checkups')
        .insert({
          student_id: studentId,
          school_id: schoolId,
          checkup_date: checkupDate,
          checkup_type: checkupType,
          vision_right_eye: visionRightEye,
          vision_left_eye: visionLeftEye,
          needs_glasses: needsGlasses,
          glasses_prescription: glassesPrescription,
          color_blindness: colorBlindness,
          hearing_right_ear: hearingRightEar,
          hearing_left_ear: hearingLeftEar,
          needs_hearing_aid: needsHearingAid,
          dental_cavities: dentalCavities,
          dental_treatment_needed: dentalTreatmentNeeded,
          dental_hygiene_score: dentalHygieneScore,
          height_cm: heightCm,
          weight_kg: weightKg,
          bmi,
          bmi_category: bmiCategory,
          vaccine_name: vaccineName,
          vaccine_dose_number: vaccineDoseNumber,
          general_findings: generalFindings,
          recommendations,
          needs_followup: needsFollowup || false,
          followup_date: followupDate,
          followup_note: followupNote,
          actions_taken: actionsTaken || [],
          examined_by: examinedBy,
          examiner_title: examinerTitle,
          attachments: attachments || [],
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating checkup:', error)
        return NextResponse.json({ success: false, error: 'خطا در ثبت معاینه' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error:', error)
      return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
    }
  }, { roles: HEALTH_API_ROLES })
}

// PATCH: بروزرسانی معاینه (مثلاً تکمیل پیگیری)
export async function PATCH(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      const { id, followupCompleted, followupNote, ...otherUpdates } = body

      if (!id) {
        return NextResponse.json({ success: false, error: 'شناسه معاینه الزامی است' }, { status: 400 })
      }

      const updates: Record<string, unknown> = {}

      if (followupCompleted !== undefined) {
        updates['followup_completed'] = followupCompleted
        if (followupCompleted) {
          updates['followup_completed_at'] = new Date().toISOString()
        }
      }

      if (followupNote) {
        updates['followup_note'] = followupNote
      }

      const fieldMapping: Record<string, string> = {
        needsFollowup: 'needs_followup',
        followupDate: 'followup_date',
        recommendations: 'recommendations',
        actionsTaken: 'actions_taken',
      }

      for (const [key, value] of Object.entries(otherUpdates)) {
        const dbField = fieldMapping[key]
        if (dbField) {
          updates[dbField] = value
        }
      }

      const { data, error } = await supabase
        .from('health_checkups')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating checkup:', error)
        return NextResponse.json({ success: false, error: 'خطا در بروزرسانی معاینه' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error:', error)
      return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
    }
  }, { roles: HEALTH_API_ROLES })
}
