'use client'

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ChromaticMode = 'immersive' | 'static' | 'role'
export type ChromaticVariant = 'light' | 'dark'

interface ChromaticCanvasProps {
  className?: string
  mode?: ChromaticMode
  variant?: ChromaticVariant
  /**
   * برای mode="role" — رنگ arc را مشخص می‌کند
   * مقادیر: 'blue' | 'green' | 'amber' | 'pink' | 'red' | 'teal'
   */
  arcColor?: 'blue' | 'green' | 'amber' | 'pink' | 'red' | 'teal'
}

const ARC_GLOW: Record<NonNullable<ChromaticCanvasProps['arcColor']>, string> = {
  blue:  'rgba(84,210,255,0.18)',
  green: 'rgba(57,217,138,0.16)',
  amber: 'rgba(255,179,71,0.18)',
  pink:  'rgba(255,77,166,0.16)',
  red:   'rgba(255,99,99,0.14)',
  teal:  'rgba(84,210,255,0.16)',
}

function ImmersiveLayers({ variant }: { variant: ChromaticVariant }) {
  const isDark = variant === 'dark'
  const opacity = isDark ? 1 : 0.85

  return (
    <>
      <div
        className="absolute inset-0 z-[1]"
        style={{
          opacity,
          backgroundImage: isDark
            ? [
                'radial-gradient(ellipse 72% 54% at 12% 10%, rgba(139,124,255,0.28), transparent 60%)',
                'radial-gradient(ellipse 58% 46% at 86% 12%, rgba(84,210,255,0.22), transparent 58%)',
                'radial-gradient(ellipse 50% 40% at 74% 88%, rgba(255,179,71,0.14), transparent 55%)',
                'radial-gradient(ellipse 48% 38% at 18% 82%, rgba(255,77,166,0.14), transparent 52%)',
                'radial-gradient(ellipse 45% 35% at 50% 50%, rgba(57,217,138,0.12), transparent 60%)',
              ].join(',')
            : [
                'radial-gradient(ellipse 72% 54% at 12% 10%, rgba(139,124,255,0.16), transparent 60%)',
                'radial-gradient(ellipse 58% 46% at 86% 12%, rgba(84,210,255,0.18), transparent 58%)',
                'radial-gradient(ellipse 50% 40% at 74% 88%, rgba(255,179,71,0.12), transparent 55%)',
                'radial-gradient(ellipse 48% 38% at 18% 82%, rgba(255,77,166,0.10), transparent 52%)',
                'radial-gradient(ellipse 45% 35% at 50% 50%, rgba(57,217,138,0.10), transparent 60%)',
              ].join(','),
        }}
      />
      <div
        className="absolute inset-0 z-[2] animate-[aurora-drift-a_24s_ease-in-out_infinite] opacity-60"
        style={{
          backgroundImage: isDark
            ? [
                'radial-gradient(ellipse 40% 30% at 20% 40%, rgba(139,124,255,0.32), transparent 55%)',
                'radial-gradient(ellipse 35% 28% at 80% 60%, rgba(255,77,166,0.22), transparent 52%)',
              ].join(',')
            : [
                'radial-gradient(ellipse 40% 30% at 20% 40%, rgba(139,124,255,0.20), transparent 55%)',
                'radial-gradient(ellipse 35% 28% at 80% 60%, rgba(255,77,166,0.14), transparent 52%)',
              ].join(','),
        }}
      />
      <div
        className="absolute inset-0 z-[2] animate-[aurora-drift-b_32s_ease-in-out_infinite] opacity-50"
        style={{
          backgroundImage: isDark
            ? [
                'radial-gradient(ellipse 38% 32% at 60% 25%, rgba(84,210,255,0.22), transparent 55%)',
                'radial-gradient(ellipse 32% 26% at 35% 70%, rgba(255,179,71,0.16), transparent 50%)',
              ].join(',')
            : [
                'radial-gradient(ellipse 38% 32% at 60% 25%, rgba(84,210,255,0.14), transparent 55%)',
                'radial-gradient(ellipse 32% 26% at 35% 70%, rgba(255,179,71,0.12), transparent 50%)',
              ].join(','),
        }}
      />
    </>
  )
}

function StaticLayers({
  arcColor,
  variant,
}: {
  arcColor?: ChromaticCanvasProps['arcColor']
  variant: ChromaticVariant
}) {
  const glow = arcColor ? ARC_GLOW[arcColor] : undefined
  const isDark = variant === 'dark'

  return (
    <div
      className="absolute inset-0 z-[1]"
      style={{
        backgroundImage: glow
          ? [
              `radial-gradient(ellipse 60% 48% at 70% 15%, ${glow}, transparent 58%)`,
              `radial-gradient(ellipse 50% 38% at 20% 85%, ${glow}, transparent 52%)`,
            ].join(',')
          : isDark
            ? [
                'radial-gradient(ellipse 55% 42% at 68% 12%, rgba(139,124,255,0.18), transparent 58%)',
                'radial-gradient(ellipse 48% 38% at 22% 88%, rgba(84,210,255,0.14), transparent 52%)',
              ].join(',')
            : [
                'radial-gradient(ellipse 55% 42% at 68% 12%, rgba(139,124,255,0.10), transparent 58%)',
                'radial-gradient(ellipse 48% 38% at 22% 88%, rgba(84,210,255,0.09), transparent 52%)',
              ].join(','),
      }}
    />
  )
}

/**
 * ChromaticCanvas — پس‌زمینه Chromatic Spectrum
 * variant=dark → hero تیره | variant=light → بدنه روشن
 */
export function ChromaticCanvas({
  className,
  mode = 'static',
  variant = 'light',
  arcColor,
}: ChromaticCanvasProps) {
  const reduce = useReducedMotion()
  const isDark = variant === 'dark'

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--lux-body)' }}
      />

      {mode === 'immersive' && !reduce ? (
        <ImmersiveLayers variant={variant} />
      ) : (
        <StaticLayers arcColor={arcColor} variant={variant} />
      )}

      <div
        className="absolute inset-0 opacity-[0.028] z-[3]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 z-[4]"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 92% 82% at 50% 40%, transparent 18%, rgba(18,21,28,0.55) 100%)'
            : 'radial-gradient(ellipse 92% 82% at 50% 40%, transparent 18%, rgba(244,247,252,0.72) 100%)',
        }}
      />
    </div>
  )
}

export { ChromaticCanvas as ObsidianCanvasChromatic }
