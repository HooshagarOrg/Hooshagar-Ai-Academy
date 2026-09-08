'use client'

import { useEffect, useState } from 'react'

type LazyToaster = typeof import('sonner').Toaster

/** توست ورود/داشبورد — این کامپوننت روی لندینگ ماونت نمی‌شود. */
export function DeferredChrome(): JSX.Element | null {
  const [Toaster, setToaster] = useState<LazyToaster | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      void import(
        /* webpackPrefetch: false, webpackPreload: false */
        'sonner'
      ).then((mod) => {
        setToaster(() => mod.Toaster)
      })
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  if (!Toaster) return null
  return <Toaster position="top-center" richColors />
}
