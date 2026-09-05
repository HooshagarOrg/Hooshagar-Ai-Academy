import { canNotifyTargetUser } from '@/lib/notifications/school-scope'

describe('notification school scope (H6)', () => {
  it('allows platform_admin across schools', () => {
    expect(
      canNotifyTargetUser({
        callerRole: 'platform_admin',
        callerSchoolId: 'school-a',
        targetSchoolId: 'school-b',
      })
    ).toBe(true)
  })

  it('allows school staff only for the same school', () => {
    expect(
      canNotifyTargetUser({
        callerRole: 'teacher',
        callerSchoolId: 'school-a',
        targetSchoolId: 'school-a',
      })
    ).toBe(true)
    expect(
      canNotifyTargetUser({
        callerRole: 'admin',
        callerSchoolId: 'school-a',
        targetSchoolId: 'school-b',
      })
    ).toBe(false)
  })

  it('denies staff without a school', () => {
    expect(
      canNotifyTargetUser({
        callerRole: 'teacher',
        callerSchoolId: null,
        targetSchoolId: 'school-a',
      })
    ).toBe(false)
  })
})
