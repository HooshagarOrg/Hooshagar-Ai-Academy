import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentAcademicYear } from './academic-year'

export function normalizeClassName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
}

export type ResolveClassInput = {
  schoolId: string
  grade: number
  className: string
  academicYear?: string
  teacherId?: string | null
  teacherName?: string | null
}

export type ResolveClassResult = {
  classId: string
  created: boolean
  name: string
  academicYear: string
  warning?: string
}

type ClassRow = {
  id: string
  name: string
  grade: number
  teacher_id: string | null
}

/**
 * پیدا یا ساخت کلاس در محدوده مدرسه + سال تحصیلی.
 * یک cache در سطح بچ import برای کاهش queryها استفاده می‌شود.
 */
export class ClassResolver {
  private cache = new Map<string, ClassRow>()
  private loadedYears = new Set<string>()

  constructor(
    private readonly admin: SupabaseClient,
    private readonly defaultAcademicYear: string = getCurrentAcademicYear()
  ) {}

  private cacheKey(schoolId: string, academicYear: string, className: string): string {
    return `${schoolId}|${academicYear}|${normalizeClassName(className)}`
  }

  private async ensureLoaded(schoolId: string, academicYear: string): Promise<void> {
    const loadKey = `${schoolId}|${academicYear}`
    if (this.loadedYears.has(loadKey)) return

    const { data, error } = await this.admin
      .from('classes')
      .select('id, name, grade, teacher_id')
      .eq('school_id', schoolId)
      .eq('academic_year', academicYear)
      .limit(500)

    if (error) {
      throw new Error(`خطا در دریافت کلاس‌ها: ${error.message}`)
    }

    for (const row of data || []) {
      this.cache.set(this.cacheKey(schoolId, academicYear, row.name), {
        id: row.id,
        name: row.name,
        grade: row.grade,
        teacher_id: row.teacher_id,
      })
    }
    this.loadedYears.add(loadKey)
  }

  async findOrCreate(input: ResolveClassInput): Promise<ResolveClassResult> {
    const className = normalizeClassName(input.className)
    if (!className) {
      throw new Error('نام کلاس خالی است')
    }
    if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 12) {
      throw new Error('پایه کلاس نامعتبر است')
    }

    const academicYear = input.academicYear || this.defaultAcademicYear
    await this.ensureLoaded(input.schoolId, academicYear)

    const key = this.cacheKey(input.schoolId, academicYear, className)
    const existing = this.cache.get(key)

    if (existing) {
      let warning: string | undefined
      const patch: Record<string, unknown> = {}

      if (existing.grade !== input.grade) {
        warning = `کلاس «${existing.name}» با پایه ${existing.grade} یافت شد (پایه شیت: ${input.grade})`
      }

      if (input.teacherId) {
        if (existing.teacher_id && existing.teacher_id !== input.teacherId) {
          warning = [warning, 'معلم قبلی کلاس جایگزین شد'].filter(Boolean).join(' | ')
        }
        patch.teacher_id = input.teacherId
        if (input.teacherName) patch.teacher_name = input.teacherName
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await this.admin.from('classes').update(patch).eq('id', existing.id)
        if (error) throw new Error(`خطا در به‌روزرسانی کلاس: ${error.message}`)
        existing.teacher_id = (patch.teacher_id as string) ?? existing.teacher_id
      }

      return {
        classId: existing.id,
        created: false,
        name: existing.name,
        academicYear,
        warning,
      }
    }

    const insertPayload: Record<string, unknown> = {
      school_id: input.schoolId,
      name: className,
      grade: input.grade,
      academic_year: academicYear,
      is_active: true,
      total_capacity: 25,
      admin_reserved: 0,
      current_count: 0,
    }
    if (input.teacherId) insertPayload.teacher_id = input.teacherId
    if (input.teacherName) insertPayload.teacher_name = input.teacherName

    const { data, error } = await this.admin
      .from('classes')
      .insert(insertPayload)
      .select('id, name, grade, teacher_id')
      .single()

    if (error || !data) {
      // مسابقه روی unique — دوباره بخوان
      if (error?.code === '23505') {
        this.loadedYears.delete(`${input.schoolId}|${academicYear}`)
        await this.ensureLoaded(input.schoolId, academicYear)
        const raced = this.cache.get(key)
        if (raced) {
          return {
            classId: raced.id,
            created: false,
            name: raced.name,
            academicYear,
          }
        }
      }
      throw new Error(error?.message || 'ساخت کلاس ناموفق بود')
    }

    const row: ClassRow = {
      id: data.id,
      name: data.name,
      grade: data.grade,
      teacher_id: data.teacher_id,
    }
    this.cache.set(key, row)

    return {
      classId: row.id,
      created: true,
      name: row.name,
      academicYear,
    }
  }

  /** فقط پیدا کردن بر اساس نام (بدون ساخت) — برای معلم بدون پایه */
  async findByName(
    schoolId: string,
    className: string,
    academicYear?: string
  ): Promise<ClassRow | null> {
    const year = academicYear || this.defaultAcademicYear
    await this.ensureLoaded(schoolId, year)
    return this.cache.get(this.cacheKey(schoolId, year, className)) ?? null
  }
}

export const CLASS_TEACHER_ROLES = new Set(['teacher'])
