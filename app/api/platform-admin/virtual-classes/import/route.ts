import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { PLATFORM_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'
import { createServiceClient } from '@/lib/supabase/service'
import { parseSpreadsheetFile } from '@/lib/bulk-import/parse-spreadsheet'
import {
  collectVirtualClassRawRows,
  importVirtualClassRows,
  validateVirtualClassRows,
} from '@/lib/virtual-class/import-spreadsheet'
import { buildVirtualClassTemplateXlsx } from '@/lib/virtual-class/excel-template'

const importBodySchema = z.object({
  action: z.literal('import'),
  schoolId: z.string().uuid('شناسه مدرسه نامعتبر است'),
  rows: z.array(z.record(z.string())).min(1, 'ردیفی برای واردسازی نیست').max(200),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const buffer = await buildVirtualClassTemplateXlsx()
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition':
            'attachment; filename="skyroom-virtual-classes.xlsx"',
        },
      })
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const contentType = request.headers.get('content-type') || ''
      const service = createServiceClient()

      if (contentType.includes('multipart/form-data')) {
        const form = await request.formData()
        const file = form.get('file')
        const schoolId = String(form.get('schoolId') || '')

        if (!(file instanceof File)) {
          return NextResponse.json({ error: 'فایل الزامی است' }, { status: 400 })
        }
        if (!z.string().uuid().safeParse(schoolId).success) {
          return NextResponse.json({ error: 'مدرسه را انتخاب کنید' }, { status: 400 })
        }

        const { data: school } = await service
          .from('schools')
          .select('id')
          .eq('id', schoolId)
          .maybeSingle()

        if (!school) {
          return NextResponse.json({ error: 'مدرسه یافت نشد' }, { status: 400 })
        }

        const sheets = await parseSpreadsheetFile(file)
        const rows = collectVirtualClassRawRows(sheets)
        if (rows.length === 0) {
          return NextResponse.json(
            { error: 'شیت کلاس‌های مجازی با ستون‌های شناسه_اتاق یا نام_لاتین_اتاق یافت نشد' },
            { status: 400 }
          )
        }

        const preview = await validateVirtualClassRows({ service, schoolId, rows })
        return NextResponse.json({ success: true, schoolId, rows: preview })
      }

      const body: unknown = await request.json()
      const parsed = importBodySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده نامعتبر' },
          { status: 400 }
        )
      }

      const { schoolId, rows } = parsed.data
      const { data: school } = await service
        .from('schools')
        .select('id')
        .eq('id', schoolId)
        .maybeSingle()

      if (!school) {
        return NextResponse.json({ error: 'مدرسه یافت نشد' }, { status: 400 })
      }

      const results = await importVirtualClassRows({
        service,
        schoolId,
        adminId: ctx.userId,
        rows,
      })

      const success = results.filter((r) => r.status === 'success').length
      const errors = results.filter((r) => r.status === 'error').length
      const skipped = results.filter((r) => r.status === 'skipped').length

      return NextResponse.json({
        success: true,
        inserted_count: success,
        error_count: errors,
        skipped_count: skipped,
        results,
      })
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}
