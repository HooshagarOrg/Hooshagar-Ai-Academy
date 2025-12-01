'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Medal, 
  Trophy, 
  Lock, 
  Check,
  Star,
  Eye,
  EyeOff,
  Sparkles,
  Gift,
  Target,
  Calendar,
  User,
  Info,
  ChevronLeft,
  ChevronRight,
  Pin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Badge as BadgeType,
  UserBadge,
  BadgeWithStatus,
  BadgeCategory,
  BadgeRarity,
  UserBadgeStats,
  BADGE_CATEGORY_CONFIG,
  BADGE_RARITY_CONFIG,
  formatAwardCondition,
  formatBadgeDate,
  calculateProgress,
} from '@/lib/types/badge.types'

// داده نمونه کاربر
const SAMPLE_USER = {
  id: '1',
  full_name: 'علی رضایی',
  level: 8,
  xp: 4500,
  streak_days: 14,
}

// داده نمونه آمار
const SAMPLE_STATS: UserBadgeStats = {
  total_badges: 12,
  total_available: 35,
  by_rarity: {
    common: { owned: 8, total: 15 },
    rare: { owned: 3, total: 12 },
    epic: { owned: 1, total: 6 },
    legendary: { owned: 0, total: 2 },
  },
  by_category: {
    academic: { owned: 4, total: 9 },
    behavior: { owned: 2, total: 5 },
    attendance: { owned: 3, total: 5 },
    social: { owned: 1, total: 3 },
    special: { owned: 0, total: 6 },
    achievement: { owned: 2, total: 7 },
  },
  unseen_count: 2,
  displayed_badges: [
    { id: '1', name: 'دانش‌پژوه', icon_emoji: '📚', rarity: 'common' },
    { id: '2', name: 'حاضرجواب', icon_emoji: '📅', rarity: 'common' },
    { id: '3', name: 'دوست مهربان', icon_emoji: '💝', rarity: 'rare' },
  ],
}

// داده نمونه نشان‌ها
const SAMPLE_BADGES: BadgeWithStatus[] = [
  // دریافت شده
  {
    id: '1', name: 'تازه‌کار', name_en: 'Newbie', description: 'اولین قدم در مسیر یادگیری',
    icon_url: '/badges/newbie.png', icon_locked_url: null, icon_emoji: '🌱',
    category: 'academic', rarity: 'common', auto_award: true,
    award_condition: { type: 'xp_total', value: 100 }, xp_reward: 50,
    is_active: true, is_secret: false, sort_order: 1, created_at: '', updated_at: '',
    is_owned: true,
    user_badge: {
      id: 'ub1', user_id: '1', badge_id: '1', awarded_by: 'auto',
      awarded_by_user_id: null, award_reason: null, is_displayed: false,
      display_order: 0, is_seen: true, awarded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    owners_count: 15234
  },
  {
    id: '2', name: 'دانش‌آموز', name_en: 'Student', description: 'کسب 500 امتیاز XP',
    icon_url: '/badges/student.png', icon_locked_url: null, icon_emoji: '📖',
    category: 'academic', rarity: 'common', auto_award: true,
    award_condition: { type: 'xp_total', value: 500 }, xp_reward: 75,
    is_active: true, is_secret: false, sort_order: 2, created_at: '', updated_at: '',
    is_owned: true,
    user_badge: {
      id: 'ub2', user_id: '1', badge_id: '2', awarded_by: 'auto',
      awarded_by_user_id: null, award_reason: null, is_displayed: false,
      display_order: 0, is_seen: true, awarded_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    owners_count: 12456
  },
  {
    id: '3', name: 'دانش‌پژوه', name_en: 'Knowledge Seeker', description: 'کسب 1000 امتیاز XP',
    icon_url: '/badges/scholar.png', icon_locked_url: null, icon_emoji: '📚',
    category: 'academic', rarity: 'common', auto_award: true,
    award_condition: { type: 'xp_total', value: 1000 }, xp_reward: 100,
    is_active: true, is_secret: false, sort_order: 3, created_at: '', updated_at: '',
    is_owned: true,
    user_badge: {
      id: 'ub3', user_id: '1', badge_id: '3', awarded_by: 'auto',
      awarded_by_user_id: null, award_reason: null, is_displayed: true,
      display_order: 1, is_seen: true, awarded_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    owners_count: 8765
  },
  {
    id: '4', name: 'پژوهشگر', name_en: 'Researcher', description: 'کسب 2500 امتیاز XP',
    icon_url: '/badges/researcher.png', icon_locked_url: null, icon_emoji: '🔬',
    category: 'academic', rarity: 'rare', auto_award: true,
    award_condition: { type: 'xp_total', value: 2500 }, xp_reward: 250,
    is_active: true, is_secret: false, sort_order: 4, created_at: '', updated_at: '',
    is_owned: true,
    user_badge: {
      id: 'ub4', user_id: '1', badge_id: '4', awarded_by: 'auto',
      awarded_by_user_id: null, award_reason: null, is_displayed: false,
      display_order: 0, is_seen: false, awarded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    owners_count: 3456
  },
  {
    id: '15', name: 'حاضرجواب', name_en: 'Always Present', description: 'حضور کامل به مدت 30 روز',
    icon_url: '/badges/present30.png', icon_locked_url: null, icon_emoji: '📅',
    category: 'attendance', rarity: 'common', auto_award: true,
    award_condition: { type: 'perfect_attendance_days', value: 30 }, xp_reward: 150,
    is_active: true, is_secret: false, sort_order: 31, created_at: '', updated_at: '',
    is_owned: true,
    user_badge: {
      id: 'ub15', user_id: '1', badge_id: '15', awarded_by: 'auto',
      awarded_by_user_id: null, award_reason: null, is_displayed: true,
      display_order: 2, is_seen: true, awarded_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    owners_count: 5678
  },
  {
    id: '10', name: 'دوست مهربان', name_en: 'Kind Friend', description: 'رفتار نمونه و مهربانی مستمر',
    icon_url: '/badges/kind.png', icon_locked_url: null, icon_emoji: '💝',
    category: 'behavior', rarity: 'rare', auto_award: false,
    award_condition: null, xp_reward: 100,
    is_active: true, is_secret: false, sort_order: 22, created_at: '', updated_at: '',
    is_owned: true,
    user_badge: {
      id: 'ub10', user_id: '1', badge_id: '10', awarded_by: 'teacher',
      awarded_by_user_id: 'teacher1', award_reason: 'به خاطر کمک مستمر به همکلاسی‌ها',
      is_displayed: true, display_order: 3, is_seen: true,
      awarded_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    owners_count: 2345
  },
  
  // قفل شده
  {
    id: '5', name: 'دانشمند', name_en: 'Scientist', description: 'کسب 5000 امتیاز XP',
    icon_url: '/badges/scientist.png', icon_locked_url: null, icon_emoji: '🧪',
    category: 'academic', rarity: 'rare', auto_award: true,
    award_condition: { type: 'xp_total', value: 5000 }, xp_reward: 500,
    is_active: true, is_secret: false, sort_order: 5, created_at: '', updated_at: '',
    is_owned: false,
    progress: { id: 'p5', user_id: '1', badge_id: '5', current_value: 4500, target_value: 5000, last_updated: '' },
    owners_count: 1234
  },
  {
    id: '6', name: 'متخصص', name_en: 'Expert', description: 'کسب 7500 امتیاز XP',
    icon_url: '/badges/expert.png', icon_locked_url: null, icon_emoji: '🎓',
    category: 'academic', rarity: 'epic', auto_award: true,
    award_condition: { type: 'xp_total', value: 7500 }, xp_reward: 750,
    is_active: true, is_secret: false, sort_order: 6, created_at: '', updated_at: '',
    is_owned: false,
    progress: { id: 'p6', user_id: '1', badge_id: '6', current_value: 4500, target_value: 7500, last_updated: '' },
    owners_count: 567
  },
  {
    id: '7', name: 'نابغه', name_en: 'Genius', description: 'کسب 10000 امتیاز XP',
    icon_url: '/badges/genius.png', icon_locked_url: null, icon_emoji: '🧠',
    category: 'academic', rarity: 'epic', auto_award: true,
    award_condition: { type: 'xp_total', value: 10000 }, xp_reward: 1000,
    is_active: true, is_secret: false, sort_order: 7, created_at: '', updated_at: '',
    is_owned: false,
    progress: { id: 'p7', user_id: '1', badge_id: '7', current_value: 4500, target_value: 10000, last_updated: '' },
    owners_count: 234
  },
  {
    id: '8', name: 'استاد اعظم', name_en: 'Grand Master', description: 'رسیدن به سطح 20',
    icon_url: '/badges/grandmaster.png', icon_locked_url: null, icon_emoji: '👑',
    category: 'academic', rarity: 'legendary', auto_award: true,
    award_condition: { type: 'level', value: 20 }, xp_reward: 2000,
    is_active: true, is_secret: false, sort_order: 9, created_at: '', updated_at: '',
    is_owned: false,
    progress: { id: 'p8', user_id: '1', badge_id: '8', current_value: 8, target_value: 20, last_updated: '' },
    owners_count: 45
  },
  {
    id: '16', name: 'نمونه حضور', name_en: 'Attendance Star', description: 'حضور کامل به مدت 60 روز',
    icon_url: '/badges/present60.png', icon_locked_url: null, icon_emoji: '🌟',
    category: 'attendance', rarity: 'rare', auto_award: true,
    award_condition: { type: 'perfect_attendance_days', value: 60 }, xp_reward: 300,
    is_active: true, is_secret: false, sort_order: 32, created_at: '', updated_at: '',
    is_owned: false,
    progress: { id: 'p16', user_id: '1', badge_id: '16', current_value: 42, target_value: 60, last_updated: '' },
    owners_count: 789
  },
  {
    id: '11', name: 'رهبر کلاس', name_en: 'Class Leader', description: 'مسئولیت‌پذیری و رهبری عالی',
    icon_url: '/badges/leader.png', icon_locked_url: null, icon_emoji: '🏆',
    category: 'behavior', rarity: 'epic', auto_award: false,
    award_condition: null, xp_reward: 200,
    is_active: true, is_secret: false, sort_order: 24, created_at: '', updated_at: '',
    is_owned: false,
    owners_count: 456
  },
  {
    id: '30', name: 'ستاره کلاس', name_en: 'Class Star', description: 'عملکرد برجسته در کلاس',
    icon_url: '/badges/classstar.png', icon_locked_url: null, icon_emoji: '⭐',
    category: 'special', rarity: 'epic', auto_award: false,
    award_condition: null, xp_reward: 500,
    is_active: true, is_secret: false, sort_order: 60, created_at: '', updated_at: '',
    is_owned: false,
    owners_count: 123
  },
  {
    id: '31', name: 'افتخار مدرسه', name_en: 'School Pride', description: 'موفقیت در مسابقات یا المپیاد',
    icon_url: '/badges/pride.png', icon_locked_url: null, icon_emoji: '🏆',
    category: 'special', rarity: 'legendary', auto_award: false,
    award_condition: null, xp_reward: 1000,
    is_active: true, is_secret: false, sort_order: 61, created_at: '', updated_at: '',
    is_owned: false,
    owners_count: 12
  },
]

export default function StudentBadgesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserBadgeStats>(SAMPLE_STATS)
  const [badges, setBadges] = useState<BadgeWithStatus[]>([])
  const [activeTab, setActiveTab] = useState<BadgeCategory | 'all'>('all')
  
  // دیالوگ‌ها
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDisplayDialog, setShowDisplayDialog] = useState(false)
  
  // انتخاب نشان‌های نمایشی
  const [selectedDisplayBadges, setSelectedDisplayBadges] = useState<string[]>([])
  const [isSavingDisplay, setIsSavingDisplay] = useState(false)

  // بارگذاری داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBadges(SAMPLE_BADGES)
      setSelectedDisplayBadges(
        SAMPLE_BADGES
          .filter(b => b.user_badge?.is_displayed)
          .map(b => b.id)
      )
      setIsLoading(false)
    }
    loadData()
  }, [])

  // نشان‌های دریافت شده و قفل شده
  const { ownedBadges, lockedBadges } = useMemo(() => {
    const owned = badges.filter(b => b.is_owned)
    const locked = badges.filter(b => !b.is_owned)
    return { ownedBadges: owned, lockedBadges: locked }
  }, [badges])

  // فیلتر بر اساس تب
  const filteredBadges = useMemo(() => {
    if (activeTab === 'all') return badges
    return badges.filter(b => b.category === activeTab)
  }, [badges, activeTab])

  // تقسیم فیلتر شده به دریافت شده و قفل
  const { filteredOwned, filteredLocked } = useMemo(() => {
    const owned = filteredBadges.filter(b => b.is_owned)
    const locked = filteredBadges.filter(b => !b.is_owned)
    return { filteredOwned: owned, filteredLocked: locked }
  }, [filteredBadges])

  // ذخیره نشان‌های نمایشی
  const handleSaveDisplayBadges = async () => {
    if (selectedDisplayBadges.length > 3) {
      toast.error('حداکثر 3 نشان می‌توانید انتخاب کنید')
      return
    }
    
    setIsSavingDisplay(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // بروزرسانی محلی
    setBadges(prev => prev.map(b => ({
      ...b,
      user_badge: b.user_badge ? {
        ...b.user_badge,
        is_displayed: selectedDisplayBadges.includes(b.id),
        display_order: selectedDisplayBadges.indexOf(b.id) + 1
      } : b.user_badge
    })))
    
    setIsSavingDisplay(false)
    setShowDisplayDialog(false)
    toast.success('نشان‌های نمایشی ذخیره شدند! ✨')
  }

  // Toggle نمایش در دیالوگ انتخاب
  const toggleDisplayBadge = (badgeId: string) => {
    setSelectedDisplayBadges(prev => {
      if (prev.includes(badgeId)) {
        return prev.filter(id => id !== badgeId)
      }
      if (prev.length >= 3) {
        toast.warning('حداکثر 3 نشان می‌توانید انتخاب کنید')
        return prev
      }
      return [...prev, badgeId]
    })
  }

  // رندر کارت نشان
  const renderBadgeCard = (badge: BadgeWithStatus, isLocked: boolean) => {
    const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity]
    const progress = badge.progress ? calculateProgress(
      badge.progress.current_value,
      badge.progress.target_value
    ) : 0

    return (
      <Card 
        key={badge.id}
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300
          hover:shadow-lg hover:-translate-y-1
          ${isLocked ? 'opacity-75' : ''}
          ${rarityConfig.borderColor} border-2
          ${badge.rarity === 'legendary' && !isLocked ? rarityConfig.glowClass : ''}
        `}
        onClick={() => {
          setSelectedBadge(badge)
          setShowDetailDialog(true)
        }}
      >
        {/* نشان جدید */}
        {badge.user_badge && !badge.user_badge.is_seen && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-red-500 text-white animate-pulse">
              جدید!
            </Badge>
          </div>
        )}

        {/* نشان نمایشی */}
        {badge.user_badge?.is_displayed && (
          <div className="absolute top-2 right-2 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Pin className="h-4 w-4 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>نمایش در پروفایل</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <CardContent className="pt-4 text-center">
          {/* آیکون */}
          <div className={`
            text-5xl mb-2 mx-auto relative
            ${isLocked ? 'grayscale' : ''}
            ${badge.rarity === 'legendary' && !isLocked ? 'animate-bounce-slow' : ''}
          `}>
            {badge.icon_emoji}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* نام */}
          <h3 className={`font-bold text-sm ${isLocked ? 'text-muted-foreground' : ''}`}>
            {badge.name}
          </h3>

          {/* نادری */}
          <Badge variant="outline" className={`mt-1 text-xs ${rarityConfig.color}`}>
            {rarityConfig.icon} {rarityConfig.label}
          </Badge>

          {/* پاداش XP */}
          {badge.xp_reward > 0 && (
            <p className="text-xs text-amber-500 mt-1">
              +{badge.xp_reward} XP
            </p>
          )}

          {/* تاریخ دریافت یا پیشرفت */}
          {!isLocked && badge.user_badge ? (
            <p className="text-xs text-muted-foreground mt-2">
              {formatBadgeDate(badge.user_badge.awarded_at)}
            </p>
          ) : isLocked && badge.progress && badge.award_condition ? (
            <div className="mt-2 space-y-1">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-muted-foreground">
                {progress}%
              </p>
            </div>
          ) : isLocked && !badge.auto_award ? (
            <p className="text-xs text-muted-foreground mt-2">
              اعطا توسط معلم
            </p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const overallProgress = Math.round((stats.total_badges / stats.total_available) * 100)

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Medal className="h-8 w-8 text-amber-500" />
            نشان‌های من
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.total_badges} از {stats.total_available} نشان ({overallProgress}%)
          </p>
        </div>

        <Button onClick={() => setShowDisplayDialog(true)}>
          <Pin className="h-4 w-4 ml-2" />
          انتخاب نشان‌های نمایشی
        </Button>
      </div>

      {/* آمار کلی */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            پیشرفت کلی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.total_badges} نشان دریافت شده</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* آمار به تفکیک نادری */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(BADGE_RARITY_CONFIG) as [BadgeRarity, typeof BADGE_RARITY_CONFIG[BadgeRarity]][]).map(([rarity, config]) => {
              const rarityStats = stats.by_rarity[rarity]
              return (
                <Card key={rarity} className={`${config.bgColor} ${config.borderColor} border`}>
                  <CardContent className="p-3 text-center">
                    <span className="text-2xl">{config.icon}</span>
                    <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                    <p className="text-lg font-bold">
                      {rarityStats?.owned || 0} / {rarityStats?.total || 0}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* تب‌ها */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BadgeCategory | 'all')}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all" className="gap-1">
            همه
            <Badge variant="secondary" className="mr-1 text-xs">
              {stats.total_badges}/{stats.total_available}
            </Badge>
          </TabsTrigger>
          {(Object.entries(BADGE_CATEGORY_CONFIG) as [BadgeCategory, typeof BADGE_CATEGORY_CONFIG[BadgeCategory]][]).map(([category, config]) => {
            const catStats = stats.by_category[category]
            return (
              <TabsTrigger key={category} value={category} className="gap-1">
                {config.icon} {config.label}
                <Badge variant="secondary" className="mr-1 text-xs">
                  {catStats?.owned || 0}/{catStats?.total || 0}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-8">
          {/* نشان‌های دریافت شده */}
          {filteredOwned.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                دریافت شده ({filteredOwned.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredOwned.map(badge => renderBadgeCard(badge, false))}
              </div>
            </div>
          )}

          {/* نشان‌های قفل شده */}
          {filteredLocked.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-500" />
                قفل شده ({filteredLocked.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredLocked.map(badge => renderBadgeCard(badge, true))}
              </div>
            </div>
          )}

          {filteredOwned.length === 0 && filteredLocked.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Medal className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">نشانی در این دسته‌بندی وجود ندارد</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* دیالوگ جزئیات نشان */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBadge?.is_owned ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-gray-500" />
              )}
              {selectedBadge?.is_owned ? 'نشان دریافت شده' : 'نشان قفل شده'}
            </DialogTitle>
          </DialogHeader>

          {selectedBadge && (
            <div className="space-y-4">
              {/* آیکون */}
              <div className={`
                text-center py-6 rounded-xl
                ${BADGE_RARITY_CONFIG[selectedBadge.rarity].bgColor}
                ${selectedBadge.rarity === 'legendary' && selectedBadge.is_owned ? 'animate-pulse-slow' : ''}
              `}>
                <div className={`
                  text-8xl
                  ${!selectedBadge.is_owned ? 'grayscale opacity-50' : ''}
                `}>
                  {selectedBadge.icon_emoji}
                </div>
              </div>

              {/* نام و توضیحات */}
              <div className="text-center">
                <h3 className="text-xl font-bold">{selectedBadge.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedBadge.name_en}</p>
                <Badge className={`mt-2 ${BADGE_RARITY_CONFIG[selectedBadge.rarity].color}`}>
                  {BADGE_RARITY_CONFIG[selectedBadge.rarity].icon}
                  {' '}
                  {BADGE_RARITY_CONFIG[selectedBadge.rarity].label}
                </Badge>
              </div>

              <Separator />

              {/* توضیحات */}
              <p className="text-center">{selectedBadge.description}</p>

              {/* شرط دریافت */}
              {selectedBadge.award_condition && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">شرط دریافت:</p>
                  <p className="font-medium">
                    {formatAwardCondition(selectedBadge.award_condition)}
                  </p>
                </div>
              )}

              {/* پاداش */}
              {selectedBadge.xp_reward > 0 && (
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-bold">+{selectedBadge.xp_reward} XP</span>
                </div>
              )}

              {/* پیشرفت (برای قفل شده) */}
              {!selectedBadge.is_owned && selectedBadge.progress && selectedBadge.award_condition && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>پیشرفت شما:</span>
                    <span className="font-medium">
                      {selectedBadge.progress.current_value.toLocaleString('fa-IR')} / {selectedBadge.progress.target_value.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgress(selectedBadge.progress.current_value, selectedBadge.progress.target_value)} 
                    className="h-2" 
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    {(selectedBadge.progress.target_value - selectedBadge.progress.current_value).toLocaleString('fa-IR')} مانده
                  </p>
                </div>
              )}

              {/* اعطا توسط معلم */}
              {!selectedBadge.is_owned && !selectedBadge.auto_award && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-3 text-center text-sm">
                    <Info className="h-4 w-4 inline ml-1 text-blue-500" />
                    این نشان توسط معلم اعطا می‌شود
                  </CardContent>
                </Card>
              )}

              {/* اطلاعات دریافت */}
              {selectedBadge.is_owned && selectedBadge.user_badge && (
                <>
                  <Separator />
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاریخ دریافت:</span>
                      <span>{formatBadgeDate(selectedBadge.user_badge.awarded_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">روش دریافت:</span>
                      <span>
                        {selectedBadge.user_badge.awarded_by === 'auto' ? 'خودکار' : 
                         selectedBadge.user_badge.awarded_by === 'teacher' ? 'معلم' : 'مدیر'}
                      </span>
                    </div>
                    {selectedBadge.user_badge.award_reason && (
                      <div className="bg-muted rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">دلیل:</p>
                        <p className="text-sm">{selectedBadge.user_badge.award_reason}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* تعداد دارندگان */}
              {selectedBadge.owners_count && (
                <div className="text-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 inline ml-1" />
                  {selectedBadge.owners_count.toLocaleString('fa-IR')} نفر این نشان را دارند
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ انتخاب نشان‌های نمایشی */}
      <Dialog open={showDisplayDialog} onOpenChange={setShowDisplayDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5" />
              انتخاب نشان‌های نمایشی
            </DialogTitle>
            <DialogDescription>
              حداکثر 3 نشان برای نمایش در پروفایل انتخاب کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* لیست نشان‌های دریافت شده */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {ownedBadges.map(badge => (
                <div 
                  key={badge.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedDisplayBadges.includes(badge.id) 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  onClick={() => toggleDisplayBadge(badge.id)}
                >
                  <Checkbox 
                    checked={selectedDisplayBadges.includes(badge.id)}
                    onCheckedChange={() => toggleDisplayBadge(badge.id)}
                  />
                  <span className="text-2xl">{badge.icon_emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium">{badge.name}</p>
                    <Badge variant="outline" className={`text-xs ${BADGE_RARITY_CONFIG[badge.rarity].color}`}>
                      {BADGE_RARITY_CONFIG[badge.rarity].icon} {BADGE_RARITY_CONFIG[badge.rarity].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* پیش‌نمایش */}
            <div>
              <p className="text-sm font-medium mb-2">پیش‌نمایش در پروفایل:</p>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{SAMPLE_USER.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Level {SAMPLE_USER.level} | {SAMPLE_USER.xp.toLocaleString('fa-IR')} XP
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {selectedDisplayBadges.length > 0 ? (
                    selectedDisplayBadges.map(id => {
                      const badge = ownedBadges.find(b => b.id === id)
                      return badge ? (
                        <TooltipProvider key={id}>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-2xl">{badge.icon_emoji}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{badge.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">نشانی انتخاب نشده</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisplayDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleSaveDisplayBadges} disabled={isSavingDisplay}>
              {isSavingDisplay ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2" />
              ) : (
                <Check className="h-4 w-4 ml-2" />
              )}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* استایل انیمیشن */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
