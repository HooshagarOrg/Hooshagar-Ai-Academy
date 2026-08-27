'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  ArrowRight,
  Star,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface SurveyQuestion {
  id: string
  question_text: string
  question_type: string
  is_required: boolean
  question_order: number
}

interface SurveyListItem {
  id: string
  title: string
  description: string | null
  status: string
  target_audience: string[] | null
}

function StarRating({
  rating,
  onRate,
}: {
  rating: number
  onRate: (rating: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'ضعیف', 'متوسط', 'خوب', 'خیلی خوب', 'عالی']

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hovered || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-white/20'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || rating) > 0 && (
        <span className="text-sm font-medium text-yellow-400">
          {labels[hovered || rating]}
        </span>
      )}
    </div>
  )
}

export default function ParentSurveyPage() {
  const [loading, setLoading] = useState(true)
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [surveyTitle, setSurveyTitle] = useState('نظرسنجی')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [sessionId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    // وابستگی ترتیبی: ابتدا لیست نظرسنجی‌های فعال، سپس جزئیات همان نظرسنجی انتخاب‌شده.
    // موازی‌سازی ممکن نیست چون detail به id حاصل از list نیاز دارد.
    const load = async () => {
      try {
        const listRes = await fetch('/api/surveys?status=active&limit=20')
        const listJson = await listRes.json()
        if (!listRes.ok) {
          toast.error(listJson.error || 'دریافت نظرسنجی‌ها ناموفق بود')
          return
        }
        const surveys = (listJson.surveys || []) as SurveyListItem[]
        const parentSurvey = surveys.find((s) =>
          (s.target_audience || []).some((role) =>
            ['parent', 'والد', 'all'].includes(role)
          )
        ) || surveys[0]
        if (!parentSurvey) return

        const detailRes = await fetch(`/api/surveys/${parentSurvey.id}`)
        const detail = await detailRes.json()
        if (!detailRes.ok) {
          toast.error(detail.error || 'این نظرسنجی در دسترس نیست')
          return
        }
        setSurveyId(parentSurvey.id)
        setSurveyTitle(detail.survey?.title || parentSurvey.title)
        setQuestions(detail.questions || [])
      } catch {
        toast.error('خطای شبکه در دریافت نظرسنجی')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const requiredIds = questions.filter((q) => q.is_required).map((q) => q.id)
  const answeredRequired = requiredIds.filter((id) => {
    const value = answers[id]
    return value !== undefined && value !== '' && value !== 0
  }).length

  const handleSubmit = async () => {
    if (!surveyId) return
    if (answeredRequired < requiredIds.length) {
      toast.error('لطفاً به همه سوالات اجباری پاسخ دهید')
      return
    }
    setIsSubmitting(true)
    try {
      const totalTime = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      const res = await fetch(`/api/surveys/${surveyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answers,
          total_time: totalTime,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'ثبت نظرسنجی ناموفق بود')
        return
      }
      setIsSubmitted(true)
    } catch {
      toast.error('خطای شبکه در ثبت نظرسنجی')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardPage title="نظرسنجی" className="mx-auto max-w-3xl">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
        </div>
      </DashboardPage>
    )
  }

  if (isSubmitted) {
    return (
      <DashboardPage className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center" title="نظرسنجی" animatedSections={false}>
        <GlassCard className="w-full p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white">با تشکر از شما</h2>
          <p className="mb-6 text-white/70">نظرسنجی شما در سامانه ثبت شد.</p>
          <Link href="/parent">
            <Button className="gap-2 bg-brand-green text-space hover:opacity-90">
              <ArrowRight className="h-5 w-5" />
              بازگشت به داشبورد
            </Button>
          </Link>
        </GlassCard>
      </DashboardPage>
    )
  }

  if (!surveyId || questions.length === 0) {
    return (
      <DashboardPage className="mx-auto max-w-3xl" title="نظرسنجی">
        <GlassCard className="p-10 text-center">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-white/30" />
          <p className="text-white/80">نظرسنجی فعالی برای والدین وجود ندارد</p>
          <p className="mt-2 text-sm text-white/50">وقتی مدرسه نظرسنجی منتشر کند، اینجا نمایش داده می‌شود</p>
        </GlassCard>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      className="mx-auto max-w-3xl"
      title={
        <span className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-brand-cyan" />
          {surveyTitle}
        </span>
      }
      description="نظر شما برای مدرسه ثبت می‌شود"
    >
      {questions.map((question, index) => {
        const isRating = ['rating_scale', 'rating_stars', 'emoji_rating', 'slider'].includes(
          question.question_type
        )
        return (
          <GlassCard key={question.id} className="p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-sm font-bold text-blue-400">
                {index + 1}
              </span>
              <p className="font-medium text-white">
                {question.question_text}
                {question.is_required ? <span className="mr-1 text-red-400">*</span> : null}
              </p>
            </div>
            {isRating ? (
              <StarRating
                rating={Number(answers[question.id] || 0)}
                onRate={(rating) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: rating }))
                }
              />
            ) : (
              <Textarea
                value={String(answers[question.id] || '')}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                placeholder="پاسخ خود را بنویسید"
                rows={3}
              />
            )}
          </GlassCard>
        )
      })}

      <Button
        className="w-full"
        onClick={() => void handleSubmit()}
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
        ثبت نظرسنجی
      </Button>
    </DashboardPage>
  )
}
