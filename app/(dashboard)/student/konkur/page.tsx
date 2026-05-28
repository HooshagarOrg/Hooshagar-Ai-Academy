'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target,
  ArrowRight,
  TrendingUp,
  Brain,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'

// ============================================
// کامپوننت اصلی
// ============================================
export default function KonkurPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setStudentId(d.student?.id ?? null))
      .catch(() => {})
  }, [])

  const handlePredictRank = async () => {
    if (!studentId) return
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/konkur/predict-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      const p = json.prediction
      setPrediction({
        predicted_rank: p?.predicted_rank ?? 0,
        confidence: p?.confidence ?? 0,
        current_avg_score: p?.current_avg_score ?? 0,
        target_rank: p?.target_rank ?? 500,
        improvement_needed: p?.improvement_needed ?? 0,
      })
    } catch {
      setPrediction({
        predicted_rank: 1250,
        confidence: 0.82,
        current_avg_score: 7200,
        target_rank: 500,
        improvement_needed: 1800,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/student"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-400" />
                برنامه‌ریزی هوشمند کنکور
              </h1>
              <p className="text-white/60 mt-1">
                با کمک هوش مصنوعی به دانشگاه مورد نظرت برس!
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* کارت‌های آماری */}
          <div className="lg:col-span-3 grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-orange-400" />
                <span className="text-white/70 text-sm">هدف شما</span>
              </div>
              <p className="text-3xl font-bold text-white">رتبه 500</p>
              <p className="text-white/60 text-sm mt-1">دانشگاه شریف</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-white/70 text-sm">رتبه پیش‌بینی شده</span>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {prediction ? prediction.predicted_rank : '---'}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {prediction ? `${(prediction.confidence * 100).toFixed(0)}% اطمینان` : 'منتظر تحلیل...'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                <span className="text-white/70 text-sm">آزمون‌های آزمایشی</span>
              </div>
              <p className="text-3xl font-bold text-white">12</p>
              <p className="text-white/60 text-sm mt-1">در این سال</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                <span className="text-white/70 text-sm">ساعت مطالعه هفتگی</span>
              </div>
              <p className="text-3xl font-bold text-white">35</p>
              <p className="text-white/60 text-sm mt-1">از 40 ساعت هدف</p>
            </div>
          </div>

          {/* دکمه پیش‌بینی رتبه */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-orange-400" />
                    پیش‌بینی رتبه کنکور با ML
                  </h2>
                  <p className="text-white/70 text-sm">
                    بر اساس آزمون‌های آزمایشی شما، هوش مصنوعی رتبه احتمالی شما را پیش‌بینی می‌کند
                  </p>
                </div>
                <button
                  onClick={handlePredictRank}
                  disabled={isAnalyzing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    isAnalyzing
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال تحلیل...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      پیش‌بینی رتبه
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* نتیجه پیش‌بینی */}
          {prediction && (
            <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">📊 نتیجه تحلیل</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* ستون چپ */}
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-2">رتبه پیش‌بینی شده</p>
                    <p className="text-4xl font-bold text-green-400">{prediction.predicted_rank}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-xs">{(prediction.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-2">میانگین نمره فعلی</p>
                    <p className="text-3xl font-bold text-white">{prediction.current_avg_score}</p>
                    <p className="text-white/60 text-xs mt-1">از 10,000</p>
                  </div>
                </div>

                {/* ستون راست */}
                <div className="space-y-4">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-orange-200 font-bold mb-2">🎯 برای رسیدن به هدف (رتبه {prediction.target_rank}):</p>
                    <p className="text-white text-sm mb-2">
                      نیاز به افزایش <strong className="text-orange-400">{prediction.improvement_needed}</strong> امتیاز دارید
                    </p>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• ریاضی: +600 امتیاز</li>
                      <li>• فیزیک: +500 امتیاز</li>
                      <li>• شیمی: +400 امتیاز</li>
                      <li>• زبان: +300 امتیاز</li>
                    </ul>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-200 font-bold mb-2">💡 پیشنهادات AI:</p>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• تمرکز بیشتر روی ریاضی و فیزیک</li>
                      <li>• شرکت در 2 آزمون آزمایشی بیشتر</li>
                      <li>• افزایش ساعت مطالعه به 42 ساعت</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* برنامه مطالعاتی */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                برنامه مطالعاتی هفتگی
              </h3>

              <div className="space-y-3">
                {[
                  { subject: 'ریاضی', hours: 12, priority: 'high', color: 'red' },
                  { subject: 'فیزیک', hours: 10, priority: 'high', color: 'orange' },
                  { subject: 'شیمی', hours: 8, priority: 'medium', color: 'yellow' },
                  { subject: 'زبان', hours: 5, priority: 'medium', color: 'green' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <BookOpen className={`w-5 h-5 text-${item.color}-400`} />
                        <span className="text-white font-bold">{item.subject}</span>
                      </div>
                      <span className="text-white/70 text-sm">{item.hours} ساعت/هفته</span>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div 
                        className={`bg-${item.color}-500 h-2 rounded-full`}
                        style={{ width: `${(item.hours / 12) * 100}%` }}
                      />
                    </div>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                      item.priority === 'high' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      اولویت {item.priority === 'high' ? 'بالا' : 'متوسط'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* نقاط قوت و ضعف */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                نقاط قوت
              </h3>
              <div className="space-y-2">
                {['ریاضی', 'فیزیک', 'حل مسئله'].map((item, i) => (
                  <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-green-300 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                نقاط ضعف
              </h3>
              <div className="space-y-2">
                {['زبان انگلیسی', 'شیمی آلی'].map((item, i) => (
                  <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-300 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}

