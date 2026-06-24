'use client'

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SpectrumMeshProps {
  className?: string
  /** شدت رنگ‌ها */
  intensity?: 'low' | 'mid' | 'high'
}

const BLOBS = [
  { color: '#3B82F6', x: '15%',  y: '20%',  size: '55%',  delay: '0s',   dur: '18s' },
  { color: '#10B981', x: '80%',  y: '10%',  size: '48%',  delay: '3s',   dur: '22s' },
  { color: '#F59E0B', x: '75%',  y: '78%',  size: '52%',  delay: '6s',   dur: '26s' },
  { color: '#EC4899', x: '20%',  y: '75%',  size: '46%',  delay: '9s',   dur: '20s' },
  { color: '#EF4444', x: '50%',  y: '50%',  size: '40%',  delay: '12s',  dur: '16s' },
]

const OPACITY: Record<NonNullable<SpectrumMeshProps['intensity']>, number> = {
  low:  0.07,
  mid:  0.12,
  high: 0.18,
}

export function SpectrumMesh({
  className,
  intensity = 'mid',
}: SpectrumMeshProps) {
  const reduce = useReducedMotion()
  const op = OPACITY[intensity]

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      aria-hidden
    >
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: blob.x,
            top:  blob.y,
            width:  blob.size,
            height: blob.size,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${blob.color}, transparent 70%)`,
            opacity: op,
            filter: 'blur(72px)',
            animation: reduce
              ? 'none'
              : `aurora-drift-${i % 2 === 0 ? 'a' : 'b'} ${blob.dur} ease-in-out infinite`,
            animationDelay: blob.delay,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
