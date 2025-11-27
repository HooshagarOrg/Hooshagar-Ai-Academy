'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Award,
  ArrowRight,
  Trophy,
  Star,
  BookOpen,
  Target,
  Dumbbell,
  Brain,
  Palette,
  Dribbble,
  Lock,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
  Heart,
  Medal,
  Crown,
  Sparkles,
  Calendar,
  TrendingUp,
  Gift,
  Rocket,
  Music,
  Lightbulb,
  Users,
  MessageCircle,
  Shield,
  Gem,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface Badge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  emoji: string
  color: string
  glowColor: string
  unlocked: boolean
  unlockedDate?: string
  progress?: number
  requirement?: string
  category: 'academic' | 'social' | 'sports' | 'creative' | 'special'
}

interface Achievement {
  id: string
  badgeId: string
  badgeName: string
  emoji: string
  date: string
  message: string
}

// ============================================
// داده‌های نمونه
// ============================================
const allBadges: Badge[] = [
  // نشان‌های کسب شده
  {
    id: '1',
    name: 'مطالعه‌گر حرفه‌ای',
    description: '100 روز مطالعه متوالی',
    icon: <BookOpen className="w-8 h-8" />,
    emoji: '🏆',
    color: 'from-yellow-400 to-orange-500',
    glowColor: 'shadow-yellow-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۹/۱۰',
    category: 'academic',
  },
  {
    id: '2',
    name: 'ستاره کلاس',
    description: 'بالاترین نمره 5 بار',
    icon: <Star className="w-8 h-8" />,
    emoji: '⭐',
    color: 'from-amber-400 to-yellow-500',
    glowColor: 'shadow-amber-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۹/۰۵',
    category: 'academic',
  },
  {
    id: '3',
    name: 'کتابخوان',
    description: '10 کتاب خوانده شده',
    icon: <BookOpen className="w-8 h-8" />,
    emoji: '📚',
    color: 'from-blue-400 to-indigo-500',
    glowColor: 'shadow-blue-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۸/۲۵',
    category: 'academic',
  },
  {
    id: '4',
    name: 'هدفمند',
    description: 'تمام تکالیف یک ماه انجام شده',
    icon: <Target className="w-8 h-8" />,
    emoji: '🎯',
    color: 'from-red-400 to-rose-500',
    glowColor: 'shadow-red-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۸/۲۰',
    category: 'academic',
  },
  {
    id: '5',
    name: 'پشتکار',
    description: '30 روز حضور کامل',
    icon: <Flame className="w-8 h-8" />,
    emoji: '💪',
    color: 'from-orange-400 to-red-500',
    glowColor: 'shadow-orange-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۸/۱۵',
    category: 'academic',
  },
  {
    id: '6',
    name: 'مغز متفکر',
    description: '50 سوال حل شده',
    icon: <Brain className="w-8 h-8" />,
    emoji: '🧠',
    color: 'from-purple-400 to-pink-500',
    glowColor: 'shadow-purple-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۸/۱۰',
    category: 'academic',
  },
  {
    id: '7',
    name: 'هنرمند',
    description: 'نمره عالی در هنر',
    icon: <Palette className="w-8 h-8" />,
    emoji: '🎨',
    color: 'from-pink-400 to-purple-500',
    glowColor: 'shadow-pink-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۸/۰۵',
    category: 'creative',
  },
  {
    id: '8',
    name: 'ورزشکار',
    description: 'فعالیت ورزشی فعال',
    icon: <Dribbble className="w-8 h-8" />,
    emoji: '⚽',
    color: 'from-green-400 to-emerald-500',
    glowColor: 'shadow-green-500/50',
    unlocked: true,
    unlockedDate: '۱۴۰۳/۰۷/۲۸',
    category: 'sports',
  },
  // نشان‌های قفل شده
  {
    id: '9',
    name: 'نابغه ریاضی',
    description: '100 سوال ریاضی درست',
    icon: <Lightbulb className="w-8 h-8" />,
    emoji: '💡',
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'shadow-cyan-500/50',
    unlocked: false,
    progress: 75,
    requirement: '۲۵ سوال دیگر مانده',
    category: 'academic',
  },
  {
    id: '10',
    name: 'دوست همه',
    description: 'کمک به 10 همکلاسی',
    icon: <Users className="w-8 h-8" />,
    emoji: '🤝',
    color: 'from-teal-400 to-green-500',
    glowColor: 'shadow-teal-500/50',
    unlocked: false,
    progress: 60,
    requirement: '۴ کمک دیگر مانده',
    category: 'social',
  },
  {
    id: '11',
    name: 'خوش‌اخلاق',
    description: '20 رفتار مثبت ثبت شده',
    icon: <Heart className="w-8 h-8" />,
    emoji: '💖',
    color: 'from-rose-400 to-pink-500',
    glowColor: 'shadow-rose-500/50',
    unlocked: false,
    progress: 85,
    requirement: '۳ رفتار مثبت دیگر',
    category: 'social',
  },
  {
    id: '12',
    name: 'قهرمان',
    description: 'رتبه اول در 3 آزمون',
    icon: <Trophy className="w-8 h-8" />,
    emoji: '🥇',
    color: 'from-yellow-400 to-amber-500',
    glowColor: 'shadow-yellow-500/50',
    unlocked: false,
    progress: 33,
    requirement: '۲ آزمون دیگر',
    category: 'academic',
  },
  {
    id: '13',
    name: 'سخنران',
    description: '5 ارائه کلاسی',
    icon: <MessageCircle className="w-8 h-8" />,
    emoji: '🎤',
    color: 'from-indigo-400 to-purple-500',
    glowColor: 'shadow-indigo-500/50',
    unlocked: false,
    progress: 40,
    requirement: '۳ ارائه دیگر',
    category: 'social',
  },
  {
    id: '14',
    name: 'موسیقیدان',
    description: 'شرکت در گروه موسیقی',
    icon: <Music className="w-8 h-8" />,
    emoji: '🎵',
    color: 'from-violet-400 to-purple-500',
    glowColor: 'shadow-violet-500/50',
    unlocked: false,
    progress: 0,
    requirement: 'عضویت در گروه موسیقی',
    category: 'creative',
  },
  {
    id: '15',
    name: 'دانشمند',
    description: 'برنده مسابقه علمی',
    icon: <Rocket className="w-8 h-8" />,
    emoji: '🚀',
    color: 'from-blue-400 to-cyan-500',
    glowColor: 'shadow-blue-500/50',
    unlocked: false,
    progress: 0,
    requirement: 'شرکت در مسابقه علمی',
    category: 'academic',
  },
  {
    id: '16',
    name: 'مدافع',
    description: '10 بار کمک به تیم',
    icon: <Shield className="w-8 h-8" />,
    emoji: '🛡️',
    color: 'from-slate-400 to-gray-500',
    glowColor: 'shadow-slate-500/50',
    unlocked: false,
    progress: 50,
    requirement: '۵ کمک دیگر',
    category: 'sports',
  },
  {
    id: '17',
    name: 'نخبه',
    description: 'میانگین بالای 19',
    icon: <Crown className="w-8 h-8" />,
    emoji: '👑',
    color: 'from-amber-400 to-yellow-500',
    glowColor: 'shadow-amber-500/50',
    unlocked: false,
    progress: 90,
    requirement: '۰.۵ نمره دیگر',
    category: 'academic',
  },
  {
    id: '18',
    name: 'خلاق',
    description: '5 پروژه خلاقانه',
    icon: <Sparkles className="w-8 h-8" />,
    emoji: '✨',
    color: 'from-fuchsia-400 to-pink-500',
    glowColor: 'shadow-fuchsia-500/50',
    unlocked: false,
    progress: 20,
    requirement: '۴ پروژه دیگر',
    category: 'creative',
  },
  {
    id: '19',
    name: 'صبور',
    description: '60 روز بدون غیبت',
    icon: <Clock className="w-8 h-8" />,
    emoji: '⏰',
    color: 'from-emerald-400 to-green-500',
    glowColor: 'shadow-emerald-500/50',
    unlocked: false,
    progress: 50,
    requirement: '۳۰ روز دیگر',
    category: 'academic',
  },
  {
    id: '20',
    name: 'الماس',
    description: 'کسب 10 نشان دیگر',
    icon: <Gem className="w-8 h-8" />,
    emoji: '💎',
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'shadow-cyan-500/50',
    unlocked: false,
    progress: 80,
    requirement: '۲ نشان دیگر',
    category: 'special',
  },
  {
    id: '21',
    name: 'اسطوره',
    description: 'کسب تمام نشان‌های پایه',
    icon: <Medal className="w-8 h-8" />,
    emoji: '🏅',
    color: 'from-orange-400 to-red-500',
    glowColor: 'shadow-orange-500/50',
    unlocked: false,
    progress: 40,
    requirement: '۱۲ نشان دیگر',
    category: 'special',
  },
  {
    id: '22',
    name: 'انرژی مثبت',
    description: '50 روز با روحیه عالی',
    icon: <Zap className="w-8 h-8" />,
    emoji: '⚡',
    color: 'from-yellow-400 to-orange-500',
    glowColor: 'shadow-yellow-500/50',
    unlocked: false,
    progress: 70,
    requirement: '۱۵ روز دیگر',
    category: 'social',
  },
  {
    id: '23',
    name: 'کاشف',
    description: 'استفاده از تمام ابزارهای AI',
    icon: <Brain className="w-8 h-8" />,
    emoji: '🔍',
    color: 'from-purple-400 to-indigo-500',
    glowColor: 'shadow-purple-500/50',
    unlocked: false,
    progress: 60,
    requirement: '۲ ابزار دیگر',
    category: 'special',
  },
  {
    id: '24',
    name: 'رکوردشکن',
    description: 'بهترین رکورد در زمین بازی',
    icon: <TrendingUp className="w-8 h-8" />,
    emoji: '📈',
    color: 'from-green-400 to-teal-500',
    glowColor: 'shadow-green-500/50',
    unlocked: false,
    progress: 45,
    requirement: 'امتیاز بالاتر لازم',
    category: 'special',
  },
  {
    id: '25',
    name: 'VIP',
    description: '1000 XP جمع‌آوری شده',
    icon: <Gift className="w-8 h-8" />,
    emoji: '🎁',
    color: 'from-rose-400 to-red-500',
    glowColor: 'shadow-rose-500/50',
    unlocked: false,
    progress: 65,
    requirement: '۳۵۰ XP دیگر',
    category: 'special',
  },
]

const recentAchievements: Achievement[] = [
  { id: '1', badgeId: '1', badgeName: 'مطالعه‌گر حرفه‌ای', emoji: '🏆', date: '۱۴۰۳/۰۹/۱۰', message: 'تبریک! 100 روز مطالعه متوالی رو تکمیل کردی!' },
  { id: '2', badgeId: '2', badgeName: 'ستاره کلاس', emoji: '⭐', date: '۱۴۰۳/۰۹/۰۵', message: 'عالی! برای پنجمین بار بالاترین نمره رو گرفتی!' },
  { id: '3', badgeId: '3', badgeName: 'کتابخوان', emoji: '📚', date: '۱۴۰۳/۰۸/۲۵', message: 'آفرین! 10 کتاب خوندی!' },
  { id: '4', badgeId: '4', badgeName: 'هدفمند', emoji: '🎯', date: '۱۴۰۳/۰۸/۲۰', message: 'تمام تکالیف ماه رو انجام دادی!' },
  { id: '5', badgeId: '5', badgeName: 'پشتکار', emoji: '💪', date: '۱۴۰۳/۰۸/۱۵', message: '30 روز حضور کامل! عالی بود!' },
]

// ============================================
// کامپوننت Badge کسب شده
// ============================================
interface UnlockedBadgeProps {
  badge: Badge
}

function UnlockedBadge({ badge }: UnlockedBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-gradient-to-br ${badge.color} rounded-2xl p-5 transition-all duration-300 cursor-pointer
        ${isHovered ? `scale-105 shadow-2xl ${badge.glowColor}` : 'shadow-lg'}`}
    >
      {/* گlow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${badge.color} rounded-2xl blur-xl opacity-50 -z-10`} />

      {/* محتوا */}
      <div className="text-center relative z-10">
        <div className="text-5xl mb-3 animate-bounce">
          {badge.emoji}
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-2 mb-2">
          {badge.icon}
        </div>
        <h3 className="text-white font-bold text-sm mb-1">{badge.name}</h3>
        <p className="text-white/70 text-xs">{badge.description}</p>
        {badge.unlockedDate && (
          <p className="text-white/50 text-xs mt-2 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {badge.unlockedDate}
          </p>
        )}
      </div>

      {/* نشان تایید */}
      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
        <CheckCircle2 className="w-4 h-4 text-white" />
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Badge قفل شده
// ============================================
interface LockedBadgeProps {
  badge: Badge
}

function LockedBadge({ badge }: LockedBadgeProps) {
  return (
    <div className="relative bg-white/5 rounded-2xl p-5 border border-white/10 transition-all hover:bg-white/10">
      {/* محتوا */}
      <div className="text-center grayscale opacity-60">
        <div className="text-5xl mb-3">
          {badge.emoji}
        </div>
        <div className="bg-white/10 rounded-xl p-2 mb-2 text-white/40">
          {badge.icon}
        </div>
        <h3 className="text-white/60 font-bold text-sm mb-1">{badge.name}</h3>
        <p className="text-white/40 text-xs">{badge.description}</p>
      </div>

      {/* Progress */}
      {badge.progress !== undefined && badge.progress > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${badge.color} rounded-full transition-all duration-500`}
              style={{ width: `${badge.progress}%` }}
            />
          </div>
          <p className="text-white/50 text-xs mt-1 text-center">{badge.progress}%</p>
        </div>
      )}

      {/* شرط کسب */}
      {badge.requirement && (
        <p className="text-white/40 text-xs mt-2 text-center flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {badge.requirement}
        </p>
      )}

      {/* آیکون قفل */}
      <div className="absolute -top-2 -right-2 bg-gray-600 rounded-full p-1.5 shadow-lg">
        <Lock className="w-3 h-3 text-white" />
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Timeline دستاورد
// ============================================
interface AchievementTimelineProps {
  achievements: Achievement[]
}

function AchievementTimeline({ achievements }: AchievementTimelineProps) {
  return (
    <div className="space-y-4">
      {achievements.map((achievement, index) => (
        <div key={achievement.id} className="flex gap-4">
          {/* خط عمودی */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
              {achievement.emoji}
            </div>
            {index < achievements.length - 1 && (
              <div className="w-0.5 flex-1 bg-gradient-to-b from-yellow-500/50 to-transparent mt-2" />
            )}
          </div>

          {/* محتوا */}
          <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-white font-bold">{achievement.badgeName}</h4>
              <span className="text-white/50 text-xs">{achievement.date}</span>
            </div>
            <p className="text-white/60 text-sm">{achievement.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function BadgesPage() {
  const unlockedBadges = allBadges.filter(b => b.unlocked)
  const lockedBadges = allBadges.filter(b => !b.unlocked)

  const totalBadges = allBadges.length
  const earnedBadges = unlockedBadges.length
  const progressPercentage = Math.round((earnedBadges / totalBadges) * 100)

  // دسته‌بندی
  const categories = [
    { id: 'all', label: 'همه', count: allBadges.length },
    { id: 'academic', label: 'تحصیلی', count: allBadges.filter(b => b.category === 'academic').length },
    { id: 'social', label: 'اجتماعی', count: allBadges.filter(b => b.category === 'social').length },
    { id: 'sports', label: 'ورزشی', count: allBadges.filter(b => b.category === 'sports').length },
    { id: 'creative', label: 'خلاقیت', count: allBadges.filter(b => b.category === 'creative').length },
    { id: 'special', label: 'ویژه', count: allBadges.filter(b => b.category === 'special').length },
  ]

  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredUnlocked = selectedCategory === 'all'
    ? unlockedBadges
    : unlockedBadges.filter(b => b.category === selectedCategory)

  const filteredLocked = selectedCategory === 'all'
    ? lockedBadges
    : lockedBadges.filter(b => b.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/student/talent-garden"
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-300" />
                  نشان‌های من
                </h1>
                <p className="text-white/60 mt-1">
                  جمع‌آوری نشان‌های دستاوردی
                </p>
              </div>
            </div>

            {/* آمار */}
            <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl px-6 py-4 border border-yellow-500/30">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-yellow-400 text-3xl font-bold">{earnedBadges}</p>
                  <p className="text-white/60 text-xs">کسب شده</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className="text-white/80 text-3xl font-bold">{totalBadges}</p>
                  <p className="text-white/60 text-xs">کل نشان‌ها</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-white/50 text-xs mt-1 text-center">{progressPercentage}% تکمیل شده</p>
              </div>
            </div>
          </div>
        </header>

        {/* ==================== دسته‌بندی ==================== */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap
                ${selectedCategory === cat.id
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
            >
              {cat.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                selectedCategory === cat.id ? 'bg-orange-100 text-orange-600' : 'bg-white/20'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* ==================== نشان‌های کسب شده ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            نشان‌های کسب شده
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              {filteredUnlocked.length} نشان
            </span>
          </h2>

          {filteredUnlocked.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredUnlocked.map((badge) => (
                <UnlockedBadge key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50">هنوز نشانی در این دسته کسب نکرده‌ای</p>
            </div>
          )}
        </div>

        {/* ==================== نشان‌های قفل شده ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-white/50" />
            نشان‌های قفل شده
            <span className="bg-white/10 text-white/50 px-3 py-1 rounded-full text-sm">
              {filteredLocked.length} نشان
            </span>
          </h2>

          {filteredLocked.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredLocked.map((badge) => (
                <LockedBadge key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white/70">همه نشان‌های این دسته رو گرفتی! 🎉</p>
            </div>
          )}
        </div>

        {/* ==================== آخرین دستاوردها ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            آخرین دستاوردها
          </h2>

          <AchievementTimeline achievements={recentAchievements} />
        </div>

        {/* ==================== پیام انگیزشی ==================== */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 text-center">
          <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            🌟 ادامه بده، داری عالی پیش میری!
          </h3>
          <p className="text-white/70 max-w-xl mx-auto">
            هر نشان نشون‌دهنده یه دستاورد بزرگه. با تلاش و پشتکار می‌تونی همه نشان‌ها رو جمع کنی!
          </p>
        </div>

        {/* ==================== Footer ==================== */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>🎓 یادگیری با هوشاگر، لذت‌بخش و هوشمند!</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}

