'use client'

import { cn } from '@/lib/utils'
import { ScholarPlasmaShader } from '@/components/ui/scholar-plasma-shader'
import { KnowledgeSymbolsLayer } from '@/components/ui/knowledge-symbols-layer'

/**
 * پس‌زمینهٔ لندینگ — WebGL plasma + Knowledge Universe شناور
 */
export function LandingKnowledgeField({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden ku-universe ku-landing-field',
        className,
      )}
      aria-hidden
    >
      <ScholarPlasmaShader variant="landing" />
      <div className="absolute inset-0 ku-grid ku-grid-landing" />
      <KnowledgeSymbolsLayer intensity="landing" animate />
      <div className="absolute inset-0 ku-aura ku-aura-vivid opacity-60 mix-blend-screen" />
      <div className="absolute inset-0 ku-vignette ku-vignette-landing" />
    </div>
  )
}
