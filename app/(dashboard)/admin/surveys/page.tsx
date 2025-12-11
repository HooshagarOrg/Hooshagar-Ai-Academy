'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  ArrowRight,
  Users,
  Star,
  Clock,
  TrendingUp,
  Filter,
  Download,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MessageSquare,
  GraduationCap,
  Building,
  RefreshCw,
  ChevronDown,
  User,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
type SentimentType = 'positive' | 'negative' | 'neutral'

interface TeacherSurveyResult {
  id: string
  name: string
  subject: string
  teachingQuality: number
  studentRelation: number
  responsiveness: number
  homeworkBalance: number
  classroomOrder: number
  average: number
  responseCount: number
}

interface FacilitySurveyResult {
  category: string
  score: number
  maxScore: number
}

interface ParentComment {
  id: string
  parentName: string
  studentName: string
  comment: string
  date: string
  sentiment: SentimentType
}

// ============================================
// داده‌های نمونه
// ============================================
const teacherResults: TeacherSurveyResult[] = [
  { id: '1', name: 'آقای احمدی', subject: 'ریاضی', teachingQuality: 4.5, studentRelation: 4.8, responsiveness: 4.6, homeworkBalance: 4.2, classroomOrder: 4.7, average: 4.56, responseCount: 18 },
  { id: '2', name: 'خانم رضایی', subject: 'فارسی', teachingQuality: 4.8, studentRelation: 4.9, responsiveness: 4.7, homeworkBalance: 4.5, classroomOrder: 4.6, average: 4.70, responseCount: 22 },
  { id: '3', name: 'آقای محمدی', subject: 'علوم', teachingQuality: 4.2, studentRelation: 4.3, responsiveness: 4.0, homeworkBalance: 3.8, classroomOrder: 4.4, average: 4.14, responseCount: 15 },
  { id: '4', name: 'خانم کریمی', subject: 'انگلیسی', teachingQuality: 4.6, studentRelation: 4.5, responsiveness: 4.4, homeworkBalance: 4.3, classroomOrder: 4.5, average: 4.46, responseCount: 20 },
  { id: '5', name: 'آقای نوری', subject: 'ورزش', teachingQuality: 4.9, studentRelation: 5.0, responsiveness: 4.8, homeworkBalance: 4.9, classroomOrder: 4.7, average: 4.86, responseCount: 25 },
]

const facilityResults: FacilitySurveyResult[] = [
  { category: 'فضای آموزشی', score: 4.2, maxScore: 5 },
  { category: 'تجهیزات کلاس', score: 3.8, maxScore: 5 },
  { category: 'بهداشت و نظافت', score: 4.5, maxScore: 5 },
  { category: 'امکانات ورزشی', score: 3.5, maxScore: 5 },
  { category: 'برنامه‌های فوق‌برنامه', score: 4.0, maxScore: 5 },
]

const parentComments: ParentComment[] = [
  { id: '1', parentName: 'خانم محمدی', studentName: 'علی محمدی', comment: 'از عملکرد معلمان بسیار راضی هستم. فرزندم پیشرفت چشمگیری داشته است.', date: '۱۴۰۳/۰۹/۱۵', sentiment: 'positive' },
  { id: '2', parentName: 'آقای رضایی', studentName: 'سارا رضایی', comment: 'کاش کلاس‌های فوق‌برنامه بیشتری برگزار شود.', date: '۱۴۰۳/۰۹/۱۴', sentiment: 'neutral' },
  { id: '3', parentName: 'خانم احمدی', studentName: 'محمد احمدی', comment: 'تکالیف خیلی زیاد است و فرزندم فرصت استراحت ندارد.', date: '۱۴۰۳/۰۹/۱۳', sentiment: 'negative' },
  { id: '4', parentName: 'آقای کریمی', studentName: 'زهرا کریمی', comment: 'مدرسه فوق‌العاده است. بهداشت و نظافت عالی است.', date: '۱۴۰۳/۰۹/۱۲', sentiment: 'positive' },
  { id: '5', parentName: 'خانم نوری', studentName: 'امیر نوری', comment: 'معلم ریاضی بسیار صبور و با حوصله است.', date: '۱۴۰۳/۰۹/۱۱', sentiment: 'positive' },
  { id: '6', parentName: 'آقای حسینی', studentName: 'فاطمه حسینی', comment: 'امکانات ورزشی نیاز به بهبود دارد.', date: '۱۴۰۳/۰۹/۱۰', sentiment: 'negative' },
  { id: '7', parentName: 'خانم صادقی', studentName: 'رضا صادقی', comment: 'ارتباط معلمان با دانش‌آموزان خوب است.', date: '۱۴۰۳/۰۹/۰۹', sentiment: 'positive' },
  { id: '8', parentName: 'آقای جعفری', studentName: 'مریم جعفری', comment: 'برنامه غذایی مدرسه قابل قبول است.', date: '۱۴۰۳/۰۹/۰۸', sentiment: 'neutral' },
  { id: '9', parentName: 'خانم موسوی', studentName: 'حسین موسوی', comment: 'خیلی خوشحالم که فرزندم در این مدرسه درس می‌خواند.', date: '۱۴۰۳/۰۹/۰۷', sentiment: 'positive' },
  { id: '10', parentName: 'آقای طاهری', studentName: 'نرگس طاهری', comment: 'کلاس‌ها کمی شلوغ هستند. کاش تعداد دانش‌آموزان کمتر بود.', date: '۱۴۰۳/۰۹/۰۶', sentiment: 'negative' },
]

// ============================================
// کامپوننت نوار نمودار
// ============================================
interface BarChartItemProps {
  label: string
  value: number
  maxValue: number
  color: string
}

function BarChartItem({ label, value, maxValue, color }: BarChartItemProps) {
  const percentage = (value / maxValue) * 100

  return (
    <div className="flex items-center gap-4">
      <span className="text-white/70 text-sm w-32 truncate">{label}</span>
      <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
        <div
          className={`h-full ${color} rounded-lg transition-all duration-1000 flex items-center justify-end px-2`}
          style={{ width: `${percentage}%` }}
        >
          <span className="text-white text-xs font-bold">{value.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Radar Chart ساده
// ============================================
interface SimpleRadarChartProps {
  data: FacilitySurveyResult[]
}

function SimpleRadarChart({ data }: SimpleRadarChartProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {data.map((item, index) => {
        const percentage = (item.score / item.maxScore) * 100
        const colors = [
          'bg-gradient-to-r from-blue-500 to-cyan-500',
          'bg-gradient-to-r from-purple-500 to-pink-500',
          'bg-gradient-to-r from-green-500 to-emerald-500',
          'bg-gradient-to-r from-orange-500 to-red-500',
          'bg-gradient-to-r from-yellow-500 to-amber-500',
        ]

        return (
          <div key={index} className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{item.category}</span>
              <span className="text-yellow-400 font-bold">{item.score.toFixed(1)} / {item.maxScore}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[index]} rounded-full transition-all duration-1000`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// کامپوننت کارت نظر
// ============================================
interface CommentCardProps {
  comment: ParentComment
}

function CommentCard({ comment }: CommentCardProps) {
  const sentimentStyles = {
    positive: { bg: 'bg-green-500/10 border-green-500/30', icon: <ThumbsUp className="w-4 h-4 text-green-400" />, label: 'مثبت' },
    negative: { bg: 'bg-red-500/10 border-red-500/30', icon: <ThumbsDown className="w-4 h-4 text-red-400" />, label: 'منفی' },
    neutral: { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: <Minus className="w-4 h-4 text-yellow-400" />, label: 'خنثی' },
  }

  const style = sentimentStyles[comment.sentiment]

  return (
    <div className={`${style.bg} border rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{comment.parentName}</p>
            <p className="text-white/40 text-xs">والد {comment.studentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-white/50 text-xs">{comment.date}</span>
        </div>
      </div>
      <p className="text-white/70 text-sm leading-relaxed">{comment.comment}</p>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function AdminSurveysPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | 'all'>('all')

  // آمار کلی
  const stats = useMemo(() => {
    const totalResponses = teacherResults.reduce((sum, t) => sum + t.responseCount, 0)
    const overallAverage = teacherResults.reduce((sum, t) => sum + t.average, 0) / teacherResults.length
    const facilityAverage = facilityResults.reduce((sum, f) => sum + f.score, 0) / facilityResults.length

    return {
      totalResponses,
      overallAverage: overallAverage.toFixed(2),
      facilityAverage: facilityAverage.toFixed(2),
      lastUpdate: '۱۴۰۳/۰۹/۱۵',
    }
  }, [])

  // فیلتر معلمان
  const filteredTeachers = useMemo(() => {
    if (selectedTeacher === 'all') return teacherResults
    return teacherResults.filter(t => t.id === selectedTeacher)
  }, [selectedTeacher])

  // فیلتر نظرات
  const filteredComments = useMemo(() => {
    if (sentimentFilter === 'all') return parentComments
    return parentComments.filter(c => c.sentiment === sentimentFilter)
  }, [sentimentFilter])

  // آمار احساسات
  const sentimentStats = useMemo(() => ({
    positive: parentComments.filter(c => c.sentiment === 'positive').length,
    negative: parentComments.filter(c => c.sentiment === 'negative').length,
    neutral: parentComments.filter(c => c.sentiment === 'neutral').length,
  }), [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                  نتایج نظرسنجی‌ها
                </h1>
                <p className="text-white/60 mt-1">
                  تحلیل نظرات والدین درباره مدرسه
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
              <Download className="w-4 h-4" />
              دانلود گزارش
            </button>
          </div>
        </header>

        {/* ==================== کارت‌های آمار ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-5 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-400 text-sm">شرکت‌کنندگان</p>
                <p className="text-white text-2xl font-bold">{stats.totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-5 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-yellow-400 text-sm">میانگین رضایت</p>
                <p className="text-white text-2xl font-bold">{stats.overallAverage}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/20 backdrop-blur-lg rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-purple-400 text-sm">امکانات</p>
                <p className="text-white text-2xl font-bold">{stats.facilityAverage}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-5 border border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-green-400 text-sm">آخرین بروزرسانی</p>
                <p className="text-white text-lg font-bold">{stats.lastUpdate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== عملکرد معلمان ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-yellow-400" />
              عملکرد معلمان
            </h2>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all" className="bg-slate-800">همه معلمان</option>
              {teacherResults.map(teacher => (
                <option key={teacher.id} value={teacher.id} className="bg-slate-800">
                  {teacher.name} - {teacher.subject}
                </option>
              ))}
            </select>
          </div>

          {/* نمودار میله‌ای */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-white/70 text-sm mb-4">میانگین امتیاز هر معلم</h3>
              <div className="space-y-3">
                {filteredTeachers.map((teacher) => (
                  <BarChartItem
                    key={teacher.id}
                    label={`${teacher.name} (${teacher.subject})`}
                    value={teacher.average}
                    maxValue={5}
                    color={teacher.average >= 4.5 ? 'bg-green-500' : teacher.average >= 4 ? 'bg-blue-500' : 'bg-orange-500'}
                  />
                ))}
              </div>
            </div>

            {/* جدول جزئیات */}
            <div>
              <h3 className="text-white/70 text-sm mb-4">جزئیات امتیازات</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="text-right py-2 font-medium">معلم</th>
                      <th className="text-center py-2 font-medium">تدریس</th>
                      <th className="text-center py-2 font-medium">ارتباط</th>
                      <th className="text-center py-2 font-medium">پاسخگویی</th>
                      <th className="text-center py-2 font-medium">میانگین</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-white/5">
                        <td className="py-3 text-white">{teacher.name}</td>
                        <td className="py-3 text-center text-yellow-400">{teacher.teachingQuality}</td>
                        <td className="py-3 text-center text-blue-400">{teacher.studentRelation}</td>
                        <td className="py-3 text-center text-purple-400">{teacher.responsiveness}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            teacher.average >= 4.5 ? 'bg-green-500/20 text-green-400' :
                            teacher.average >= 4 ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {teacher.average.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== امکانات مدرسه ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-400" />
            امکانات مدرسه
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div>
              <h3 className="text-white/70 text-sm mb-4">نمودار شاخص‌های امکانات</h3>
              <SimpleRadarChart data={facilityResults} />
            </div>

            {/* مقایسه */}
            <div>
              <h3 className="text-white/70 text-sm mb-4">مقایسه با استاندارد</h3>
              <div className="space-y-4">
                {facilityResults.map((item, index) => {
                  const percentage = (item.score / item.maxScore) * 100
                  const status = percentage >= 80 ? 'عالی' : percentage >= 60 ? 'خوب' : 'نیاز به بهبود'
                  const statusColor = percentage >= 80 ? 'text-green-400' : percentage >= 60 ? 'text-yellow-400' : 'text-red-400'

                  return (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <span className="text-white">{item.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-bold">{item.score.toFixed(1)}</span>
                        <span className={`text-xs ${statusColor}`}>{status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== نظرات متنی ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              نظرات والدین
              <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-sm">
                {parentComments.length} نظر
              </span>
            </h2>

            {/* فیلتر احساسات */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'همه', count: parentComments.length },
                { value: 'positive', label: 'مثبت', count: sentimentStats.positive, color: 'bg-green-500/20 text-green-400' },
                { value: 'neutral', label: 'خنثی', count: sentimentStats.neutral, color: 'bg-yellow-500/20 text-yellow-400' },
                { value: 'negative', label: 'منفی', count: sentimentStats.negative, color: 'bg-red-500/20 text-red-400' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSentimentFilter(filter.value as SentimentType | 'all')}
                  className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1
                    ${sentimentFilter === filter.value
                      ? filter.color || 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                >
                  {filter.label}
                  <span className="bg-white/10 px-1.5 rounded text-xs">{filter.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* لیست نظرات */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>

          {filteredComments.length === 0 && (
            <div className="text-center py-8 text-white/50">
              نظری با این فیلتر یافت نشد
            </div>
          )}
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}





























