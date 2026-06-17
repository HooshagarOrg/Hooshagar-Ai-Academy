'use client'

import { cn } from '@/lib/utils'
import type { UiTone } from '@/lib/ui/role-tone'
import { KnowledgeUniverseBg } from '@/components/ui/knowledge-universe-bg'

interface AmbientBackgroundProps {
  className?: string
  tone?: UiTone
}

export function AmbientBackground({ className, tone = 'balanced' }: AmbientBackgroundProps) {
  return <KnowledgeUniverseBg className={className} tone={tone} />
}
