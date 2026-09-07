import { isPublicMarketingPath } from '@/lib/monitoring/public-path'

/**
 * عمداً @sentry/nextjs را اینجا import نمی‌کنیم تا SDK روی first paint پارس نشود.
 * Replay جدا است تا rrweb وارد چانک لندینگ/ورود نشود.
 */

function runOnce(fn: () => void): () => void {
  let done = false
  return (): void => {
    if (done) return
    done = true
    fn()
  }
}

function bootCore(): void {
  void import('@/lib/monitoring/sentry-client-boot')
    .then((mod) => {
      mod.initClientSentry()
    })
    .catch(() => undefined)
}

function bootReplay(): void {
  if (isPublicMarketingPath()) return
  void import('@/lib/monitoring/sentry-client-replay')
    .then((mod) => {
      mod.addClientReplay()
    })
    .catch(() => undefined)
}

if (typeof window !== 'undefined') {
  const start = runOnce(() => {
    try {
      bootCore()
      if (!isPublicMarketingPath()) {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => bootReplay(), { timeout: 4000 })
        } else {
          window.setTimeout(() => bootReplay(), 2500)
        }
      }
    } catch {
      // Sentry must never block the app
    }
  })

  if (isPublicMarketingPath()) {
    const onInteract = (): void => start()
    window.addEventListener('pointerdown', onInteract, { once: true, passive: true })
    window.addEventListener('keydown', onInteract, { once: true, passive: true })
    // No idle timeout: Lighthouse (and bounce visits) must not parse the 500KB SDK.
  } else {
    start()
  }
}
