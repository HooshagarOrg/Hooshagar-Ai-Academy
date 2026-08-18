import { getRoom } from '@/lib/skyroom'
import { createServiceClient } from '@/lib/supabase/service'
import {
  evaluateVirtualClassRow,
  mapVirtualClassImportRow,
  type VirtualClassImportResult,
  type VirtualClassImportRow,
  type VirtualClassPreviewRow,
  type VirtualClassSchoolClass,
} from '@/lib/virtual-class/import-map'

export {
  VIRTUAL_CLASS_IMPORT_HEADERS,
  collectVirtualClassRawRows,
  evaluateVirtualClassRow,
  extractSkyroomSlug,
  findClass,
  isImportablePreviewRow,
  isVirtualClassDataSheet,
  mapVirtualClassImportRow,
  parseVirtualClassGrade,
  previewRowToRaw,
} from '@/lib/virtual-class/import-map'

export type {
  VirtualClassImportResult,
  VirtualClassImportRow,
  VirtualClassPreviewRow,
  VirtualClassRowStatus,
  VirtualClassSchoolClass,
} from '@/lib/virtual-class/import-map'

async function loadSchoolClasses(
  service: ReturnType<typeof createServiceClient>,
  schoolId: string
): Promise<{ classes: VirtualClassSchoolClass[]; used: Set<string> }> {
  const { data: classes, error: classError } = await service
    .from('classes')
    .select('id, name, grade, teacher_id')
    .eq('school_id', schoolId)
    .limit(500)

  if (classError) {
    throw new Error(`خطا در دریافت کلاس‌ها: ${classError.message}`)
  }

  const { data: existing } = await service
    .from('virtual_classes')
    .select('class_id')
    .eq('school_id', schoolId)

  return {
    classes: (classes || []) as VirtualClassSchoolClass[],
    used: new Set((existing || []).map((e) => e.class_id)),
  }
}

export async function validateVirtualClassRows(options: {
  service: ReturnType<typeof createServiceClient>
  schoolId: string
  rows: Record<string, string>[]
}): Promise<VirtualClassPreviewRow[]> {
  const { classes, used } = await loadSchoolClasses(options.service, options.schoolId)
  const claimed = new Set<string>()
  return options.rows.map((row, i) =>
    evaluateVirtualClassRow(mapVirtualClassImportRow(row, i + 2), classes, used, claimed)
  )
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
  const { classes, used } = await loadSchoolClasses(service, schoolId)
  const claimed = new Set<string>()
  const preview = rows.map((row, i) =>
    evaluateVirtualClassRow(mapVirtualClassImportRow(row, i + 2), classes, used, claimed)
  )
  const results: VirtualClassImportResult[] = []

  for (const mapped of preview) {
    const label = mapped.title || mapped.className || `ردیف ${mapped.rowNumber}`

    if (mapped.status === 'skipped') {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'skipped',
        message: mapped.warnings[0] || 'ردیف رد شد',
      })
      continue
    }

    if (mapped.status === 'error' || !mapped.resolvedClassId) {
      results.push({
        rowNumber: mapped.rowNumber,
        title: label,
        status: 'error',
        message: mapped.errors.join(' | ') || 'ردیف نامعتبر',
      })
      continue
    }

    const cls = classes.find((c) => c.id === mapped.resolvedClassId)
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
