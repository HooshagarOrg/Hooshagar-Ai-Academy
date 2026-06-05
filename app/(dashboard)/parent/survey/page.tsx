'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  ArrowRight,
  Star,
  Send,
  CheckCircle2,
  GraduationCap,
  Building,
  MessageSquare,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'

// ============================================
// تایپ‌ها
// ============================================
interface SurveyQuestion {
  id: string
  text: string
  rating: number
}

interface SurveySection {
  id: string
  title: string
  icon: React.ReactNode
  questions: SurveyQuestion[]
}

// ============================================
// کامپوننت امتیازدهی ستاره‌ای
// ============================================
interface StarRatingProps {
  rating: number
  onRate: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

function StarRating({ rating, onRate, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

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
              className={`${sizeClasses[size]} transition-colors ${
                star <= (hovered || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-white/20'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || rating) > 0 && (
        <span className="text-yellow-400 text-sm font-medium">
          {labels[hovered || rating]}
        </span>
      )}
    </div>
  )
}

// ============================================
// کامپوننت Progress Bar
// ============================================
interface ProgressBarProps {
  current: number
  total: number
}

function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-white/60 mb-2">
        <span>{current} از {total} سوال</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function ParentSurveyPage() {
  // داده‌های اولیه نظرسنجی
  const [teacherQuestions, setTeacherQuestions] = useState<SurveyQuestion[]>([
    { id: 't1', text: 'میزان رضایت از تدریس معلم', rating: 0 },
    { id: 't2', text: 'ارتباط معلم با دانش‌آموز', rating: 0 },
    { id: 't3', text: 'پاسخگویی به سوالات دانش‌آموز', rating: 0 },
    { id: 't4', text: 'میزان مناسب بودن تکالیف', rating: 0 },
    { id: 't5', text: 'انضباط و نظم کلاسی', rating: 0 },
  ])

  const [facilityQuestions, setFacilityQuestions] = useState<SurveyQuestion[]>([
    { id: 'f1', text: 'فضای آموزشی و کلاس‌ها', rating: 0 },
    { id: 'f2', text: 'تجهیزات و امکانات کلاس', rating: 0 },
    { id: 'f3', text: 'بهداشت و نظافت مدرسه', rating: 0 },
    { id: 'f4', text: 'امکانات ورزشی', rating: 0 },
    { id: 'f5', text: 'برنامه‌های فوق‌برنامه', rating: 0 },
  ])

  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // بروزرسانی امتیاز
  const updateTeacherRating = (id: string, rating: number): void => {
    setTeacherQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, rating } : q)
    )
  }

  const updateFacilityRating = (id: string, rating: number): void => {
    setFacilityQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, rating } : q)
    )
  }

  // محاسبه پیشرفت
  const answeredCount = [
    ...teacherQuestions.filter(q => q.rating > 0),
    ...facilityQuestions.filter(q => q.rating > 0),
  ].length
  const totalQuestions = teacherQuestions.length + facilityQuestions.length

  // ارسال نظرسنجی
  const handleSubmit = async (): Promise<void> => {
    if (answeredCount < totalQuestions) {
      alert('لطفاً به همه سوالات پاسخ دهید.')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  // نمایش صفحه موفقیت
  if (isSubmitted) {
    return (
      <DashboardPage className="max-w-md mx-auto flex items-center justify-center min-h-[50vh]" title="نظرسنجی" animatedSections={false}>
        <GlassCard className="p-8 text-center w-full">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            🙏 با تشکر از شما!
          </h2>
          <p className="text-white/70 mb-6">
            نظرسنجی شما با موفقیت ثبت شد. نظرات شما به بهبود کیفیت آموزش کمک می‌کند.
          </p>
          <Link href="/parent">
            <Button className="gap-2 bg-brand-green hover:opacity-90 text-space">
              <ArrowRight className="w-5 h-5" />
              بازگشت به داشبورد
            </Button>
          </Link>
        </GlassCard>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      className="max-w-3xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-brand-cyan" />
          نظرسنجی
        </span>
      }
      description="نظر شما برای ما مهم است"
      actions={
        <Link href="/parent">
          <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      }
      animatedSections={false}
    >
        <GlassCard className="p-4">
          <ProgressBar current={answeredCount} total={totalQuestions} />
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-yellow-400" />
            عملکرد معلم
          </h2>

          <div className="space-y-6">
            {teacherQuestions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{question.text}</span>
                  </div>
                  <StarRating
                    rating={question.rating}
                    onRate={(rating) => updateTeacherRating(question.id, rating)}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Building className="w-6 h-6 text-purple-400" />
            امکانات مدرسه
          </h2>

          <div className="space-y-6">
            {facilityQuestions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{question.text}</span>
                  </div>
                  <StarRating
                    rating={question.rating}
                    onRate={(rating) => updateFacilityRating(question.id, rating)}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-400" />
            نظرات و پیشنهادات
          </h2>
          <p className="text-white/60 text-sm mb-4">
            اگر نظر یا پیشنهادی دارید، لطفاً با ما در میان بگذارید (اختیاری)
          </p>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="نظرات و پیشنهادات خود را اینجا بنویسید..."
            rows={5}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none leading-relaxed"
          />
        </GlassCard>

        {/* ==================== دکمه ارسال ==================== */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || answeredCount < totalQuestions}
          className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all
            ${isSubmitting || answeredCount < totalQuestions
              ? 'bg-white/20 text-white/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30'
            }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              در حال ارسال...
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              ارسال نظرسنجی
              <Sparkles className="w-5 h-5" />
            </>
          )}
        </button>

        {answeredCount < totalQuestions && (
          <p className="text-center text-white/50 text-sm mt-3">
            لطفاً به همه {totalQuestions} سوال پاسخ دهید
          </p>
        )}

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-muted-foreground text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
    </DashboardPage>
  )
}

















































