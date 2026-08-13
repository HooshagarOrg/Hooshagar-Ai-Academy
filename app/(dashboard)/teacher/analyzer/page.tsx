'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  ArrowRight,
  Loader2,
  Sparkles,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'

interface ClassStudent {
  id: string
  name: string
  className: string
  grade: number | null
}

interface AnalysisResult {
  analysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  risk_level: 'low' | 'medium' | 'high'
}

const TYPE_OPTIONS = [
  { value: 'comprehensive', label: 'جامع' },
  { value: 'academic', label: 'تحصیلی' },
  { value: 'behavioral', label: 'رفتاری' },
] as const

const RISK_FA: Record<AnalysisResult['risk_level'], { label: string; className: string }> = {
  low: { label: 'کم‌خطر', className: 'text-green-400 bg-green-500/15' },
  medium: { label: 'نیاز به توجه', className: 'text-amber-400 bg-amber-500/15' },
  high: { label: 'نیاز به پیگیری', className: 'text-red-400 bg-red-500/15' },
}

export default function TeacherAnalyzerPage() {
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [studentId, setStudentId] = useState('')
  const [analysisType, setAnalysisType] = useState<(typeof TYPE_OPTIONS)[number]['value']>(
    'comprehensive'
  )
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [studentName, setStudentName] = useState('')
  const [model, setModel] = useState('')

  useEffect(() => {
    void fetch('/api/teacher/class-students')
      .then((r) => r.json())
      .then((data: { students?: ClassStudent[]; error?: string }) => {
        if (!Array.isArray(data.students)) {
          toast.error(data.error || 'دریافت دانش‌آموزان ناموفق بود')
          return
        }
        setStudents(data.students)
      })
      .catch(() => toast.error('خطای شبکه'))
      .finally(() => setIsLoadingStudents(false))
  }, [])

  const runAnalysis = async (): Promise<void> => {
    if (!studentId) {
      toast.error('یک دانش‌آموز انتخاب کنید')
      return
    }
    setIsAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, analysisType }),
      })
      const data = (await res.json()) as {
        error?: string
        analysis?: AnalysisResult
        student?: { full_name?: string }
        model?: string
      }
      if (!res.ok) {
        toast.error(data.error || 'تحلیل ناموفق بود')
        return
      }
      if (!data.analysis) {
        toast.error('پاسخ تحلیل خالی بود')
        return
      }
      setResult(data.analysis)
      setStudentName(data.student?.full_name || '')
      setModel(data.model || '')
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const risk = result ? RISK_FA[result.risk_level] ?? RISK_FA.medium : null

  return (
    <DashboardPage
      className="max-w-4xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-brand-purple" />
          تحلیلگر هوشمند
        </span>
      }
      description="تحلیل عملکرد دانش‌آموز کلاس با نمرات و گزارش رفتار واقعی"
      actions={
        <Link href="/teacher">
          <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      }
      animatedSections={false}
    >
      <GlassCard className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/70 text-sm mb-1 block">دانش‌آموز</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={isLoadingStudents}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
            >
              <option value="" className="bg-slate-800">
                {isLoadingStudents ? 'در حال بارگذاری...' : 'انتخاب کنید'}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">
                  {s.name} {s.className ? `— ${s.className}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white/70 text-sm mb-1 block">نوع تحلیل</label>
            <select
              value={analysisType}
              onChange={(e) =>
                setAnalysisType(e.target.value as (typeof TYPE_OPTIONS)[number]['value'])
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-800">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {students.length === 0 && !isLoadingStudents && (
          <p className="text-white/50 text-sm">کلاسی با دانش‌آموز برای این حساب ثبت نشده است.</p>
        )}
        <button
          type="button"
          onClick={() => void runAnalysis()}
          disabled={isAnalyzing || !studentId}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال تحلیل...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              شروع تحلیل
            </>
          )}
        </button>
      </GlassCard>

      {result && (
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-white">{studentName || 'نتیجه تحلیل'}</h2>
            {risk && (
              <span className={`text-xs px-3 py-1 rounded-full ${risk.className}`}>{risk.label}</span>
            )}
          </div>
          <p className="text-white/80 leading-relaxed">{result.analysis}</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <h3 className="text-green-400 text-sm mb-2 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                نقاط قوت
              </h3>
              <ul className="text-white/80 text-sm space-y-1">
                {result.strengths.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <h3 className="text-orange-400 text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                نقاط قابل بهبود
              </h3>
              <ul className="text-white/80 text-sm space-y-1">
                {result.weaknesses.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-blue-400 text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                پیشنهادها
              </h3>
              <ul className="text-white/80 text-sm space-y-1">
                {result.recommendations.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          {model && (
            <p className="text-white/40 text-xs flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              مدل: {model} — این تحلیل پیشنهاد است، نه تشخیص قطعی.
            </p>
          )}
        </GlassCard>
      )}
    </DashboardPage>
  )
}
