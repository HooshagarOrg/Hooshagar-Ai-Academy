import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { getArvanObjectBytes } from '@/lib/arvan-storage'
import { TEXTBOOK_ROLES } from '@/lib/teacher/textbooks'

export const maxDuration = 60
export const runtime = 'nodejs'

const idSchema = z.string().uuid()

/**
 * پروکسی PDF از آروان روی دامنهٔ اپ — iframe same-origin بدون هدر غیرلاتین
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async () => {
      try {
        const { id } = params
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
          return NextResponse.json(
            { error: 'کتاب یافت نشد یا دسترسی ندارید' },
            { status: 404 }
          )
        }

        const object = await getArvanObjectBytes(data.file_path as string)

        if (!object || object.bytes.byteLength < 5) {
          return NextResponse.json(
            { error: 'خواندن فایل از فضای ذخیره‌سازی ناموفق بود' },
            { status: 502 }
          )
        }

        return new NextResponse(Buffer.from(object.bytes), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="textbook.pdf"',
            'Content-Length': String(object.bytes.byteLength),
            'Cache-Control': 'private, max-age=120',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      } catch (err) {
        console.error('textbook file proxy error:', err)
        return NextResponse.json(
          { error: 'بارگذاری PDF ناموفق بود' },
          { status: 500 }
        )
      }
    },
    { roles: TEXTBOOK_ROLES, skipRateLimit: true }
  )
}
