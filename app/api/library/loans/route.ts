import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['librarian', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  book_id: z.string().uuid('شناسه کتاب نامعتبر است'),
  borrower_student_id: z.string().uuid().optional().nullable(),
  borrower_name: z.string().trim().max(200).optional().nullable(),
  borrowed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ امانت نامعتبر است'),
  due_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ بازگشت نامعتبر است')
    .optional()
    .nullable(),
})

const returnSchema = z.object({
  id: z.string().uuid('شناسه امانت نامعتبر است'),
  returned_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ بازگشت نامعتبر است')
    .optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ loans: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      let query = ctx.supabase
        .from('book_loans')
        .select(
          'id, book_id, borrower_student_id, borrower_name, borrowed_at, due_at, returned_at, library_books(title, author)'
        )
        .order('borrowed_at', { ascending: false })
        .limit(100)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ loans: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ loans: data || [] })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const parsed = createSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      if (!parsed.data.borrower_student_id && !parsed.data.borrower_name) {
        return NextResponse.json(
          { error: 'نام امانت‌گیرنده یا دانش‌آموز الزامی است' },
          { status: 400 }
        )
      }

      const { data: book } = await ctx.supabase
        .from('library_books')
        .select('id')
        .eq('id', parsed.data.book_id)
        .eq('school_id', ctx.schoolId)
        .maybeSingle()

      if (!book) {
        return NextResponse.json({ error: 'کتاب یافت نشد' }, { status: 404 })
      }

      const { data, error } = await ctx.supabase
        .from('book_loans')
        .insert({
          school_id: ctx.schoolId,
          book_id: parsed.data.book_id,
          borrower_student_id: parsed.data.borrower_student_id || null,
          borrower_name: parsed.data.borrower_name || null,
          borrowed_at: parsed.data.borrowed_at,
          due_at: parsed.data.due_at || null,
          created_by: ctx.userId,
        })
        .select(
          'id, book_id, borrower_student_id, borrower_name, borrowed_at, due_at, returned_at'
        )
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ loan: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}

export async function PATCH(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const parsed = returnSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const returnedAt =
        parsed.data.returned_at || new Date().toISOString().slice(0, 10)

      let query = ctx.supabase
        .from('book_loans')
        .update({ returned_at: returnedAt })
        .eq('id', parsed.data.id)
        .is('returned_at', null)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)

      const { data, error } = await query
        .select(
          'id, book_id, borrower_student_id, borrower_name, borrowed_at, due_at, returned_at'
        )
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: 'امانت یافت نشد یا قبلاً برگشت داده شده' }, { status: 404 })
      }
      return NextResponse.json({ loan: data })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
