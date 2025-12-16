import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CoinTransactionType } from '@/lib/types/shop.types'

// دریافت تاریخچه تراکنش‌های سکه
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد شوید' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as CoinTransactionType | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // ساخت کوئری
    let query = supabase
      .from('coin_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // فیلتر نوع
    if (type) {
      query = query.eq('type', type)
    }

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دریافت تراکنش‌ها' },
        { status: 500 }
      )
    }

    // محاسبه آمار
    const { data: statsData } = await supabase
      .from('coin_transactions')
      .select('type, amount')
      .eq('user_id', user.id)

    const stats = {
      total_earned: 0,
      total_spent: 0,
      total_bonus: 0,
      total_refund: 0,
    }

    for (const tx of statsData || []) {
      switch (tx.type) {
        case 'earn':
          stats.total_earned += tx.amount
          break
        case 'spend':
          stats.total_spent += Math.abs(tx.amount)
          break
        case 'bonus':
          stats.total_bonus += tx.amount
          break
        case 'refund':
          stats.total_refund += tx.amount
          break
      }
    }

    // دریافت موجودی فعلی
    const { data: talentData } = await supabase
      .from('talent_garden')
      .select('coins')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        current_balance: talentData?.coins || 0,
        stats,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit,
        },
      },
    })
  } catch (error) {
    console.error('Error in transactions API:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    )
  }
}












































