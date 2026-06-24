'use client'

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ChromaticMode = 'immersive' | 'static' | 'role'

interface ChromaticCanvasProps {
  className?: string
  mode?: ChromaticMode
  /**
   * برای mode="role" — رنگ arc را مشخص می‌کند
   * مقادیر: 'blue' | 'green' | 'amber' | 'pink' | 'red' | 'teal'
   */
  arcColor?: 'blue' | 'green' | 'amber' | 'pink' | 'red' | 'teal'
}

const ARC_GLOW: Record<NonNullable<ChromaticCanvasProps['arcColor']>, string> = {
  blue:  'rgba(59,130,246,0.12)',
  green: 'rgba(16,185,129,0.12)',
  amber: 'rgba(245,158,11,0.12)',
  pink:  'rgba(236,72,153,0.12)',
  red:   'rgba(239,68,68,0.12)',
  teal:  'rgba(20,184,166,0.12)',
}

function ImmersiveLayers() {
  return (
    <>
      {/* طبقه اصلی aurora — ۵ رنگ قوس */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 70% 55% at 15% 20%, rgba(59,130,246,0.14), transparent 60%)',
            'radial-gradient(ellipse 55% 45% at 85% 15%, rgba(16,185,129,0.11), transparent 58%)',
            'radial-gradient(ellipse 50% 40% at 75% 85%, rgba(245,158,11,0.10), transparent 55%)',
            'radial-gradient(ellipse 48% 38% at 25% 80%, rgba(236,72,153,0.09), transparent 52%)',
            'radial-gradient(ellipse 45% 35% at 50% 50%, rgba(20,184,166,0.07), transparent 60%)',
          ].join(','),
        }}
      />
      {/* انیمیشن aurora drift */}
      <div
        className="absolute inset-0 z-[2] animate-[aurora-drift-a_24s_ease-in-out_infinite] opacity-60"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 40% 30% at 20% 40%, rgba(59,130,246,0.18), transparent 55%)',
            'radial-gradient(ellipse 35% 28% at 80% 60%, rgba(236,72,153,0.14), transparent 52%)',
          ].join(','),
        }}
      />
      <div
        className="absolute inset-0 z-[2] animate-[aurora-drift-b_32s_ease-in-out_infinite] opacity-50"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 38% 32% at 60% 25%, rgba(16,185,129,0.12), transparent 55%)',
            'radial-gradient(ellipse 32% 26% at 35% 70%, rgba(245,158,11,0.10), transparent 50%)',
          ].join(','),
        }}
      />
    </>
  )
}

function StaticLayers({ arcColor }: { arcColor?: ChromaticCanvasProps['arcColor'] }) {
  const glow = arcColor ? ARC_GLOW[arcColor] : undefined
  return (
    <div
      className="absolute inset-0 z-[1]"
      style={{
        backgroundImage: glow
          ? [
              `radial-gradient(ellipse 60% 48% at 70% 15%, ${glow}, transparent 58%)`,
              `radial-gradient(ellipse 50% 38% at 20% 85%, ${glow}, transparent 52%)`,
            ].join(',')
          : [
              'radial-gradient(ellipse 55% 42% at 68% 12%, rgba(59,130,246,0.07), transparent 58%)',
              'radial-gradient(ellipse 48% 38% at 22% 88%, rgba(16,185,129,0.05), transparent 52%)',
            ].join(','),
      }}
    />
  )
}

/**
 * ChromaticCanvas — پس‌زمینه Chromatic Spectrum
 * mode=immersive → aurora متحرک (لندینگ + auth)
 * mode=static    → گرادیان ثابت (داشبورد)
 * mode=role      → رنگ arc مرتبط با نقش
 */
export function ChromaticCanvas({
  className,
  mode = 'static',
  arcColor,
}: ChromaticCanvasProps) {
  const reduce = useReducedMotion()

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}
      aria-hidden
    >
      {/* لایه base */}
      <div className="absolute inset-0" style={{ backgroundColor: '#07080E' }} />

      {mode === 'immersive' && !reduce ? (
        <ImmersiveLayers />
      ) : (
        <StaticLayers arcColor={arcColor} />
      )}

      {/* noise texture */}
      <div
        className="absolute inset-0 opacity-[0.028] z-[3]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* vignette */}
      <div
        className="absolute inset-0 z-[4]"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 45%, transparent 20%, rgba(7,8,14,0.85) 100%)',
        }}
      />
    </div>
  )
}

/* Backward-compat — ObsidianCanvas استفاده می‌کرده این alias را */
export { ChromaticCanvas as ObsidianCanvasChromatic }
