import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'
import { PLATFORM_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'
import { createServiceClient } from '@/lib/supabase/service'
import { parseSpreadsheetFile } from '@/lib/bulk-import/parse-spreadsheet'
import { importVirtualClassRows } from '@/lib/virtual-class/import-spreadsheet'
import { buildVirtualClassTemplateXlsx } from '@/lib/virtual-class/excel-template'

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
      const form = await request.formData()
      const file = form.get('file')
      const schoolId = String(form.get('schoolId') || '')

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'فایل الزامی است' }, { status: 400 })
      }
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه را انتخاب کنید' }, { status: 400 })
      }

      const sheets = await parseSpreadsheetFile(file)
      const dataSheets = sheets.filter((s) => {
        const joined = s.headers.join('|')
        return (
          joined.includes('نام_لاتین_اتاق') ||
          joined.includes('شناسه_اتاق') ||
          joined.includes('skyroom_room_name') ||
          s.sheetName.includes('مجازی')
        )
      })
      const rows = (dataSheets.length > 0 ? dataSheets : sheets)
        .flatMap((s) => s.rows)
        .slice(0, 200)
      if (rows.length === 0) {
        return NextResponse.json({ error: 'ردیف معتبری در فایل نیست' }, { status: 400 })
      }

      const service = createServiceClient()
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
