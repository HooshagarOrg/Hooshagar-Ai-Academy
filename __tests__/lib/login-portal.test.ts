import { loginPortalRoleError } from '@/lib/auth/login-portal'

describe('login portal role check', () => {
  it('parent portal accepts only parents', () => {
    expect(loginPortalRoleError('parent', 'parent')).toBeNull()
    expect(loginPortalRoleError('parent', 'teacher')).toContain('کادر مدرسه')
    expect(loginPortalRoleError('parent', 'principal')).toContain('کادر مدرسه')
    expect(loginPortalRoleError('parent', 'admin')).toContain('کادر مدرسه')
    expect(loginPortalRoleError('parent', 'student')).toContain('دانش‌آموزان')
  })

  it('staff portal accepts only staff roles', () => {
    for (const role of ['teacher', 'principal', 'admin', 'platform_admin', 'librarian', 'financial_vp']) {
      expect(loginPortalRoleError('staff', role)).toBeNull()
    }
    expect(loginPortalRoleError('staff', 'parent')).toContain('والدین')
    expect(loginPortalRoleError('staff', 'student')).toContain('دانش‌آموزان')
    expect(loginPortalRoleError('staff', 'unknown_role')).not.toBeNull()
  })

  it('student portal accepts only students', () => {
    expect(loginPortalRoleError('student', 'student')).toBeNull()
    expect(loginPortalRoleError('student', 'parent')).toContain('والدین')
    expect(loginPortalRoleError('student', 'teacher')).toContain('کادر مدرسه')
    expect(loginPortalRoleError('student', null)).not.toBeNull()
  })
})
