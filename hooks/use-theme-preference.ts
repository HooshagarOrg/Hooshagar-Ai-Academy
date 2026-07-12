'use client'

import { useCallback, useState } from 'react'
import { useTheme } from 'next-themes'
import type { UiTheme } from '@/lib/theme/constants'

export function useThemePreference() {
  const { resolvedTheme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)

  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as UiTheme

  const updateTheme = useCallback(
    async (next: UiTheme) => {
      if (next === theme) return
      setTheme(next)
      setSaving(true)
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ui_theme: next }),
        })
        if (!res.ok) throw new Error('save failed')
      } catch {
        setTheme(theme)
      } finally {
        setSaving(false)
      }
    },
    [setTheme, theme],
  )

  return { theme, setTheme: updateTheme, saving }
}
