'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star,
  Clock,
  CheckCircle2,
  Circle,
  ChevronLeft,
  Sparkles,
  Brain,
  Lightbulb,
  Gamepad2,
  Calendar,
  Award,
  Target,
  Zap,
  Medal,
  FileText,
  Compass,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { ToolTile } from '@/components/ui/tool-tile'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePersianDateString } from '@/lib/hooks/use-persian-date'

type RealGrade = {
  id: string
  subject: string
  score: number
  max_score: number
  exam_date: string
  exam_type: string
}
type RealExam = { id: string; title: string; subject: string; status: string; start_time: string }
type XPData = {
  xp: number
  level: number
  coins: number
  current_streak: number
  longest_streak: number
  xp_progress: { current: number; needed: number }
}

const todaySchedule: {
  id: string
  subject: string
  time: string
  teacher: string
}[] = []

function getLevelTitle(level: number): string {
  if (level <= 1) return 'تازه‌کار'
  if (level <= 2) return 'دانش‌آموز'
  if (level <= 3) return 'دانش‌پژوه'
  if (level <= 4) return 'پژوهشگر'
  if (level <= 5) return 'دانشمند'
  return 'نابغه'
}

export default function StudentDashboardPage() {
  const [homework, setHomework] = useState<
    { id: string; subject: string; title: string; dueDate: string; done: boolean }[]
  >([])
  const persianDate = usePersianDateString()
  const [recentGrades, setRecentGrades] = useState<RealGrade[]>([])
  const [upcomingExams, setUpcomingExams] = useState<RealExam[]>([])
  const [profileName, setProfileName] = useState('')
  const [xpData, setXpData] = useState<XPData>({
    xp: 0,
    level: 1,
    coins: 0,
    current_streak: 0,
    longest_streak: 0,
    xp_progress: { current: 0, needed: 100 },
  })

  useEffect(() => {
    fetch('/api/gamification/daily-xp', { method: 'POST' }).catch(() => {})

    Promise.all([
      fetch('/api/grades')
        .then((r) => r.json())
        .catch(() => ({ grades: [] })),
      fetch('/api/exams?filter=upcoming')
        .then((r) => r.json())
        .catch(() => ({ exams: [] })),
      fetch('/api/profile')
        .then((r) => r.json())
        .catch(() => ({})),
      fetch('/api/xp/balance')
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([gData, eData, pData, xData]) => {
      setRecentGrades((gData.grades || []).slice(0, 5))
      setUpcomingExams((eData.exams || []).slice(0, 3))
      if (pData?.full_name) setProfileName(pData.full_name)
      if (xData && !xData.error) setXpData(xData)
    })
  }, [])

  const toggleHomework = (id: string) => {
    setHomework((prev) => prev.map((hw) => (hw.id === id ? { ...hw, done: !hw.done } : hw)))
  }

  const homeworkProgress =
    homework.length > 0
      ? Math.round((homework.filter((hw) => hw.done).length / homework.length) * 100)
      : 0

  const averageGrade =
    recentGrades.length > 0
      ? (
          recentGrades.reduce((sum, g) => sum + (g.score / g.max_score) * 20, 0) / recentGrades.length
        ).toFixed(1)
      : '—'

  const levelProgress =
    xpData.xp_progress.needed > 0
      ? Math.round((xpData.xp_progress.current / xpData.xp_progress.needed) * 100)
      : 0
  const levelTitle = getLevelTitle(xpData.level)

  const learningTools = [
    {
      label: 'دستیار مطالعه',
      href: '/student/study-buddy',
      icon: <Brain className="w-6 h-6" />,
      description: 'سوالاتت را بپرس',
      accent: 'pink' as const,
      featured: true,
    },
    {
      label: 'حل مسئله',
      href: '/student/problem-solver',
      icon: <Lightbulb className="w-5 h-5" />,
      description: 'عکس بگیر، جواب بگیر',
      accent: 'orange' as const,
    },
    {
      label: 'زمین بازی',
      href: '/student/practice-playground',
      icon: <Gamepad2 className="w-5 h-5" />,
      description: 'تمرین بازی‌گونه',
      accent: 'green' as const,
    },
    {
      label: 'باغ استعداد',
      href: '/student/talent-garden',
      icon: <Trophy className="w-5 h-5" />,
      description: 'امتیاز جمع کن',
      accent: 'orange' as const,
    },
    {
      label: 'قطب‌نمای آینده',
      href: '/student/future-compass',
      icon: <Compass className="w-5 h-5" />,
      description: 'مسیر آینده',
      accent: 'cyan' as const,
    },
    {
      label: 'انتخاب رشته',
      href: '/student/field-selection',
      icon: <Target className="w-5 h-5" />,
      description: 'رشته مناسب',
      accent: 'purple' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        meta={persianDate}
        title={
          <>
            سلام، <span className="gradient-text">{profileName || 'دانش‌آموز'}</span>
          </>
        }
        description="همراه هوشمند یادگیری آماده است — امروز روی یک هدف تمرکز کن."
        actions={
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel-quiet text-sm">
            <Zap className="w-4 h-4 text-brand-yellow shrink-0" />
            <div>
              <p className="font-bold tabular-nums">{xpData.xp.toLocaleString('fa-IR')} XP</p>
              <p className="text-xs text-muted-foreground">
                سطح {xpData.level} · {levelTitle}
              </p>
            </div>
          </div>
        }
      />

      {/* تمرکز اصلی: پیشرفت سطح */}
      <GlassCard className="p-6 md:p-7 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-l from-brand-pink/10 via-transparent to-brand-purple/5 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-pink to-brand-orange flex items-center justify-center ring-2 ring-white/10">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="section-label mb-1">پیشرفت امروز</p>
              <p className="text-lg font-semibold">مسیر رشد تو</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {xpData.xp_progress.current.toLocaleString('fa-IR')} از{' '}
                {xpData.xp_progress.needed.toLocaleString('fa-IR')} XP تا سطح بعد
              </p>
            </div>
          </div>
          <div className="md:w-64 w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>سطح {xpData.level}</span>
              <span className="text-brand-yellow font-medium">{levelProgress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-brand-yellow to-brand-orange transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="امتیاز XP"
          value={xpData.xp.toLocaleString('fa-IR')}
          hint={levelTitle}
          icon={<Zap className="w-5 h-5" />}
          accentClass="text-brand-yellow"
        />
        <StatCard
          label="میانگین نمرات"
          value={averageGrade}
          hint="از ۲۰"
          icon={<Star className="w-5 h-5" />}
          accentClass="text-brand-green"
        />
        <StatCard
          label="تکالیف"
          value={`${homework.filter((h) => h.done).length}/${homework.length || 0}`}
          hint={`${homeworkProgress}% انجام‌شده`}
          icon={<FileText className="w-5 h-5" />}
          accentClass="text-brand-cyan"
        />
        <StatCard
          label="استریک"
          value={xpData.current_streak}
          hint={`رکورد ${xpData.longest_streak} روز`}
          icon={<Medal className="w-5 h-5" />}
          accentClass="text-brand-pink"
        />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-brand-pink" />
          <h2 className="text-lg font-bold">ابزارهای یادگیری</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {learningTools.map((tool) => (
            <ToolTile
              key={tool.href}
              href={tool.href}
              label={tool.label}
              description={tool.description}
              icon={tool.icon}
              featured={tool.featured}
              accent={tool.accent}
            />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard quiet className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-cyan" />
              تکالیف من
            </h2>
            {homework.length > 0 && (
              <span className="text-sm text-brand-green font-medium">{homeworkProgress}%</span>
            )}
          </div>
          {homework.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="تکلیفی برای امروز نیست"
              description="می‌توانی از دستیار مطالعه یا زمین بازی شروع کنی."
              action={
                <Link href="/student/study-buddy">
                  <Button variant="gradient" size="sm">
                    دستیار مطالعه
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {homework.map((hw) => (
                <button
                  key={hw.id}
                  type="button"
                  onClick={() => toggleHomework(hw.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer text-right focus-ring',
                    hw.done
                      ? 'border-brand-green/30 bg-brand-green/5'
                      : 'border-white/[0.06] hover:bg-white/[0.03]',
                  )}
                >
                  {hw.done ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 text-right">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        hw.done && 'line-through text-muted-foreground',
                      )}
                    >
                      {hw.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{hw.subject}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard quiet className="p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-brand-purple" />
            برنامه امروز
          </h2>
          {todaySchedule.length === 0 ? (
            <EmptyState
              title="برنامه‌ای ثبت نشده"
              description="برنامه کلاس‌ها از مدرسه همگام می‌شود."
            />
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <p className="text-sm font-medium">{item.subject}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard quiet className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-yellow" />
            نمرات اخیر
          </h2>
          <Link href="/student/grades">
            <Button variant="ghost" size="sm">
              همه
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {recentGrades.length === 0 ? (
          <EmptyState title="هنوز نمره‌ای ثبت نشده" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-white/[0.06]">
                  <th className="text-right pb-3 font-medium">درس</th>
                  <th className="text-center pb-3 font-medium">نوع</th>
                  <th className="text-center pb-3 font-medium">نمره</th>
                  <th className="text-center pb-3 font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="py-3 font-medium">{grade.subject}</td>
                    <td className="py-3 text-center text-muted-foreground">
                      {grade.exam_type || '—'}
                    </td>
                    <td className="py-3 text-center font-bold tabular-nums">{grade.score}</td>
                    <td className="py-3 text-center text-muted-foreground text-xs">
                      {grade.exam_date
                        ? new Date(grade.exam_date).toLocaleDateString('fa-IR')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {upcomingExams.length > 0 && (
        <GlassCard quiet className="p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand-orange" />
            آزمون‌های پیش‌رو
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <p className="font-medium text-sm">{exam.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{exam.subject}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <Link href="/student/talent-garden" className="block cursor-pointer">
        <GlassCard hover className="p-6 border-brand-orange/15">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="font-bold">باغ استعداد</h3>
                <p className="text-sm text-muted-foreground">امتیاز، سطح و نشان‌ها</p>
              </div>
            </div>
            <div className="text-left flex items-center gap-2">
              <div>
                <p className="text-xl font-bold gradient-text">
                  {xpData.xp.toLocaleString('fa-IR')} XP
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Award className="w-3.5 h-3.5 text-brand-yellow" />
                  {levelTitle}
                </p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </GlassCard>
      </Link>
    </div>
  )
}
