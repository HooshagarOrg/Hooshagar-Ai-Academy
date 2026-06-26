'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LuxCard } from '@/components/lux/lux-card'

const AXES = ['درسی', 'هنری', 'ورزشی', 'اجتماعی', 'فناوری'] as const

interface TalentRadarProps {
  current: number[]
  potential?: number[]
  className?: string
}

export function TalentRadarPanel({ current, potential, className }: TalentRadarProps) {
  const reduce = useReducedMotion()
  const [drawn, setDrawn] = useState(reduce)
  const pathRef = useRef<SVGPolygonElement>(null)
  const n = AXES.length
  const cx = 50
  const cy = 50
  const maxR = 36

  const point = (i: number, v: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const r = (v / 100) * maxR
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }

  useEffect(() => {
    if (reduce) return
    const t = setTimeout(() => setDrawn(true), 120)
    return () => clearTimeout(t)
  }, [reduce])

  const currentPoly = current.map((v, i) => point(i, drawn ? v : 0)).join(' ')
  const potentialPoly = (potential ?? current).map((v, i) => point(i, drawn ? Math.min(100, v + 8) : 0)).join(' ')

  return (
    <LuxCard className={className}>
      <p className="lux-kicker mb-1">رادار استعداد</p>
      <h3 className="mb-4 font-black text-[var(--lux-text)]">نمای پنج‌محوری</h3>
      <svg viewBox="0 0 100 100" className="mx-auto h-52 w-full max-w-[220px]">
        {[20, 40, 60, 80, 100].map((g) => (
          <polygon
            key={g}
            points={Array.from({ length: n }, (_, i) => point(i, g)).join(' ')}
            fill="none"
            stroke="var(--lux-surface)"
            strokeWidth="0.5"
          />
        ))}
        <polygon
          points={potentialPoly}
          fill="rgba(84,210,255,0.08)"
          stroke="var(--lux-secondary)"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.7"
        />
        <polygon
          ref={pathRef}
          points={currentPoly}
          fill="rgba(139,124,255,0.22)"
          stroke="var(--lux-primary)"
          strokeWidth="1.8"
          style={{ transition: 'all 0.8s ease' }}
        />
        {AXES.map((label, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          const x = cx + (maxR + 12) * Math.cos(angle)
          const y = cy + (maxR + 12) * Math.sin(angle)
          return (
            <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="var(--lux-text-muted)" fontSize="5.5">
              {label}
            </text>
          )
        })}
      </svg>
    </LuxCard>
  )
}

export function TalentRadarFallback({ values }: { values: number[] }) {
  return <TalentRadarPanel current={values} />
}
