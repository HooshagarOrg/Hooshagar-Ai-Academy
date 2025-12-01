import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET: دریافت آمار حضور و غیاب
export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const schoolId = searchParams.get('schoolId')
    const month = searchParams.get('month') // format: YYYY-MM-01
    const type = searchParams.get('type') // daily, weekly, monthly, comparison
    
    // دریافت کاربر جاری
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // دریافت پروفایل کاربر
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    const effectiveSchoolId = profile.role === 'admin' ? schoolId : profile.school_id

    // آمار دانش‌آموز خاص
    if (studentId) {
      const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01'
      
      const { data: monthlyStats, error } = await supabase
        .from('attendance_monthly_stats')
        .select('*')
        .eq('student_id', studentId)
        .eq('month', currentMonth)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      // آخرین غیبت
      const { data: lastAbsence } = await supabase
        .from('attendance')
        .select('date, absence_reason')
        .eq('student_id', studentId)
        .in('status', ['absent', 'sick', 'excused'])
        .order('date', { ascending: false })
        .limit(1)
        .single()
      
      return NextResponse.json({
        presentDays: monthlyStats?.present_days || 0,
        absentDays: monthlyStats?.absent_days || 0,
        lateDays: monthlyStats?.late_days || 0,
        sickDays: monthlyStats?.sick_days || 0,
        excusedDays: monthlyStats?.excused_days || 0,
        totalDays: monthlyStats?.total_days || 0,
        attendancePercentage: monthlyStats?.attendance_percentage || 0,
        lastAbsenceDate: lastAbsence?.date,
        lastAbsenceReason: lastAbsence?.absence_reason,
        unexcusedAbsences: monthlyStats?.absent_days || 0,
      })
    }
    
    // آمار کلاس
    if (classId && type === 'daily') {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('class_id', classId)
        .eq('date', today)
      
      if (error) throw error
      
      const stats = {
        total: data?.length || 0,
        present: data?.filter(r => r.status === 'present').length || 0,
        absent: data?.filter(r => r.status === 'absent').length || 0,
        late: data?.filter(r => r.status === 'late').length || 0,
        sick: data?.filter(r => r.status === 'sick').length || 0,
        excused: data?.filter(r => r.status === 'excused').length || 0,
      }
      
      return NextResponse.json({
        ...stats,
        attendanceRate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      })
    }
    
    // آمار مدرسه
    if (type === 'school') {
      const today = new Date().toISOString().split('T')[0]
      
      // تعداد کل دانش‌آموزان
      const { count: totalStudents } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', effectiveSchoolId)
      
      // آمار امروز
      const { data: todayData, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('school_id', effectiveSchoolId)
        .eq('date', today)
      
      if (error) throw error
      
      const presentCount = todayData?.filter(r => r.status === 'present').length || 0
      const absentCount = todayData?.filter(r => ['absent', 'sick', 'excused'].includes(r.status)).length || 0
      const lateCount = todayData?.filter(r => r.status === 'late').length || 0
      
      // موارد نیازمند پیگیری
      const { count: pendingFollowups } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', effectiveSchoolId)
        .in('status', ['absent', 'late'])
        .eq('followed_up', false)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      
      return NextResponse.json({
        totalStudents: totalStudents || 0,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: todayData?.length ? Math.round((presentCount / todayData.length) * 100) : 0,
        pendingFollowups: pendingFollowups || 0,
      })
    }
    
    // مقایسه مدارس (فقط برای ادمین)
    if (type === 'comparison' && profile.role === 'admin') {
      const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01'
      
      const { data, error } = await supabase.rpc('compare_schools_attendance', {
        p_month: currentMonth
      })
      
      if (error) throw error
      
      return NextResponse.json({ schools: data })
    }
    
    // دانش‌آموزان پرغیبت
    if (type === 'high_absence') {
      const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01'
      const minAbsences = parseInt(searchParams.get('minAbsences') || '5')
      
      const { data, error } = await supabase.rpc('get_high_absence_students', {
        p_school_id: effectiveSchoolId,
        p_month: currentMonth,
        p_min_absences: minAbsences
      })
      
      if (error) throw error
      
      return NextResponse.json({ students: data })
    }
    
    // موارد نیازمند پیگیری
    if (type === 'pending_followups') {
      const { data, error } = await supabase.rpc('get_pending_followups', {
        p_school_id: effectiveSchoolId
      })
      
      if (error) throw error
      
      return NextResponse.json({ items: data })
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



