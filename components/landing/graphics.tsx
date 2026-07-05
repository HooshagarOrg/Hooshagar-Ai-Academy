'use client'

import { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'
import { ParallaxLayer } from '@/components/landing/gsap'
import { GlowCounter } from '@/components/landing/gsap'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const PARTICLE_COLORS = ['#8B7CFF', '#54D2FF', '#FF4DA6', '#39D98A', '#C9A962']

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
    const dots = Array.from({ length: 48 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.5,
      c: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.00032,
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
        const a = 0.3 + 0.25 * Math.sin(now * 0.001 + d.t)
        ctx.beginPath()
        ctx.arc(d.x * width, d.y * height, d.r * 2.5, 0, Math.PI * 2)
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
  const glowRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!glowRef.current || reduce) return
      gsap.to(glowRef.current, {
        scale: 1.08,
        opacity: 0.85,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    },
    { scope: glowRef, dependencies: [reduce] },
  )

  return (
    <div className="relative">
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--lux-glow-primary) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <svg viewBox="0 0 128 128" className={className} aria-hidden>
        <defs>
          <linearGradient id="hooshi-body" x1="24" y1="20" x2="104" y2="108">
            <stop offset="0%" stopColor="#8B7CFF" />
            <stop offset="100%" stopColor="#54D2FF" />
          </linearGradient>
          <radialGradient id="hooshi-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#8B7CFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8B7CFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="64" cy="64" r="58" fill="url(#hooshi-glow)" />
        <ellipse cx="64" cy="72" rx="40" ry="36" fill="url(#hooshi-body)" />
        <ellipse cx="64" cy="78" rx="22" ry="18" fill="#C9A962" opacity="0.88" />
        <path d="M30 48 L20 22 L42 40 Z" fill="#6B5CE7" />
        <path d="M98 48 L108 22 L86 40 Z" fill="#6B5CE7" />
        <circle cx="50" cy="62" r="7" fill="#141820" />
        <circle cx="78" cy="62" r="7" fill="#141820" />
        <circle cx="52" cy="60" r="2.5" fill="#E8ECF4" />
        <circle cx="80" cy="60" r="2.5" fill="#E8ECF4" />
        <path d="M52 84 Q64 94 76 84" stroke="#141820" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function TalentRadar({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const polyRef = useRef<SVGPolygonElement>(null)
  const reduce = useReducedMotion()
  const pts = '64,14 108,42 94,104 34,104 18,42'
  const labels = [
    { x: 64, y: 4, t: 'منطق' },
    { x: 114, y: 44, t: 'خلاقیت' },
    { x: 98, y: 118, t: 'زبان' },
    { x: 30, y: 118, t: 'فضایی' },
    { x: 14, y: 44, t: 'اجتماعی' },
  ]

  useGSAP(
    () => {
      if (!polyRef.current || !svgRef.current || reduce) return
      gsap.fromTo(
        polyRef.current,
        { opacity: 0, scale: 0.6, transformOrigin: '64px 64px' },
        {
          opacity: 1,
          scale: 1,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: svgRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        },
      )
    },
    { scope: svgRef, dependencies: [reduce] },
  )

  return (
    <svg ref={svgRef} viewBox="0 0 128 128" className={className} role="img" aria-label="رادار استعداد">
      {[52, 40, 28, 16].map((o) => (
        <polygon
          key={o}
          points={`64,${o} ${128 - o / 2},${64 - o / 3} ${102 - o / 5},${128 - o / 2} ${26 + o / 5},${128 - o / 2} ${o / 2},${64 - o / 3}`}
          fill="none"
          stroke="rgba(139,124,255,0.22)"
          strokeWidth="0.7"
        />
      ))}
      <polygon points={pts} fill="rgba(139,124,255,0.15)" stroke="none" />
      <polygon
        ref={polyRef}
        points={pts}
        fill="rgba(139,124,255,0.22)"
        stroke="url(#radarStroke)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--lux-primary)" />
          <stop offset="100%" stopColor="var(--lux-gold)" />
        </linearGradient>
      </defs>
      {pts.split(' ').map((p) => {
        const [cx, cy] = p.split(',')
        return <circle key={p} cx={cx} cy={cy} r="4" fill="var(--lux-accent)" />
      })}
      {labels.map(({ x, y, t }) => (
        <text key={t} x={x} y={y} textAnchor="middle" fill="var(--lux-text-muted)" fontSize="7" fontWeight="700">
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
            <stop offset="0%" stopColor="var(--lux-primary)" />
            <stop offset="50%" stopColor="var(--lux-secondary)" />
            <stop offset="100%" stopColor="var(--lux-gold)" />
          </linearGradient>
        </defs>
        <path
          d="M 20 50 Q 120 20, 200 45 T 380 35"
          fill="none"
          stroke="url(#pathLine)"
          strokeWidth="3"
          strokeDasharray="8 6"
          opacity="0.6"
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
                border: `2px solid ${n.active ? 'var(--lux-accent)' : n.done ? 'var(--lux-success)' : 'var(--lux-primary)'}`,
                color: 'var(--lux-text)',
                boxShadow: n.active ? '0 0 28px var(--lux-glow-accent)' : undefined,
              }}
            >
              {i + 1}
            </div>
            <span className="text-[10px] font-bold text-[var(--lux-text-muted)]">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardMock({ className }: { className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!frameRef.current || reduce) return
      gsap.fromTo(
        frameRef.current,
        { rotateX: 18, rotateY: -12, z: -40 },
        {
          rotateX: 0,
          rotateY: 0,
          z: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: frameRef.current,
            start: 'top 85%',
            end: 'center center',
            scrub: 0.6,
          },
        },
      )
    },
    { scope: frameRef, dependencies: [reduce] },
  )

  return (
    <div className={cn('lux-perspective', className)}>
      <div
        ref={frameRef}
        className="lux-scene-3d overflow-hidden rounded-2xl border border-[rgba(232,236,244,0.12)] bg-[var(--lux-void)] shadow-[0_32px_80px_rgba(0,0,0,0.5),0_0_60px_var(--lux-glow-primary)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center gap-2 border-b border-[rgba(232,236,244,0.08)] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lux-accent)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lux-gold)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lux-success)]" />
          <span className="mr-2 text-xs text-[var(--lux-text-muted)]">هوشاگر — آریا</span>
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
            <p className="text-sm font-black text-[var(--lux-text)]">سلام آریا!</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['۳', 'درس امروز'],
                ['۷', 'استریک'],
                ['۱٬۲۴۰', 'XP'],
                ['۱۲', 'سطح'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-[rgba(232,236,244,0.04)] p-2 text-center">
                  <p className="text-sm font-black text-[var(--lux-text)]">{v}</p>
                  <p className="text-[9px] text-[var(--lux-text-muted)]">{l}</p>
                </div>
              ))}
            </div>
            <div className="h-24 rounded-xl border border-[rgba(139,124,255,0.22)] bg-[rgba(139,124,255,0.08)] p-2">
              <p className="mb-2 text-[10px] font-bold text-[var(--lux-primary)]">مسیر یادگیری</p>
              <svg viewBox="0 0 300 40" className="h-10 w-full">
                <path d="M0 30 Q75 8, 150 22 T300 12" fill="none" stroke="var(--lux-secondary)" strokeWidth="2" />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[rgba(232,236,244,0.04)] p-2">
                <p className="text-[10px] text-[var(--lux-text-muted)]">هوشیار</p>
                <p className="text-xs text-[var(--lux-text)]">فیزیک را شروع کنیم؟</p>
              </div>
              <div className="rounded-xl bg-[rgba(232,236,244,0.04)] p-2">
                <p className="text-[10px] text-[var(--lux-text-muted)]">استعداد</p>
                <p className="text-xs text-[var(--lux-text)]">منطق ۹۵٪</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ParentPhone({ className }: { className?: string }) {
  return (
    <ParallaxLayer speed={0.2} className={className}>
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-8 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--lux-glow-gold) 0%, transparent 70%)' }}
          aria-hidden
        />
        <svg viewBox="0 0 200 360" className="relative mx-auto h-auto w-[min(100%,220px)]" aria-hidden>
          <rect
            x="8"
            y="8"
            width="184"
            height="344"
            rx="28"
            fill="var(--lux-depth-2)"
            stroke="var(--lux-gold)"
            strokeWidth="2"
            strokeOpacity="0.5"
          />
          <rect x="20" y="28" width="160" height="308" rx="20" fill="var(--lux-depth-1)" />
          <rect x="70" y="16" width="60" height="6" rx="3" fill="rgba(232,236,244,0.15)" />
          <text x="100" y="58" textAnchor="middle" fill="var(--lux-gold)" fontSize="9" fontWeight="800">
            گزارش فرزند
          </text>
          <text x="100" y="78" textAnchor="middle" fill="var(--lux-text)" fontSize="11" fontWeight="800">
            سارا — پایه هشتم
          </text>
          {[
            { y: 100, label: 'ریاضی', pct: 85, c: '#8B7CFF' },
            { y: 150, label: 'خلاقیت', pct: 92, c: '#C9A962' },
            { y: 200, label: 'استریک', pct: 70, c: '#39D98A', text: '۵ روز' },
          ].map((row) => (
            <g key={row.label}>
              <text x="36" y={row.y} fill="var(--lux-text-muted)" fontSize="8" fontWeight="700">
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
    </ParallaxLayer>
  )
}

export function ScrollCounter({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  return (
    <GlowCounter
      value={value}
      suffix={suffix}
      className="text-3xl font-black text-[var(--lux-text)] sm:text-4xl"
    />
  )
}
