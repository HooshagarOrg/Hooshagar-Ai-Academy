import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { IssueActivationCodeRequest, IssueActivationCodeResponse } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // بررسی نقش ادمین
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    
    const body: IssueActivationCodeRequest = await request.json()
    
    // تولید کد یکتا
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_activation_code')
    
    if (codeError) {
      console.error('Generate code error:', codeError)
      return NextResponse.json({ success: false, error: 'Failed to generate code' }, { status: 500 })
    }
    
    const code = codeData as string
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (body.expires_days || 30))
    
    // ذخیره کد
    const { data: activationCode, error: insertError } = await supabase
      .from('activation_codes')
      .insert({
        code,
        school_id: body.school_id || profile.school_id,
        student_id: body.student_id,
        target_role: body.target_role,
        relation_type: body.relation_type,
        target_name: body.target_name,
        target_phone: body.target_phone,
        target_email: body.target_email,
        expires_at: expiresAt.toISOString(),
        issued_by: user.id,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cleanCode = code.replace('-', '')
    const activationUrl = `${baseUrl}/activate/${cleanCode}`
    const qrUrl = `${baseUrl}/api/qr?data=${encodeURIComponent(activationUrl)}`
    
    const response: IssueActivationCodeResponse = {
      success: true,
      code,
      qr_url: qrUrl,
      activation_url: activationUrl,
      expires_at: expiresAt.toISOString(),
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Issue activation code error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

