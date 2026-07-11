import { commonItems, navConfig, simpleNavs } from '@/lib/nav/config'

const FALLBACK_TITLES: Record<string, string> = {
  '/admin': 'داشبورد مدیریت',
  '/teacher': 'داشبورد معلم',
  '/parent': 'پنل خانواده',
  '/student': 'فضای یادگیری',
  '/counselor': 'داشبورد مشاوره',
  '/messages': 'پیام‌ها',
  '/notifications': 'اعلانات',
  '/profile': 'پروفایل',
}

function collectNavItems(): Array<{ href: string; title: string }> {
  const items: Array<{ href: string; title: string }> = []

  for (const groups of Object.values(navConfig)) {
    for (const group of groups) {
      for (const item of group.items) {
        items.push({ href: item.href, title: item.title })
      }
    }
  }

  for (const list of Object.values(simpleNavs)) {
    for (const item of list) {
      items.push({ href: item.href, title: item.title })
    }
  }

  for (const item of commonItems) {
    items.push({ href: item.href, title: item.title })
  }

  return items.sort((a, b) => b.href.length - a.href.length)
}

const NAV_ITEMS = collectNavItems()

export function getPageTitleFromPath(pathname: string): string | null {
  if (!pathname) return null

  const exact = FALLBACK_TITLES[pathname]
  if (exact) return exact

  for (const item of NAV_ITEMS) {
    if (item.href.includes('#')) continue
    if (pathname === item.href) return item.title
    if (item.href !== '/' && pathname.startsWith(`${item.href}/`)) return item.title
  }

  return null
}
