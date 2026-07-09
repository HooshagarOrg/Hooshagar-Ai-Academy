'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Brain, CheckCircle2, Clock, User, Loader2,
  AlertCircle, ArrowRight, Sparkles, Star, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { StatCard } from '@/components/ui/stat-card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PageLoading } from '@/components/ui/page-states'
import { DashboardPage, DashboardSectionBlock } from '@/components/layout/dashboard-page'

interface ExamSession {
  id: string
  status: 'in_progress' | 'submitted' | 'graded' | 'expired'
  submitted_at: string | null
  graded_at: string | null
  total_score: number
  max_score: number
  percentage: number
  passed: boolean | null
  student_name: string
  pending_descriptive: number
}

interface ExamInfo {
  id: string
  title: string
  subject: string
  grade: number
  total_questions: number
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  in_progress: { label: 'در حال انجام', className: 'bg-brand-cyan/15 text-brand-cyan' },
  submitted: { label: 'ارسال‌شده', className: 'bg-brand-yellow/15 text-brand-yellow' },
  graded: { label: 'تصحیح‌شده', className: 'bg-brand-green/15 text-brand-green' },
  expired: { label: 'منقضی', className: 'bg-white/10 text-muted-foreground' },
}

function ScoreBadge({ pct }: { pct: number }) {
  const color =
    pct >= 75 ? 'text-brand-green' : pct >= 50 ? 'text-brand-yellow' : 'text-destructive'
  return <span className={`font-bold text-lg tabular-nums ${color}`}>{pct.toFixed(0)}٪</span>
}

export default function ExamGradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<string | null>(null)
  const [gradingAll, setGradingAll] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [examRes, sessRes] = await Promise.all([
        fetch(`/api/exams/${id}`),
        fetch(`/api/exams/${id}/sessions`),
      ])
      const examData = await examRes.json()
      const sessData = await sessRes.json()
      setExam(examData.exam || null)
      setSessions(sessData.sessions || [])
    } catch {
      toast.error('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const gradeSession = async (sessionId: string) => {
    setGrading(sessionId)
    try {
      const res = await fetch('/api/exams/grade-descriptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.graded} پاسخ با AI تصحیح شد`)
      fetchData()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'خطا در تصحیح')
    } finally {
      setGrading(null)
    }
  }

  const gradeAllPending = async () => {
    const pending = sessions.filter((s) => s.status === 'submitted' && s.pending_descriptive > 0)
    if (pending.length === 0) {
      toast.info('جلسه‌ای برای تصحیح وجود ندارد')
      return
    }

    setGradingAll(true)
    let total = 0
    for (const s of pending) {
      try {
        const res = await fetch('/api/exams/grade-descriptive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: s.id }),
        })
        const data = await res.json()
        if (res.ok) total += data.graded || 0
      } catch {
        /* ادامه با بقیه */
      }
    }
    toast.success(`${total} پاسخ تشریحی با AI تصحیح شد`)
    fetchData()
    setGradingAll(false)
  }

  if (loading) {
    return (
      <DashboardPage title="تصحیح آزمون" description="در حال بارگذاری...">
        <PageLoading label="در حال بارگذاری جلسات آزمون..." compact />
      </DashboardPage>
    )
  }

  const pendingSessions = sessions.filter((s) => s.status === 'submitted' && s.pending_descriptive > 0)
  const gradedSessions = sessions.filter((s) => s.status === 'graded')
  const avgScore =
    gradedSessions.length > 0
      ? Math.round(gradedSessions.reduce((s, g) => s + g.percentage, 0) / gradedSessions.length) + '٪'
      : '—'

  return (
    <DashboardPage
      className="max-w-5xl mx-auto"
      title={
        <span className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-[var(--lux-primary)]" />
          تصحیح آزمون — {exam?.title || ''}
        </span>
      }
      description={
        exam
          ? `${exam.subject} · پایه ${exam.grade} · ${exam.total_questions} سوال`
          : undefined
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/teacher/exams"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به آزمون‌ها
          </Link>
          {pendingSessions.length > 0 && (
            <Button
              onClick={gradeAllPending}
              disabled={gradingAll}
              className="bg-brand-purple hover:opacity-90 text-space gap-2"
            >
              {gradingAll ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              تصحیح همه با AI ({pendingSessions.length})
            </Button>
          )}
        </div>
      }
    >

      <DashboardSectionBlock>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="کل شرکت‌کننده" value={sessions.length} accentClass="text-brand-cyan" />
        <StatCard label="در انتظار تصحیح" value={pendingSessions.length} accentClass="text-brand-yellow" />
        <StatCard label="تصحیح‌شده" value={gradedSessions.length} accentClass="text-brand-green" />
        <StatCard label="میانگین نمره" value={avgScore} accentClass="text-brand-purple" />
      </div>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-purple" />
            جلسات دانش‌آموزان
          </h2>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
            هنوز هیچ دانش‌آموزی در این آزمون شرکت نکرده
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="p-3 text-right font-medium text-muted-foreground">دانش‌آموز</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">وضعیت</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">نمره</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">زمان ارسال</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const badge = STATUS_BADGE[session.status] || STATUS_BADGE.submitted
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-3 font-medium">{session.student_name || 'نامشخص'}</td>
                      <td className="p-3">
                        <Badge className={cn('text-xs border-0', badge.className)}>{badge.label}</Badge>
                        {session.pending_descriptive > 0 && (
                          <span className="mr-1 text-xs text-brand-orange">
                            ({session.pending_descriptive} تشریحی)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {session.status === 'graded' ? (
                          <ScoreBadge pct={session.percentage} />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {session.submitted_at
                          ? new Date(session.submitted_at).toLocaleString('fa-IR')
                          : '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {session.status === 'submitted' && session.pending_descriptive > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={grading === session.id}
                              onClick={() => gradeSession(session.id)}
                              className="text-brand-purple border-brand-purple/30 hover:bg-brand-purple/10 gap-1 h-7 text-xs"
                            >
                              {grading === session.id ? (
                                <Loader2 className="animate-spin w-3 h-3" />
                              ) : (
                                <Brain className="w-3 h-3" />
                              )}
                              تصحیح AI
                            </Button>
                          )}
                          {session.status === 'graded' && (
                            <span
                              className={cn(
                                'text-xs flex items-center gap-1',
                                session.passed ? 'text-brand-green' : 'text-destructive',
                              )}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {session.passed ? 'قبول' : 'مردود'}
                            </span>
                          )}
                          {session.status === 'in_progress' && (
                            <span className="flex items-center gap-1 text-xs text-brand-cyan">
                              <Clock className="w-3 h-3" />
                              در جریان
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
      </DashboardSectionBlock>

      <DashboardSectionBlock>
      <GlassCard quiet className="p-4 border-brand-purple/25">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">تصحیح هوشمند با AI</p>
            <p className="text-muted-foreground leading-relaxed">
              سوالات چندگزینه‌ای و صحیح/غلط بلافاصله پس از ارسال تصحیح می‌شوند. سوالات{' '}
              <strong>کوتاه‌پاسخ</strong> و <strong>تشریحی</strong> توسط AI هوشاگر بررسی و نمره‌دهی
              می‌شوند.
            </p>
          </div>
        </div>
      </GlassCard>
      </DashboardSectionBlock>
    </DashboardPage>
  )
}
