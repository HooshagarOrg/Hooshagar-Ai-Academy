/**
 * هوشاگر - Generate Weekly SMS
 * 
 * این Edge Function هر یکشنبه ساعت 9 صبح اجرا می‌شود
 * و پیامک‌های هفتگی را برای خانواده‌ها آماده می‌کند
 * 
 * ارسال واقعی: پنج‌شنبه ساعت 11 (طبق تنظیمات)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🚀 Starting weekly SMS generation...')

    // Calculate current week (Saturday to Friday in Iran)
    const now = new Date()
    const weekStart = getSaturday(now)
    const weekEnd = getFriday(now)
    const weekNumber = getWeekNumber(now)

    // Schedule for next Thursday 11:00 (based on user preferences)
    const defaultScheduledAt = getNextThursday11()

    console.log(`📅 Week: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`)

    // Get all active parents with SMS enabled
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select(`
        id,
        phone,
        notification_preferences!inner (
          weekly_sms_enabled,
          weekly_sms_day,
          weekly_sms_time
        )
      `)
      .eq('role', 'parent')
      .eq('is_active', true)
      .eq('notification_preferences.weekly_sms_enabled', true)

    if (parentsError) throw parentsError

    console.log(`📊 Found ${parents?.length || 0} parents with SMS enabled`)

    let generated = 0
    let skipped = 0

    for (const parent of parents || []) {
      // Get parent's children
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('parent_id', parent.id)
        .eq('is_active', true)

      if (!students || students.length === 0) {
        skipped++
        continue
      }

      for (const student of students) {
        // Check for duplicate
        const { data: existing } = await supabase
          .from('weekly_sms_queue')
          .select('id')
          .eq('parent_id', parent.id)
          .eq('student_id', student.id)
          .eq('week_start', weekStart.toISOString().split('T')[0])
          .maybeSingle()

        if (existing) {
          console.log(`⏭ SMS already exists for parent ${parent.id}, student ${student.id}`)
          skipped++
          continue
        }

        // Collect week data
        const weekData = await collectWeekData(
          supabase,
          student.id,
          weekStart,
          weekEnd
        )

        // Determine tone
        const tone = determineTone(weekData)

        // Generate SMS text
        const studentName = `${student.first_name} ${student.last_name}`
        const smsText = generateSMSText(studentName, tone)

        // Calculate scheduled time based on user preferences
        const prefs = parent.notification_preferences
        const scheduledAt = calculateScheduledTime(
          prefs.weekly_sms_day || 'thursday',
          prefs.weekly_sms_time || '11:00:00'
        )

        // Insert into queue
        const { error: insertError } = await supabase
          .from('weekly_sms_queue')
          .insert({
            parent_id: parent.id,
            student_id: student.id,
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
            week_number: weekNumber,
            sms_text: smsText,
            sms_tone: tone,
            summary_data: weekData,
            scheduled_at: scheduledAt.toISOString(),
            status: 'pending'
          })

        if (insertError) {
          console.error(`❌ Error for parent ${parent.id}:`, insertError.message)
        } else {
          generated++
        }
      }
    }

    console.log(`✅ Generated ${generated} SMS, Skipped ${skipped}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated, 
        skipped,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0]
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ========================================
// Helper Functions
// ========================================

async function collectWeekData(
  supabase: any,
  studentId: string,
  weekStart: Date,
  weekEnd: Date
) {
  const start = weekStart.toISOString()
  const end = weekEnd.toISOString()

  // Grades
  const { data: grades } = await supabase
    .from('grades')
    .select('score')
    .eq('student_id', studentId)
    .gte('created_at', start)
    .lte('created_at', end)

  // Messages
  const { data: messages } = await supabase
    .from('teacher_messages')
    .select('id, is_read, priority')
    .eq('student_id', studentId)
    .gte('created_at', start)
    .lte('created_at', end)

  // Alerts
  const { data: alerts } = await supabase
    .from('student_alerts')
    .select('severity, status')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .gte('created_at', start)
    .lte('created_at', end)

  // Absences
  const { data: absences } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', studentId)
    .eq('status', 'absent')
    .gte('date', weekStart.toISOString().split('T')[0])
    .lte('date', weekEnd.toISOString().split('T')[0])

  const gradesArray = grades || []
  const avgGrade = gradesArray.length > 0
    ? gradesArray.reduce((sum: number, g: any) => sum + g.score, 0) / gradesArray.length
    : null

  return {
    grades_count: gradesArray.length,
    avg_grade: avgGrade,
    messages_count: messages?.length || 0,
    unread_messages: messages?.filter((m: any) => !m.is_read).length || 0,
    high_priority_messages: messages?.filter((m: any) => m.priority === 'high' || m.priority === 'urgent').length || 0,
    alerts_count: alerts?.length || 0,
    high_alerts: alerts?.filter((a: any) => a.severity === 'high' || a.severity === 'critical').length || 0,
    absences_count: absences?.length || 0
  }
}

function determineTone(data: any): string {
  // Attention if high alerts, many absences, or high priority messages
  if (
    data.high_alerts > 0 ||
    data.absences_count >= 2 ||
    data.high_priority_messages > 0
  ) {
    return 'attention'
  }

  // Positive if good activity and no alerts
  if (
    data.grades_count >= 3 &&
    data.avg_grade >= 15 &&
    data.alerts_count === 0 &&
    data.absences_count === 0
  ) {
    return 'positive'
  }

  return 'normal'
}

function generateSMSText(studentName: string, tone: string): string {
  if (tone === 'attention') {
    return `⚠️ اطلاع‌رسانی آموزشی\nبررسی‌های این هفته نشان می‌دهد ${studentName} نیازمند توجه بیشتر است.\nجزئیات: hooshagar.com`
  }

  if (tone === 'positive') {
    return `✅ گزارش هفتگی\nروند وضعیت آموزشی ${studentName} این هفته رضایت‌بخش گزارش شده است.\nمشاهده: hooshagar.com`
  }

  // Normal
  return `📊 گزارش هفتگی\nوضعیت آموزشی و رفتاری ${studentName} در سامانه هوشگر بررسی شده است.\nجزئیات: hooshagar.com`
}

// Date helpers (Iranian week: Saturday to Friday)
function getSaturday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 6 ? 0 : -(day + 1) // Saturday is 6
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getFriday(date: Date): Date {
  const saturday = getSaturday(date)
  const friday = new Date(saturday)
  friday.setDate(saturday.getDate() + 6)
  friday.setHours(23, 59, 59, 999)
  return friday
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getNextThursday11(): Date {
  const now = new Date()
  const thursday = new Date(now)
  const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7
  thursday.setDate(now.getDate() + daysUntilThursday)
  thursday.setHours(11, 0, 0, 0)
  return thursday
}

function calculateScheduledTime(day: string, time: string): Date {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  
  const dayMap: { [key: string]: number } = {
    'saturday': 6,
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5
  }
  
  const targetDay = dayMap[day.toLowerCase()] ?? 4 // Default to Thursday
  const currentDay = now.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
  
  const scheduledDate = new Date(now)
  scheduledDate.setDate(now.getDate() + daysUntilTarget)
  scheduledDate.setHours(hours, minutes, 0, 0)
  
  return scheduledDate
}

