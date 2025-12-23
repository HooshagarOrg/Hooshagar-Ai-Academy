import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // بررسی نقش
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    
    // دریافت کدها
    const { data: codes, error } = await supabase
      .from('activation_codes')
      .select(`
        *,
        student:students(full_name, grade),
        school:schools(name)
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Fetch codes error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, codes })
    
  } catch (error) {
    console.error('Get activation codes error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

