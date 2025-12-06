import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase-server'

/**
 * GET /api/admin/user-credits
 * دریافت اعتبار کاربران
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) + '-01'

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // let query = supabase
    //   .from('user_monthly_credits')
    //   .select('*, profiles(full_name, role)')
    //   .eq('month', month)
    // 
    // if (userId) {
    //   query = query.eq('user_id', userId)
    // }
    // 
    // const { data, error } = await query

    // داده نمونه
    const credits = [
      {
        id: 'credit-1',
        userId: 'user-1',
        userName: 'علی رضایی',
        userRole: 'دانش‌آموز',
        month,
        totalCredits: 100,
        usedCredits: 45,
        bonusCredits: 20,
        availableCredits: 75,
        bonusHistory: [
          { date: '1403/09/15', amount: 10, reason: 'برنده مسابقه' },
          { date: '1403/09/20', amount: 10, reason: 'فعالیت خوب' },
        ],
      },
      {
        id: 'credit-2',
        userId: 'user-2',
        userName: 'سارا احمدی',
        userRole: 'معلم',
        month,
        totalCredits: 500,
        usedCredits: 234,
        bonusCredits: 0,
        availableCredits: 266,
        bonusHistory: [],
      },
    ]

    if (userId) {
      const userCredit = credits.find(c => c.userId === userId)
      return NextResponse.json({ credit: userCredit || null })
    }

    return NextResponse.json({ credits })
  } catch (error) {
    console.error('Error fetching user credits:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اعتبار' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/user-credits
 * افزودن اعتبار جایزه
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, amount, reason } = body

    // اعتبارسنجی
    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'مقدار اعتبار باید مثبت باشد' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'دلیل افزودن اعتبار الزامی است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // const { data, error } = await supabase.rpc('add_bonus_credits', {
    //   p_user_id: userId,
    //   p_amount: amount,
    //   p_reason: reason
    // })

    console.log('[Bonus Credits Added]', { userId, amount, reason })

    return NextResponse.json({
      success: true,
      message: `${amount} اعتبار با موفقیت اضافه شد`,
    })
  } catch (error) {
    console.error('Error adding bonus credits:', error)
    return NextResponse.json(
      { error: 'خطا در افزودن اعتبار' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/user-credits
 * تنظیم اعتبار ماهانه کاربر
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, totalCredits, month } = body

    // اعتبارسنجی
    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    if (totalCredits === undefined || totalCredits < 0) {
      return NextResponse.json(
        { error: 'مقدار اعتبار باید صفر یا مثبت باشد' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }
    // 
    // const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01'
    // 
    // const { data, error } = await supabase
    //   .from('user_monthly_credits')
    //   .upsert({
    //     user_id: userId,
    //     month: currentMonth,
    //     total_credits: totalCredits,
    //   }, {
    //     onConflict: 'user_id,month'
    //   })

    console.log('[Credits Updated]', { userId, totalCredits, month })

    return NextResponse.json({
      success: true,
      message: 'اعتبار با موفقیت تنظیم شد',
    })
  } catch (error) {
    console.error('Error updating user credits:', error)
    return NextResponse.json(
      { error: 'خطا در تنظیم اعتبار' },
      { status: 500 }
    )
  }
}













