import { parseGrade } from '@/lib/bulk-import/column-mapper'
import { normalizeClassName } from '@/lib/bulk-import/resolve-class'
import { getRoom } from '@/lib/skyroom'
import { createServiceClient } from '@/lib/supabase/service'

export const VIRTUAL_CLASS_IMPORT_HEADERS = [
  'پایه',
  'کلاس',
  'عنوان',
  'شناسه_اتاق',
  'نام_لاتین_اتاق',
  'لینک_اتاق',
] as const

export type VirtualClassImportRow = {
  rowNumber: number
  grade: number
  className: string
  title: string
  roomIdRaw: string
  latinName: string
  link: string
}

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

export function mapVirtualClassImportRow(
  row: Record<string, string>,
  rowNumber: number
): VirtualClassImportRow {
  const latinName =
    pick(row, ['نام_لاتین_اتاق', 'skyroom_room_name', 'name', 'slug']) ||
    extractSkyroomSlug(pick(row, ['لینک_اتاق', 'link', 'url', 'لینک']))

  return {
    rowNumber,
    grade: parseGrade(pick(row, ['پایه', 'grade'])),
    className: pick(row, ['کلاس', 'class', 'class_name', 'نام_کلاس']),
    title: pick(row, ['عنوان', 'title']),
    roomIdRaw: pick(row, ['شناسه_اتاق', 'room_id', 'skyroom_room_id']),
    latinName,
    link: pick(row, ['لینک_اتاق', 'link', 'url', 'لینک']),
  }
}

export type VirtualClassImportResult = {
  rowNumber: number
  title: string
  status: 'success' | 'error' | 'skipped'
  message: string
}

type SchoolClass = {
  id: string
  name: string
  grade: number
  teacher_id: string | null
}

function findClass(
  classes: SchoolClass[],
  mapped: VirtualClassImportRow
): SchoolClass | undefined {
  const wanted = normalizeClassName(mapped.className)
  const sameName = classes.filter((c) => normalizeClassName(c.name) === wanted)
  if (sameName.length === 1) return sameName[0]
  const sameGrade = sameName.filter((c) => c.grade === mapped.grade)
  if (sameGrade.length === 1) return sameGrade[0]
  return sameName[0] ?? classes.find((c) => c.grade === mapped.grade && normalizeClassName(c.name).includes(wanted))
}

async function resolveSkyroomRoom(
  mapped: VirtualClassImportRow
): Promise<{ id: number; name: string }> {
  const parsedId = Number(mapped.roomIdRaw)
  if (Number.isInteger(parsedId) && parsedId > 0) {
    const room = await getRoom({ room_id: parsedId })
    return { id: room.id, name: mapped.latinName || room.name }
  }
  if (!mapped.latinName) {
    throw new Error('شناسه_اتاق یا نام_لاتین_اتاق لازم است')
  }
  const room = await getRoom({ name: mapped.latinName })
  return { id: room.id, name: room.name || mapped.latinName }
}

export async function importVirtualClassRows(options: {
  service: ReturnType<typeof createServiceClient>
  schoolId: string
  adminId: string
  rows: Record<string, string>[]
}): Promise<VirtualClassImportResult[]> {
  const { service, schoolId, adminId, rows } = options
  const mappedRows = rows.map((row, i) => mapVirtualClassImportRow(row, i + 2))

  const { data: classes, error: classError } = await service
    .from('classes')
    .select('id, name, grade, teacher_id')
    .eq('school_id', schoolId)
    .limit(500)

  if (classError) {
    throw new Error(`خطا در دریافت کلاس‌ها: ${classError.message}`)
  }

  const schoolClasses = (classes || []) as SchoolClass[]
  const { data: existing } = await service
    .from('virtual_classes')
    .select('class_id')
    .eq('school_id', schoolId)

  const used = new Set((existing || []).map((e) => e.class_id))
  const results: VirtualClassImportResult[] = []

  for (const mapped of mappedRows) {
    const label = mapped.title || mapped.className || `ردیف ${mapped.rowNumber}`
    if (!mapped.className && !mapped.latinName && !mapped.roomIdRaw) {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'skipped',
        message: 'ردیف خالی',
      })
      continue
    }

    if (!mapped.className) {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'error',
        message: 'ستون کلاس خالی است — باید با نام کلاس در هوشاگر یکی باشد',
      })
      continue
    }

    const cls = findClass(schoolClasses, mapped)
    if (!cls) {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'error',
        message: `کلاس «${mapped.className}» در این مدرسه پیدا نشد`,
      })
      continue
    }

    if (used.has(cls.id)) {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'skipped',
        message: `کلاس «${cls.name}» از قبل به اسکای‌روم وصل است`,
      })
      continue
    }

    try {
      const room = await resolveSkyroomRoom(mapped)
      const { error } = await service.from('virtual_classes').insert({
        school_id: schoolId,
        class_id: cls.id,
        teacher_id: cls.teacher_id,
        title: mapped.title || `کلاس مجازی ${cls.name}`,
        skyroom_room_id: room.id,
        skyroom_room_name: room.name,
        status: 'active',
        created_by: adminId,
      })
      if (error) throw new Error(error.message)
      used.add(cls.id)
      results.push({
        rowNumber: mapped.rowNumber,
        title: mapped.title || cls.name,
        status: 'success',
        message: `وصل شد — room_id ${room.id} / ${room.name}`,
      })
    } catch (e) {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'error',
        message: e instanceof Error ? e.message : 'خطا در ذخیره',
      })
    }
  }

  return results
}
