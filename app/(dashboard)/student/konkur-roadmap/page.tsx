'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Map,
  ArrowRight,
  GraduationCap,
  Building,
  Target,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  Download,
  Save,
  Share2,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Award,
  Brain,
  AlertCircle,
  Star,
  Loader2,
  Calculator,
  FlaskConical,
  Languages,
  Palette,
  FileText,
  Users,
  Zap,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
type FieldOfStudy = 'experimental' | 'mathematics' | 'humanities' | 'art'

interface FormData {
  field: FieldOfStudy | ''
  targetUniversity: string
  targetMajor: string
  monthsRemaining: string
  dailyHours: number
}

interface WeeklySlot {
  day: string
  slots: {
    time: string
    subject: string
    topic: string
    duration: string
    color: string
  }[]
}

interface MonthlyGoal {
  month: number
  goals: {
    subject: string
    topics: string[]
    color: string
  }[]
}

interface StudyPlan {
  totalDays: number
  totalHours: number
  prioritySubjects: { name: string; percentage: number; color: string }[]
  weeklySchedule: WeeklySlot[]
  monthlyGoals: MonthlyGoal[]
  advisorTips: string[]
  strengths: string[]
  weaknesses: string[]
}

// ============================================
// داده‌های نمونه
// ============================================
const fieldOptions = [
  { value: 'experimental', label: 'تجربی', icon: <FlaskConical className="w-5 h-5" />, color: 'from-green-500 to-emerald-600' },
  { value: 'mathematics', label: 'ریاضی', icon: <Calculator className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
  { value: 'humanities', label: 'انسانی', icon: <Languages className="w-5 h-5" />, color: 'from-purple-500 to-pink-600' },
  { value: 'art', label: 'هنر', icon: <Palette className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
]

const samplePlan: StudyPlan = {
  totalDays: 180,
  totalHours: 1080,
  prioritySubjects: [
    { name: 'زیست‌شناسی', percentage: 30, color: 'bg-green-500' },
    { name: 'شیمی', percentage: 25, color: 'bg-blue-500' },
    { name: 'فیزیک', percentage: 20, color: 'bg-purple-500' },
    { name: 'ریاضی', percentage: 15, color: 'bg-orange-500' },
    { name: 'عمومی', percentage: 10, color: 'bg-pink-500' },
  ],
  weeklySchedule: [
    {
      day: 'شنبه',
      slots: [
        { time: '۸-۱۰', subject: 'زیست', topic: 'ژنتیک', duration: '۲ ساعت', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
        { time: '۱۰-۱۲', subject: 'شیمی', topic: 'ترمودینامیک', duration: '۲ ساعت', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
        { time: '۱۴-۱۶', subject: 'فیزیک', topic: 'الکتریسیته', duration: '۲ ساعت', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
        { time: '۱۶-۱۷', subject: 'ادبیات', topic: 'قرابت معنایی', duration: '۱ ساعت', color: 'bg-pink-500/20 border-pink-500/50 text-pink-400' },
      ],
    },
    {
      day: 'یکشنبه',
      slots: [
        { time: '۸-۱۰', subject: 'ریاضی', topic: 'مشتق', duration: '۲ ساعت', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
        { time: '۱۰-۱۲', subject: 'زیست', topic: 'گیاهی', duration: '۲ ساعت', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
        { time: '۱۴-۱۶', subject: 'شیمی', topic: 'اسید و باز', duration: '۲ ساعت', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
        { time: '۱۶-۱۷', subject: 'عربی', topic: 'ترجمه', duration: '۱ ساعت', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' },
      ],
    },
    {
      day: 'دوشنبه',
      slots: [
        { time: '۸-۱۰', subject: 'فیزیک', topic: 'نوسان و موج', duration: '۲ ساعت', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
        { time: '۱۰-۱۲', subject: 'زیست', topic: 'جانوری', duration: '۲ ساعت', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
        { time: '۱۴-۱۶', subject: 'ریاضی', topic: 'انتگرال', duration: '۲ ساعت', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
        { time: '۱۶-۱۷', subject: 'زبان', topic: 'گرامر', duration: '۱ ساعت', color: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' },
      ],
    },
    {
      day: 'سه‌شنبه',
      slots: [
        { time: '۸-۱۰', subject: 'شیمی', topic: 'آلی', duration: '۲ ساعت', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
        { time: '۱۰-۱۲', subject: 'فیزیک', topic: 'اپتیک', duration: '۲ ساعت', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
        { time: '۱۴-۱۶', subject: 'زیست', topic: 'سلولی', duration: '۲ ساعت', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
        { time: '۱۶-۱۷', subject: 'دینی', topic: 'مرور', duration: '۱ ساعت', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
      ],
    },
    {
      day: 'چهارشنبه',
      slots: [
        { time: '۸-۱۰', subject: 'زیست', topic: 'انسانی', duration: '۲ ساعت', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
        { time: '۱۰-۱۲', subject: 'ریاضی', topic: 'احتمال', duration: '۲ ساعت', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
        { time: '۱۴-۱۶', subject: 'شیمی', topic: 'مرور', duration: '۲ ساعت', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
        { time: '۱۶-۱۷', subject: 'تست', topic: 'جمع‌بندی', duration: '۱ ساعت', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
      ],
    },
    {
      day: 'پنج‌شنبه',
      slots: [
        { time: '۸-۱۲', subject: 'آزمون', topic: 'آزمون جامع', duration: '۴ ساعت', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
        { time: '۱۴-۱۶', subject: 'مرور', topic: 'رفع اشکال', duration: '۲ ساعت', color: 'bg-gray-500/20 border-gray-500/50 text-gray-400' },
      ],
    },
    {
      day: 'جمعه',
      slots: [
        { time: '۱۰-۱۲', subject: 'مرور', topic: 'نکات طلایی', duration: '۲ ساعت', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' },
        { time: '۱۴-۱۵', subject: 'استراحت', topic: 'ورزش و تفریح', duration: '۱ ساعت', color: 'bg-teal-500/20 border-teal-500/50 text-teal-400' },
      ],
    },
  ],
  monthlyGoals: [
    {
      month: 1,
      goals: [
        { subject: 'زیست', topics: ['ژنتیک مندلی', 'ژنتیک مولکولی', 'میتوز و میوز'], color: 'bg-green-500' },
        { subject: 'شیمی', topics: ['ساختار اتم', 'جدول تناوبی', 'پیوندهای شیمیایی'], color: 'bg-blue-500' },
        { subject: 'فیزیک', topics: ['حرکت‌شناسی', 'دینامیک'], color: 'bg-purple-500' },
      ],
    },
    {
      month: 2,
      goals: [
        { subject: 'زیست', topics: ['گیاهی ۱', 'گیاهی ۲', 'فتوسنتز'], color: 'bg-green-500' },
        { subject: 'شیمی', topics: ['ترمودینامیک', 'سینتیک'], color: 'bg-blue-500' },
        { subject: 'ریاضی', topics: ['مشتق', 'کاربرد مشتق'], color: 'bg-orange-500' },
      ],
    },
    {
      month: 3,
      goals: [
        { subject: 'زیست', topics: ['جانوری ۱', 'دستگاه گوارش', 'دستگاه تنفس'], color: 'bg-green-500' },
        { subject: 'شیمی', topics: ['تعادل شیمیایی', 'اسید و باز'], color: 'bg-blue-500' },
        { subject: 'فیزیک', topics: ['کار و انرژی', 'تکانه'], color: 'bg-purple-500' },
      ],
    },
    {
      month: 4,
      goals: [
        { subject: 'زیست', topics: ['جانوری ۲', 'گردش خون', 'دفع'], color: 'bg-green-500' },
        { subject: 'شیمی', topics: ['الکتروشیمی', 'شیمی آلی ۱'], color: 'bg-blue-500' },
        { subject: 'ریاضی', topics: ['انتگرال', 'کاربرد انتگرال'], color: 'bg-orange-500' },
      ],
    },
    {
      month: 5,
      goals: [
        { subject: 'زیست', topics: ['عصبی', 'حواس', 'هورمون'], color: 'bg-green-500' },
        { subject: 'شیمی', topics: ['شیمی آلی ۲', 'مرور'], color: 'bg-blue-500' },
        { subject: 'فیزیک', topics: ['الکتریسیته', 'مغناطیس'], color: 'bg-purple-500' },
      ],
    },
    {
      month: 6,
      goals: [
        { subject: 'همه', topics: ['مرور کلی', 'آزمون‌های جامع', 'رفع اشکال نهایی'], color: 'bg-red-500' },
      ],
    },
  ],
  advisorTips: [
    '📚 هر روز حداقل ۳۰ تست از هر درس اختصاصی بزن',
    '⏰ ساعت طلایی مطالعه: ۶ تا ۱۰ صبح برای دروس سخت',
    '🎯 هفته‌ای یک آزمون جامع حتماً بده',
    '💤 خواب کافی (۷-۸ ساعت) را فراموش نکن',
    '🏃 روزانه ۳۰ دقیقه ورزش کن',
    '📝 خلاصه‌نویسی کن و هر هفته مرور کن',
    '🧘 قبل از آزمون تمرین تنفس عمیق انجام بده',
  ],
  strengths: [
    'برنامه‌ریزی منظم و هدفمند',
    'زمان کافی برای مرور',
    'تعادل بین دروس',
    'استراحت کافی در برنامه',
  ],
  weaknesses: [
    'نیاز به تمرین تست بیشتر',
    'دروس عمومی کمتر مورد توجه است',
    'شب‌ها برنامه سنگین نداشته باشید',
  ],
}

// ============================================
// کامپوننت Slider
// ============================================
interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  label: string
}

function Slider({ value, onChange, min, max, label }: SliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white font-bold text-lg">{value} ساعت</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="flex justify-between text-white/40 text-xs mt-1">
        <span>{min} ساعت</span>
        <span>{max} ساعت</span>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت کارت خلاصه
// ============================================
interface SummaryCardProps {
  plan: StudyPlan
  formData: FormData
}

function SummaryCard({ plan, formData }: SummaryCardProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-emerald-400" />
        خلاصه برنامه
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <Calendar className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-white text-2xl font-bold">{plan.totalDays}</p>
          <p className="text-white/60 text-sm">روز باقی‌مانده</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-white text-2xl font-bold">{plan.totalHours}</p>
          <p className="text-white/60 text-sm">ساعت مطالعه</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-white text-2xl font-bold">{formData.dailyHours}</p>
          <p className="text-white/60 text-sm">ساعت روزانه</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <Target className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <p className="text-white text-lg font-bold">{formData.targetMajor || 'پزشکی'}</p>
          <p className="text-white/60 text-sm">رشته هدف</p>
        </div>
      </div>

      {/* اولویت دروس */}
      <div>
        <p className="text-white/70 text-sm mb-3">اولویت دروس:</p>
        <div className="space-y-2">
          {plan.prioritySubjects.map((subject, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-white/70 text-sm w-20">{subject.name}</span>
              <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${subject.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${subject.percentage}%` }}
                />
              </div>
              <span className="text-white/70 text-sm w-12 text-left">{subject.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت برنامه هفتگی
// ============================================
interface WeeklyScheduleProps {
  schedule: WeeklySlot[]
}

function WeeklySchedule({ schedule }: WeeklyScheduleProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        برنامه هفتگی
      </h3>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {schedule.map((day, dayIndex) => (
            <div key={dayIndex} className="mb-4 last:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-lg font-bold text-sm w-24 text-center">
                  {day.day}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mr-6">
                {day.slots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className={`${slot.color} border rounded-xl p-3 transition-all hover:scale-105`}
                  >
                    <p className="font-bold text-sm mb-1">{slot.subject}</p>
                    <p className="text-xs opacity-80">{slot.topic}</p>
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{slot.time}</span>
                      <span>{slot.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اهداف ماهانه
// ============================================
interface MonthlyGoalsProps {
  goals: MonthlyGoal[]
}

function MonthlyGoals({ goals }: MonthlyGoalsProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-orange-400" />
        اهداف ماهانه
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((monthGoal) => (
          <div key={monthGoal.month} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {monthGoal.month}
              </span>
              <span className="text-white font-bold">ماه {monthGoal.month}</span>
            </div>
            <div className="space-y-2">
              {monthGoal.goals.map((goal, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${goal.color}`} />
                    <span className="text-white/80 text-sm font-medium">{goal.subject}</span>
                  </div>
                  <ul className="mr-4 space-y-1">
                    {goal.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="text-white/50 text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// کامپوننت نکات مشاور
// ============================================
interface AdvisorTipsProps {
  tips: string[]
  strengths: string[]
  weaknesses: string[]
}

function AdvisorTips({ tips, strengths, weaknesses }: AdvisorTipsProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        نکات مشاور هوشمند
      </h3>

      <div className="grid md:grid-cols-3 gap-6">
        {/* توصیه‌ها */}
        <div>
          <h4 className="text-white/80 font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            توصیه‌های طلایی
          </h4>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="text-white/60 text-sm leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* نقاط قوت */}
        <div>
          <h4 className="text-white/80 font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            نقاط قوت برنامه
          </h4>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="text-green-400/80 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* نقاط ضعف */}
        <div>
          <h4 className="text-white/80 font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            نکات هشدار
          </h4>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li key={index} className="text-orange-400/80 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function KonkurRoadmapPage() {
  const [formData, setFormData] = useState<FormData>({
    field: '',
    targetUniversity: '',
    targetMajor: '',
    monthsRemaining: '',
    dailyHours: 6,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const [saved, setSaved] = useState(false)

  // تولید برنامه
  const handleGenerate = async (): Promise<void> => {
    if (!formData.field) {
      alert('لطفاً رشته تحصیلی را انتخاب کنید')
      return
    }

    setIsGenerating(true)

    // شبیه‌سازی تولید برنامه
    await new Promise(resolve => setTimeout(resolve, 2500))

    setIsGenerating(false)
    setShowPlan(true)
  }

  // دانلود PDF
  const handleDownload = (): void => {
    alert('در نسخه نهایی، برنامه به صورت PDF دانلود خواهد شد.')
  }

  // ذخیره
  const handleSave = (): void => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // اشتراک‌گذاری
  const handleShare = (): void => {
    alert('برنامه با معلم شما به اشتراک گذاشته شد!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/student"
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <Map className="w-8 h-8 text-emerald-400" />
                  نقشه راه کنکور
                </h1>
                <p className="text-white/60 mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  برنامه‌ریزی حرفه‌ای برای موفقیت
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/30 text-emerald-200 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                مشاور هوشمند AI
              </span>
            </div>
          </div>
        </header>

        {/* ==================== فرم اطلاعات ==================== */}
        {!showPlan && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              اطلاعات اولیه
            </h2>

            {/* انتخاب رشته */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-3">
                رشته تحصیلی
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fieldOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, field: option.value as FieldOfStudy })}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                      ${formData.field === option.value
                        ? `bg-gradient-to-br ${option.color} border-white/50 shadow-lg`
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                      }`}
                  >
                    {option.icon}
                    <span className="text-white font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* سایر فیلدها */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  دانشگاه هدف
                </label>
                <input
                  type="text"
                  value={formData.targetUniversity}
                  onChange={(e) => setFormData({ ...formData, targetUniversity: e.target.value })}
                  placeholder="مثال: تهران، شریف، علوم پزشکی تهران"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  رشته هدف
                </label>
                <input
                  type="text"
                  value={formData.targetMajor}
                  onChange={(e) => setFormData({ ...formData, targetMajor: e.target.value })}
                  placeholder="مثال: پزشکی، مهندسی کامپیوتر، حقوق"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  زمان باقی‌مانده تا کنکور (ماه)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.monthsRemaining}
                  onChange={(e) => setFormData({ ...formData, monthsRemaining: e.target.value })}
                  placeholder="مثال: ۶"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <Slider
                  value={formData.dailyHours}
                  onChange={(value) => setFormData({ ...formData, dailyHours: value })}
                  min={1}
                  max={12}
                  label="ساعت مطالعه روزانه"
                />
              </div>
            </div>

            {/* دکمه ساخت برنامه */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all
                ${isGenerating
                  ? 'bg-white/20 text-white/70 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  در حال ساخت برنامه اختصاصی...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  ساخت برنامه
                </>
              )}
            </button>
          </div>
        )}

        {/* ==================== نمایش برنامه ==================== */}
        {showPlan && (
          <div className="space-y-6">
            {/* دکمه‌های عملیاتی */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPlan(false)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                ویرایش اطلاعات
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود PDF
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                  ${saved
                    ? 'bg-green-500 text-white'
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  }`}
              >
                {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'ذخیره شد!' : 'ذخیره برنامه'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-xl transition-all"
              >
                <Share2 className="w-4 h-4" />
                اشتراک با معلم
              </button>
            </div>

            {/* خلاصه برنامه */}
            <SummaryCard plan={samplePlan} formData={formData} />

            {/* برنامه هفتگی */}
            <WeeklySchedule schedule={samplePlan.weeklySchedule} />

            {/* اهداف ماهانه */}
            <MonthlyGoals goals={samplePlan.monthlyGoals} />

            {/* نکات مشاور */}
            <AdvisorTips
              tips={samplePlan.advisorTips}
              strengths={samplePlan.strengths}
              weaknesses={samplePlan.weaknesses}
            />

            {/* پیام انگیزشی */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30 text-center">
              <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                🌟 موفقیت در انتظار توست!
              </h3>
              <p className="text-white/70 max-w-2xl mx-auto">
                با پیگیری این برنامه و تلاش مداوم، حتماً به هدفت می‌رسی.
                یادت باشه که مهم‌ترین چیز استمرار و پشتکار است. موفق باشی! 💪
              </p>
            </div>
          </div>
        )}

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}




