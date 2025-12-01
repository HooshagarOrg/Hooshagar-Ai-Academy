import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET: دریافت لیست حضور و غیاب
export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const followedUp = searchParams.get('followedUp')
    
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
    
    // ساخت query
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(id, full_name, student_code, avatar_url, class_id),
        class:classes(id, name)
      `)
    
    // فیلتر بر اساس نقش
    if (profile.role !== 'admin') {
      query = query.eq('school_id', profile.school_id)
    }
    
    // اعمال فیلترها
    if (classId) {
      query = query.eq('class_id', classId)
    }
    
    if (date) {
      query = query.eq('date', date)
    }
    
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (followedUp !== null) {
      query = query.eq('followed_up', followedUp === 'true')
    }
    
    query = query.order('date', { ascending: false })
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: ثبت حضور و غیاب
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    const { records } = body
    
    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid records' }, { status: 400 })
    }
    
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
    
    // بررسی دسترسی
    if (!['teacher', 'principal', 'discipline_vp', 'educational_vp', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // آماده‌سازی رکوردها
    const preparedRecords = records.map(record => ({
      ...record,
      school_id: profile.school_id,
      recorded_by: user.id,
      recorded_at: new Date().toISOString(),
    }))
    
    // Upsert رکوردها
    const { data, error } = await supabase
      .from('attendance')
      .upsert(preparedRecords, {
        onConflict: 'student_id,date',
        ignoreDuplicates: false,
      })
      .select()
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      message: 'حضور و غیاب با موفقیت ثبت شد',
      count: preparedRecords.length 
    })
  } catch (error: any) {
    console.error('Error saving attendance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: بروزرسانی رکورد (پیگیری)
export async function PATCH(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }
    
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
    
    // بررسی دسترسی برای پیگیری
    if (!['discipline_vp', 'principal', 'counselor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // اگر پیگیری است، اطلاعات پیگیری‌کننده را اضافه کن
    if (updates.followed_up === true) {
      updates.followed_up_by = user.id
      updates.followed_up_at = new Date().toISOString()
    }
    
    updates.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      message: 'رکورد با موفقیت بروزرسانی شد',
      data 
    })
  } catch (error: any) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



