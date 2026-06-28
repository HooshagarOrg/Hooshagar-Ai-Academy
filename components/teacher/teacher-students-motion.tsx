'use client'

import type { ReactNode } from 'react'
import { LuxFadeUp, LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'

export function TeacherStudentsMotion({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl" dir="rtl">
      <LuxStagger className="space-y-6" stagger={0.1}>
        <LuxStaggerItem>
          <LuxFadeUp>{children}</LuxFadeUp>
        </LuxStaggerItem>
      </LuxStagger>
    </div>
  )
}
