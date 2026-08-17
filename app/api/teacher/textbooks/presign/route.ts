import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { generateTextbookPath, getSignedUploadUrl } from '@/lib/arvan-storage'
import {
  TEXTBOOK_ROLES,
  TEXTBOOK_MIME,
  MAX_TEXTBOOK_BYTES,
  canUploadGrade,
} from '@/lib/teacher/textbooks'

export const maxDuration = 30

const presignSchema = z.object({
  title: z.string().min(2).max(200),
  subject: z.string().max(100).optional().nullable(),
  grade: z.number().int().min(1).max(12),
  fileName: z.string().min(3).max(200),
  fileSize: z.number().int().positive().max(MAX_TEXTBOOK_BYTES, 'حداکثر حجم ۵۰ مگابایت است'),
  mimeType: z.literal(TEXTBOOK_MIME),
})

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId) {
        return NextResponse.json(
          { error: 'مدرسه کاربر مشخص نیست' },
          { status: 400 }
        )
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = presignSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { grade, fileName, fileSize, mimeType } = parsed.data
      const supabase = await createClient()

      const allowed = await canUploadGrade(supabase, ctx.userId, ctx.role, grade)
      if (!allowed) {
        return NextResponse.json(
          { error: 'مجاز به آپلود برای این پایه نیستید' },
          { status: 403 }
        )
      }

      if (!fileName.toLowerCase().endsWith('.pdf') && mimeType !== TEXTBOOK_MIME) {
        return NextResponse.json({ error: 'فقط فایل PDF مجاز است' }, { status: 400 })
      }

      const filePath = generateTextbookPath(ctx.schoolId, grade, fileName)
      const uploadUrl = await getSignedUploadUrl(filePath, TEXTBOOK_MIME, 900)

      if (!uploadUrl) {
        return NextResponse.json(
          { error: 'تولید لینک آپلود ناموفق بود' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        uploadUrl,
        filePath,
        fileSize,
        contentType: TEXTBOOK_MIME,
        expiresIn: 900,
      })
    },
    { roles: TEXTBOOK_ROLES, rateLimit: 'api_default' }
  )
}
