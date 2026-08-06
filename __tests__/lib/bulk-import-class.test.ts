import { getCurrentAcademicYear } from '@/lib/bulk-import/academic-year'
import { mapStaffRow, parseGrade } from '@/lib/bulk-import/column-mapper'
import { normalizeClassName } from '@/lib/bulk-import/resolve-class'
import { validateStaffRow } from '@/lib/bulk-import/validators'

describe('bulk-import class assignment helpers', () => {
  describe('getCurrentAcademicYear', () => {
    it('returns previous-current year before Mehr', () => {
      // 2025-05-01 ≈ Ordibehesht 1404 → 1403-1404
      const year = getCurrentAcademicYear(new Date('2025-05-01T12:00:00Z'))
      expect(year).toMatch(/^\d{4}-\d{4}$/)
      const [a, b] = year.split('-').map(Number)
      expect(b).toBe(a + 1)
    })

    it('returns current-(current+1) from Mehr onward', () => {
      // 2025-10-01 ≈ Mehr 1404 → 1404-1405
      const year = getCurrentAcademicYear(new Date('2025-10-01T12:00:00Z'))
      expect(year).toMatch(/^\d{4}-\d{4}$/)
      const [a, b] = year.split('-').map(Number)
      expect(b).toBe(a + 1)
    })
  })

  describe('normalizeClassName', () => {
    it('trims and normalizes Arabic letters', () => {
      expect(normalizeClassName('  كلاس  خانم  ثلبتي  ')).toBe('کلاس خانم ثلبتی')
    })
  })

  describe('mapStaffRow + validateStaffRow', () => {
    it('maps grade and class for teachers', () => {
      const mapped = mapStaffRow(
        {
          نام: 'مریم',
          نام_خانوادگی: 'ثلبتی',
          کد_ملی: '0013542419',
          نقش: 'معلم',
          موبایل: '09123334455',
          کد_ورود: '0013542419',
          پایه: 'چهارم',
          کلاس: 'کلاس خانم ثلبتی',
        },
        1
      )
      expect(mapped.grade).toBe(4)
      expect(mapped.className).toBe('کلاس خانم ثلبتی')

      const validated = validateStaffRow(mapped)
      expect(validated.status).not.toBe('error')
      expect(validated.role).toBe('teacher')
      expect(validated.grade).toBe(4)
      expect(validated.className).toBe('کلاس خانم ثلبتی')
    })

    it('warns when teacher has no class', () => {
      const mapped = mapStaffRow(
        {
          نام: 'حسن',
          نام_خانوادگی: 'کریمی',
          کد_ملی: '0013542419',
          نقش: 'معلم',
          کد_ورود: '0013542419',
        },
        2
      )
      const validated = validateStaffRow(mapped)
      expect(validated.warnings.some((w) => w.includes('کلاس مسئول'))).toBe(true)
    })
  })

  describe('parseGrade', () => {
    it('parses Persian grade labels', () => {
      expect(parseGrade('چهارم')).toBe(4)
      expect(parseGrade('7')).toBe(7)
    })
  })
})
