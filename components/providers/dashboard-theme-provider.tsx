'use client'

import { ThemeProvider } from 'next-themes'
import type { UiTheme } from '@/lib/theme/constants'

interface DashboardThemeProviderProps {
  children: React.ReactNode
  initialTheme: UiTheme
}

/** فقط داخل (dashboard) — صفحات عمومی toggle ندارند */
export function DashboardThemeProvider({ children, initialTheme }: DashboardThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem={false}
      storageKey="hooshagar-ui-theme-cache"
      themes={['light', 'dark']}
    >
      {children}
    </ThemeProvider>
  )
}
