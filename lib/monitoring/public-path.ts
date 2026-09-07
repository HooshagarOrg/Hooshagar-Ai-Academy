/** مسیرهای عمومی که نباید Replay/tracing سنگین Sentry بگیرند. */
export function isPublicMarketingPath(pathname?: string): boolean {
  const p =
    pathname ?? (typeof window === 'undefined' ? '/' : window.location.pathname)
  return (
    p === '/' ||
    p === '/login' ||
    p.startsWith('/login/') ||
    p === '/pricing' ||
    p === '/privacy' ||
    p === '/help' ||
    p === '/terms' ||
    p.startsWith('/register') ||
    p.startsWith('/forgot-password') ||
    p.startsWith('/reset-password') ||
    p.startsWith('/activate')
  )
}
