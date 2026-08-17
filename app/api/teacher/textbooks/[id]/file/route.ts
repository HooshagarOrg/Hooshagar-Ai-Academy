import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { getArvanObjectStream } from '@/lib/arvan-storage'
import {
  TEXTBOOK_ROLES,
  type TextbookRow,
} from '@/lib/teacher/textbooks'

export const maxDuration = 60
export const runtime = 'nodejs'

const idSchema = z.string().uuid()

/**
 * پروکسی PDF از آروان روی دامنهٔ اپ — تا iframe مرورگر بتواند کتاب را نشان دهد
 * (لینک مستقیم آروان معمولاً داخل iframe بلاک می‌شود)
 */
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
        .select('id, file_path, title, mime_type')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('textbook file meta error:', error)
        return NextResponse.json({ error: 'خطا در دریافت کتاب' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: 'کتاب یافت نشد یا دسترسی ندارید' }, { status: 404 })
      }

      const row = data as Pick<TextbookRow, 'id' | 'file_path' | 'title' | 'mime_type'>
      const object = await getArvanObjectStream(row.file_path)

      if (!object) {
        return NextResponse.json(
          { error: 'خواندن فایل از فضای ذخیره‌سازی ناموفق بود' },
          { status: 502 }
        )
      }

      const safeName = (row.title || 'textbook')
        .replace(/[^\w\u0600-\u06FF.-]+/g, '_')
        .slice(0, 80)

      const headers = new Headers()
      headers.set('Content-Type', 'application/pdf')
      headers.set('Content-Disposition', `inline; filename="${safeName}.pdf"`)
      headers.set('Cache-Control', 'private, max-age=300')
      headers.set('X-Content-Type-Options', 'nosniff')
      if (object.contentLength !== undefined) {
        headers.set('Content-Length', String(object.contentLength))
      }

      return new NextResponse(object.body, {
        status: 200,
        headers,
      })
    },
    { roles: TEXTBOOK_ROLES, rateLimit: 'api_default', skipRateLimit: true }
  )
}
