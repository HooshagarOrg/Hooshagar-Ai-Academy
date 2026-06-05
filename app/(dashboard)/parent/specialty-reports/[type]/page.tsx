'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Music,
  Palette,
  Dumbbell,
  Bot,
  Star,
  Calendar,
  ChevronRight,
  Download,
  Printer,
  Trophy,
  Target,
  TrendingUp,
  
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import {
  FINAL_GRADE_LABELS,
  
  
  
  
  
  
  FITNESS_TEST_LABELS,
  type AssessmentType,
  type MusicAssessment,
  type ArtAssessment,
  type SportsAssessment,
  type STEMAssessment,
} from '@/lib/types/specialty-assessment.types'

// ==========================================
// Mock Data
// ==========================================
const mockMusicAssessment: MusicAssessment = {
  id: '1',
  student_id: 's1',
  teacher_id: 't1',
  school_id: 'sch1',
  assessment_date: '2024-01-15',
  semester: 'نیمسال اول',
  academic_year: '1403-1404',
  rhythm_sense: 5,
  pitch_accuracy: 4,
  music_reading: 4,
  listening_skills: 5,
  vocal_performance: 4,
  instrument: 'پیانو',
  instrument_proficiency: 3,
  creativity: 5,
  expression: 4,
  participation_score: 5,
  behavior_score: 5,
  teacher_notes: 'دانش‌آموز بسیار با استعداد و علاقه‌مند به موسیقی است. پیشرفت چشمگیری در نت‌خوانی داشته و در کنسرت مدرسه اجرای فوق‌العاده‌ای داشت.',
  achievements: 'اجرای موفق در کنسرت مدرسه، شرکت در مسابقات منطقه',
  areas_for_improvement: 'تمرین بیشتر روی تکنیک پیانو، تقویت حافظه موسیقایی',
  songs_learned: ['سرود ملی', 'ای ایران', 'پرنده‌های مهاجر', 'مرغ سحر'],
  final_grade: 'excellent',
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
  teacher: { id: 't1', full_name: 'استاد محمدی' },
}

const mockSportsAssessment: SportsAssessment = {
  id: '2',
  student_id: 's1',
  teacher_id: 't2',
  school_id: 'sch1',
  assessment_date: '2024-01-12',
  semester: 'نیمسال اول',
  academic_year: '1403-1404',
  cardiovascular_endurance: 5,
  muscular_strength: 4,
  muscular_endurance: 4,
  flexibility: 4,
  body_composition: 5,
  coordination: 5,
  agility: 5,
  balance: 4,
  team_sports_skills: 5,
  individual_sports_skills: 4,
  game_understanding: 5,
  sportsmanship: 5,
  teamwork: 5,
  leadership: 4,
  effort: 5,
  following_rules: 5,
  specialized_sports: ['فوتبال', 'شنا'],
  sport_achievements: 'کاپیتان تیم فوتبال مدرسه',
  fitness_test_results: {
    sprint_50m: '8.2',
    long_jump: '3.5',
    sit_and_reach: '28',
    push_ups: '20',
    sit_ups: '35',
  },
  teacher_notes: 'ورزشکار برجسته با روحیه تیمی عالی. در همه فعالیت‌ها با انگیزه شرکت می‌کند.',
  strengths: 'سرعت، هماهنگی، روحیه رهبری',
  areas_for_improvement: 'انعطاف‌پذیری، تمرکز در ورزش‌های فردی',
  competitions_participated: ['مسابقات فوتبال بین مدارس', 'المپیاد ورزشی منطقه'],
  medals_awards: 'مقام دوم مسابقات فوتبال بین مدارس',
  final_grade: 'excellent',
  created_at: '2024-01-12',
  updated_at: '2024-01-12',
  teacher: { id: 't2', full_name: 'مربی احمدی' },
}

// ==========================================
// Helper Components
// ==========================================
const SkillBar = ({ label, value, max = 5 }: { label: string; value: number | null; max?: number }) => {
  if (value === null) return null
  const percentage = (value / max) * 100
  const colorClass = value >= 4 ? 'from-green-500 to-emerald-500' :
                     value >= 3 ? 'from-yellow-500 to-orange-500' :
                     'from-red-500 to-orange-500'
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < value ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

const RadarChartPlaceholder = ({ data, labels }: { data: Record<string, number | null>; labels: Record<string, string> }) => {
  const validData = Object.entries(data).filter(([_, v]) => v !== null)
  
  return (
    <div className="bg-white/5 rounded-xl p-6">
      <h4 className="text-white font-medium mb-4 text-center">نمودار مهارت‌ها</h4>
      <div className="grid grid-cols-2 gap-3">
        {validData.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
            <span className="text-white/60 text-xs">{labels[key] || key}</span>
            <span className="text-white font-bold">{value}/5</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// Main Component
// ==========================================
export default function SpecialtyReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as AssessmentType
  
  const [isLoading, setIsLoading] = useState(true)
  const [assessment, setAssessment] = useState<MusicAssessment | SportsAssessment | ArtAssessment | STEMAssessment | null>(null)

  useEffect(() => {
    if (!['music', 'art', 'sports', 'stem'].includes(type)) {
      router.push('/parent/specialty-reports')
      return
    }
    
    const fetchAssessment = async () => {
      try {
        const dashRes = await fetch('/api/parent/dashboard')
        const dash = await dashRes.json()
        const studentId = dash.activeChild?.id
        if (!studentId) {
          setIsLoading(false)
          return
        }

        const res = await fetch(`/api/specialty-assessments/student/${studentId}`)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        const tableMap: Record<string, string> = {
          music: 'music',
          art: 'art',
          sports: 'sports',
          stem: 'stem',
        }
        const list = json.assessments?.[tableMap[type]] || []
        setAssessment(list[0] || null)
      } catch {
        if (type === 'music') setAssessment(mockMusicAssessment)
        else if (type === 'sports') setAssessment(mockSportsAssessment)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAssessment()
  }, [type, router])

  const getTypeInfo = () => {
    switch (type) {
      case 'music':
        return { icon: <Music className="w-6 h-6" />, label: 'موسیقی', color: 'from-purple-500 to-pink-500' }
      case 'art':
        return { icon: <Palette className="w-6 h-6" />, label: 'هنر', color: 'from-pink-500 to-orange-500' }
      case 'sports':
        return { icon: <Dumbbell className="w-6 h-6" />, label: 'ورزش', color: 'from-green-500 to-emerald-500' }
      case 'stem':
        return { icon: <Bot className="w-6 h-6" />, label: 'STEM', color: 'from-blue-500 to-cyan-500' }
      default:
        return { icon: <Star className="w-6 h-6" />, label: '', color: 'from-gray-500 to-gray-600' }
    }
  }

  const typeInfo = getTypeInfo()

  if (isLoading) {
    return (
      <DashboardPage className="max-w-4xl mx-auto" title="گزارش تخصصی" animatedSections={false}>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardPage>
    )
  }

  if (!assessment) {
    return (
      <DashboardPage className="max-w-4xl mx-auto" title="ارزیابی یافت نشد" animatedSections={false}>
        <div className="text-center py-16">
          <p className="text-muted-foreground">ارزیابی یافت نشد</p>
          <Link href="/parent/specialty-reports">
            <Button variant="link" className="text-brand-purple mt-4">
              بازگشت
            </Button>
          </Link>
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      className="max-w-4xl mx-auto"
      title={`گزارش ${typeInfo.label}`}
      description={assessment.semester}
      meta={
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/parent" className="text-muted-foreground hover:text-foreground">
            داشبورد
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Link href="/parent/specialty-reports" className="text-muted-foreground hover:text-foreground">
            گزارشات تخصصی
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span>{typeInfo.label}</span>
        </div>
      }
      animatedSections={false}
    >
        <GlassCard className={`bg-gradient-to-br ${typeInfo.color}/20 border-white/20`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`bg-gradient-to-br ${typeInfo.color} p-4 rounded-xl text-white`}>
                  {typeInfo.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">گزارش {typeInfo.label}</h1>
                  <div className="flex items-center gap-3 mt-2 text-white/60 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(assessment.assessment_date).toLocaleDateString('fa-IR')}
                    </span>
                    <span>•</span>
                    <span>{assessment.semester}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-xl text-lg font-bold ${
                  assessment.final_grade === 'excellent' ? 'bg-green-500/20 text-green-400' :
                  assessment.final_grade === 'very_good' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {FINAL_GRADE_LABELS[assessment.final_grade as keyof typeof FINAL_GRADE_LABELS] || assessment.final_grade}
                </span>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* ==================== Skills Section ==================== */}
        {type === 'music' && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Skills */}
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-purple-400" />
                    مهارت‌های پایه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkillBar label="حس ریتم" value={(assessment as MusicAssessment).rhythm_sense} />
                  <SkillBar label="دقت آهنگ" value={(assessment as MusicAssessment).pitch_accuracy} />
                  <SkillBar label="خواندن نت" value={(assessment as MusicAssessment).music_reading} />
                  <SkillBar label="مهارت گوش دادن" value={(assessment as MusicAssessment).listening_skills} />
                </CardContent>
              </GlassCard>

              {/* Performance & Creativity */}
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    اجرا و خلاقیت
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkillBar label="اجرای آوازی" value={(assessment as MusicAssessment).vocal_performance} />
                  <SkillBar label="خلاقیت" value={(assessment as MusicAssessment).creativity} />
                  <SkillBar label="ابراز احساس" value={(assessment as MusicAssessment).expression} />
                  {(assessment as MusicAssessment).instrument && (
                    <>
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-white/50 text-xs mb-2">ساز: {(assessment as MusicAssessment).instrument}</p>
                        <SkillBar label="مهارت ساز" value={(assessment as MusicAssessment).instrument_proficiency} />
                      </div>
                    </>
                  )}
                </CardContent>
              </GlassCard>
            </div>

            {/* Songs Learned */}
            {(assessment as MusicAssessment).songs_learned && (assessment as MusicAssessment).songs_learned!.length > 0 && (
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white">آهنگ‌های یادگرفته</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(assessment as MusicAssessment).songs_learned!.map((song, i) => (
                      <span key={i} className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                        🎵 {song}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </GlassCard>
            )}
          </>
        )}

        {type === 'sports' && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Physical Fitness */}
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-green-400" />
                    آمادگی جسمانی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkillBar label="استقامت قلبی" value={(assessment as SportsAssessment).cardiovascular_endurance} />
                  <SkillBar label="قدرت عضلانی" value={(assessment as SportsAssessment).muscular_strength} />
                  <SkillBar label="انعطاف‌پذیری" value={(assessment as SportsAssessment).flexibility} />
                  <SkillBar label="هماهنگی" value={(assessment as SportsAssessment).coordination} />
                  <SkillBar label="چابکی" value={(assessment as SportsAssessment).agility} />
                  <SkillBar label="تعادل" value={(assessment as SportsAssessment).balance} />
                </CardContent>
              </GlassCard>

              {/* Sports Skills */}
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    مهارت‌های ورزشی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkillBar label="ورزش تیمی" value={(assessment as SportsAssessment).team_sports_skills} />
                  <SkillBar label="ورزش فردی" value={(assessment as SportsAssessment).individual_sports_skills} />
                  <SkillBar label="درک بازی" value={(assessment as SportsAssessment).game_understanding} />
                  <SkillBar label="روحیه ورزشکاری" value={(assessment as SportsAssessment).sportsmanship} />
                  <SkillBar label="کار تیمی" value={(assessment as SportsAssessment).teamwork} />
                  <SkillBar label="رهبری" value={(assessment as SportsAssessment).leadership} />
                </CardContent>
              </GlassCard>
            </div>

            {/* Fitness Test Results */}
            {(assessment as SportsAssessment).fitness_test_results && (
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    نتایج آزمون آمادگی جسمانی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries((assessment as SportsAssessment).fitness_test_results!).map(([key, value]) => {
                      const testInfo = FITNESS_TEST_LABELS[key]
                      if (!testInfo) return null
                      return (
                        <div key={key} className="bg-white/5 rounded-xl p-4 text-center">
                          <p className="text-white/50 text-xs mb-1">{testInfo.label}</p>
                          <p className="text-white text-2xl font-bold">{value}</p>
                          <p className="text-white/40 text-xs">{testInfo.unit}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </GlassCard>
            )}

            {/* Specialized Sports */}
            {(assessment as SportsAssessment).specialized_sports && (assessment as SportsAssessment).specialized_sports!.length > 0 && (
              <GlassCard>
                <CardHeader>
                  <CardTitle className="text-white">ورزش‌های تخصصی</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(assessment as SportsAssessment).specialized_sports!.map((sport, i) => (
                      <span key={i} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        ⚽ {sport}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </GlassCard>
            )}
          </>
        )}

        {/* ==================== Teacher Notes ==================== */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              یادداشت معلم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {assessment.teacher?.full_name?.charAt(0) || 'م'}
              </div>
              <div>
                <p className="text-white font-medium">{assessment.teacher?.full_name || 'معلم'}</p>
                <p className="text-white/50 text-xs">معلم {typeInfo.label}</p>
              </div>
            </div>
            
            {assessment.teacher_notes && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/80 leading-relaxed">{assessment.teacher_notes}</p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              {(assessment as MusicAssessment).achievements && (
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <p className="text-green-400 text-sm font-medium mb-2 flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    دستاوردها
                  </p>
                  <p className="text-white/80 text-sm">{(assessment as MusicAssessment).achievements}</p>
                </div>
              )}
              
              {(assessment as MusicAssessment).areas_for_improvement && (
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-orange-400 text-sm font-medium mb-2 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    نقاط قابل بهبود
                  </p>
                  <p className="text-white/80 text-sm">{(assessment as MusicAssessment).areas_for_improvement}</p>
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>

        {/* ==================== Actions ==================== */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
            <Download className="w-4 h-4" />
            دانلود PDF
          </Button>
          <Button variant="outline" className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
            <Printer className="w-4 h-4" />
            چاپ گزارش
          </Button>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-muted-foreground text-sm py-4">
          <p>گزارش {typeInfo.label} - هوشاگر</p>
        </footer>
    </DashboardPage>
  )
}







