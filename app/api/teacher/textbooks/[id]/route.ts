import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { deleteFromArvan, getSignedDownloadUrl } from '@/lib/arvan-storage'
import {
  TEXTBOOK_ROLES,
  TEXTBOOK_SELECT,
  canManageAllSchoolGrades,
  type TextbookRow,
} from '@/lib/teacher/textbooks'

export const maxDuration = 30

const idSchema = z.string().uuid()

/** مشاهده metadata + لینک امضا‌شده برای تدریس (۴ ساعت) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async () => {
      const { id } = await params
      if (!idSchema.safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('textbooks')
        .select(TEXTBOOK_SELECT)
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('textbook get error:', error)
        return NextResponse.json({ error: 'خطا در دریافت کتاب' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: 'کتاب یافت نشد یا دسترسی ندارید' }, { status: 404 })
      }

      const textbook = data as TextbookRow
      const signedUrl = await getSignedDownloadUrl(textbook.file_path, 4 * 60 * 60)

      if (!signedUrl) {
        return NextResponse.json(
          { error: 'تولید لینک دانلود ناموفق بود' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        textbook,
        signedUrl,
        expiresIn: 4 * 60 * 60,
      })
    },
    { roles: TEXTBOOK_ROLES, rateLimit: 'api_default' }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async (ctx) => {
      const { id } = await params
      if (!idSchema.safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('textbooks')
        .select(TEXTBOOK_SELECT)
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('textbook delete fetch error:', error)
        return NextResponse.json({ error: 'خطا در حذف کتاب' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: 'کتاب یافت نشد یا دسترسی ندارید' }, { status: 404 })
      }

      const textbook = data as TextbookRow
      const canDelete =
        textbook.uploaded_by === ctx.userId || canManageAllSchoolGrades(ctx.role)

      if (!canDelete) {
        return NextResponse.json(
          { error: 'فقط آپلودکننده یا مدیر می‌تواند حذف کند' },
          { status: 403 }
        )
      }

      const { error: delError } = await supabase.from('textbooks').delete().eq('id', id)
      if (delError) {
        console.error('textbook delete error:', delError)
        return NextResponse.json({ error: 'حذف از پایگاه داده ناموفق بود' }, { status: 500 })
      }

      await deleteFromArvan(textbook.file_path)

      return NextResponse.json({ success: true })
    },
    { roles: TEXTBOOK_ROLES, rateLimit: 'api_default' }
  )
}
