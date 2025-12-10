import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET: دریافت آمار سلامت
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    
    const schoolId = searchParams.get('schoolId')
    const type = searchParams.get('type') // overview, bmi, vision, vaccination, dental
    
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'شناسه مدرسه الزامی است' }, { status: 400 })
    }
    
    const stats: Record<string, unknown> = {}
    
    // Get total students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
    
    stats.totalStudents = totalStudents || 0
    
    // Get students with health records
    const { count: studentsWithRecords } = await supabase
      .from('student_health_records')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
    
    stats.studentsWithRecords = studentsWithRecords || 0
    
    // Get pending followups
    const { count: pendingFollowups } = await supabase
      .from('health_checkups')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('needs_followup', true)
      .eq('followup_completed', false)
    
    stats.pendingFollowups = pendingFollowups || 0
    
    // Get checkups this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { count: checkupsThisMonth } = await supabase
      .from('health_checkups')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('checkup_date', startOfMonth.toISOString().split('T')[0])
    
    stats.checkupsThisMonth = checkupsThisMonth || 0
    
    // Get visits this month
    const { count: visitsThisMonth } = await supabase
      .from('health_visits')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('visit_date', startOfMonth.toISOString())
    
    stats.visitsThisMonth = visitsThisMonth || 0
    
    // Type-specific stats
    if (type === 'bmi' || type === 'overview') {
      // BMI distribution
      const { data: bmiData } = await supabase
        .from('health_checkups')
        .select('bmi_category')
        .eq('school_id', schoolId)
        .eq('checkup_type', 'growth')
        .not('bmi_category', 'is', null)
      
      const bmiDistribution = {
        underweight: 0,
        normal: 0,
        overweight: 0,
        obese: 0,
      }
      
      bmiData?.forEach(item => {
        if (item.bmi_category && bmiDistribution[item.bmi_category as keyof typeof bmiDistribution] !== undefined) {
          bmiDistribution[item.bmi_category as keyof typeof bmiDistribution]++
        }
      })
      
      stats.bmiDistribution = bmiDistribution
    }
    
    if (type === 'vision' || type === 'overview') {
      // Vision stats
      const { data: visionData } = await supabase
        .from('health_checkups')
        .select('needs_glasses, vision_right_eye, vision_left_eye')
        .eq('school_id', schoolId)
        .eq('checkup_type', 'vision')
      
      const visionStats = {
        total: visionData?.length || 0,
        needsGlasses: visionData?.filter(v => v.needs_glasses).length || 0,
        normalVision: 0,
        weakVision: 0,
      }
      
      // Simple heuristic for vision quality
      visionData?.forEach(item => {
        const isNormal = item.vision_right_eye === '10/10' && item.vision_left_eye === '10/10'
        if (isNormal) {
          visionStats.normalVision++
        } else if (!item.needs_glasses) {
          visionStats.weakVision++
        }
      })
      
      stats.visionStats = visionStats
    }
    
    if (type === 'vaccination' || type === 'overview') {
      // Vaccination coverage would require more complex logic
      // For now, return placeholder
      const { data: vaccinationData } = await supabase
        .from('student_vaccinations')
        .select('vaccine_name')
        .eq('school_id', schoolId)
      
      stats.vaccinationsRecorded = vaccinationData?.length || 0
    }
    
    if (type === 'dental' || type === 'overview') {
      // Dental stats
      const { data: dentalData } = await supabase
        .from('health_checkups')
        .select('dental_cavities, dental_treatment_needed, dental_hygiene_score')
        .eq('school_id', schoolId)
        .eq('checkup_type', 'dental')
      
      const dentalStats = {
        total: dentalData?.length || 0,
        healthy: dentalData?.filter(d => (d.dental_cavities || 0) === 0).length || 0,
        needsTreatment: dentalData?.filter(d => d.dental_treatment_needed).length || 0,
        averageHygiene: 0,
      }
      
      const hygieneScores = dentalData?.filter(d => d.dental_hygiene_score).map(d => d.dental_hygiene_score) || []
      if (hygieneScores.length > 0) {
        dentalStats.averageHygiene = Math.round(
          (hygieneScores.reduce((a, b) => a + (b || 0), 0) / hygieneScores.length) * 10
        ) / 10
      }
      
      stats.dentalStats = dentalStats
    }
    
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 })
  }
}
























