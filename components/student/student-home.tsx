'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  ChevronLeft,
  Compass,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { LuxCard } from '@/components/lux/lux-card'
import { LuxEmptyState } from '@/components/lux/lux-empty-state'
import { LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'
import { LuxErrorState, LuxSkeletonCards } from '@/components/lux/lux-page-states'
import { HooshiarCharacter } from '@/components/avatar/hooshiar-character'

type DashboardPayload = {
  student?: { name: string; grade: number }
  xp?: {
    total: number
    level: number
    currentStreak: number
    longestStreak: number
  }
  homework?: Array<{ id: string; subject: string; title: string; due_date: string; status: string }>
  grades?: { recent: Array<{ subject: string; score: number }> }
}

type DailyItem = { id: string; subject: string; title: string; progress: number }
type GoalItem = { id: string; label: string; progress: number; color: string }

const DEFAULT_RECOMMENDATIONS = [
  { id: '1', title: 'مرور معادلات درجه اول', subject: 'ریاضی', minutes: 15, color: 'var(--lux-primary)' },
  { id: '2', title: 'فتوسنتز — خلاصه درس', subject: 'علوم', minutes: 20, color: 'var(--lux-success)' },
  { id: '3', title: 'تمرین نگارش فارسی', subject: 'ادبیات', minutes: 12, color: 'var(--lux-accent)' },
  { id: '4', title: 'مسئله حرکت شناسی', subject: 'فیزیک', minutes: 18, color: 'var(--lux-secondary)' },
]

function MiniTalentRadar({ values }: { values: number[] }) {
  const labels = ['درسی', 'هنری', 'ورزشی', 'اجتماعی', 'فناوری']
  const n = labels.length
  const cx = 50
  const cy = 50
  const maxR = 38

  const point = (i: number, v: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const r = (v / 100) * maxR
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }

  const poly = values.map((v, i) => point(i, v)).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40">
      {[20, 40, 60, 80, 100].map((g) => (
        <polygon
          key={g}
          points={Array.from({ length: n }, (_, i) => point(i, g)).join(' ')}
          fill="none"
          stroke="var(--lux-surface)"
          strokeWidth="0.6"
        />
      ))}
      <polygon points={poly} fill="rgba(139,124,255,0.2)" stroke="var(--lux-primary)" strokeWidth="1.5" />
      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const x = cx + (maxR + 10) * Math.cos(angle)
        const y = cy + (maxR + 10) * Math.sin(angle)
        return (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="var(--lux-text-muted)" fontSize="5">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

function buildDailyPlan(homework: DashboardPayload['homework']): DailyItem[] {
  if (homework && homework.length > 0) {
    return homework.slice(0, 4).map((h, i) => ({
      id: h.id,
      subject: h.subject,
      title: h.title,
      progress: Math.min(90, 25 + i * 20),
    }))
  }
  return []
}

function buildGoals(xp: DashboardPayload['xp']): GoalItem[] {
  const streak = xp?.currentStreak ?? 0
  const level = xp?.level ?? 1
  return [
    { id: 'g1', label: '۳۰ دقیقه مطالعه امروز', progress: Math.min(100, streak * 12 + 20), color: 'var(--lux-primary)' },
    { id: 'g2', label: 'تکمیل یک تمرین AI', progress: Math.min(100, level * 15), color: 'var(--lux-secondary)' },
    { id: 'g3', label: 'حفظ استریک هفتگی', progress: Math.min(100, streak * 14), color: 'var(--lux-gold)' },
  ]
}

function buildInsight(data: DashboardPayload): string {
  const name = data.student?.name?.split(' ')[0] ?? 'دوست من'
  const streak = data.xp?.currentStreak ?? 0
  if (streak >= 5) {
    return `${name}، ${streak} روز پشت‌سرهم یاد گرفتی — امروز روی یک درس عمیق‌تر تمرکز کن تا رشدت پایدار بماند.`
  }
  if ((data.grades?.recent?.length ?? 0) > 0) {
    const top = data.grades!.recent[0]
    return `${name}، در ${top.subject} پیشرفت خوبی داری. پیشنهاد می‌کنم امروز ۱۵ دقیقه مرور مفهومی داشته باشی.`
  }
  return `${name}، امروز از یک درس کوتاه شروع کن — هوشیار کنارت است تا مسیر را مرحله‌به‌مرحله بسازیم.`
}

export function StudentHome() {
  const [data, setData] = useState<DashboardPayload>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = () => {
    setLoading(true)
    setError('')
    fetch('/api/student/dashboard')
      .then(async (r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((d) => {
        if (d.success) setData(d)
        else setError('دریافت داشبورد ناموفق بود.')
      })
      .catch(() => setError('اتصال برقرار نشد. لطفاً دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const dailyPlan = useMemo(() => buildDailyPlan(data.homework), [data.homework])
  const goals = useMemo(() => buildGoals(data.xp), [data.xp])
  const insight = useMemo(() => buildInsight(data), [data])
  const talentValues = useMemo(() => {
    const base = data.xp?.level ?? 1
    return [55 + base * 4, 48 + base * 3, 40 + base * 2, 52 + base * 3, 50 + base * 5].map((v) => Math.min(95, v))
  }, [data.xp?.level])
  const hasTalentData = (data.xp?.total ?? 0) > 0 || (data.grades?.recent?.length ?? 0) > 0

  if (loading) {
    return (
      <div dir="rtl">
        <LuxSkeletonCards count={4} variant="lux" className="sm:grid-cols-2" />
      </div>
    )
  }

  if (error) {
    return (
      <div dir="rtl">
        <LuxErrorState message={error} onRetry={loadDashboard} variant="lux" />
      </div>
    )
  }

  return (
    <div dir="rtl">
    <LuxStagger className="space-y-5" stagger={0.1}>
      <div className="grid gap-5 lg:grid-cols-12">
        <LuxStaggerItem className="lg:col-span-7">
          <LuxCard>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="lux-kicker mb-1">برنامه هوشمند امروز</p>
                <h2 className="text-lg font-black text-[var(--lux-text)]">مسیر یادگیری روزانه</h2>
              </div>
              <Sparkles className="h-5 w-5 shrink-0 text-[var(--lux-primary)]" aria-hidden />
            </div>
            {dailyPlan.length === 0 ? (
              <LuxEmptyState
                icon={<Brain className="h-6 w-6" />}
                title="هوشیار برنامه‌ات را می‌سازد"
                description="با یک گفتگوی کوتاه با هوشیار، برنامه شخصی امروزت آماده می‌شود."
                actionLabel="شروع با هوشیار"
                actionHref="/student/study-buddy"
              />
            ) : (
              <div className="space-y-3">
                {dailyPlan.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--lux-surface)] bg-[var(--lux-card)] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[var(--lux-text)]">{item.title}</p>
                      <span className="text-xs font-bold text-[var(--lux-primary)]">{item.subject}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--lux-surface)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.progress}%`, background: 'var(--lux-primary)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LuxCard>
        </LuxStaggerItem>

        <LuxStaggerItem className="lg:col-span-5">
          <LuxCard gradientBorder>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <HooshiarCharacter mood="idle" size="md" />
              <div className="min-w-0 text-center sm:text-right">
                <p className="text-xs font-bold text-[var(--lux-accent)]">بینش هوشیار</p>
                <h3 className="mt-1 text-base font-black text-[var(--lux-text)]">پیام امروز</h3>
                <p className="mt-2 text-sm leading-8 text-[var(--lux-text-muted)]">{insight}</p>
                <Link href="/student/study-buddy" className="lux-btn-ghost mt-4 inline-flex min-h-9 px-4 text-xs">
                  گفتگو با هوشیار
                </Link>
              </div>
            </div>
          </LuxCard>
        </LuxStaggerItem>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <LuxStaggerItem>
          <LuxCard interactive className="h-full">
            <Link href="/student/learning-journey" className="block h-full">
              <p className="lux-kicker mb-1">سفر یادگیری</p>
              <h3 className="font-black text-[var(--lux-text)]">آخرین ایستگاه مسیر</h3>
              <p className="mt-2 text-sm text-[var(--lux-text-muted)]">فیزیک — حرکت شناسی</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--lux-secondary)]">
                ادامه مسیر
                <ChevronLeft className="h-4 w-4" />
              </div>
            </Link>
          </LuxCard>
        </LuxStaggerItem>

        <LuxStaggerItem>
          <LuxCard className="h-full">
            <p className="lux-kicker mb-1">استعداد</p>
            <h3 className="font-black text-[var(--lux-text)]">نمای کلی</h3>
            {hasTalentData ? (
              <>
                <MiniTalentRadar values={talentValues} />
                <Link href="/student/talent-garden" className="lux-btn-ghost mt-2 inline-flex min-h-9 w-full justify-center text-xs">
                  جزئیات باغ استعداد
                </Link>
              </>
            ) : (
              <LuxEmptyState
                icon={<Target className="h-6 w-6" />}
                title="استعدادت را کشف کن"
                description="با چند فعالیت یادگیری، رادار استعدادت شکل می‌گیرد."
                actionLabel="شروع کشف"
                actionHref="/student/talent-garden"
              />
            )}
          </LuxCard>
        </LuxStaggerItem>

        <LuxStaggerItem>
          <LuxCard className="h-full">
            <p className="lux-kicker mb-1">اهداف</p>
            <h3 className="mb-3 font-black text-[var(--lux-text)]">پیشرفت هفتگی</h3>
            {goals.every((g) => g.progress === 0) ? (
              <LuxEmptyState
                icon={<Flame className="h-6 w-6" />}
                title="هدف اول را تعریف کن"
                description="از باغ استعداد یا هوشیار، هدف شخصی‌ات را بساز."
                actionLabel="تعریف هدف"
                actionHref="/student/talent-garden"
              />
            ) : (
              <div className="space-y-3">
                {goals.map((g) => (
                  <div key={g.id}>
                    <div className="mb-1 flex justify-between text-xs font-bold text-[var(--lux-text-muted)]">
                      <span>{g.label}</span>
                      <span>{g.progress.toLocaleString('fa-IR')}٪</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--lux-surface)]">
                      <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: g.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LuxCard>
        </LuxStaggerItem>
      </div>

      <LuxStaggerItem>
        <LuxCard>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="lux-kicker mb-1">پیشنهاد هوشمند</p>
              <h3 className="font-black text-[var(--lux-text)]">درس‌های پیشنهادی AI</h3>
            </div>
            <TrendingUp className="h-5 w-5 shrink-0 text-[var(--lux-gold)]" aria-hidden />
          </div>
          <div className="lux-recommendations-scroll">
            {DEFAULT_RECOMMENDATIONS.map((rec) => (
              <div
                key={rec.id}
                className="w-[220px] rounded-2xl border border-[var(--lux-surface)] bg-[var(--lux-card)] p-4"
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${rec.color}22`, color: rec.color }}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <p className="text-sm font-black text-[var(--lux-text)]">{rec.title}</p>
                <p className="mt-1 text-xs text-[var(--lux-text-muted)]">
                  {rec.subject} · {rec.minutes.toLocaleString('fa-IR')} دقیقه
                </p>
                <Link
                  href="/student/study-buddy"
                  className="mt-3 inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold"
                  style={{ background: `${rec.color}22`, color: rec.color }}
                >
                  شروع
                </Link>
              </div>
            ))}
          </div>
        </LuxCard>
      </LuxStaggerItem>
    </LuxStagger>
    </div>
  )
}
