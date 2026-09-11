import { navConfig } from '@/lib/nav/config'
import { canManagePlatformTextbooks, isPlatformTextbook } from '@/lib/teacher/textbooks'

describe('platform textbooks', () => {
  it('treats null school_id as the shared catalog', () => {
    expect(isPlatformTextbook({ school_id: null })).toBe(true)
    expect(isPlatformTextbook({ school_id: 'school-1' })).toBe(false)
  })

  it('lets only platform/school admins fill the shared catalog', () => {
    expect(canManagePlatformTextbooks('platform_admin')).toBe(true)
    expect(canManagePlatformTextbooks('admin')).toBe(true)
    expect(canManagePlatformTextbooks('teacher')).toBe(false)
    expect(canManagePlatformTextbooks('principal')).toBe(false)
  })

  it('puts shared textbooks in the admin menu', () => {
    const items = (navConfig.admin ?? []).flatMap((group) => group.items)
    expect(items.some((item) => item.href === '/admin/textbooks')).toBe(true)
  })
})
