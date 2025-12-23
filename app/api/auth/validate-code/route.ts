import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ValidateCodeRequest, ValidateCodeResponse } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body: ValidateCodeRequest = await request.json()
    
    // نرمال‌سازی کد (حذف خط تیره و spaces)
    const code = body.code.toUpperCase().replace(/[-\s]/g, '')
    const formattedCode = code.length === 8 
      ? `${code.slice(0, 4)}-${code.slice(4)}` 
      : body.code.toUpperCase()
    
    // پیدا کردن کد
    const { data: activationCode, error } = await supabase
      .from('activation_codes')
      .select(`
        *,
        school:schools(name),
        student:students(full_name, grade)
      `)
      .or(`code.eq.${formattedCode},code.eq.${code}`)
      .single()
    
    if (error || !activationCode) {
      // لاگ تلاش ناموفق
      await supabase.from('activation_logs').insert({
        action: 'failed',
        error_message: 'Invalid code',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
      })
      
      return NextResponse.json({ 
        valid: false, 
        error: 'کد فعال‌سازی نامعتبر است' 
      })
    }
    
    // بررسی وضعیت
    if (activationCode.status === 'used') {
      return NextResponse.json({ 
        valid: false, 
        error: 'این کد قبلاً استفاده شده است' 
      })
    }
    
    if (activationCode.status === 'expired' || new Date(activationCode.expires_at) < new Date()) {
      await supabase
        .from('activation_codes')
        .update({ status: 'expired' })
        .eq('id', activationCode.id)
        
      return NextResponse.json({ 
        valid: false, 
        error: 'این کد منقضی شده است' 
      })
    }
    
    if (activationCode.status === 'revoked') {
      return NextResponse.json({ 
        valid: false, 
        error: 'این کد لغو شده است' 
      })
    }
    
    // بررسی تعداد تلاش
    if (activationCode.attempt_count >= activationCode.max_attempts) {
      return NextResponse.json({ 
        valid: false, 
        error: 'تعداد تلاش‌های مجاز به پایان رسیده است' 
      })
    }
    
    // لاگ بازدید
    await supabase.from('activation_logs').insert({
      code_id: activationCode.id,
      action: 'view',
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
    })
    
    const response: ValidateCodeResponse = {
      valid: true,
      code_id: activationCode.id,
      target_role: activationCode.target_role,
      relation_type: activationCode.relation_type,
      target_name: activationCode.target_name,
      student_name: activationCode.student?.full_name,
      school_name: activationCode.school?.name,
      school_id: activationCode.school_id,
      grade: activationCode.student?.grade?.toString(),
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({ valid: false, error: 'خطای سرور' }, { status: 500 })
  }
}

