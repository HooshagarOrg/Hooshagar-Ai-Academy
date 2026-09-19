import { COMING_SOON_BADGE, COMING_SOON_ROLE_INACTIVE } from '@/lib/copy/coming-soon'
import { navConfig, simpleNavs } from '@/lib/nav/config'

describe('pilot coming-soon contract in nav', () => {
  it('keeps parent financials visible with به‌زودی', () => {
    const items = (navConfig.parent ?? []).flatMap((group) => group.items)
    const financials = items.find((item) => item.href === '/parent/financials')
    expect(financials).toBeDefined()
    expect(financials?.badge).toBe(COMING_SOON_BADGE)
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

  it('marks inactive staff roles as به‌زودی', () => {
    expect(simpleNavs.financial_vp.every((item) => item.badge === COMING_SOON_BADGE)).toBe(
      true
    )
    expect(simpleNavs.secretary.every((item) => item.badge === COMING_SOON_BADGE)).toBe(
      true
    )
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
