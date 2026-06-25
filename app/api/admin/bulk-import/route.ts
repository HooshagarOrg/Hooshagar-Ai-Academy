import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, ADMIN_ROLES, type AllowedRole } from '@/lib/security/api-guard'
import { mapStaffRow, mapStudentRow } from '@/lib/bulk-import/column-mapper'
import { importStaffRows, importStudentRows } from '@/lib/bulk-import/importer'
import { parseSpreadsheetFile } from '@/lib/bulk-import/parse-spreadsheet'
import { validateStaffRow, validateStudentRow } from '@/lib/bulk-import/validators'
import type { ImportSheetType } from '@/lib/bulk-import/types'

const BULK_IMPORT_ROLES: AllowedRole[] = [...ADMIN_ROLES, 'principal']

const optionsSchema = z.object({
  schoolId: z.string().uuid('شناسه مدرسه نامعتبر است'),
  createParentAccounts: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
  defaultParentPassword: z.string().min(4).max(20).optional(),
  defaultStaffPassword: z.string().min(4).max(20).optional(),
})

const validateBodySchema = z.object({
  action: z.literal('validate'),
  importType: z.enum(['students', 'staff', 'auto']),
  rows: z.array(z.record(z.string())).min(1).max(2000),
})

const importBodySchema = z.object({
  action: z.literal('import'),
  importType: z.enum(['students', 'staff']),
  options: optionsSchema,
  rows: z.array(z.record(z.string())).min(1).max(500),
})

// ============================================
// POST: validate یا import
// ============================================
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const contentType = request.headers.get('content-type') || ''

      // آپلود فایل
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const schoolId = String(formData.get('schoolId') || ctx.schoolId || '')

        if (!file) {
          return NextResponse.json({ error: 'فایل ارسال نشده' }, { status: 400 })
        }
        if (!schoolId) {
          return NextResponse.json({ error: 'مدرسه انتخاب نشده' }, { status: 400 })
        }

        const sheets = await parseSpreadsheetFile(file)
        if (sheets.length === 0) {
          return NextResponse.json({ error: 'فایل خالی یا نامعتبر است' }, { status: 400 })
        }

        const result = sheets.map((sheet) => {
          if (sheet.type === 'staff') {
            const rows = sheet.rows.map((r, i) => validateStaffRow(mapStaffRow(r, i + 1)))
            return { sheetName: sheet.sheetName, type: 'staff' as ImportSheetType, rows }
          }
          const rows = sheet.rows.map((r, i) => validateStudentRow(mapStudentRow(r, i + 1)))
          return { sheetName: sheet.sheetName, type: 'students' as ImportSheetType, rows }
        })

        return NextResponse.json({ success: true, schoolId, sheets: result })
      }

      // JSON validate/import
      const body = await request.json()

      if (body.action === 'validate') {
        const parsed = validateBodySchema.safeParse(body)
        if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
        }

        const { importType, rows } = parsed.data
        if (importType === 'staff') {
          const validated = rows.map((r, i) => validateStaffRow(mapStaffRow(r, i + 1)))
          return NextResponse.json({ success: true, type: 'staff', rows: validated })
        }

        const validated = rows.map((r, i) => validateStudentRow(mapStudentRow(r, i + 1)))
        return NextResponse.json({ success: true, type: 'students', rows: validated })
      }

      if (body.action === 'import') {
        const parsed = importBodySchema.safeParse(body)
        if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
        }

        const { importType, options, rows } = parsed.data
        const schoolId = options.schoolId || ctx.schoolId
        if (!schoolId) {
          return NextResponse.json({ error: 'شناسه مدرسه الزامی است' }, { status: 400 })
        }

        const opts = { ...options, schoolId }

        if (importType === 'staff') {
          const validated = rows.map((r, i) => validateStaffRow(mapStaffRow(r, i + 1)))
          const summary = await importStaffRows(validated, opts)
          return NextResponse.json(summary)
        }

        const validated = rows.map((r, i) => validateStudentRow(mapStudentRow(r, i + 1)))
        const summary = await importStudentRows(validated, opts)
        return NextResponse.json(summary)
      }

      return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
    },
    { roles: BULK_IMPORT_ROLES, rateLimit: 'admin_action' }
  )
}

// ============================================
// GET: دانلود قالب CSV
// ============================================
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') || 'students'

      const templates: Record<string, string> = {
        students: `نام,نام_خانوادگی,کد_ملی,پایه,کلاس,نام_والد,نام_خانوادگی_والد,کد_ورود_والد,نسبت_والد,موبایل_والد
علی,احمدی,1234567890,هفتم,هفتم الف,محمد,احمدی,2112112111,پدر,09121234567
زهرا,رضایی,0987654321,پنجم,پنجم ب,فاطمه,رضایی,9399654875,مادر,09399654875`,
        staff: `نام,نام_خانوادگی,کد_ملی,نقش,موبایل,کد_ورود
حسن,کریمی,1122334455,معلم,09122222222,1122334455
مریم,صالحی,2233445566,مشاور,09332222222,9332222222`,
      }

      const content = templates[type] ?? templates.students
      return new NextResponse('\uFEFF' + content, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="bulk-import-${type}.csv"`,
        },
      })
    },
    { roles: BULK_IMPORT_ROLES }
  )
}
