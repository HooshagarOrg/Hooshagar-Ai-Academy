import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'

const ADMIN_PLUS_PRINCIPAL: AllowedRole[] = [...ADMIN_ROLES, 'principal']

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * GET /api/admin/user-credits
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const month = searchParams.get('month') || currentMonth()

        if (userId) {
          const { data, error } = await ctx.supabase
            .from('user_monthly_credits')
            .select(
              'user_id, month, total_credits, used_credits, bonus_credits, bonus_history, updated_at'
            )
            .eq('user_id', userId)
            .eq('month', month)
            .maybeSingle()

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
          }

          return NextResponse.json({ credit: data, available: true })
        }

        let query = ctx.supabase
          .from('user_monthly_credits')
          .select(
            'user_id, month, total_credits, used_credits, bonus_credits, updated_at, profiles!inner(full_name, role, school_id)'
          )
          .eq('month', month)
          .order('updated_at', { ascending: false })
          .limit(100)

        if (ctx.schoolId) {
          query = query.eq('profiles.school_id', ctx.schoolId)
        }

        const { data, error } = await query
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const credits = (data || []).map((row) => {
          const profile = row.profiles as
            | { full_name?: string; role?: string }
            | { full_name?: string; role?: string }[]
          const one = Array.isArray(profile) ? profile[0] : profile
          return {
            user_id: row.user_id,
            month: row.month,
            total_credits: row.total_credits,
            used_credits: row.used_credits,
            bonus_credits: row.bonus_credits,
            full_name: one?.full_name || 'کاربر',
            role: one?.role || '',
          }
        })

        return NextResponse.json({ credits, available: true, month })
      } catch (error) {
        console.error('Error fetching user credits:', error)
        return NextResponse.json({ error: 'خطا در دریافت اعتبار' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

/**
 * POST — افزودن اعتبار جایزه
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const { userId, amount, reason } = body

        if (!userId) {
          return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 })
        }
        if (!amount || amount <= 0) {
          return NextResponse.json({ error: 'مقدار اعتبار باید مثبت باشد' }, { status: 400 })
        }
        if (!reason || String(reason).trim().length < 3) {
          return NextResponse.json({ error: 'دلیل افزودن اعتبار الزامی است' }, { status: 400 })
        }

        const month = currentMonth()
        const { data: existing } = await ctx.supabase
          .from('user_monthly_credits')
          .select('bonus_credits, bonus_history, total_credits')
          .eq('user_id', userId)
          .eq('month', month)
          .maybeSingle()

        const history = Array.isArray(existing?.bonus_history) ? existing.bonus_history : []
        const nextHistory = [
          ...history,
          { date: new Date().toISOString(), amount, reason: String(reason).trim() },
        ]

        const { data, error } = existing
          ? await ctx.supabase
              .from('user_monthly_credits')
              .update({
                bonus_credits: (existing.bonus_credits || 0) + amount,
                bonus_history: nextHistory,
              })
              .eq('user_id', userId)
              .eq('month', month)
              .select('user_id, month, total_credits, used_credits, bonus_credits')
              .single()
          : await ctx.supabase
              .from('user_monthly_credits')
              .insert({
                user_id: userId,
                month,
                total_credits: 100,
                used_credits: 0,
                bonus_credits: amount,
                bonus_history: nextHistory,
              })
              .select('user_id, month, total_credits, used_credits, bonus_credits')
              .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, credit: data })
      } catch (error) {
        console.error('Error adding bonus credits:', error)
        return NextResponse.json({ error: 'خطا در افزودن اعتبار' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}

export async function PUT(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const body = await request.json()
        const { userId, totalCredits, month: monthParam } = body

        if (!userId) {
          return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 })
        }
        if (totalCredits === undefined || totalCredits < 0) {
          return NextResponse.json({ error: 'مقدار اعتبار باید صفر یا مثبت باشد' }, { status: 400 })
        }

        const month = monthParam || currentMonth()
        const { data, error } = await ctx.supabase
          .from('user_monthly_credits')
          .upsert(
            {
              user_id: userId,
              month,
              total_credits: totalCredits,
            },
            { onConflict: 'user_id,month' }
          )
          .select('user_id, month, total_credits, used_credits, bonus_credits')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, credit: data })
      } catch (error) {
        console.error('Error updating user credits:', error)
        return NextResponse.json({ error: 'خطا در تنظیم اعتبار' }, { status: 500 })
      }
    },
    { roles: ADMIN_PLUS_PRINCIPAL }
  )
}
