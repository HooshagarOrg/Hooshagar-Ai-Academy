import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['librarian', 'principal', 'admin', 'platform_admin']

const createSchema = z.object({
  title: z.string().trim().min(2, 'عنوان کتاب الزامی است').max(300),
  author: z.string().trim().max(200).optional().nullable(),
  copies: z.number().int().min(0).max(9999).optional().default(1),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ books: [], error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const q = request.nextUrl.searchParams.get('q')?.trim()

      let query = ctx.supabase
        .from('library_books')
        .select('id, title, author, copies, created_at')
        .order('title')
        .limit(100)

      if (ctx.schoolId) query = query.eq('school_id', ctx.schoolId)
      if (q) query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ books: [], error: error.message }, { status: 500 })
      }
      return NextResponse.json({ books: data || [] })
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

      const { data, error } = await ctx.supabase
        .from('library_books')
        .insert({
          school_id: ctx.schoolId,
          title: parsed.data.title,
          author: parsed.data.author || null,
          copies: parsed.data.copies,
        })
        .select('id, title, author, copies, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ book: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
