import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

/**
 * GET /api/admin/user-credits
 * دریافت اعتبار کاربران
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) + '-01'

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
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * POST /api/admin/user-credits
 * افزودن اعتبار جایزه
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const { userId, amount, reason } = body

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
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * PUT /api/admin/user-credits
 * تنظیم اعتبار ماهانه کاربر
 */
export async function PUT(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const { userId, totalCredits, month } = body

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
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
