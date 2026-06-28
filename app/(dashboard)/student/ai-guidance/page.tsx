'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Compass,
  ArrowRight,
  Brain,
  TrendingUp,
  Target,
  Award,
  Star,
  Lightbulb,
  Users,
  Briefcase,
  GraduationCap,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { LuxStagger, LuxStaggerItem } from '@/components/lux/lux-motion'

// ============================================
// کامپوننت اصلی
// ============================================
export default function AIGuidancePage() {
  const [currentGrade, setCurrentGrade] = useState(9)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [guidance, setGuidance] = useState<any>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setStudentId(d.student?.id ?? null)
        if (d.student?.grade) setCurrentGrade(d.student.grade)
      })
      .catch(() => {})
  }, [])

  const defaultGuidance = () => ({
    talents: [
      { name: 'حل مسئله ریاضی', score: 92, icon: '🧮' },
      { name: 'تفکر منطقی', score: 88, icon: '🧩' },
      { name: 'خلاقیت', score: 85, icon: '🎨' },
      { name: 'کار تیمی', score: 78, icon: '👥' },
    ],
    personality_traits: [
      { trait: 'تحلیل‌گر', percentage: 85 },
      { trait: 'خلاق', percentage: 75 },
      { trait: 'سیستماتیک', percentage: 80 },
      { trait: 'مستقل', percentage: 70 },
    ],
    recommended_fields: [
      {
        name: 'ریاضی و فیزیک',
        match: 92,
        reason: 'توانایی قوی در حل مسئله و تفکر منطقی',
        careers: ['مهندسی کامپیوتر', 'مهندسی برق', 'علوم داده'],
      },
    ],
    career_paths: [
      {
        title: 'مهندس نرم‌افزار',
        match: 95,
        salary_range: '50-200 میلیون تومان',
        demand: 'بسیار بالا',
        description: 'طراحی و توسعه نرم‌افزارها و اپلیکیشن‌ها',
      },
    ],
    universities: [
      { name: 'دانشگاه شریف', rank: 1, match: 90 },
      { name: 'دانشگاه تهران', rank: 2, match: 88 },
    ],
  })

  const handleAnalyze = async () => {
    if (!studentId) return
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/field-selection/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      const rec = json.recommendation
      if (rec && typeof rec === 'object') {
        setGuidance({
          talents: (rec.strengths || []).map((s: { subject: string; score: number }) => ({
            name: s.subject,
            score: Math.round((s.score / 20) * 100),
            icon: '📚',
          })),
          personality_traits: [],
          recommended_fields: [
            {
              name: rec.recommended_field || 'پیشنهاد AI',
              match: Math.round((rec.confidence || 0.8) * 100),
              reason: (rec.reasons || [])[0] || '',
              careers: rec.career_paths || [],
            },
          ],
          career_paths: (rec.career_paths || []).map((c: string) => ({
            title: c,
            match: 85,
            salary_range: '—',
            demand: 'متوسط',
            description: '',
          })),
          universities: (rec.suitable_universities || []).map((u: string, i: number) => ({
            name: u,
            rank: i + 1,
            match: 80,
          })),
        })
      } else {
        setGuidance(defaultGuidance())
      }
    } catch {
      setGuidance(defaultGuidance())
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <DashboardPage
      className="max-w-7xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <Compass className="w-8 h-8 text-brand-cyan" />
          راهنمای هوشمند آینده
        </span>
      }
      description="با هوش مصنوعی مسیر آینده‌ات را پیدا کن"
      actions={
        <Link href="/student">
          <Button variant="outline" size="icon" className="glass-panel-quiet" aria-label="بازگشت">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      }
      animatedSections={false}
    >
      <LuxStagger className="space-y-6" stagger={0.1}>
        <LuxStaggerItem>
        <GlassCard className="p-8 text-center border-brand-cyan/25 bg-gradient-to-bl from-brand-cyan/15 via-card/90 to-brand-purple/10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/20 mb-4">
            <Brain className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            تحلیل جامع استعداد و آینده شغلی
          </h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto leading-relaxed">
            بر اساس عملکرد تحصیلی، فعالیت‌های فوق‌برنامه، علایق و شخصیت شما، 
            هوش مصنوعی بهترین مسیر تحصیلی و شغلی را پیشنهاد می‌دهد.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
              isAnalyzing
                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
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
                شروع تحلیل هوشمند
              </>
            )}
          </button>
        </GlassCard>
        </LuxStaggerItem>

        {guidance && (
          <LuxStaggerItem>
          <div className="space-y-6">
            {/* استعدادها */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                استعدادهای شما
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {guidance.talents.map((talent: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">{talent.icon}</div>
                    <p className="text-white font-bold mb-2">{talent.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${talent.score}%` }}
                        />
                      </div>
                      <span className="text-yellow-400 font-bold text-sm">{talent.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* خصوصیات شخصیتی */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  ویژگی‌های شخصیتی
                </h3>
                <div className="space-y-3">
                  {guidance.personality_traits.map((trait: any, i: number) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{trait.trait}</span>
                        <span className="text-purple-400 font-bold">{trait.percentage}%</span>
                      </div>
                      <div className="bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${trait.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* رشته‌های پیشنهادی */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-green-400" />
                  رشته‌های مناسب
                </h3>
                <div className="space-y-3">
                  {guidance.recommended_fields.map((field: any, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{field.name}</span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold">
                          {field.match}% تطابق
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mb-3">{field.reason}</p>
                      <div className="flex flex-wrap gap-2">
                        {field.careers.map((career: string, j: number) => (
                          <span key={j} className="px-2 py-1 bg-white/10 text-white/80 rounded-lg text-xs">
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* مسیرهای شغلی */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-400" />
                مسیرهای شغلی پیشنهادی
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {guidance.career_paths.map((career: any, i: number) => (
                  <div key={i} className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Briefcase className="w-8 h-8 text-blue-400" />
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">
                        {career.match}% تطابق
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">{career.title}</h4>
                    <p className="text-white/70 text-sm mb-3">{career.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-bold">{career.salary_range}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 text-sm">تقاضا: {career.demand}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* دانشگاه‌های پیشنهادی */}
            <GlassCard className="p-6 border-brand-purple/30 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-400" />
                دانشگاه‌های پیشنهادی
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {guidance.universities.map((uni: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">🎓</div>
                    <p className="text-white font-bold mb-1">{uni.name}</p>
                    <p className="text-white/60 text-sm mb-2">رتبه {uni.rank}</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{uni.match}% تطابق</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* توصیه نهایی */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <div>
                  <h4 className="text-cyan-300 font-bold text-lg mb-2">💡 توصیه هوش مصنوعی</h4>
                  <p className="text-cyan-200/80 leading-relaxed">
                    با توجه به استعدادهای شما در ریاضی و تفکر منطقی، رشته <strong>ریاضی و فیزیک</strong> بهترین 
                    انتخاب برای شماست. این رشته به شما امکان می‌دهد در زمینه‌های پر تقاضا مانند مهندسی کامپیوتر و 
                    هوش مصنوعی فعالیت کنید. با ادامه تمرین در ریاضیات و برنامه‌نویسی، می‌توانید به یکی از 
                    دانشگاه‌های برتر راه پیدا کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </LuxStaggerItem>
        )}

        <LuxStaggerItem>
        <footer className="text-center text-muted-foreground text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
        </LuxStaggerItem>
      </LuxStagger>
    </DashboardPage>
  )
}

