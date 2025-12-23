import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ActivateAccountRequest, ActivateAccountResponse } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body: ActivateAccountRequest = await request.json()
    
    // نرمال‌سازی کد
    const code = body.code.toUpperCase().replace(/[-\s]/g, '')
    const formattedCode = code.length === 8 
      ? `${code.slice(0, 4)}-${code.slice(4)}` 
      : body.code.toUpperCase()
    
    // پیدا کردن و اعتبارسنجی کد
    const { data: activationCode, error: codeError } = await supabase
      .from('activation_codes')
      .select('*')
      .or(`code.eq.${formattedCode},code.eq.${code}`)
      .eq('status', 'pending')
      .single()
    
    if (codeError || !activationCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'کد فعال‌سازی نامعتبر است' 
      })
    }
    
    // بررسی انقضا
    if (new Date(activationCode.expires_at) < new Date()) {
      await supabase
        .from('activation_codes')
        .update({ status: 'expired' })
        .eq('id', activationCode.id)
      
      return NextResponse.json({ 
        success: false, 
        error: 'این کد منقضی شده است' 
      })
    }
    
    // افزایش شمارنده تلاش
    const newAttemptCount = activationCode.attempt_count + 1
    await supabase
      .from('activation_codes')
      .update({ attempt_count: newAttemptCount })
      .eq('id', activationCode.id)
    
    // بررسی تعداد تلاش
    if (newAttemptCount > activationCode.max_attempts) {
      await supabase.from('activation_logs').insert({
        code_id: activationCode.id,
        action: 'blocked',
        phone: body.phone,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        error_message: 'Max attempts exceeded',
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'تعداد تلاش‌های مجاز به پایان رسیده است' 
      })
    }
    
    // بررسی شماره موبایل تکراری
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', body.phone)
      .single()
    
    if (existingPhone) {
      return NextResponse.json({ 
        success: false, 
        error: 'این شماره موبایل قبلاً ثبت شده است' 
      })
    }
    
    // ساخت حساب کاربری در Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: body.phone,
      password: body.password,
      phone_confirm: true,
      user_metadata: {
        full_name: activationCode.target_name,
        role: activationCode.target_role,
      }
    })
    
    if (authError || !authData.user) {
      console.error('Auth create user error:', authError)
      await supabase.from('activation_logs').insert({
        code_id: activationCode.id,
        action: 'failed',
        phone: body.phone,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        error_message: authError?.message || 'Failed to create user',
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'خطا در ساخت حساب کاربری' 
      })
    }
    
    // ساخت پروفایل
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: activationCode.target_name,
        email: activationCode.target_email,
        phone: body.phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        role: activationCode.target_role,
        school_id: activationCode.school_id,
        activation_code_id: activationCode.id,
        activated_at: new Date().toISOString(),
      })
    
    if (profileError) {
      console.error('Profile create error:', profileError)
      // حذف کاربر Auth اگر پروفایل ساخته نشد
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json({ 
        success: false, 
        error: 'خطا در ساخت پروفایل' 
      })
    }
    
    // اگر والد است، اتصال به دانش‌آموز
    if (activationCode.student_id && activationCode.target_role === 'parent') {
      await supabase
        .from('guardians')
        .insert({
          profile_id: authData.user.id,
          student_id: activationCode.student_id,
          relation: activationCode.relation_type || 'guardian',
          is_primary: activationCode.relation_type === 'father',
        })
    }
    
    // بروزرسانی کد فعال‌سازی
    await supabase
      .from('activation_codes')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        used_by: authData.user.id,
        bound_phone: body.phone,
      })
      .eq('id', activationCode.id)
    
    // لاگ موفقیت
    await supabase.from('activation_logs').insert({
      code_id: activationCode.id,
      action: 'success',
      phone: body.phone,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
    })
    
    const response: ActivateAccountResponse = {
      success: true,
      user_id: authData.user.id,
      message: 'حساب کاربری با موفقیت فعال شد',
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Activate account error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'خطای سرور' 
    }, { status: 500 })
  }
}

