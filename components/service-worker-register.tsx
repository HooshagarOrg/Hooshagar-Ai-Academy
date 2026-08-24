'use client'

import { useEffect } from 'react'
import {
  isCanonicalServiceWorkerScript,
  serviceWorkerScriptUrl,
} from '@/lib/pwa/canonical-sw'

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister())
      })
      return
    }

    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          regs.map(async (reg) => {
            const script = serviceWorkerScriptUrl(reg)
            if (script && !isCanonicalServiceWorkerScript(script, window.location.origin)) {
              await reg.unregister()
            }
          }),
        )
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
      } catch {
        // ignore
      }
    })()
  }, [])

  return null
}
