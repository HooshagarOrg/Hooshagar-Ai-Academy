'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Brain,
  TrendingUp,
  CheckCircle,
  Loader2,
  Sparkles,
  Target,
  Award,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Field {
  id: string
  name_fa: string
  name_en: string
  category: string
  branch: string
  description: string
}

const fields: Field[] = [
  { id: '1', name_fa: 'ریاضی و فیزیک', name_en: 'Math & Physics', category: 'theoretical', branch: 'math_physics', description: 'برای علاقه‌مندان به ریاضی، فیزیک و مهندسی' },
  { id: '2', name_fa: 'علوم تجربی', name_en: 'Experimental Sciences', category: 'theoretical', branch: 'experimental', description: 'برای علاقه‌مندان به پزشکی، زیست‌شناسی و شیمی' },
  { id: '3', name_fa: 'علوم انسانی', name_en: 'Humanities', category: 'theoretical', branch: 'humanities', description: 'برای علاقه‌مندان به ادبیات، تاریخ و علوم اجتماعی' },
  { id: '4', name_fa: 'هنر', name_en: 'Art', category: 'theoretical', branch: 'art', description: 'برای علاقه‌مندان به هنرهای تجسمی و هنرهای کاربردی' },
]

// ============================================
// کامپوننت اصلی
// ============================================
export default function FieldSelectionPage() {
  const [choices, setChoices] = useState({
    first: '',
    second: '',
    third: '',
  })
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true)
    // TODO: فراخوانی API واقعی
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setAiRecommendation({
      recommended_field: 'math_physics',
      confidence: 0.85,
      reasons: [
        'میانگین ریاضی در 3 سال: 18.5',
        'میانگین فیزیک در 3 سال: 17.8',
        'توانایی حل مسئله بالا',
        'علاقه به علوم پایه',
      ],
      strengths: [
        { subject: 'ریاضی', score: 18.5 },
        { subject: 'فیزیک', score: 17.8 },
        { subject: 'شیمی', score: 17.2 },
      ],
      weaknesses: [
        { subject: 'زبان انگلیسی', score: 15.5 },
      ],
      suitable_universities: [
        'دانشگاه شریف',
        'دانشگاه تهران',
        'دانشگاه صنعتی امیرکبیر',
      ],
      career_paths: [
        'مهندسی کامپیوتر',
        'مهندسی برق',
        'مهندسی مکانیک',
      ],
    })
    
    setIsAnalyzing(false)
  }

  const handleSubmit = async () => {
    if (!choices.first || !choices.second || !choices.third) {
      alert('لطفاً هر 3 اولویت را انتخاب کنید')
      return
    }
    
    // TODO: ارسال به API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4 md:p-6 lg:p-8" dir="rtl">
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
                <GraduationCap className="w-8 h-8 text-blue-400" />
                انتخاب رشته تحصیلی
              </h1>
              <p className="text-white/60 mt-1">
                با کمک هوش مصنوعی بهترین رشته را انتخاب کنید
              </p>
            </div>
          </div>
        </header>

        {!isSubmitted ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* ستون چپ: تحلیل AI */}
            <div className="space-y-6">
              {/* دکمه تحلیل AI */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  تحلیل هوشمند با AI
                </h2>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  بر اساس عملکرد شما در 3 سال متوسطه اول (پایه 7، 8 و 9)، هوش مصنوعی بهترین رشته را پیشنهاد می‌دهد.
                </p>
                <button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                    isAnalyzing
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
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
                      دریافت پیشنهاد هوشمند
                    </>
                  )}
                </button>
              </div>

              {/* نتیجه تحلیل AI */}
              {aiRecommendation && (
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-purple-400" />
                    پیشنهاد هوش مصنوعی
                  </h3>

                  {/* رشته پیشنهادی */}
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold text-lg">
                        {fields.find(f => f.branch === aiRecommendation.recommended_field)?.name_fa}
                      </span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold">
                        {(aiRecommendation.confidence * 100).toFixed(0)}% اطمینان
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {fields.find(f => f.branch === aiRecommendation.recommended_field)?.description}
                    </p>
                  </div>

                  {/* دلایل */}
                  <div className="mb-4">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      دلایل این پیشنهاد:
                    </h4>
                    <ul className="space-y-2">
                      {aiRecommendation.reasons.map((reason: string, i: number) => (
                        <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* نقاط قوت */}
                  <div className="mb-4">
                    <h4 className="text-white font-bold mb-2">📊 نقاط قوت شما:</h4>
                    <div className="space-y-2">
                      {aiRecommendation.strengths.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                          <span className="text-white/80 text-sm">{s.subject}</span>
                          <span className="text-green-400 font-bold">{s.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* دانشگاه‌های مناسب */}
                  <div>
                    <h4 className="text-white font-bold mb-2">🎓 دانشگاه‌های پیشنهادی:</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiRecommendation.suitable_universities.map((uni: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                          {uni}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ستون راست: انتخاب رشته */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  انتخاب‌های شما
                </h2>

                {/* اولویت 1 */}
                <div className="mb-4">
                  <label className="text-white/70 text-sm mb-2 block font-bold">
                    اولویت اول *
                  </label>
                  <select
                    value={choices.first}
                    onChange={(e) => setChoices({ ...choices, first: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="" className="bg-slate-800">انتخاب کنید...</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id} className="bg-slate-800">
                        {field.name_fa}
                      </option>
                    ))}
                  </select>
                  {choices.first && (
                    <p className="text-white/60 text-xs mt-2">
                      {fields.find(f => f.id === choices.first)?.description}
                    </p>
                  )}
                </div>

                {/* اولویت 2 */}
                <div className="mb-4">
                  <label className="text-white/70 text-sm mb-2 block font-bold">
                    اولویت دوم *
                  </label>
                  <select
                    value={choices.second}
                    onChange={(e) => setChoices({ ...choices, second: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="" className="bg-slate-800">انتخاب کنید...</option>
                    {fields.filter(f => f.id !== choices.first).map(field => (
                      <option key={field.id} value={field.id} className="bg-slate-800">
                        {field.name_fa}
                      </option>
                    ))}
                  </select>
                </div>

                {/* اولویت 3 */}
                <div className="mb-6">
                  <label className="text-white/70 text-sm mb-2 block font-bold">
                    اولویت سوم *
                  </label>
                  <select
                    value={choices.third}
                    onChange={(e) => setChoices({ ...choices, third: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="" className="bg-slate-800">انتخاب کنید...</option>
                    {fields.filter(f => f.id !== choices.first && f.id !== choices.second).map(field => (
                      <option key={field.id} value={field.id} className="bg-slate-800">
                        {field.name_fa}
                      </option>
                    ))}
                  </select>
                </div>

                {/* توضیحات */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <p className="text-blue-200 text-sm leading-relaxed">
                    ⚠️ <strong>توجه:</strong> پس از ثبت، انتخاب شما توسط مشاور مدرسه بررسی می‌شود. 
                    والدین نیز باید انتخاب شما را تأیید کنند.
                  </p>
                </div>

                {/* دکمه ثبت */}
                <button
                  onClick={handleSubmit}
                  disabled={!choices.first || !choices.second || !choices.third}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                    !choices.first || !choices.second || !choices.third
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  ثبت نهایی انتخاب رشته
                </button>
              </div>
            </div>
          </div>
        ) : (
          // صفحه تأیید
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
              <Award className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              انتخاب شما با موفقیت ثبت شد!
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed max-w-2xl mx-auto">
              انتخاب‌های شما در سیستم ثبت شد و به مشاور مدرسه ارسال شد. 
              همچنین والدین شما باید انتخاب را تأیید کنند.
              پس از تأیید نهایی، در پایه دهم در رشته انتخابی خود ادامه تحصیل خواهید داد.
            </p>
            <Link
              href="/student"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
            >
              بازگشت به پنل دانش‌آموز
            </Link>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}

