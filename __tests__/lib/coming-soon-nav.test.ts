import { COMING_SOON_BADGE, COMING_SOON_ROLE_INACTIVE } from '@/lib/copy/coming-soon'
import { navConfig, simpleNavs } from '@/lib/nav/config'

describe('pilot coming-soon contract in nav', () => {
  it('activates parent financials without به‌زودی', () => {
    const items = (navConfig.parent ?? []).flatMap((group) => group.items)
    const financials = items.find((item) => item.href === '/parent/financials')
    expect(financials).toBeDefined()
    expect(financials?.badge).toBeUndefined()
  })

  it('does not hide counselor routes', () => {
    const items = (navConfig.counselor ?? []).flatMap((group) => group.items)
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((item) => item.href === '/counselor/records')).toBe(true)
    const familyInsight = items.find((item) => item.href === '/counselor/family-insight')
    expect(familyInsight?.badge).toBe(COMING_SOON_BADGE)
  })

  it('activates Mehr staff dashboards without به‌زودی on core items', () => {
    expect(simpleNavs.principal.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.educational_vp.find((item) => item.href === '/educational-vp/planning')).toBeDefined()
    expect(simpleNavs.educational_vp.some((item) => item.href?.includes('activities'))).toBe(false)
    expect(simpleNavs.nurturing_vp.some((item) => item.href === '/nurturing-vp/activities')).toBe(true)
    expect(simpleNavs.disciplinary_vp.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.health_vp.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
  })

  it('activates remaining staff role MVPs; keeps SMS and maintenance schedule as به‌زودی', () => {
    expect(simpleNavs.secretary.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.evaluation_vp.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.librarian.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.art_teacher.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.sports_teacher.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.security.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)

    const sms = simpleNavs.financial_vp.find((item) => item.href === '/financial-vp/sms')
    expect(sms?.badge).toBe(COMING_SOON_BADGE)
    expect(
      simpleNavs.financial_vp
        .filter((item) => item.href !== '/financial-vp/sms')
        .every((item) => item.badge !== COMING_SOON_BADGE)
    ).toBe(true)

    const schedule = simpleNavs.maintenance.find((item) => item.href === '/maintenance/schedule')
    expect(schedule?.badge).toBe(COMING_SOON_BADGE)
    expect(
      simpleNavs.maintenance
        .filter((item) => item.href !== '/maintenance/schedule')
        .every((item) => item.badge !== COMING_SOON_BADGE)
    ).toBe(true)
  })

  it('activates teacher foundation and award-badges without به‌زودی', () => {
    const items = (navConfig.teacher ?? []).flatMap((group) => group.items)
    expect(items.find((item) => item.href === '/teacher/academic-foundation')?.badge).toBeUndefined()
    expect(items.find((item) => item.href === '/teacher/award-badges')?.badge).toBeUndefined()
  })

  it('keeps student sample tools in the menu with به‌زودی', () => {
    const items = (navConfig.student ?? []).flatMap((group) => group.items)
    const hrefs = items
      .filter((item) => item.badge === COMING_SOON_BADGE)
      .map((item) => item.href)
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/student/ai-guidance',
        '/student/konkur-roadmap',
        '/student/future-compass',
        '/student/practice-playground',
      ])
    )
  })

  it('exports the inactive-role page copy', () => {
    expect(COMING_SOON_ROLE_INACTIVE).toBe('این نقش هنوز فعال نیست')
  })
})
