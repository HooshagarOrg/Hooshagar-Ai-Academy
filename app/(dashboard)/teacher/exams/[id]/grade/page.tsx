'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Brain, CheckCircle2, Clock, User, Loader2,
  AlertCircle, ArrowRight, Sparkles, Star, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

// ────────────────────────────────────────────────
// تایپ‌ها
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// رنگ‌ها
// ────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  in_progress: { label: 'در حال انجام', className: 'bg-blue-100 text-blue-700' },
  submitted:   { label: 'ارسال‌شده',    className: 'bg-yellow-100 text-yellow-700' },
  graded:      { label: 'تصحیح‌شده',   className: 'bg-green-100 text-green-700' },
  expired:     { label: 'منقضی',        className: 'bg-gray-100 text-gray-500' },
}

function ScoreBadge({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'text-green-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-600'
  return <span className={`font-bold text-lg ${color}`}>{pct.toFixed(0)}٪</span>
}

// ────────────────────────────────────────────────
// صفحه اصلی
// ────────────────────────────────────────────────
export default function ExamGradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [exam, setExam]         = useState<ExamInfo | null>(null)
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading]   = useState(true)
  const [grading, setGrading]   = useState<string | null>(null)   // session_id در حال تصحیح
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

  useEffect(() => { fetchData() }, [id])

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
      toast.error((e instanceof Error ? e.message : 'خطا در تصحیح'))
    } finally {
      setGrading(null)
    }
  }

  const gradeAllPending = async () => {
    const pending = sessions.filter(s => s.status === 'submitted' && s.pending_descriptive > 0)
    if (pending.length === 0) { toast.info('جلسه‌ای برای تصحیح وجود ندارد'); return }

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
      } catch { /* ادامه با بقیه */ }
    }
    toast.success(`${total} پاسخ تشریحی با AI تصحیح شد`)
    fetchData()
    setGradingAll(false)
  }

  // ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
    </div>
  )

  const pendingSessions = sessions.filter(s => s.status === 'submitted' && s.pending_descriptive > 0)
  const gradedSessions  = sessions.filter(s => s.status === 'graded')

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">

      {/* هدر */}
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/teacher/exams`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2">
            <ArrowRight className="w-4 h-4" /> بازگشت به آزمون‌ها
          </Link>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Brain className="text-purple-500" />
            تصحیح آزمون — {exam?.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {exam?.subject} | پایه {exam?.grade} | {exam?.total_questions} سوال
          </p>
        </div>

        {pendingSessions.length > 0 && (
          <Button
            onClick={gradeAllPending}
            disabled={gradingAll}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            {gradingAll ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            تصحیح همه با AI ({pendingSessions.length})
          </Button>
        )}
      </div>

      {/* آمار خلاصه */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'کل شرکت‌کننده', value: sessions.length,          color: 'text-blue-600' },
          { label: 'در انتظار تصحیح', value: pendingSessions.length, color: 'text-yellow-600' },
          { label: 'تصحیح‌شده',       value: gradedSessions.length,  color: 'text-green-600' },
          { label: 'میانگین نمره',
            value: gradedSessions.length > 0
              ? Math.round(gradedSessions.reduce((s, g) => s + g.percentage, 0) / gradedSessions.length) + '٪'
              : '—',
            color: 'text-purple-600' },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* جدول جلسات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> جلسات دانش‌آموزان
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              هنوز هیچ دانش‌آموزی در این آزمون شرکت نکرده
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-right font-medium text-gray-600">دانش‌آموز</th>
                  <th className="p-3 text-right font-medium text-gray-600">وضعیت</th>
                  <th className="p-3 text-right font-medium text-gray-600">نمره</th>
                  <th className="p-3 text-right font-medium text-gray-600">زمان ارسال</th>
                  <th className="p-3 text-right font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => {
                  const badge = STATUS_BADGE[session.status] || STATUS_BADGE.submitted
                  return (
                    <tr key={session.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{session.student_name || 'نامشخص'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                        {session.pending_descriptive > 0 && (
                          <span className="mr-1 text-xs text-orange-500">
                            ({session.pending_descriptive} تشریحی)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {session.status === 'graded'
                          ? <ScoreBadge pct={session.percentage} />
                          : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="p-3 text-gray-400 text-xs">
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
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-1 h-7 text-xs"
                            >
                              {grading === session.id
                                ? <Loader2 className="animate-spin w-3 h-3" />
                                : <Brain className="w-3 h-3" />}
                              تصحیح AI
                            </Button>
                          )}
                          {session.status === 'graded' && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {session.passed ? 'قبول' : 'مردود'}
                            </span>
                          )}
                          {session.status === 'in_progress' && (
                            <span className="flex items-center gap-1 text-xs text-blue-500">
                              <Clock className="w-3 h-3" /> در جریان
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* راهنما */}
      <Card className="border-purple-100 bg-purple-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Star className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-bold mb-1">تصحیح هوشمند با AI</p>
            <p className="text-purple-600">
              سوالات چندگزینه‌ای و صحیح/غلط بلافاصله پس از ارسال تصحیح می‌شوند.
              سوالات <strong>کوتاه‌پاسخ</strong> و <strong>تشریحی</strong> توسط AI هوشاگر بررسی و نمره‌دهی می‌شوند.
              در صورت نیاز، نمره AI را می‌توانید ویرایش کنید.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
