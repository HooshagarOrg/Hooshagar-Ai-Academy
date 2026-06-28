'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  ArrowRight,
  User,
  Heart,
  Sparkles,
  GraduationCap,
  Briefcase,
  Wrench,
  Download,
  CheckCircle2,
  Loader2,
  FlaskConical,
  Calculator,
  Palette,
  Dumbbell,
  Music,
  BookOpen,
  Monitor,
  HandHeart,
  Star,
  TrendingUp,
  Award,
  Target,
  Lightbulb,
  Rocket,
  Brain,
  Code,
  Stethoscope,
  Building,
  Brush,
  Globe,
  Lock,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'
import {
  type UserRole,
  type AnalysisAccessLevel,
  getAnalysisAccessLevel,
  canViewFullAnalysis,
  canViewLimitedAnalysis,
  cannotViewAnalysis,
  ACCESS_DENIED_MESSAGES,
  SENSITIVE_FIELDS_FOR_STUDENT,
} from '@/lib/privacy'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'

// ============================================
// تایپ‌ها
// ============================================
interface Interest {
  id: string
  label: string
  icon: React.ReactNode
  checked: boolean
}

interface SuggestedMajor {
  id: string
  name: string
  description: string
  matchPercent: number
  icon: React.ReactNode
}

interface SuggestedJob {
  id: string
  name: string
  reason: string
  icon: React.ReactNode
  salary: string
}

interface Skill {
  id: string
  name: string
  priority: 'high' | 'medium' | 'low'
}

interface StudentProfile {
  name: string
  grade: string
  className: string
  avatar: string
  strengths: { label: string; value: number }[]
}

// ============================================
// داده‌های نمونه
// ============================================
const studentProfile: StudentProfile = {
  name: 'علی محمدی',
  grade: 'ششم',
  className: 'پنجم الف',
  avatar: 'ع',
  strengths: [
    { label: 'ریاضی', value: 85 },
    { label: 'علوم', value: 78 },
    { label: 'فارسی', value: 70 },
    { label: 'هنر', value: 65 },
    { label: 'ورزش', value: 80 },
  ],
}

const initialInterests: Interest[] = [
  { id: 'science', label: 'علوم و تجربی', icon: <FlaskConical className="w-5 h-5" />, checked: false },
  { id: 'math', label: 'ریاضی و محاسبات', icon: <Calculator className="w-5 h-5" />, checked: false },
  { id: 'art', label: 'هنر و خلاقیت', icon: <Palette className="w-5 h-5" />, checked: false },
  { id: 'sports', label: 'ورزش و حرکت', icon: <Dumbbell className="w-5 h-5" />, checked: false },
  { id: 'music', label: 'موسیقی', icon: <Music className="w-5 h-5" />, checked: false },
  { id: 'literature', label: 'ادبیات و نوشتن', icon: <BookOpen className="w-5 h-5" />, checked: false },
  { id: 'tech', label: 'فناوری و کامپیوتر', icon: <Monitor className="w-5 h-5" />, checked: false },
  { id: 'helping', label: 'کمک به مردم', icon: <HandHeart className="w-5 h-5" />, checked: false },
]

const sampleMajors: SuggestedMajor[] = [
  {
    id: '1',
    name: 'مهندسی کامپیوتر',
    description: 'طراحی نرم‌افزار، هوش مصنوعی، برنامه‌نویسی و توسعه سیستم‌های کامپیوتری',
    matchPercent: 92,
    icon: <Code className="w-6 h-6" />,
  },
  {
    id: '2',
    name: 'پزشکی',
    description: 'تشخیص و درمان بیماری‌ها، کمک به سلامت مردم و نجات جان انسان‌ها',
    matchPercent: 85,
    icon: <Stethoscope className="w-6 h-6" />,
  },
  {
    id: '3',
    name: 'معماری',
    description: 'طراحی ساختمان‌ها و فضاهای زیبا، ترکیب هنر با مهندسی',
    matchPercent: 78,
    icon: <Building className="w-6 h-6" />,
  },
  {
    id: '4',
    name: 'طراحی گرافیک',
    description: 'خلق آثار بصری، طراحی لوگو، پوستر و محتوای دیجیتال',
    matchPercent: 72,
    icon: <Brush className="w-6 h-6" />,
  },
]

const sampleJobs: SuggestedJob[] = [
  {
    id: '1',
    name: 'برنامه‌نویس و توسعه‌دهنده',
    reason: 'علاقه شما به فناوری و توانایی در حل مسئله',
    icon: <Code className="w-6 h-6" />,
    salary: 'بالا',
  },
  {
    id: '2',
    name: 'پزشک متخصص',
    reason: 'علاقه به کمک به مردم و نمرات خوب در علوم',
    icon: <Stethoscope className="w-6 h-6" />,
    salary: 'عالی',
  },
  {
    id: '3',
    name: 'معمار',
    reason: 'خلاقیت هنری و توانایی در ریاضی',
    icon: <Building className="w-6 h-6" />,
    salary: 'بالا',
  },
  {
    id: '4',
    name: 'محقق و دانشمند',
    reason: 'کنجکاوی علمی و علاقه به کشف چیزهای جدید',
    icon: <FlaskConical className="w-6 h-6" />,
    salary: 'متوسط تا بالا',
  },
  {
    id: '5',
    name: 'طراح UX/UI',
    reason: 'ترکیب هنر و فناوری، خلاقیت در طراحی',
    icon: <Palette className="w-6 h-6" />,
    salary: 'بالا',
  },
]

const sampleSkills: Skill[] = [
  { id: '1', name: 'برنامه‌نویسی پایتون', priority: 'high' },
  { id: '2', name: 'تفکر منطقی و حل مسئله', priority: 'high' },
  { id: '3', name: 'زبان انگلیسی', priority: 'high' },
  { id: '4', name: 'کار تیمی', priority: 'medium' },
  { id: '5', name: 'مدیریت زمان', priority: 'medium' },
  { id: '6', name: 'خلاقیت و نوآوری', priority: 'medium' },
  { id: '7', name: 'ارتباطات مؤثر', priority: 'low' },
  { id: '8', name: 'آشنایی با ریاضیات پیشرفته', priority: 'low' },
]

// ============================================
// کامپوننت نوار پیشرفت
// ============================================
interface ProgressBarProps {
  label: string
  value: number
  color: string
}

function ProgressBar({ label, value, color }: ProgressBarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white font-bold text-sm">{value}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Checkbox علاقه‌مندی
// ============================================
interface InterestCheckboxProps {
  interest: Interest
  onChange: (id: string) => void
}

function InterestCheckbox({ interest, onChange }: InterestCheckboxProps) {
  return (
    <div
      onClick={() => onChange(interest.id)}
      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2
        ${interest.checked
          ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30'
        }`}
    >
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
          ${interest.checked
            ? 'bg-purple-500 border-purple-500'
            : 'bg-white/10 border-white/30'
          }`}
      >
        {interest.checked && <CheckCircle2 className="w-4 h-4 text-white" />}
      </div>
      <div className={`${interest.checked ? 'text-purple-400' : 'text-white/50'}`}>
        {interest.icon}
      </div>
      <span className={`font-medium ${interest.checked ? 'text-white' : 'text-white/70'}`}>
        {interest.label}
      </span>
    </div>
  )
}

// ============================================
// کامپوننت کارت رشته پیشنهادی
// ============================================
interface MajorCardProps {
  major: SuggestedMajor
  rank: number
}

function MajorCard({ major, rank }: MajorCardProps) {
  const getRankColor = (r: number): string => {
    switch (r) {
      case 1: return 'from-yellow-500 to-orange-500'
      case 2: return 'from-gray-400 to-gray-500'
      case 3: return 'from-amber-600 to-amber-700'
      default: return 'from-purple-500 to-blue-500'
    }
  }

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all group">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${getRankColor(rank)} text-white shadow-lg`}>
          {major.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-bold text-lg">{major.name}</h3>
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
              {major.matchPercent}% تطابق
            </span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">{major.description}</p>
        </div>
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-white font-bold shadow-lg`}>
          {rank}
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت کارت شغل پیشنهادی
// ============================================
interface JobCardProps {
  job: SuggestedJob
}

function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
          {job.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1">{job.name}</h3>
          <p className="text-white/60 text-sm mb-2">{job.reason}</p>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">درآمد:</span>
            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">
              {job.salary}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Privacy Notice
// ============================================
interface PrivacyNoticeProps {
  accessLevel: AnalysisAccessLevel
  userRole: UserRole
}

function PrivacyNotice({ accessLevel, userRole }: PrivacyNoticeProps) {
  if (accessLevel === 'full') return null

  return (
    <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
      accessLevel === 'none'
        ? 'bg-red-500/20 border border-red-500/30'
        : 'bg-yellow-500/20 border border-yellow-500/30'
    }`}>
      <div className={`p-2 rounded-lg ${
        accessLevel === 'none' ? 'bg-red-500/30' : 'bg-yellow-500/30'
      }`}>
        {accessLevel === 'none' ? (
          <EyeOff className="w-5 h-5 text-red-400" />
        ) : (
          <Shield className="w-5 h-5 text-yellow-400" />
        )}
      </div>
      <div>
        <h4 className={`font-bold mb-1 ${
          accessLevel === 'none' ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {accessLevel === 'none' ? 'دسترسی محدود' : 'نمایش محدود'}
        </h4>
        <p className="text-white/70 text-sm">
          {ACCESS_DENIED_MESSAGES[accessLevel]}
        </p>
        {accessLevel === 'none' && userRole === 'student' && (
          <p className="text-white/50 text-xs mt-2">
            💡 نتایج کامل تحلیل فقط برای معلم و مشاور قابل مشاهده است.
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Restricted Content
// ============================================
interface RestrictedContentProps {
  children: React.ReactNode
  accessLevel: AnalysisAccessLevel
  requiredLevel: 'full' | 'limited'
  fallbackMessage?: string
}

function RestrictedContent({ 
  children, 
  accessLevel, 
  requiredLevel,
  fallbackMessage 
}: RestrictedContentProps) {
  const hasAccess = requiredLevel === 'limited' 
    ? accessLevel !== 'none'
    : accessLevel === 'full'

  if (!hasAccess) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <Lock className="w-10 h-10 text-white/30 mx-auto mb-3" />
        <p className="text-white/50 text-sm">
          {fallbackMessage || 'این محتوا برای نقش شما قابل مشاهده نیست'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function FutureCompassPage() {
  // State ها
  const [interests, setInterests] = useState<Interest[]>(initialInterests)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState('')
  const [savedInterests, setSavedInterests] = useState(false)

  // ============================================
  // Privacy Check - نقش کاربر
  // در نسخه واقعی از session/context می‌آید
  // ============================================
  const [userRole] = useState<UserRole>('student') // تغییر دهید برای تست
  const accessLevel = getAnalysisAccessLevel(userRole)
  
  // بررسی دسترسی
  const canViewFull = canViewFullAnalysis(userRole)
  const canViewLimited = canViewLimitedAnalysis(userRole)
  const cannotView = cannotViewAnalysis(userRole)

  // تغییر علاقه‌مندی
  const handleInterestChange = (id: string): void => {
    setInterests(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
    setSavedInterests(false)
  }

  // ذخیره علایق
  const handleSaveInterests = (): void => {
    setSavedInterests(true)
    setTimeout(() => setSavedInterests(false), 2000)
  }

  // تحلیل هوشمند
  const handleAnalyze = async (): Promise<void> => {
    setIsAnalyzing(true)
    setShowResults(false)

    const steps = [
      'در حال بررسی نمرات...',
      'در حال تحلیل رفتار و فعالیت‌ها...',
      'در حال بررسی علایق...',
      'در حال تولید پیشنهادات...',
      'در حال نهایی‌سازی گزارش...',
    ]

    for (const step of steps) {
      setAnalyzeStep(step)
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    setIsAnalyzing(false)
    setShowResults(true)
  }

  // دانلود PDF
  const handleDownload = (): void => {
    alert('در نسخه نهایی، گزارش PDF دانلود خواهد شد.')
  }

  // رنگ‌های نوار پیشرفت
  const progressColors = [
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'bg-gradient-to-r from-blue-500 to-cyan-500',
    'bg-gradient-to-r from-green-500 to-emerald-500',
    'bg-gradient-to-r from-yellow-500 to-orange-500',
    'bg-gradient-to-r from-red-500 to-rose-500',
  ]

  // تعداد علایق انتخاب شده
  const selectedInterestsCount = interests.filter(i => i.checked).length

  return (
    <DashboardPage
      className="max-w-5xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Compass className="w-8 h-8 text-brand-yellow animate-pulse" />
          قطب‌نمای آینده
        </span>
      }
      description="کشف استعدادها و انتخاب مسیر شغلی و تحصیلی"
      actions={
        <div className="flex items-center gap-2">
          <span className="bg-brand-purple/20 text-brand-purple px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            تحلیل هوشمند AI
          </span>
          <Link href="/student">
            <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      }
      animatedSections={false}
    >
      <LuxStagger className="space-y-6" stagger={0.1}>
        <LuxStaggerItem>
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              درباره من
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {studentProfile.avatar}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{studentProfile.name}</h3>
                <p className="text-white/60">پایه {studentProfile.grade} - {studentProfile.className}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80 font-medium">علایق ثبت شده</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.filter(i => i.checked).length > 0 ? (
                  interests.filter(i => i.checked).map(interest => (
                    <span
                      key={interest.id}
                      className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {interest.icon}
                      {interest.label}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 text-sm">هنوز علاقه‌ای انتخاب نشده</span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              نقاط قوت من
            </h2>
            <p className="text-white/60 text-sm mb-4">بر اساس نمرات و تحلیل AI</p>

            <div>
              {studentProfile.strengths.map((strength, index) => (
                <ProgressBar
                  key={strength.label}
                  label={strength.label}
                  value={strength.value}
                  color={progressColors[index % progressColors.length]}
                />
              ))}
            </div>
          </GlassCard>
        </div>
        </LuxStaggerItem>

        <LuxStaggerItem>
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              علایق من
            </h2>
            <span className="bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-sm font-bold">
              {selectedInterestsCount} مورد انتخاب شده
            </span>
          </div>
          <p className="text-white/60 text-sm mb-4">
            به چه چیزهایی علاقه‌مند هستی؟ انتخاب کن تا بهتر بشناسیمت!
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {interests.map((interest) => (
              <InterestCheckbox
                key={interest.id}
                interest={interest}
                onChange={handleInterestChange}
              />
            ))}
          </div>

          <button
            onClick={handleSaveInterests}
            disabled={selectedInterestsCount === 0}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${savedInterests
                ? 'bg-green-500 text-white'
                : selectedInterestsCount > 0
                  ? 'bg-pink-500 hover:bg-pink-600 text-white'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
          >
            {savedInterests ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ذخیره شد!
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                ذخیره علایق
              </>
            )}
          </button>
        </GlassCard>
        </LuxStaggerItem>

        <LuxStaggerItem>
        <div className="mb-6">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg
              ${isAnalyzing
                ? 'bg-white/20 text-white/70 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/30 hover:shadow-purple-500/50'
              }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {analyzeStep}
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                تحلیل هوشمند و پیشنهاد مسیر
                <Rocket className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        </LuxStaggerItem>

        {showResults && (
          <LuxStaggerItem>
          <div className="space-y-6">
            {/* Privacy Notice */}
            <PrivacyNotice accessLevel={accessLevel} userRole={userRole} />

            {/* نمایش سطح دسترسی فعلی (فقط برای معلم/ادمین) */}
            {canViewFull && (
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30 flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-blue-400 font-medium">حالت مشاهده کامل</span>
                  <span className="text-white/50 text-sm mr-2">
                    (نقش: {userRole === 'teacher' ? 'معلم' : userRole === 'counselor' ? 'مشاور' : 'مدیر'})
                  </span>
                </div>
              </div>
            )}

            {/* رشته‌های پیشنهادی - همه می‌بینند */}
            <GlassCard className="p-6 border-brand-purple/30 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">رشته‌های تحصیلی پیشنهادی</h2>
                  <p className="text-white/60 text-sm">بر اساس استعدادها و علایق تو</p>
                </div>
              </div>

              <div className="grid gap-4">
                {sampleMajors.map((major, index) => (
                  <MajorCard key={major.id} major={major} rank={index + 1} />
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-brand-cyan/30 bg-gradient-to-bl from-brand-cyan/15 via-card/90 to-blue-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">مشاغل آینده پیشنهادی</h2>
                  <p className="text-white/60 text-sm">شغل‌هایی که برای تو مناسب هستند</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {sampleJobs.map((job) => (
                  <div key={job.id} className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                        {job.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{job.name}</h3>
                        <p className="text-white/60 text-sm mb-2">{job.reason}</p>
                        {/* حقوق فقط برای معلم/مشاور/مدیر نمایش داده می‌شود */}
                        {!cannotView && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-xs">درآمد:</span>
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">
                              {job.salary}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-green-500/30 bg-gradient-to-bl from-green-500/15 via-card/90 to-emerald-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">مهارت‌هایی که باید یاد بگیری</h2>
                  <p className="text-white/60 text-sm">برای رسیدن به اهدافت این مهارت‌ها رو تقویت کن</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sampleSkills.map((skill) => {
                  const priorityStyles = {
                    high: 'bg-red-500/20 border-red-500/30 text-red-400',
                    medium: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
                    low: 'bg-green-500/20 border-green-500/30 text-green-400',
                  }
                  const priorityLabels = {
                    high: 'اولویت بالا',
                    medium: 'اولویت متوسط',
                    low: 'اولویت کم',
                  }

                  return (
                    <div
                      key={skill.id}
                      className={`p-4 rounded-xl border ${priorityStyles[skill.priority]} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="text-white font-medium">{skill.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${priorityStyles[skill.priority]}`}>
                        {priorityLabels[skill.priority]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </GlassCard>

            {/* ==================== بخش محرمانه - فقط معلم/مشاور ==================== */}
            <RestrictedContent
              accessLevel={accessLevel}
              requiredLevel="full"
              fallbackMessage="تحلیل تفصیلی فقط برای معلم و مشاور قابل مشاهده است"
            >
              <GlassCard className="p-6 border-red-500/30 bg-gradient-to-bl from-red-500/15 via-card/90 to-orange-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      تحلیل تفصیلی (محرمانه)
                      <Lock className="w-4 h-4 text-red-400" />
                    </h2>
                    <p className="text-white/60 text-sm">فقط قابل مشاهده برای معلم و مشاور</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* پروفایل روان‌شناختی */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      پروفایل روان‌شناختی
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      دانش‌آموز دارای هوش منطقی-ریاضی بالا و گرایش به تفکر تحلیلی است. 
                      از نظر اجتماعی درون‌گرا با تمایل به کار فردی. نیاز به تشویق بیشتر در فعالیت‌های گروهی.
                    </p>
                  </div>

                  {/* عوامل خطر */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      عوامل نیازمند توجه
                    </h3>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• کمبود اعتماد به نفس در ارائه‌های کلاسی</li>
                      <li>• نیاز به تقویت مهارت‌های ارتباطی</li>
                      <li>• گاهی استرس در موقعیت‌های رقابتی</li>
                    </ul>
                  </div>

                  {/* پیشنهادات مداخله */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-green-400" />
                      پیشنهادات مداخله
                    </h3>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• تشویق به شرکت در فعالیت‌های گروهی کوچک</li>
                      <li>• ارائه فرصت‌های رهبری در پروژه‌های کلاسی</li>
                      <li>• جلسه با مشاور برای تقویت اعتماد به نفس</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </RestrictedContent>

            <GlassCard className="p-6 border-yellow-500/30 bg-gradient-to-bl from-yellow-500/15 via-card/90 to-orange-500/10 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg">
                  <Award className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                🌟 تو می‌تونی به هر هدفی برسی!
              </h3>
              <p className="text-white/70 leading-relaxed max-w-2xl mx-auto">
                این فقط یک پیشنهاد است. آینده در دستان توست و هر مسیری که انتخاب کنی، 
                با تلاش و پشتکار می‌تونی به بهترین‌ها برسی. به خودت ایمان داشته باش! 🚀
              </p>
            </GlassCard>

            {/* دکمه دانلود - فقط برای معلم/مشاور/مدیر */}
            {canViewFull && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-medium transition-all border border-white/20"
              >
                <Download className="w-5 h-5" />
                دانلود گزارش کامل (PDF)
              </button>
            )}
          </div>
          </LuxStaggerItem>
        )}

        <LuxStaggerItem>
        <footer className="text-center text-muted-foreground text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
        </LuxStaggerItem>
      </LuxStagger>
    </DashboardPage>
  )
}

