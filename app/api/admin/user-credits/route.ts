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

        if (userId) {
          return NextResponse.json({ credit: null, available: false })
        }

        return NextResponse.json({ credits: [], available: false })
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

        return NextResponse.json(
          { error: 'افزودن اعتبار هنوز به سامانهٔ صورتحساب وصل نیست' },
          { status: 503 }
        )
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

        return NextResponse.json(
          { error: 'تنظیم اعتبار هنوز به سامانهٔ صورتحساب وصل نیست' },
          { status: 503 }
        )
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
