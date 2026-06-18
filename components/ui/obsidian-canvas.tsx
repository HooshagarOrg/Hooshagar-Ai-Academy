'use client'

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ScholarPlasmaShader } from '@/components/ui/scholar-plasma-shader'

interface ObsidianCanvasProps {
  className?: string
  /**
   * immersive = تارهای متحرک WebGL — فقط لندینگ و ورود/ثبت‌نام
   * static = پس‌زمینه ثابت لاکچری — داشبورد و سایر صفحات
   */
  mode?: 'immersive' | 'static'
}

const BASE = '#020617'

/** هاله‌های ثابت طلایی/یاقوت — بدون انیمیشن */
function StaticLuxuryGlow() {
  return (
    <>
      <div
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: `radial-gradient(circle 520px at 50% 180px, rgba(38, 32, 52, 0.55), transparent 72%)`,
        }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 55% 42% at 68% 12%, rgba(79,124,255,0.07), transparent 58%), radial-gradient(ellipse 48% 38% at 22% 88%, rgba(212,175,55,0.06), transparent 52%)',
        }}
      />
    </>
  )
}

/**
 * Obsidian Meridian — پس‌زمینه لاکچری
 * تارهای متحرک فقط در mode=immersive
 */
export function ObsidianCanvas({ className, mode = 'static' }: ObsidianCanvasProps) {
  const reduce = useReducedMotion()
  const immersive = mode === 'immersive'

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ backgroundColor: BASE }} />

      {immersive ? (
        <>
          <ScholarPlasmaShader variant="luxury" className="opacity-85" />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                'radial-gradient(ellipse 58% 48% at 70% 16%, rgba(79,124,255,0.11), transparent 55%), radial-gradient(ellipse 52% 42% at 20% 84%, rgba(212,175,55,0.09), transparent 50%)',
            }}
          />
          {!reduce && (
            <div className="obsidian-rings-stage z-[2]">
              <div className="obsidian-ring obsidian-ring-a obsidian-ring-vivid" />
              <div className="obsidian-ring obsidian-ring-b obsidian-ring-vivid" />
              <div className="obsidian-ring obsidian-ring-c obsidian-ring-vivid" />
            </div>
          )}
        </>
      ) : (
        <StaticLuxuryGlow />
      )}

      <div className="absolute inset-0 obsidian-noise opacity-[0.035] z-[3]" />
      <div className="absolute inset-0 obsidian-vignette z-[4]" />
    </div>
  )
}
