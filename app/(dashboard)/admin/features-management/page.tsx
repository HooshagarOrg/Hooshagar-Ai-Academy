'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Settings,
  ArrowRight,
  Sparkles,
  Layout,
  BarChart3,
  Zap,
  Building,
  Users,
  Check,
  X,
  Info,
  Bell,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  TrendingUp,
  Brain,
  BookOpen,
  MessageSquare,
  Gamepad2,
  Target,
  FileText,
  Heart,
  Dumbbell,
  Palette,
  Shield,
  Wallet,
  ClipboardList,
  Award,
  ShoppingBag,
  Flame,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface School {
  id: string
  name: string
}

interface AIFeature {
  id: string
  name: string
  description: string
  creditCost: number
  icon: React.ComponentType<{ className?: string }>
  enabledSchools: string[]
}

interface GeneralFeature {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabledRoles: string[]
  subFeatures?: { id: string; name: string; enabledRoles: string[] }[]
}

interface UsageStats {
  featureId: string
  schoolId: string
  usageCount: number
  activeUsers: number
}

interface Role {
  id: string
  name: string
  color: string
}

// ============================================
// داده‌های نمونه
// ============================================
const schools: School[] = [
  { id: '1', name: 'دبستان تلاش' },
  { id: '2', name: 'امیدان تلاش' },
  { id: '3', name: 'دبیرستان نور' },
  { id: '4', name: 'مدرسه فجر' },
]

const roles: Role[] = [
  { id: 'teacher', name: 'معلم', color: 'blue' },
  { id: 'parent', name: 'والدین', color: 'green' },
  { id: 'student', name: 'دانش‌آموز', color: 'purple' },
  { id: 'principal', name: 'مدیر', color: 'red' },
  { id: 'counselor', name: 'مشاور', color: 'yellow' },
  { id: 'financial_vp', name: 'معاون مالی', color: 'emerald' },
  { id: 'educational_vp', name: 'معاون پرورشی', color: 'pink' },
  { id: 'health_vp', name: 'معاون بهداشت', color: 'teal' },
  { id: 'disciplinary_vp', name: 'معاون انضباطی', color: 'orange' },
  { id: 'art_teacher', name: 'معلم هنر', color: 'rose' },
  { id: 'sports_teacher', name: 'معلم ورزش', color: 'lime' },
]

const initialAIFeatures: AIFeature[] = [
  { id: 'student-analyzer', name: 'Student Analyzer', description: 'تحلیل ۳۶۰ درجه دانش‌آموز', creditCost: 50, icon: Brain, enabledSchools: ['1', '2', '3'] },
  { id: 'problem-solver', name: 'Problem Solver OCR', description: 'حل مسائل از عکس', creditCost: 20, icon: Target, enabledSchools: ['1', '2', '3', '4'] },
  { id: 'story-wizard', name: 'Story Wizard', description: 'تولید داستان کودکان', creditCost: 15, icon: BookOpen, enabledSchools: ['1', '2'] },
  { id: 'study-buddy', name: 'Study Buddy RAG', description: 'دستیار یادگیری هوشمند', creditCost: 10, icon: MessageSquare, enabledSchools: ['1', '2', '3', '4'] },
  { id: 'content-creator', name: 'Content Creator', description: 'تولید طرح درس و سوال', creditCost: 30, icon: FileText, enabledSchools: ['1', '3'] },
  { id: 'exam-generator', name: 'Exam Generator', description: 'تولید سوال از PDF', creditCost: 40, icon: ClipboardList, enabledSchools: ['3', '4'] },
  { id: 'future-compass', name: 'Future Compass', description: 'هدایت شغلی', creditCost: 25, icon: Target, enabledSchools: ['3', '4'] },
  { id: 'practice-playground', name: 'Practice Playground', description: 'تمرین بازی‌گونه', creditCost: 5, icon: Gamepad2, enabledSchools: ['1', '2'] },
  { id: 'konkur-roadmap', name: 'Konkur Roadmap', description: 'برنامه‌ریزی کنکور', creditCost: 35, icon: TrendingUp, enabledSchools: ['3', '4'] },
  { id: 'parent-message', name: 'Parent Message Assistant', description: 'تولید پیام برای والدین', creditCost: 10, icon: MessageSquare, enabledSchools: ['1', '2', '3', '4'] },
  { id: 'weekly-report', name: 'Weekly Report Generator', description: 'خلاصه‌سازی یادداشت‌ها', creditCost: 20, icon: FileText, enabledSchools: ['1', '2', '3'] },
  { id: 'ews-system', name: 'EWS System', description: 'شناسایی دانش‌آموزان پرخطر', creditCost: 30, icon: AlertTriangle, enabledSchools: ['1', '2', '3', '4'] },
]

const initialGeneralFeatures: GeneralFeature[] = [
  { id: 'talent-garden', name: 'Talent Garden', description: 'باغ استعداد', icon: Award, enabledRoles: ['student', 'teacher'], subFeatures: [
    { id: 'talent-garden-student', name: 'نمای دانش‌آموز', enabledRoles: ['student'] },
    { id: 'talent-garden-teacher', name: 'نمای معلم', enabledRoles: ['teacher'] },
  ]},
  { id: 'badge-system', name: 'Badge System', description: 'نشان‌های دستاوردی', icon: Award, enabledRoles: ['student'] },
  { id: 'shop', name: 'Shop', description: 'فروشگاه مجازی', icon: ShoppingBag, enabledRoles: ['student'] },
  { id: 'streak-system', name: 'Streak System', description: 'روزهای متوالی', icon: Flame, enabledRoles: ['student', 'teacher'] },
  { id: 'financial-management', name: 'Financial Management', description: 'مدیریت مالی', icon: Wallet, enabledRoles: ['parent', 'financial_vp'], subFeatures: [
    { id: 'financial-parent', name: 'نمای والدین', enabledRoles: ['parent'] },
    { id: 'financial-vp', name: 'نمای معاون مالی', enabledRoles: ['financial_vp'] },
  ]},
  { id: 'survey-system', name: 'Survey System', description: 'نظرسنجی', icon: ClipboardList, enabledRoles: ['parent', 'principal'], subFeatures: [
    { id: 'survey-submit', name: 'ارسال نظرسنجی', enabledRoles: ['parent'] },
    { id: 'survey-results', name: 'مشاهده نتایج', enabledRoles: ['principal'] },
  ]},
  { id: 'messaging', name: 'Messaging', description: 'پیام‌رسانی', icon: MessageSquare, enabledRoles: ['teacher', 'parent', 'student', 'principal', 'counselor'] },
  { id: 'behavior-reports', name: 'Behavior Reports', description: 'گزارش‌های رفتاری', icon: Shield, enabledRoles: ['teacher', 'disciplinary_vp'] },
  { id: 'health-reports', name: 'Health Reports', description: 'گزارش‌های بهداشت', icon: Heart, enabledRoles: ['health_vp'] },
  { id: 'activity-reports', name: 'Activity Reports', description: 'گزارش‌های پرورشی', icon: Sparkles, enabledRoles: ['educational_vp'] },
  { id: 'art-reports', name: 'Art Reports', description: 'گزارش هنر', icon: Palette, enabledRoles: ['art_teacher'] },
  { id: 'sports-reports', name: 'Sports Reports', description: 'گزارش ورزش', icon: Dumbbell, enabledRoles: ['sports_teacher'] },
]

const usageStats: UsageStats[] = [
  { featureId: 'student-analyzer', schoolId: '1', usageCount: 145, activeUsers: 12 },
  { featureId: 'problem-solver', schoolId: '1', usageCount: 320, activeUsers: 45 },
  { featureId: 'study-buddy', schoolId: '1', usageCount: 580, activeUsers: 78 },
  { featureId: 'parent-message', schoolId: '1', usageCount: 89, activeUsers: 8 },
  { featureId: 'weekly-report', schoolId: '1', usageCount: 24, activeUsers: 6 },
  { featureId: 'student-analyzer', schoolId: '2', usageCount: 98, activeUsers: 8 },
  { featureId: 'problem-solver', schoolId: '2', usageCount: 210, activeUsers: 35 },
  { featureId: 'story-wizard', schoolId: '2', usageCount: 156, activeUsers: 42 },
  { featureId: 'student-analyzer', schoolId: '3', usageCount: 210, activeUsers: 15 },
  { featureId: 'exam-generator', schoolId: '3', usageCount: 67, activeUsers: 5 },
  { featureId: 'konkur-roadmap', schoolId: '3', usageCount: 89, activeUsers: 28 },
]

// ============================================
// کامپوننت Toggle Switch
// ============================================
interface ToggleSwitchProps {
  enabled: boolean
  onChange: () => void
  size?: 'sm' | 'md'
}

function ToggleSwitch({ enabled, onChange, size = 'md' }: ToggleSwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  }

  return (
    <button
      onClick={onChange}
      className={`${sizes[size].track} rounded-full p-0.5 transition-colors ${
        enabled ? 'bg-green-500' : 'bg-white/20'
      }`}
    >
      <div
        className={`${sizes[size].thumb} bg-white rounded-full transition-transform ${
          enabled ? '' : sizes[size].translate
        }`}
      />
    </button>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function FeaturesManagementPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'general' | 'stats'>('ai')
  const [aiFeatures, setAIFeatures] = useState<AIFeature[]>(initialAIFeatures)
  const [generalFeatures, setGeneralFeatures] = useState<GeneralFeature[]>(initialGeneralFeatures)
  const [selectedSchoolForStats, setSelectedSchoolForStats] = useState('1')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // تنظیمات پیشرفته
  const [advancedSettings, setAdvancedSettings] = useState({
    dailyLimit: 100,
    monthlyLimit: 2000,
    limitAction: 'warning',
    autoEWS: true,
    autoWeeklyReport: true,
    notifyAt80: true,
    notifyOnDisable: true,
  })

  // Toggle AI Feature برای مدرسه
  const toggleAIFeature = (featureId: string, schoolId: string) => {
    setAIFeatures(prev => prev.map(f => {
      if (f.id === featureId) {
        const enabled = f.enabledSchools.includes(schoolId)
        return {
          ...f,
          enabledSchools: enabled
            ? f.enabledSchools.filter(s => s !== schoolId)
            : [...f.enabledSchools, schoolId]
        }
      }
      return f
    }))
  }

  // Toggle General Feature برای نقش
  const toggleGeneralFeature = (featureId: string, roleId: string) => {
    setGeneralFeatures(prev => prev.map(f => {
      if (f.id === featureId) {
        const enabled = f.enabledRoles.includes(roleId)
        return {
          ...f,
          enabledRoles: enabled
            ? f.enabledRoles.filter(r => r !== roleId)
            : [...f.enabledRoles, roleId]
        }
      }
      return f
    }))
  }

  // فعال/غیرفعال همه برای مدرسه
  const toggleAllForSchool = (schoolId: string, enable: boolean) => {
    setAIFeatures(prev => prev.map(f => ({
      ...f,
      enabledSchools: enable
        ? [...new Set([...f.enabledSchools, schoolId])]
        : f.enabledSchools.filter(s => s !== schoolId)
    })))
  }

  // فعال/غیرفعال همه برای نقش
  const toggleAllForRole = (roleId: string, enable: boolean) => {
    setGeneralFeatures(prev => prev.map(f => ({
      ...f,
      enabledRoles: enable
        ? [...new Set([...f.enabledRoles, roleId])]
        : f.enabledRoles.filter(r => r !== roleId)
    })))
  }

  // آمار مدرسه انتخابی
  const schoolStats = useMemo(() => {
    const stats = usageStats.filter(s => s.schoolId === selectedSchoolForStats)
    const enabledAI = aiFeatures.filter(f => f.enabledSchools.includes(selectedSchoolForStats)).length
    const totalUsage = stats.reduce((sum, s) => sum + s.usageCount, 0)
    return { stats, enabledAI, totalUsage }
  }, [selectedSchoolForStats, aiFeatures])

  // ذخیره تنظیمات
  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/30 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
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
                  <Settings className="w-8 h-8 text-indigo-400" />
                  مدیریت قابلیت‌های پلتفرم
                </h1>
                <p className="text-white/60 mt-1">
                  فعال/غیرفعال‌سازی قابلیت‌ها برای مدارس و نقش‌های کاربری
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ذخیره...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  ذخیره شد!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  ذخیره تغییرات
                </>
              )}
            </button>
          </div>
        </header>

        {/* ==================== Tabs ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden mb-6">
          <div className="flex border-b border-white/10">
            {[
              { key: 'ai', label: 'قابلیت‌های هوش مصنوعی', icon: Sparkles },
              { key: 'general', label: 'قابلیت‌های عمومی', icon: Layout },
              { key: 'stats', label: 'آمار استفاده', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all ${
                    activeTab === tab.key
                      ? 'bg-white/10 text-white border-b-2 border-indigo-500'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* ==================== تب قابلیت‌های AI ==================== */}
          {activeTab === 'ai' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  فعال‌سازی به تفکیک مدرسه
                </h2>
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {schools.map(school => (
                  <div key={school.id} className="flex gap-1">
                    <button
                      onClick={() => toggleAllForSchool(school.id, true)}
                      className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30"
                    >
                      فعال همه - {school.name}
                    </button>
                    <button
                      onClick={() => toggleAllForSchool(school.id, false)}
                      className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30"
                    >
                      غیرفعال
                    </button>
                  </div>
                ))}
              </div>

              {/* جدول */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800/90 backdrop-blur">
                    <tr className="text-white/60 border-b border-white/10">
                      <th className="text-right py-3 px-4 font-medium min-w-[200px]">نام قابلیت</th>
                      <th className="text-right py-3 px-4 font-medium min-w-[150px]">توضیح</th>
                      <th className="text-center py-3 px-4 font-medium">مصرف Credit</th>
                      {schools.map(school => (
                        <th key={school.id} className="text-center py-3 px-4 font-medium min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <Building className="w-4 h-4 mb-1" />
                            <span className="text-xs">{school.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {aiFeatures.map((feature) => {
                      const Icon = feature.icon
                      return (
                        <tr key={feature.id} className="hover:bg-white/5">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <Icon className="w-4 h-4 text-indigo-400" />
                              </div>
                              <span className="text-white font-medium">{feature.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white/60">{feature.description}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs">
                              {feature.creditCost} credit
                            </span>
                          </td>
                          {schools.map(school => {
                            const enabled = feature.enabledSchools.includes(school.id)
                            return (
                              <td key={school.id} className="py-3 px-4 text-center">
                                <ToggleSwitch
                                  enabled={enabled}
                                  onChange={() => toggleAIFeature(feature.id, school.id)}
                                  size="sm"
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== تب قابلیت‌های عمومی ==================== */}
          {activeTab === 'general' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  فعال‌سازی به تفکیک نقش کاربری
                </h2>
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {roles.slice(0, 5).map(role => (
                  <div key={role.id} className="flex gap-1">
                    <button
                      onClick={() => toggleAllForRole(role.id, true)}
                      className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30"
                    >
                      فعال - {role.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* جدول */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800/90 backdrop-blur">
                    <tr className="text-white/60 border-b border-white/10">
                      <th className="text-right py-3 px-4 font-medium min-w-[180px]">نام قابلیت</th>
                      <th className="text-right py-3 px-4 font-medium min-w-[120px]">توضیح</th>
                      {roles.map(role => (
                        <th key={role.id} className="text-center py-3 px-2 font-medium">
                          <span className="text-xs">{role.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {generalFeatures.map((feature) => {
                      const Icon = feature.icon
                      return (
                        <tr key={feature.id} className="hover:bg-white/5">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Icon className="w-4 h-4 text-green-400" />
                              </div>
                              <span className="text-white font-medium">{feature.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white/60">{feature.description}</td>
                          {roles.map(role => {
                            const enabled = feature.enabledRoles.includes(role.id)
                            return (
                              <td key={role.id} className="py-3 px-2 text-center">
                                <ToggleSwitch
                                  enabled={enabled}
                                  onChange={() => toggleGeneralFeature(feature.id, role.id)}
                                  size="sm"
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== تب آمار استفاده ==================== */}
          {activeTab === 'stats' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  گزارش مصرف به تفکیک مدرسه
                </h2>
                <select
                  value={selectedSchoolForStats}
                  onChange={(e) => setSelectedSchoolForStats(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none"
                >
                  {schools.map(school => (
                    <option key={school.id} value={school.id} className="bg-slate-800">
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* کارت‌های خلاصه */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-500/20 rounded-xl p-4 border border-indigo-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-indigo-400 text-sm">قابلیت‌های AI فعال</p>
                      <p className="text-white text-2xl font-bold">{schoolStats.enabledAI}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Layout className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-green-400 text-sm">قابلیت‌های عمومی فعال</p>
                      <p className="text-white text-2xl font-bold">{generalFeatures.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-purple-400 text-sm">کل استفاده این ماه</p>
                      <p className="text-white text-2xl font-bold">{schoolStats.totalUsage}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* نمودار میله‌ای ساده */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="text-white font-medium mb-4">استفاده از هر قابلیت AI</h3>
                <div className="space-y-3">
                  {schoolStats.stats.map((stat) => {
                    const feature = aiFeatures.find(f => f.id === stat.featureId)
                    const maxUsage = Math.max(...schoolStats.stats.map(s => s.usageCount))
                    const percentage = (stat.usageCount / maxUsage) * 100
                    return (
                      <div key={stat.featureId} className="flex items-center gap-3">
                        <span className="text-white/70 w-40 text-sm truncate">{feature?.name}</span>
                        <div className="flex-1 h-6 bg-white/10 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-end px-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-bold">{stat.usageCount}</span>
                          </div>
                        </div>
                        <span className="text-white/50 text-xs w-20">{stat.activeUsers} کاربر</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* جدول پرکاربردترین */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-medium mb-4">پرکاربردترین قابلیت‌ها</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="text-right py-2 font-medium">قابلیت</th>
                      <th className="text-center py-2 font-medium">تعداد استفاده</th>
                      <th className="text-center py-2 font-medium">کاربران فعال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {schoolStats.stats
                      .sort((a, b) => b.usageCount - a.usageCount)
                      .slice(0, 5)
                      .map((stat, index) => {
                        const feature = aiFeatures.find(f => f.id === stat.featureId)
                        return (
                          <tr key={stat.featureId}>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                  index === 1 ? 'bg-gray-400 text-gray-900' :
                                  index === 2 ? 'bg-orange-500 text-orange-900' :
                                  'bg-white/10 text-white/60'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="text-white">{feature?.name}</span>
                              </div>
                            </td>
                            <td className="py-2 text-center text-purple-400 font-bold">{stat.usageCount}</td>
                            <td className="py-2 text-center text-white/60">{stat.activeUsers}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ==================== تنظیمات پیشرفته ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            تنظیمات پیشرفته
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* محدودیت استفاده */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                محدودیت استفاده
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-1 block">حداکثر استفاده روزانه</label>
                  <input
                    type="number"
                    value={advancedSettings.dailyLimit}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, dailyLimit: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 block">حداکثر استفاده ماهانه</label>
                  <input
                    type="number"
                    value={advancedSettings.monthlyLimit}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, monthlyLimit: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 block">اگر تمام شد</label>
                  <select
                    value={advancedSettings.limitAction}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, limitAction: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="stop" className="bg-slate-800">متوقف شود</option>
                    <option value="warning" className="bg-slate-800">اجازه با warning</option>
                  </select>
                </div>
              </div>
            </div>

            {/* زمان‌بندی */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                زمان‌بندی
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedSettings.autoEWS}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, autoEWS: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white text-sm">فعال‌سازی خودکار EWS هر ۳۰ روز</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedSettings.autoWeeklyReport}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, autoWeeklyReport: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white text-sm">فعال‌سازی Weekly Report هر جمعه</span>
                </label>
              </div>
            </div>

            {/* اعلان‌ها */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-400" />
                اعلان‌ها
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedSettings.notifyAt80}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, notifyAt80: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white text-sm">اعلان هنگام رسیدن به ۸۰٪ اعتبار</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedSettings.notifyOnDisable}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, notifyOnDisable: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white text-sm">اعلان هنگام غیرفعال شدن قابلیت</span>
                </label>
              </div>
            </div>
          </div>

          {/* راهنما */}
          <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white mb-1">عملکرد Toggle Switch:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>وقتی قابلیتی غیرفعال شود، از منوی کاربران حذف می‌شود</li>
                  <li>آیتم‌های غیرفعال با icon قفل نمایش داده می‌شوند</li>
                  <li>دسترسی مستقیم به URL: صفحه 403 Forbidden</li>
                </ul>
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










