/**
 * GET /api/xp/history
 * 
 * تاریخچه تراکنش‌های XP کاربر
 */

import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // بررسی لاگین
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }
    
    // دریافت query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action_type = searchParams.get('type')
    
    // Query builder
    let query = supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // فیلتر بر اساس نوع
    if (action_type) {
      query = query.eq('action_type', action_type)
    }
    
    const { data: transactions, error } = await query
    
    if (error) {
      console.error('خطا در دریافت تاریخچه:', error)
      return NextResponse.json(
        { error: 'خطا در دریافت تاریخچه' },
        { status: 500 }
      )
    }
    
    // دریافت تعداد کل
    let countQuery = supabase
      .from('xp_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (action_type) {
      countQuery = countQuery.eq('action_type', action_type)
    }
    
    const { count } = await countQuery
    
    // ترجمه action_type به فارسی
    const translateAction = (action: string): string => {
      const translations: Record<string, string> = {
        'study_buddy': 'دستیار مطالعه',
        'problem_solver': 'حل مسئله',
        'story_wizard': 'ساخت داستان',
        'ai_analyzer': 'تحلیل AI',
        'content_generator': 'تولید محتوا',
        'quiz_taker': 'شرکت در آزمون',
        'exam_maker': 'ساخت آزمون',
        'daily_login': 'ورود روزانه',
        'streak_milestone': 'دستاورد Streak',
        'badge_earned': 'دریافت نشان',
        'shop_purchase': 'خرید از فروشگاه',
        'manual_bonus': 'پاداش ویژه'
      }
      return translations[action] || action
    }
    
    const translatedTransactions = transactions.map(t => ({
      ...t,
      action_type_fa: translateAction(t.action_type)
    }))
    
    return NextResponse.json({
      transactions: translatedTransactions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('خطا در /api/xp/history:', error)
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    )
  }
}

