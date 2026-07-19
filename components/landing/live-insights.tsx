'use client'

/**
 * سکشن بینش زنده — نمودارهای انیمیشنی و بردارهای گرافیکی
 * بدون وابستگی به لوگو/ویدیو؛ فقط CSS + SVG سبک.
 */

import { useEffect, useState } from 'react'
import { Activity, TrendingUp, Users, Zap } from 'lucide-react'
import { SectionReveal, StaggerReveal, TiltCard } from './motion'

const SUBJECT_BARS = [
  { label: 'ریاضی', value: 86, color: '#8B7CFF' },
  { label: 'علوم', value: 74, color: '#54D2FF' },
  { label: 'فارسی', value: 91, color: '#39D98A' },
  { label: 'انگلیسی', value: 68, color: '#C9A962' },
  { label: 'اجتماعی', value: 79, color: '#FF4DA6' },
]

const WEEKLY_POINTS = [42, 55, 48, 70, 63, 82, 88]
const WEEK_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const RING_SEGMENTS = [
  { label: 'تحلیل', pct: 34, color: '#8B7CFF' },
  { label: 'OCR', pct: 22, color: '#54D2FF' },
  { label: 'مطالعه', pct: 28, color: '#39D98A' },
  { label: 'گزارش', pct: 16, color: '#C9A962' },
]

function useLiveTick(ms = 3200): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setTick((t) => t + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return tick
}

function AnimatedBarChart(): JSX.Element {
  const tick = useLiveTick(4000)
  const bars = SUBJECT_BARS.map((b, i) => ({
    ...b,
    value: Math.min(98, Math.max(55, b.value + ((tick + i) % 3) * 2 - 2)),
  }))

  return (
    <TiltCard className="lp-glass h-full p-5" maxTilt={4}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[var(--lux-text-muted)]">پیشرفت درسی</p>
          <p className="text-sm font-black text-[var(--lux-text)]">میانگین کلاس — زنده</p>
        </div>
        <span className="lp-live-dot" aria-hidden />
      </div>
      <div className="flex h-40 items-end justify-between gap-2" role="img" aria-label="نمودار میله‌ای پیشرفت درسی">
        {bars.map((b) => (
          <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-bold tabular-nums text-[var(--lux-text-muted)]">
              {b.value}٪
            </span>
            <div className="relative w-full max-w-[2.25rem] flex-1 overflow-hidden rounded-t-lg bg-[rgba(232,236,244,0.06)]">
              <div
                className="lp-chart-bar absolute inset-x-0 bottom-0 rounded-t-lg"
                style={{
                  height: `${b.value}%`,
                  background: `linear-gradient(180deg, ${b.color}, color-mix(in srgb, ${b.color} 45%, transparent))`,
                  boxShadow: `0 0 18px color-mix(in srgb, ${b.color} 35%, transparent)`,
                }}
              />
            </div>
            <span className="truncate text-[10px] font-bold text-[var(--lux-text-muted)]">{b.label}</span>
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

function AnimatedLineChart(): JSX.Element {
  const tick = useLiveTick(3500)
  const points = WEEKLY_POINTS.map((v, i) =>
    Math.min(96, Math.max(35, v + ((tick + i) % 4) - 1.5)),
  )
  const w = 280
  const h = 120
  const pad = 8
  const max = 100
  const stepX = (w - pad * 2) / (points.length - 1)
  const coords = points.map((v, i) => {
    const x = pad + i * stepX
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  })
  const line = coords.join(' ')
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`

  return (
    <TiltCard className="lp-glass h-full p-5" maxTilt={4}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[var(--lux-text-muted)]">تعامل هفتگی</p>
          <p className="text-sm font-black text-[var(--lux-text)]">فعالیت دانش‌آموزان</p>
        </div>
        <TrendingUp className="h-4 w-4 text-[var(--lux-secondary)]" aria-hidden />
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-36 w-full overflow-visible"
        role="img"
        aria-label="نمودار خطی تعامل هفتگی"
      >
        <defs>
          <linearGradient id="lp-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#54D2FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#54D2FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lp-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B7CFF" />
            <stop offset="50%" stopColor="#54D2FF" />
            <stop offset="100%" stopColor="#39D98A" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={pad + g * (h - pad * 2)}
            y2={pad + g * (h - pad * 2)}
            stroke="rgba(232,236,244,0.08)"
            strokeWidth="1"
          />
        ))}
        <polygon points={area} fill="url(#lp-area-grad)" className="lp-chart-area" />
        <polyline
          points={line}
          fill="none"
          stroke="url(#lp-line-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lp-chart-line"
        />
        {points.map((v, i) => {
          const x = pad + i * stepX
          const y = h - pad - (v / max) * (h - pad * 2)
          return (
            <circle
              key={WEEK_LABELS[i]}
              cx={x}
              cy={y}
              r="3.5"
              fill="#0B0D12"
              stroke="#54D2FF"
              strokeWidth="2"
              className="lp-chart-dot"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] font-bold text-[var(--lux-text-muted)]">
        {WEEK_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </TiltCard>
  )
}

function AnimatedRingChart(): JSX.Element {
  const tick = useLiveTick(4500)
  const r = 42
  const c = 2 * Math.PI * r
  let offset = 0
  const segs = RING_SEGMENTS.map((s, i) => {
    const wobble = ((tick + i) % 3) - 1
    const pct = Math.max(12, Math.min(40, s.pct + wobble))
    const len = (pct / 100) * c
    const dashOffset = -offset
    offset += len
    return { ...s, pct, len, dashOffset }
  })
  const total = 100 + (tick % 5)

  return (
    <TiltCard className="lp-glass h-full p-5" maxTilt={4}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[var(--lux-text-muted)]">مصرف هوش مصنوعی</p>
          <p className="text-sm font-black text-[var(--lux-text)]">توزیع قابلیت‌ها</p>
        </div>
        <Zap className="h-4 w-4 text-[var(--lux-gold)]" aria-hidden />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="نمودار حلقه‌ای مصرف AI">
            <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(232,236,244,0.08)" strokeWidth="10" />
            {segs.map((s) => (
              <circle
                key={s.label}
                cx="56"
                cy="56"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${s.len} ${c - s.len}`}
                strokeDashoffset={s.dashOffset}
                transform="rotate(-90 56 56)"
                className="lp-chart-ring"
                style={{ filter: `drop-shadow(0 0 6px ${s.color}55)` }}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black tabular-nums text-[var(--lux-text)]">{total}</span>
            <span className="text-[9px] font-bold text-[var(--lux-text-muted)]">درخواست</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {segs.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-2 text-[var(--lux-text)]">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.label}
              </span>
              <span className="tabular-nums text-[var(--lux-text-muted)]">{s.pct}٪</span>
            </li>
          ))}
        </ul>
      </div>
    </TiltCard>
  )
}

function NetworkVectors(): JSX.Element {
  return (
    <svg
      className="lp-network-svg pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="lp-net-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B7CFF" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#54D2FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF4DA6" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {[
        'M80,80 C180,40 260,160 360,100',
        'M360,100 C460,40 520,180 680,90',
        'M120,240 C240,200 300,300 420,250',
        'M420,250 C540,200 620,310 720,260',
        'M200,120 C280,200 340,160 400,220',
      ].map((d, i) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="url(#lp-net-stroke)"
          strokeWidth="1.25"
          className="lp-network-path"
          style={{ animationDelay: `${i * 0.6}s` }}
        />
      ))}
      {[
        [80, 80, '#8B7CFF'],
        [360, 100, '#54D2FF'],
        [680, 90, '#39D98A'],
        [120, 240, '#C9A962'],
        [420, 250, '#FF4DA6'],
        [720, 260, '#8B7CFF'],
        [200, 120, '#54D2FF'],
        [400, 220, '#39D98A'],
      ].map(([x, y, color], i) => (
        <g key={`${x}-${y}`} className="lp-network-node" style={{ animationDelay: `${i * 0.35}s` }}>
          <circle cx={x} cy={y} r="10" fill={`${color}22`} />
          <circle cx={x} cy={y} r="3.5" fill={String(color)} />
        </g>
      ))}
    </svg>
  )
}

function PulseMetrics(): JSX.Element {
  const metrics = [
    { icon: Activity, label: 'تحلیل لحظه‌ای', value: 'فعال', color: 'var(--lux-success)' },
    { icon: Users, label: 'نقش‌های متصل', value: '۴ مسیر', color: 'var(--lux-secondary)' },
    { icon: Zap, label: 'پالس سامانه', value: 'زنده', color: 'var(--lux-gold)' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="lp-breath flex items-center gap-3 rounded-2xl border border-[rgba(232,236,244,0.08)] bg-[rgba(22,27,38,0.55)] px-4 py-3"
        >
          <m.icon className="h-4 w-4 shrink-0" style={{ color: m.color }} aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[var(--lux-text-muted)]">{m.label}</p>
            <p className="text-sm font-black text-[var(--lux-text)]">{m.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LiveInsightsSection(): JSX.Element {
  return (
    <section id="insights" className="lux-section relative overflow-hidden" aria-label="بینش زنده">
      <NetworkVectors />
      <div className="lux-container relative z-10">
        <SectionReveal className="mb-10 text-center">
          <p className="lux-kicker lp-kicker-gold mb-4">نبض مدرسه</p>
          <h2 className="lux-h2">
            دادهٔ زنده، <span className="lp-gradient-text-animated">تصمیم هوشمند</span>
          </h2>
          <p className="lux-body mx-auto mt-4 max-w-2xl">
            پیشرفت تحصیلی، تعامل کلاس و مصرف هوش مصنوعی — هم‌زمان و رنگارنگ، درست مثل داشبورد واقعی هوشاگر.
          </p>
        </SectionReveal>

        <div className="mb-6">
          <PulseMetrics />
        </div>

        <StaggerReveal className="grid gap-5 lg:grid-cols-3">
          <AnimatedBarChart />
          <AnimatedLineChart />
          <AnimatedRingChart />
        </StaggerReveal>
      </div>
    </section>
  )
}
