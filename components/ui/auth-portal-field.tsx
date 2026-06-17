'use client'

import { cn } from '@/lib/utils'
import { ScholarPlasmaShader } from '@/components/ui/scholar-plasma-shader'
import { KnowledgeSymbolsLayer } from '@/components/ui/knowledge-symbols-layer'

/**
 * پورتال ورود — shader آرام‌تر + حلقه‌های ۳D + نمادهای دانش
 */
export function AuthPortalField({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden ku-universe ku-auth-portal',
        className,
      )}
      aria-hidden
    >
      <ScholarPlasmaShader variant="auth" className="opacity-90" />

      {/* حلقه‌های مداری ۳D */}
      <div className="auth-portal-stage">
        <div className="auth-portal-ring auth-portal-ring-1" />
        <div className="auth-portal-ring auth-portal-ring-2" />
        <div className="auth-portal-ring auth-portal-ring-3" />
        <div className="auth-portal-core" />
      </div>

      <div className="absolute inset-0 ku-grid opacity-[0.025]" />
      <KnowledgeSymbolsLayer intensity="auth" animate />
      <div className="absolute inset-0 ku-vignette ku-vignette-auth" />
    </div>
  )
}
