import { parseGrade } from '@/lib/bulk-import/column-mapper'
import { normalizeClassName } from '@/lib/bulk-import/resolve-class'

export const VIRTUAL_CLASS_IMPORT_HEADERS = [
  'پایه',
  'کلاس',
  'عنوان',
  'شناسه_اتاق',
  'نام_لاتین_اتاق',
  'لینک_اتاق',
] as const

export type VirtualClassRowStatus = 'valid' | 'warning' | 'error' | 'skipped'

export type VirtualClassImportRow = {
  rowNumber: number
  grade: number | null
  className: string
  title: string
  roomIdRaw: string
  latinName: string
  link: string
}

export type VirtualClassPreviewRow = VirtualClassImportRow & {
  status: VirtualClassRowStatus
  errors: string[]
  warnings: string[]
  alreadyLinked: boolean
  resolvedClassId: string | null
  resolvedClassName: string | null
}

export type VirtualClassImportResult = {
  rowNumber: number
  title: string
  status: 'success' | 'error' | 'skipped'
  message: string
}

export type VirtualClassSchoolClass = {
  id: string
  name: string
  grade: number
  teacher_id: string | null
}

type SheetLike = {
  headers: string[]
  sheetName: string
  rows: Record<string, string>[]
}

const PERSIAN_GRADE_NAMES = new Set([
  'اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم',
  'هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم',
])

function normHeader(s: string): string {
  return s
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/\u200c/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function pick(row: Record<string, string>, aliases: string[]): string {
  const wanted = aliases.map(normHeader)
  for (const [key, val] of Object.entries(row)) {
    const k = normHeader(key)
    if (wanted.includes(k)) return String(val ?? '').trim()
  }
  return ''
}

export function extractSkyroomSlug(link: string): string {
  const trimmed = link.trim()
  if (!trimmed) return ''
  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    const parts = url.pathname.split('/').filter(Boolean)
    return (parts[parts.length - 1] ?? '').toLowerCase()
  } catch {
    const parts = trimmed.split('/').filter(Boolean)
    return (parts[parts.length - 1] ?? '').toLowerCase()
  }
}

export function parseVirtualClassGrade(raw: string): number | null | 'invalid' {
  const t = raw.trim()
  if (!t) return null
  if (PERSIAN_GRADE_NAMES.has(t)) return parseGrade(t)
  if (/^\d{1,2}$/.test(t)) {
    const n = parseInt(t, 10)
    if (n >= 1 && n <= 12) return n
  }
  return 'invalid'
}

export function mapVirtualClassImportRow(
  row: Record<string, string>,
  fallbackRowNumber: number
): VirtualClassImportRow {
  const latinName =
    pick(row, ['نام_لاتین_اتاق', 'skyroom_room_name', 'name', 'slug']) ||
    extractSkyroomSlug(pick(row, ['لینک_اتاق', 'link', 'url', 'لینک']))
  const parsedGrade = parseVirtualClassGrade(pick(row, ['پایه', 'grade']))
  const explicit = Number(pick(row, ['ردیف', 'row_number', '_row']))
  const rowNumber =
    Number.isInteger(explicit) && explicit > 0 ? explicit : fallbackRowNumber

  return {
    rowNumber,
    grade: parsedGrade === 'invalid' ? -1 : parsedGrade,
    className: pick(row, ['کلاس', 'class', 'class_name', 'نام_کلاس']),
    title: pick(row, ['عنوان', 'title']),
    roomIdRaw: pick(row, ['شناسه_اتاق', 'room_id', 'skyroom_room_id']),
    latinName,
    link: pick(row, ['لینک_اتاق', 'link', 'url', 'لینک']),
  }
}

export function isVirtualClassDataSheet(sheet: Pick<SheetLike, 'headers' | 'sheetName'>): boolean {
  const joined = sheet.headers.join('|')
  return (
    joined.includes('نام_لاتین_اتاق') ||
    joined.includes('شناسه_اتاق') ||
    joined.includes('skyroom_room_name') ||
    sheet.sheetName.includes('مجازی')
  )
}

export function collectVirtualClassRawRows(sheets: SheetLike[]): Record<string, string>[] {
  const dataSheets = sheets.filter(isVirtualClassDataSheet)
  if (dataSheets.length === 0) return []
  return dataSheets.flatMap((s) => s.rows).slice(0, 200)
}

export function previewRowToRaw(row: VirtualClassPreviewRow): Record<string, string> {
  return {
    ردیف: String(row.rowNumber),
    پایه: row.grade != null && row.grade > 0 ? String(row.grade) : '',
    کلاس: row.className,
    عنوان: row.title,
    شناسه_اتاق: row.roomIdRaw,
    نام_لاتین_اتاق: row.latinName,
    لینک_اتاق: row.link,
  }
}

export function findClass(
  classes: VirtualClassSchoolClass[],
  mapped: VirtualClassImportRow
): VirtualClassSchoolClass | undefined {
  const wanted = normalizeClassName(mapped.className)
  if (!wanted) return undefined
  const sameName = classes.filter((c) => normalizeClassName(c.name) === wanted)
  if (sameName.length === 1) return sameName[0]
  if (mapped.grade != null && mapped.grade > 0) {
    const sameGrade = sameName.filter((c) => c.grade === mapped.grade)
    if (sameGrade.length === 1) return sameGrade[0]
    const fuzzy = classes.find(
      (c) => c.grade === mapped.grade && normalizeClassName(c.name).includes(wanted)
    )
    if (fuzzy) return fuzzy
  }
  return sameName[0]
}

export function evaluateVirtualClassRow(
  mapped: VirtualClassImportRow,
  schoolClasses: VirtualClassSchoolClass[],
  alreadyLinked: Set<string>,
  claimedInFile: Set<string>
): VirtualClassPreviewRow {
  const errors: string[] = []
  const warnings: string[] = []
  let resolvedClassId: string | null = null
  let resolvedClassName: string | null = null
  let alreadyLinkedFlag = false
  let pendingClaim: string | null = null

  const empty =
    !mapped.className &&
    !mapped.latinName &&
    !mapped.roomIdRaw &&
    !mapped.title &&
    !mapped.link

  if (empty) {
    return {
      ...mapped,
      status: 'skipped',
      errors: [],
      warnings: ['ردیف خالی'],
      alreadyLinked: false,
      resolvedClassId: null,
      resolvedClassName: null,
    }
  }

  if (mapped.grade === -1) {
    errors.push('پایه باید عدد ۱ تا ۱۲ یا نام فارسی پایه باشد')
  }

  if (!mapped.className) {
    errors.push('ستون کلاس خالی است — باید با نام کلاس در هوشاگر یکی باشد')
  } else {
    const cls = findClass(schoolClasses, mapped)
    if (!cls) {
      errors.push(`کلاس «${mapped.className}» در این مدرسه پیدا نشد`)
    } else {
      resolvedClassId = cls.id
      resolvedClassName = cls.name
      if (mapped.grade != null && mapped.grade > 0 && cls.grade !== mapped.grade) {
        warnings.push(
          `پایه شیت (${mapped.grade}) با پایه کلاس «${cls.name}» (${cls.grade}) یکی نیست`
        )
      }
      if (alreadyLinked.has(cls.id)) {
        alreadyLinkedFlag = true
        warnings.push(`کلاس «${cls.name}» از قبل به اسکای‌روم وصل است`)
      } else {
        pendingClaim = cls.id
      }
    }
  }

  const parsedId = Number(mapped.roomIdRaw)
  const hasRoomId = mapped.roomIdRaw !== '' && Number.isInteger(parsedId) && parsedId > 0
  if (!alreadyLinkedFlag) {
    if (mapped.roomIdRaw && !hasRoomId) {
      errors.push('شناسه_اتاق باید عدد مثبت باشد (از نوار آدرس پنل اسکای‌روم)')
    }
    if (!hasRoomId && !mapped.latinName) {
      errors.push('شناسه_اتاق یا نام_لاتین_اتاق (یا لینک اتاق) لازم است')
    }
  }

  if (pendingClaim && errors.length === 0) {
    if (claimedInFile.has(pendingClaim)) {
      errors.push(`کلاس «${resolvedClassName || mapped.className}» در همین فایل چند بار آمده است`)
    } else {
      claimedInFile.add(pendingClaim)
    }
  }

  const status: VirtualClassRowStatus = errors.length
    ? 'error'
    : alreadyLinkedFlag
      ? 'skipped'
      : warnings.length
        ? 'warning'
        : 'valid'

  return {
    ...mapped,
    status,
    errors,
    warnings,
    alreadyLinked: alreadyLinkedFlag,
    resolvedClassId,
    resolvedClassName,
  }
}

export function isImportablePreviewRow(row: VirtualClassPreviewRow): boolean {
  return row.status === 'valid' || row.status === 'warning'
}
