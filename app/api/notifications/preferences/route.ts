/**
 * API Route: Notification Preferences
 * 
 * GET: دریافت تنظیمات
 * PATCH: بروزرسانی تنظیمات
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const PreferencesSchema = z.object({
  weekly_sms_enabled: z.boolean().optional(),
  weekly_sms_day: z.enum(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']).optional(),
  weekly_sms_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional()
})

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 })
    }

    let { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Create default if not exists
    if (!preferences) {
      const { data: newPrefs } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          weekly_sms_enabled: true,
          weekly_sms_day: 'thursday',
          weekly_sms_time: '11:00:00'
        })
        .select()
        .single()

      preferences = newPrefs
    }

    return NextResponse.json({ preferences })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 })
    }

    const body = await req.json()
    const validated = PreferencesSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'داده‌های نامعتبر', details: validated.error.issues },
        { status: 400 }
      )
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...validated.data,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ preferences })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    )
  }
}

