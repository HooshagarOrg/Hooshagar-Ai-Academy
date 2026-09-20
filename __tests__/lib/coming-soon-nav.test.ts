import { COMING_SOON_BADGE, COMING_SOON_ROLE_INACTIVE } from '@/lib/copy/coming-soon'
import { navConfig, simpleNavs } from '@/lib/nav/config'

describe('pilot coming-soon contract in nav', () => {
  it('activates parent financials without به‌زودی', () => {
    const items = (navConfig.parent ?? []).flatMap((group) => group.items)
    const financials = items.find((item) => item.href === '/parent/financials')
    expect(financials).toBeDefined()
    expect(financials?.badge).toBeUndefined()
  })

  it('activates admin AI and feature management without به‌زودی', () => {
    const items = (navConfig.admin ?? []).flatMap((group) => group.items)
    const hrefs = [
      '/admin/ai-usage-dashboard',
      '/admin/ai-models',
      '/admin/ai-credits',
      '/admin/early-warning',
      '/admin/features-management',
    ]
    for (const href of hrefs) {
      expect(items.find((item) => item.href === href)?.badge).toBeUndefined()
    }
  })

  it('activates elementary student AI tools without به‌زودی', () => {
    const items = (navConfig.student ?? []).flatMap((group) => group.items)
    for (const href of [
      '/student/ai-guidance',
      '/student/future-compass',
      '/student/practice-playground',
    ]) {
      expect(items.find((item) => item.href === href)?.badge).toBeUndefined()
    }
  })

  it('activates counselor family insight without به‌زودی', () => {
    const items = (navConfig.counselor ?? []).flatMap((group) => group.items)
    expect(items.find((item) => item.href === '/counselor/family-insight')?.badge).toBeUndefined()
  })

  it('activates Mehr staff dashboards without به‌زودی on core items', () => {
    expect(simpleNavs.principal.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.secretary.every((item) => item.badge !== COMING_SOON_BADGE)).toBe(true)
    expect(simpleNavs.financial_vp.find((item) => item.href === '/financial-vp/sms')?.badge).toBe(
      COMING_SOON_BADGE
    )
  })

  it('keeps konkur roadmap as به‌زودی for students', () => {
    const items = (navConfig.student ?? []).flatMap((group) => group.items)
    expect(items.find((item) => item.href === '/student/konkur-roadmap')?.badge).toBe(
      COMING_SOON_BADGE
    )
  })

  it('exports the inactive-role page copy', () => {
    expect(COMING_SOON_ROLE_INACTIVE).toBe('این نقش هنوز فعال نیست')
  })
})
