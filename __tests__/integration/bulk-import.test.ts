import { afterAll, describe, expect, it } from 'vitest'
import { mapStudentRow } from '@/lib/bulk-import/column-mapper'
import { importStudentRows } from '@/lib/bulk-import/importer'
import { validateStudentRow } from '@/lib/bulk-import/validators'
import {
  cleanupTestData,
  createTestServiceClient,
  trackNationalCode,
} from '../helpers/supabase-test-client'
import { uniqueIranNationalCode } from '../helpers/national-id'
import { createTestSchool } from '../helpers/test-factories'

describe('bulk import', () => {
  const admin = createTestServiceClient()

  afterAll(async () => {
    await cleanupTestData()
  })

  it('rejects a CSV row with a missing required field while others stay valid', () => {
    const valid = validateStudentRow(
      mapStudentRow(
        {
          نام: 'علی',
          'نام خانوادگی': 'محمدی',
          'کد ملی': uniqueIranNationalCode(1),
          پایه: 'ششم',
        },
        1,
      ),
    )
    const missing = validateStudentRow(
      mapStudentRow(
        {
          نام: '',
          'نام خانوادگی': 'رضایی',
          'کد ملی': uniqueIranNationalCode(2),
          پایه: 'ششم',
        },
        2,
      ),
    )
    expect(valid.status).not.toBe('error')
    expect(missing.status).toBe('error')
    expect(missing.errors.some((item) => item.includes('نام'))).toBe(true)
  })

  it('imports valid rows into the correct school and reports duplicate national IDs', async () => {
    const school = await createTestSchool()
    const codeA = uniqueIranNationalCode(11)
    const codeB = uniqueIranNationalCode(12)
    trackNationalCode(codeA)
    trackNationalCode(codeB)

    const rows = [
      validateStudentRow(
        mapStudentRow(
          { نام: 'سارا', 'نام خانوادگی': 'کاظمی', 'کد ملی': codeA, پایه: 'ششم' },
          1,
        ),
      ),
      validateStudentRow(
        mapStudentRow(
          { نام: '', 'نام خانوادگی': 'ناقص', 'کد ملی': uniqueIranNationalCode(13), پایه: 'ششم' },
          2,
        ),
      ),
      validateStudentRow(
        mapStudentRow(
          { نام: 'رضا', 'نام خانوادگی': 'کریمی', 'کد ملی': codeB, پایه: 'پنجم' },
          3,
        ),
      ),
    ]

    const first = await importStudentRows(rows, {
      schoolId: school.id,
      createParentAccounts: false,
      skipDuplicates: true,
    })
    expect(first.successful).toBeGreaterThanOrEqual(2)
    expect(first.errors).toBeGreaterThanOrEqual(1)

    const { data: imported } = await admin
      .from('profiles')
      .select('id, school_id, national_code')
      .in('national_code', [codeA, codeB])
    expect(imported?.every((row) => row.school_id === school.id)).toBe(true)

    const duplicate = await importStudentRows(
      [
        validateStudentRow(
          mapStudentRow(
            { نام: 'سارا', 'نام خانوادگی': 'کاظمی', 'کد ملی': codeA, پایه: 'ششم' },
            1,
          ),
        ),
      ],
      {
        schoolId: school.id,
        createParentAccounts: false,
        skipDuplicates: true,
      },
    )
    expect(duplicate.skipped + duplicate.errors).toBeGreaterThanOrEqual(1)
    expect(duplicate.details[0]?.message).toMatch(/قبلاً ثبت|تکرار|کد ملی/)
  }, 180_000)
})
