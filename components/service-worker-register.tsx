'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      // در dev کش SW باعث ChunkLoadError روی /_next/static می‌شود
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister())
      })
      return
    }

    // بعد از رفع کش HTML: SWهای قدیمی را یک‌بار پاک و نسخهٔ جدید را ثبت کن
    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((reg) => reg.update()))
        await navigator.serviceWorker.register('/sw.js')
      } catch {
        // ignore
      }
    })()
  }, [])

  return null
}
