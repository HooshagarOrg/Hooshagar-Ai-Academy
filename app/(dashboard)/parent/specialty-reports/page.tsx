'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Music,
  Palette,
  Dumbbell,
  Bot,
  Star,
  Calendar,
  Trophy,
  ChevronLeft,
  TrendingUp,
  Award,
  
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FINAL_GRADE_LABELS,
  STEM_SUBJECT_LABELS,
  
  type 
} from '@/lib/types/specialty-assessment.types'

// ==========================================
// Types
// ==========================================
interface AssessmentSummary {
  latest_date: string
  final_grade: string
  average_score: number
  total_assessments: number
  achievements?: string[]
  highlights?: string[]
}

interface MusicSummary extends AssessmentSummary {
  songs_learned?: string[]
  instrument?: string
}

interface ArtSummary extends AssessmentSummary {
  mastered_techniques?: string[]
  notable_projects?: { title: string; score: number }[]
}

interface SportsSummary extends AssessmentSummary {
  fitness_score: number
  specialized_sports?: string[]
  competitions?: string[]
}

interface STEMSummary extends AssessmentSummary {
  subject: string
  programming_languages?: string[]
  completed_projects?: { name: string; score: number }[]
}

// ==========================================
// Mock Data
// ==========================================
const mockStudentName = 'علی رضایی'

const mockMusicSummary: MusicSummary = {
  latest_date: '1403/09/15',
  final_grade: 'excellent',
  average_score: 4.5,
  total_assessments: 3,
  songs_learned: ['سرود ملی', 'ای ایران', 'پرنده‌های مهاجر'],
  instrument: 'پیانو',
  achievements: ['اجرای موفق در کنسرت مدرسه'],
  highlights: ['پیشرفت چشمگیر در نت‌خوانی', 'استعداد برجسته در ریتم'],
}

const mockArtSummary: ArtSummary = {
  latest_date: '1403/09/10',
  final_grade: 'very_good',
  average_score: 4.2,
  total_assessments: 3,
  mastered_techniques: ['نقاشی', 'کاردستی', 'کولاژ'],
  notable_projects: [
    { title: 'نقاشی طبیعت', score: 5 },
    { title: 'مجسمه گلی', score: 4 },
  ],
  achievements: ['شرکت در نمایشگاه مدرسه'],
}

const mockSportsSummary: SportsSummary = {
  latest_date: '1403/09/12',
  final_grade: 'excellent',
  average_score: 4.7,
  fitness_score: 85,
  total_assessments: 4,
  specialized_sports: ['فوتبال', 'شنا'],
  competitions: ['مسابقات بین مدارس (مقام دوم)'],
  highlights: ['دو ۵۰ متر: ۸.۲ ثانیه', 'پرش طول: ۳.۵ متر'],
}

const mockSTEMSummary: STEMSummary = {
  latest_date: '1403/09/08',
  final_grade: 'excellent',
  average_score: 4.8,
  total_assessments: 2,
  subject: 'robotics',
  programming_languages: ['Python', 'Scratch', 'Arduino'],
  completed_projects: [
    { name: 'ربات خط‌رو', score: 5 },
    { name: 'بازی Snake با Python', score: 5 },
  ],
  achievements: ['مقام اول مسابقات رباتیک منطقه'],
}

// ==========================================
// Helper Components
// ==========================================
const StarRating = ({ score, max = 5 }: { score: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(score) 
            ? 'text-yellow-400 fill-yellow-400' 
            : i < score 
            ? 'text-yellow-400 fill-yellow-400/50'
            : 'text-white/20'
        }`}
      />
    ))}
    <span className="text-white/60 text-sm mr-1">({score})</span>
  </div>
)

const ProgressRing = ({ value, size = 80 }: { value: number; size?: number }) => {
  const radius = (size - 8) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/10"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-green-500 transition-all duration-1000"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-lg font-bold">{value}%</span>
      </div>
    </div>
  )
}

const GradeBadge = ({ grade }: { grade: string }) => {
  const colors: Record<string, string> = {
    excellent: 'bg-green-500/20 text-green-400 border-green-500/30',
    very_good: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    good: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    satisfactory: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    needs_improvement: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm border ${colors[grade] || colors.good}`}>
      {FINAL_GRADE_LABELS[grade as keyof typeof FINAL_GRADE_LABELS] || grade}
    </span>
  )
}

// ==========================================
// Main Component
// ==========================================
export default function ParentSpecialtyReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{
    music: MusicSummary | null
    art: ArtSummary | null
    sports: SportsSummary | null
    stem: STEMSummary | null
  } | null>(null)

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setData({
        music: mockMusicSummary,
        art: mockArtSummary,
        sports: mockSportsSummary,
        stem: mockSTEMSummary,
      })
      setIsLoading(false)
    }, 500)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full bg-white/10" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ==================== Header ==================== */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">گزارشات تخصصی</h1>
            <p className="text-white/60 text-sm">{mockStudentName}</p>
          </div>
        </div>

        {/* ==================== Assessment Cards ==================== */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Music Card */}
          {data.music && (
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                    موسیقی
                  </CardTitle>
                  <GradeBadge grade={data.music.final_grade} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    آخرین ارزیابی: {data.music.latest_date}
                  </div>
                  <StarRating score={data.music.average_score} />
                </div>
                
                {data.music.instrument && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/50 text-xs mb-1">ساز</p>
                    <p className="text-white">{data.music.instrument}</p>
                  </div>
                )}
                
                {data.music.highlights && data.music.highlights.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-purple-400 text-xs mb-2">💬 نظر معلم</p>
                    {data.music.highlights.map((h, i) => (
                      <p key={i} className="text-white/80 text-sm">{h}</p>
                    ))}
                  </div>
                )}
                
                {data.music.achievements && data.music.achievements.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">دستاوردها</p>
                    {data.music.achievements.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        {a}
                      </div>
                    ))}
                  </div>
                )}
                
                {data.music.songs_learned && data.music.songs_learned.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">آهنگ‌های یادگرفته</p>
                    <div className="flex flex-wrap gap-1">
                      {data.music.songs_learned.map((song, i) => (
                        <span key={i} className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded">
                          {song}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <Link href="/parent/specialty-reports/music">
                  <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                    مشاهده جزئیات
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Art Card */}
          {data.art && (
            <Card className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 backdrop-blur-xl border-pink-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="bg-pink-500/20 p-2 rounded-lg">
                      <Palette className="w-5 h-5 text-pink-400" />
                    </div>
                    هنر
                  </CardTitle>
                  <GradeBadge grade={data.art.final_grade} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    آخرین ارزیابی: {data.art.latest_date}
                  </div>
                  <StarRating score={data.art.average_score} />
                </div>
                
                {data.art.mastered_techniques && data.art.mastered_techniques.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">تکنیک‌های تسلط یافته</p>
                    <div className="flex flex-wrap gap-1">
                      {data.art.mastered_techniques.map((tech, i) => (
                        <span key={i} className="bg-pink-500/20 text-pink-400 text-xs px-2 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.art.notable_projects && data.art.notable_projects.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">پروژه‌های برجسته</p>
                    {data.art.notable_projects.map((project, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-2 mb-1">
                        <span className="text-white/80 text-sm">{project.title}</span>
                        <StarRating score={project.score} />
                      </div>
                    ))}
                  </div>
                )}
                
                {data.art.achievements && data.art.achievements.length > 0 && (
                  <div>
                    {data.art.achievements.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <Award className="w-4 h-4 text-pink-400" />
                        {a}
                      </div>
                    ))}
                  </div>
                )}
                
                <Link href="/parent/specialty-reports/art">
                  <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                    مشاهده جزئیات
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Sports Card */}
          {data.sports && (
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border-green-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-green-400" />
                    </div>
                    ورزش
                  </CardTitle>
                  <GradeBadge grade={data.sports.final_grade} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    آخرین ارزیابی: {data.sports.latest_date}
                  </div>
                  <StarRating score={data.sports.average_score} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-xs mb-1">آمادگی جسمانی</p>
                    <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        style={{ width: `${data.sports.fitness_score}%` }}
                      />
                    </div>
                  </div>
                  <ProgressRing value={data.sports.fitness_score} size={60} />
                </div>
                
                {data.sports.highlights && data.sports.highlights.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-green-400 text-xs mb-2">نتایج آزمون</p>
                    {data.sports.highlights.map((h, i) => (
                      <p key={i} className="text-white/80 text-sm">• {h}</p>
                    ))}
                  </div>
                )}
                
                {data.sports.specialized_sports && data.sports.specialized_sports.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">ورزش‌های تخصصی</p>
                    <div className="flex flex-wrap gap-1">
                      {data.sports.specialized_sports.map((sport, i) => (
                        <span key={i} className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.sports.competitions && data.sports.competitions.length > 0 && (
                  <div>
                    {data.sports.competitions.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        {c}
                      </div>
                    ))}
                  </div>
                )}
                
                <Link href="/parent/specialty-reports/sports">
                  <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                    مشاهده جزئیات
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* STEM Card */}
          {data.stem && (
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border-blue-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Bot className="w-5 h-5 text-blue-400" />
                    </div>
                    {STEM_SUBJECT_LABELS[data.stem.subject as keyof typeof STEM_SUBJECT_LABELS] || 'STEM'}
                  </CardTitle>
                  <GradeBadge grade={data.stem.final_grade} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    آخرین ارزیابی: {data.stem.latest_date}
                  </div>
                  <StarRating score={data.stem.average_score} />
                </div>
                
                {data.stem.programming_languages && data.stem.programming_languages.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">زبان‌های برنامه‌نویسی</p>
                    <div className="flex flex-wrap gap-1">
                      {data.stem.programming_languages.map((lang, i) => (
                        <span key={i} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.stem.completed_projects && data.stem.completed_projects.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs mb-2">پروژه‌های تکمیل شده</p>
                    {data.stem.completed_projects.map((project, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-2 mb-1">
                        <span className="text-white/80 text-sm">{project.name}</span>
                        <StarRating score={project.score} />
                      </div>
                    ))}
                  </div>
                )}
                
                {data.stem.achievements && data.stem.achievements.length > 0 && (
                  <div>
                    {data.stem.achievements.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        {a}
                      </div>
                    ))}
                  </div>
                )}
                
                <Link href="/parent/specialty-reports/stem">
                  <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
                    مشاهده جزئیات
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ==================== Overall Summary ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">عملکرد کلی عالی</h3>
                  <p className="text-white/60 text-sm">
                    فرزند شما در تمام حوزه‌های تخصصی پیشرفت خوبی داشته است
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-white/50 text-xs">میانگین کل</p>
                  <p className="text-white text-2xl font-bold">4.5</p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-xs">تعداد ارزیابی</p>
                  <p className="text-white text-2xl font-bold">12</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/30 text-sm py-4">
          <p>گزارشات تخصصی - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}







