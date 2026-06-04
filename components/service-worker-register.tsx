'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // در dev کش SW باعث ChunkLoadError روی /_next/static می‌شود
      void navigator.serviceWorker?.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister())
      })
      return
    }

    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
