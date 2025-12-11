'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Flame, 
  Trophy, 
  Shield, 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Check,
  BarChart3,
  ShoppingCart,
  Info,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { FlameAnimation } from '@/components/streak-widget'
import {
  UserStreakInfo,
  StreakMilestone,
  UserStreakMilestone,
  CalendarDay,
  getStreakColor,
  getStreakMessage,
  calculateMilestoneProgress,
  getTimeUntilMidnight,
  generateCalendarDays,
  WEEKDAY_NAMES,
  PERSIAN_MONTHS,
} from '@/lib/types/streak.types'

// داده نمونه
const SAMPLE_STREAK_INFO: UserStreakInfo = {
  current_streak: 15,
  longest_streak: 23,
  total_active_days: 45,
  streak_freeze_count: 2,
  last_activity_date: new Date().toISOString().split('T')[0],
  is_active_today: true,
  next_milestone_days: 21,
  next_milestone_name: 'سه هفته قهرمانی',
  next_milestone_xp: 300,
  days_to_next_milestone: 6,
}

const SAMPLE_MILESTONES: StreakMilestone[] = [
  { id: '1', days_required: 3, name: 'شروع خوب', name_en: 'Good Start', description: '3 روز فعالیت پیاپی', xp_reward: 50, coins_reward: 10, freeze_reward: 0, icon_emoji: '🌱', sort_order: 1, is_active: true, created_at: '' },
  { id: '2', days_required: 7, name: 'یک هفته آتشین', name_en: 'Fire Week', description: '7 روز فعالیت پیاپی', xp_reward: 100, coins_reward: 25, freeze_reward: 1, icon_emoji: '🔥', sort_order: 2, is_active: true, created_at: '' },
  { id: '3', days_required: 14, name: 'دو هفته پایداری', name_en: 'Two Week Warrior', description: '14 روز فعالیت پیاپی', xp_reward: 200, coins_reward: 50, freeze_reward: 0, icon_emoji: '⚡', sort_order: 3, is_active: true, created_at: '' },
  { id: '4', days_required: 21, name: 'سه هفته قهرمانی', name_en: 'Three Week Champion', description: '21 روز فعالیت پیاپی', xp_reward: 300, coins_reward: 75, freeze_reward: 1, icon_emoji: '💪', sort_order: 4, is_active: true, created_at: '' },
  { id: '5', days_required: 30, name: 'یک ماه افسانه‌ای', name_en: 'Monthly Legend', description: '30 روز فعالیت پیاپی', xp_reward: 500, coins_reward: 100, freeze_reward: 2, icon_emoji: '🏆', sort_order: 5, is_active: true, created_at: '' },
  { id: '6', days_required: 50, name: 'پنجاه روز طلایی', name_en: 'Golden Fifty', description: '50 روز فعالیت پیاپی', xp_reward: 750, coins_reward: 150, freeze_reward: 1, icon_emoji: '✨', sort_order: 6, is_active: true, created_at: '' },
  { id: '7', days_required: 100, name: 'صد روز افتخار', name_en: 'Century Pride', description: '100 روز فعالیت پیاپی', xp_reward: 2000, coins_reward: 500, freeze_reward: 3, icon_emoji: '👑', sort_order: 7, is_active: true, created_at: '' },
  { id: '8', days_required: 365, name: 'یک سال اسطوره‌ای', name_en: 'Legendary Year', description: '365 روز فعالیت پیاپی!', xp_reward: 10000, coins_reward: 5000, freeze_reward: 5, icon_emoji: '🏅', sort_order: 8, is_active: true, created_at: '' },
]

const SAMPLE_USER_MILESTONES: UserStreakMilestone[] = [
  { id: '1', user_id: '1', milestone_id: '1', achieved_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), streak_at_time: 3, reward_claimed: true },
  { id: '2', user_id: '1', milestone_id: '2', achieved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), streak_at_time: 7, reward_claimed: true },
  { id: '3', user_id: '1', milestone_id: '3', achieved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), streak_at_time: 14, reward_claimed: true },
]

export default function StreakPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [streakInfo, setStreakInfo] = useState<UserStreakInfo>(SAMPLE_STREAK_INFO)
  const [milestones, setMilestones] = useState<StreakMilestone[]>([])
  const [userMilestones, setUserMilestones] = useState<UserStreakMilestone[]>([])
  const [calendarActivities, setCalendarActivities] = useState<{ activity_date: string; is_active: boolean; is_freeze_used: boolean; xp_earned: number; activities_count: number }[]>([])
  
  // ماه و سال تقویم
  const [calendarDate, setCalendarDate] = useState(new Date())
  
  // دیالوگ‌ها
  const [showFreezeDialog, setShowFreezeDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [isUsingFreeze, setIsUsingFreeze] = useState(false)
  
  // تایمر
  const [timeUntilMidnight, setTimeUntilMidnight] = useState(getTimeUntilMidnight())

  // بارگذاری داده‌ها
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMilestones(SAMPLE_MILESTONES)
      setUserMilestones(SAMPLE_USER_MILESTONES)
      
      // فعالیت‌های تقویم نمونه
      const sampleActivities = []
      for (let i = 0; i < 20; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        sampleActivities.push({
          activity_date: date.toISOString().split('T')[0],
          is_active: i < 15 || Math.random() > 0.3,
          is_freeze_used: i === 5,
          xp_earned: Math.floor(Math.random() * 100) + 50,
          activities_count: Math.floor(Math.random() * 5) + 1,
        })
      }
      setCalendarActivities(sampleActivities)
      
      setIsLoading(false)
    }
    loadData()
  }, [])

  // تایمر
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilMidnight(getTimeUntilMidnight())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // روزهای تقویم
  const calendarDays = useMemo(() => {
    return generateCalendarDays(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      calendarActivities
    )
  }, [calendarDate, calendarActivities])

  // استفاده از محافظ
  const handleUseFreeze = async () => {
    setIsUsingFreeze(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setStreakInfo(prev => ({
      ...prev,
      streak_freeze_count: prev.streak_freeze_count - 1,
      is_active_today: true,
    }))
    
    setIsUsingFreeze(false)
    setShowFreezeDialog(false)
    toast.success('🛡️ Streak شما با موفقیت محافظت شد!')
  }

  // تغییر ماه تقویم
  const changeMonth = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const streakColor = getStreakColor(streakInfo.current_streak)
  const message = getStreakMessage(streakInfo.current_streak, streakInfo.is_active_today)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Flame className="h-8 w-8 text-orange-500" />
          Streak من
        </h1>
        <Button variant="ghost" size="icon" onClick={() => setShowInfoDialog(true)}>
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Streak فعلی */}
      <Card className={`${streakColor.bgColor} border-0`}>
        <CardContent className="py-8 text-center">
          <FlameAnimation size="xl" streak={streakInfo.current_streak} />
          
          <div className="mt-4">
            <span className={`text-5xl font-bold ${streakColor.color}`}>
              {streakInfo.current_streak}
            </span>
            <span className={`text-2xl mr-2 ${streakColor.color}`}>روز</span>
          </div>
          
          <Badge className={`mt-2 ${streakColor.color} bg-white/50`}>
            {streakColor.label}
          </Badge>
          
          <p className="mt-4 text-lg">{message}</p>
          
          {!streakInfo.is_active_today && streakInfo.current_streak > 0 && (
            <Alert className="mt-4 max-w-md mx-auto bg-white/80">
              <Clock className="h-4 w-4" />
              <AlertTitle>زمان باقی‌مانده</AlertTitle>
              <AlertDescription>
                {timeUntilMidnight.formatted} تا پایان روز
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* آمار */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{streakInfo.longest_streak}</p>
            <p className="text-sm text-muted-foreground">بیشترین Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{streakInfo.total_active_days}</p>
            <p className="text-sm text-muted-foreground">روز فعال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{streakInfo.streak_freeze_count}</p>
            <p className="text-sm text-muted-foreground">محافظ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">
              {Math.round((streakInfo.total_active_days / 30) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">میانگین ماهانه</p>
          </CardContent>
        </Card>
      </div>

      {/* تقویم */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تقویم فعالیت
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => changeMonth('prev')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="min-w-24 text-center font-medium">
                {PERSIAN_MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </span>
              <Button variant="ghost" size="icon" onClick={() => changeMonth('next')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_NAMES.map((day, i) => (
              <div key={i} className="text-center text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center
                      transition-all cursor-default
                      ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      ${day.isToday ? 'ring-2 ring-orange-400' : ''}
                      ${day.isActive 
                        ? day.isFreezeUsed 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-50 dark:bg-gray-900'
                      }
                    `}>
                      <span className={`text-sm ${day.isToday ? 'font-bold' : ''}`}>
                        {day.dayOfMonth}
                      </span>
                      {day.isCurrentMonth && (
                        <span className="text-xs">
                          {day.isActive 
                            ? day.isFreezeUsed ? '🛡️' : '✅'
                            : day.isToday ? '🔥' : ''
                          }
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  {day.isCurrentMonth && (
                    <TooltipContent>
                      <p className="font-medium">{day.date}</p>
                      {day.isActive && (
                        <>
                          <p className="text-sm">
                            {day.isFreezeUsed ? 'محافظ استفاده شده' : 'فعال'}
                          </p>
                          {day.xpEarned > 0 && (
                            <p className="text-sm text-amber-500">+{day.xpEarned} XP</p>
                          )}
                        </>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          {/* راهنما */}
          <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">✅ فعال</span>
            <span className="flex items-center gap-1">🛡️ محافظ</span>
            <span className="flex items-center gap-1">🔥 امروز</span>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            دستاوردها
          </CardTitle>
          <CardDescription>
            با ادامه Streak به جوایز بیشتری برسید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map(milestone => {
            const achieved = userMilestones.find(um => um.milestone_id === milestone.id)
            const isNext = !achieved && milestone.days_required > streakInfo.current_streak &&
              milestones.filter(m => m.days_required < milestone.days_required && !userMilestones.find(um => um.milestone_id === m.id)).length === 0
            const progress = achieved 
              ? 100 
              : calculateMilestoneProgress(streakInfo.current_streak, milestone.days_required)
            
            return (
              <div 
                key={milestone.id}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${achieved 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                    : isNext
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-border opacity-60'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    text-4xl p-3 rounded-xl
                    ${achieved ? 'bg-green-100' : isNext ? 'bg-amber-100' : 'bg-gray-100 grayscale'}
                  `}>
                    {milestone.icon_emoji}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{milestone.name}</h3>
                      {achieved && <Check className="h-5 w-5 text-green-500" />}
                      {!achieved && !isNext && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    
                    {!achieved && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{streakInfo.current_streak} / {milestone.days_required} روز</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {achieved && (
                      <p className="text-xs text-muted-foreground mt-1">
                        دریافت شده در: {new Date(achieved.achieved_at).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-left space-y-1">
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      +{milestone.xp_reward} XP
                    </Badge>
                    {milestone.coins_reward > 0 && (
                      <Badge variant="outline" className="gap-1 block">
                        🪙 +{milestone.coins_reward}
                      </Badge>
                    )}
                    {milestone.freeze_reward > 0 && (
                      <Badge variant="outline" className="gap-1 block text-blue-600">
                        <Shield className="h-3 w-3" />
                        +{milestone.freeze_reward}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* محافظ Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            محافظ Streak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg">موجودی:</span>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {streakInfo.streak_freeze_count} محافظ
            </Badge>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>اگر یک روز نتوانستید فعالیت کنید، از محافظ استفاده کنید تا Streak شما حفظ شود.</p>
            
            <p className="font-medium">نحوه کسب محافظ:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>خرید از فروشگاه (300 سکه)</li>
              <li>هدیه در Milestone ها</li>
              <li>جایزه مسابقات</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowFreezeDialog(true)}
              disabled={streakInfo.streak_freeze_count === 0 || streakInfo.is_active_today}
            >
              <Shield className="h-4 w-4 ml-2" />
              استفاده از محافظ
            </Button>
            <Button variant="secondary" className="flex-1">
              <ShoppingCart className="h-4 w-4 ml-2" />
              خرید محافظ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* دیالوگ استفاده از محافظ */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              استفاده از محافظ Streak
            </DialogTitle>
            <DialogDescription>
              آیا می‌خواهید از محافظ استفاده کنید؟
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <Shield className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <p>با استفاده از محافظ، Streak {streakInfo.current_streak} روزه شما حفظ می‌شود.</p>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                موجودی فعلی: {streakInfo.streak_freeze_count} محافظ
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFreezeDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleUseFreeze} disabled={isUsingFreeze}>
              {isUsingFreeze ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 ml-2" />
              )}
              استفاده از محافظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ اطلاعات */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              درباره Streak
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              <strong>Streak چیست؟</strong>
              <br />
              Streak تعداد روزهای متوالی است که شما در هوشاگر فعالیت داشته‌اید.
            </p>
            
            <p>
              <strong>چه فعالیت‌هایی حساب می‌شوند؟</strong>
              <br />
              هر کار آموزشی مثل ساخت داستان، حل مسئله، مطالعه، شرکت در آزمون و...
            </p>
            
            <p>
              <strong>چه زمانی Streak شکسته می‌شود؟</strong>
              <br />
              اگر یک روز کامل (از 00:00 تا 23:59) هیچ فعالیتی نداشته باشید.
            </p>
            
            <p>
              <strong>محافظ Streak چیست؟</strong>
              <br />
              با استفاده از محافظ می‌توانید یک روز را بدون فعالیت بگذرانید بدون اینکه Streak از دست برود.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowInfoDialog(false)}>
              متوجه شدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}























