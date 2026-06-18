'use client'

import type { UiTone } from '@/lib/ui/role-tone'

interface AmbientBackgroundProps {
  className?: string
  tone?: UiTone
}

/** @deprecated پس‌زمینه از PlatformCanvas در root layout ارث می‌برد */
export function AmbientBackground(_props: AmbientBackgroundProps) {
  return null
}
