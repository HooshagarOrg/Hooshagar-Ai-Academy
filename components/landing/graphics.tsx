'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { EASE } from '@/components/landing/motion'

const PARTICLE_COLORS = ['#8B7CFF', '#54D2FF', '#FF4DA6', '#39D98A', '#F59E0B']

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const dots = Array.from({ length: 36 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2,
      c: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00028,
      t: Math.random() * Math.PI * 2,
    }))

    const resize = () => {
      const p = canvas.parentElement
      if (!p) return
      canvas.width = p.clientWidth
      canvas.height = p.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (now: number) => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0 || d.x > 1) d.vx *= -1
        if (d.y < 0 || d.y > 1) d.vy *= -1
        const a = 0.25 + 0.2 * Math.sin(now * 0.001 + d.t)
        ctx.beginPath()
        ctx.arc(d.x * width, d.y * height, d.r * 2.2, 0, Math.PI * 2)
        ctx.fillStyle = d.c + Math.floor(a * 255).toString(16).padStart(2, '0')
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduce])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}

export function HooshiarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden>
      <defs>
        <linearGradient id="hooshi-body" x1="24" y1="20" x2="104" y2="108">
          <stop offset="0%" stopColor="#8B7CFF" />
          <stop offset="100%" stopColor="#54D2FF" />
        </linearGradient>
        <radialGradient id="hooshi-glow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#8B7CFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B7CFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="58" fill="url(#hooshi-glow)" />
      <ellipse cx="64" cy="72" rx="40" ry="36" fill="url(#hooshi-body)" />
      <ellipse cx="64" cy="78" rx="22" ry="18" fill="#DFC98A" opacity="0.88" />
      <path d="M30 48 L20 22 L42 40 Z" fill="#6B5CE7" />
      <path d="M98 48 L108 22 L86 40 Z" fill="#6B5CE7" />
      <circle cx="50" cy="62" r="7" fill="#141820" />
      <circle cx="78" cy="62" r="7" fill="#141820" />
      <circle cx="52" cy="60" r="2.5" fill="#E8ECF4" />
      <circle cx="80" cy="60" r="2.5" fill="#E8ECF4" />
      <path d="M52 84 Q64 94 76 84" stroke="#141820" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function TalentRadar({ className }: { className?: string }) {
  const pts = '64,14 108,42 94,104 34,104 18,42'
  const labels = [
    { x: 64, y: 4, t: 'منطق' },
    { x: 114, y: 44, t: 'خلاقیت' },
    { x: 98, y: 118, t: 'زبان' },
    { x: 30, y: 118, t: 'فضایی' },
    { x: 14, y: 44, t: 'اجتماعی' },
  ]
  return (
    <svg viewBox="0 0 128 128" className={className} role="img" aria-label="رادار استعداد">
      {[52, 40, 28, 16].map((o) => (
        <polygon
          key={o}
          points={`64,${o} ${128 - o / 2},${64 - o / 3} ${102 - o / 5},${128 - o / 2} ${26 + o / 5},${128 - o / 2} ${o / 2},${64 - o / 3}`}
          fill="none"
          stroke="rgba(139,124,255,0.2)"
          strokeWidth="0.7"
        />
      ))}
      <polygon points={pts} fill="rgba(139,124,255,0.18)" stroke="#8B7CFF" strokeWidth="2" />
      {pts.split(' ').map((p) => {
        const [cx, cy] = p.split(',')
        return <circle key={p} cx={cx} cy={cy} r="3.5" fill="#FF4DA6" />
      })}
      {labels.map(({ x, y, t }) => (
        <text key={t} x={x} y={y} textAnchor="middle" fill="#8B95A8" fontSize="7" fontWeight="700">
          {t}
        </text>
      ))}
    </svg>
  )
}

const PATH_NODES = [
  { label: 'ریاضی', x: 10, done: true },
  { label: 'علوم', x: 30, done: true },
  { label: 'فیزیک', x: 50, active: true },
  { label: 'ادبیات', x: 70 },
  { label: 'استعداد', x: 90 },
]

export function LearningPathNodes({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 400 80" className="mb-4 h-16 w-full" aria-hidden>
        <defs>
          <linearGradient id="pathLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B7CFF" />
            <stop offset="100%" stopColor="#54D2FF" />
          </linearGradient>
        </defs>
        <path
          d="M 20 50 Q 120 20, 200 45 T 380 35"
          fill="none"
          stroke="url(#pathLine)"
          strokeWidth="3"
          strokeDasharray="8 6"
          opacity="0.55"
        />
      </svg>
      <div className="relative h-14">
        {PATH_NODES.map((n, i) => (
          <div
            key={n.label}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-2"
            style={{ left: `${n.x}%` }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-black"
              style={{
                background: n.active ? 'rgba(255,77,166,0.2)' : 'rgba(139,124,255,0.12)',
                border: `2px solid ${n.active ? '#FF4DA6' : n.done ? '#39D98A' : '#8B7CFF'}`,
                color: '#E8ECF4',
                boxShadow: n.active ? '0 0 24px rgba(255,77,166,0.35)' : undefined,
              }}
            >
              {i + 1}
            </div>
            <span className="text-[10px] font-bold text-[#8B95A8]">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ISLANDS = [
  { label: 'ریاضی', c: '#8B7CFF', x: 10, h: 0 },
  { label: 'علوم', c: '#54D2FF', x: 30, h: 12 },
  { label: 'فیزیک', c: '#FF4DA6', x: 50, h: 6, active: true },
  { label: 'ادبیات', c: '#39D98A', x: 70, h: 14 },
  { label: 'استعداد', c: '#F59E0B', x: 90, h: 4 },
]

export function IsometricIslands({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className={className} style={{ perspective: 800 }}>
      <svg viewBox="0 0 400 200" className="h-48 w-full sm:h-56" aria-hidden>
        <defs>
          <linearGradient id="islandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B7CFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#161B26" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M 0 160 Q 200 120, 400 150 L 400 200 L 0 200 Z" fill="rgba(139,124,255,0.06)" />
        {ISLANDS.map((island) => {
          const bx = 40 + island.x * 3.2
          const by = 120 - island.h
          return (
            <g key={island.label} transform={`translate(${bx}, ${by})`}>
              <polygon points="0,20 24,8 48,20 24,32" fill={island.c} opacity={island.active ? 0.85 : 0.45} />
              <polygon points="0,20 24,32 24,48 0,36" fill={island.c} opacity={island.active ? 0.55 : 0.28} />
              <polygon points="24,32 48,20 48,36 24,48" fill={island.c} opacity={island.active ? 0.4 : 0.2} />
              <text x="24" y="58" textAnchor="middle" fill="#8B95A8" fontSize="8" fontWeight="700">
                {island.label}
              </text>
            </g>
          )
        })}
      </svg>
      {!reduce &&
        ISLANDS.filter((i) => i.active).map((island) => (
          <motion.div
            key={`glow-${island.label}`}
            className="pointer-events-none absolute rounded-full blur-2xl"
            style={{
              left: `${island.x}%`,
              top: '35%',
              width: 80,
              height: 40,
              background: island.c,
              opacity: 0.15,
            }}
            animate={{ opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        ))}
    </div>
  )
}

export function DashboardMock({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="overflow-hidden rounded-2xl border border-[rgba(232,236,244,0.1)] bg-[#0B0D12] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[rgba(232,236,244,0.08)] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF4DA6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#39D98A]" />
          <span className="mr-2 text-xs text-[#8B95A8]">هوشاگر — آریا</span>
        </div>
        <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[80px_1fr]">
          <div className="space-y-2 border-l border-[rgba(232,236,244,0.06)] p-2 sm:p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg sm:h-9"
                style={{ background: i === 1 ? 'rgba(139,124,255,0.35)' : 'rgba(232,236,244,0.05)' }}
              />
            ))}
          </div>
          <div className="space-y-3 p-3 sm:p-4">
            <p className="text-sm font-black text-[#E8ECF4]">سلام آریا!</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['۳', 'درس امروز'],
                ['۷', 'استریک'],
                ['۱٬۲۴۰', 'XP'],
                ['۱۲', 'سطح'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-[rgba(232,236,244,0.04)] p-2 text-center">
                  <p className="text-sm font-black text-[#E8ECF4]">{v}</p>
                  <p className="text-[9px] text-[#8B95A8]">{l}</p>
                </div>
              ))}
            </div>
            <div className="h-24 rounded-xl border border-[rgba(139,124,255,0.2)] bg-[rgba(139,124,255,0.08)] p-2">
              <p className="mb-2 text-[10px] font-bold text-[#8B7CFF]">مسیر یادگیری</p>
              <svg viewBox="0 0 300 40" className="h-10 w-full">
                <path d="M0 30 Q75 8, 150 22 T300 12" fill="none" stroke="#54D2FF" strokeWidth="2" />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[rgba(232,236,244,0.04)] p-2">
                <p className="text-[10px] text-[#8B95A8]">هوشیار</p>
                <p className="text-xs text-[#E8ECF4]">فیزیک را شروع کنیم؟</p>
              </div>
              <div className="rounded-xl bg-[rgba(232,236,244,0.04)] p-2">
                <p className="text-[10px] text-[#8B95A8]">استعداد</p>
                <p className="text-xs text-[#E8ECF4]">منطق ۹۵٪</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ParentPhone({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 200 360" className="mx-auto h-auto w-[min(100%,220px)]" aria-hidden>
        <rect x="8" y="8" width="184" height="344" rx="28" fill="#161B26" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.4" />
        <rect x="20" y="28" width="160" height="308" rx="20" fill="#12151C" />
        <rect x="70" y="16" width="60" height="6" rx="3" fill="rgba(232,236,244,0.15)" />
        <text x="100" y="58" textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="800">
          گزارش فرزند
        </text>
        <text x="100" y="78" textAnchor="middle" fill="#E8ECF4" fontSize="11" fontWeight="800">
          سارا — پایه هشتم
        </text>
        {[
          { y: 100, label: 'ریاضی', pct: 85, c: '#8B7CFF' },
          { y: 150, label: 'خلاقیت', pct: 92, c: '#F59E0B' },
          { y: 200, label: 'استریک', pct: 70, c: '#39D98A', text: '۵ روز' },
        ].map((row) => (
          <g key={row.label}>
            <text x="36" y={row.y} fill="#8B95A8" fontSize="8" fontWeight="700">
              {row.label}
            </text>
            <text x="164" y={row.y} textAnchor="end" fill={row.c} fontSize="8" fontWeight="800">
              {row.text ?? `${row.pct}٪`}
            </text>
            <rect x="36" y={row.y + 8} width="128" height="6" rx="3" fill="rgba(232,236,244,0.08)" />
            <rect x="36" y={row.y + 8} width={(128 * row.pct) / 100} height="6" rx="3" fill={row.c} />
          </g>
        ))}
      </svg>
    </div>
  )
}

export function ScrollCounter({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    const t0 = performance.now()
    const dur = 2200
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      const eased = 1 - (1 - p) ** 3
      setN(Math.round(eased * value))
      if (p < 1) requestAnimationFrame(step)
      else setN(value)
    }
    requestAnimationFrame(step)
  }, [inView, value])

  return (
    <span ref={ref}>
      {n.toLocaleString('fa-IR')}
      {suffix}
    </span>
  )
}
