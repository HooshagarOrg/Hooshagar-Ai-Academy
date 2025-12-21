/**
 * API Route: دریافت دانش‌آموز بر اساس user_id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient()
    const { userId } = params

    // دریافت دانش‌آموز
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: 'دانش‌آموز یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      student
    })

  } catch (error) {
    console.error('❌ Error fetching student:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}




