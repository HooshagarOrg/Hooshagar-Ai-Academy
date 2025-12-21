/**
 * API Route: مدیریت الگوهای پیامک
 * GET /api/sms/templates - دریافت لیست
 * POST /api/sms/templates - ایجاد الگو
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت ناموفق' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('sms_templates')
      .select('*')
      .eq('school_id', profile?.school_id)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      templates
    })

  } catch (error) {
    console.error('❌ Error fetching templates:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت ناموفق' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, body: templateBody, category } = body

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'platform_admin', 'principal', 'financial_vp'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    }

    const { data: template, error } = await supabase
      .from('sms_templates')
      .insert({
        school_id: profile.school_id,
        title,
        body: templateBody,
        category,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json(
          { success: false, error: 'الگویی با این عنوان قبلاً ایجاد شده' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'الگو با موفقیت ایجاد شد',
      template
    })

  } catch (error) {
    console.error('❌ Error creating template:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

