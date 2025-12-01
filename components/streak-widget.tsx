'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Flame, 
  Trophy, 
  Shield, 
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  UserStreakInfo,
  getStreakColor,
  getStreakMessage,
  calculateMilestoneProgress,
  getTimeUntilMidnight,
  WEEKDAY_NAMES,
} from '@/lib/types/streak.types'

interface StreakWidgetProps {
  streakInfo?: UserStreakInfo;
  weekActivities?: { date: string; isActive: boolean; isFreezeUsed: boolean }[];
  compact?: boolean;
  className?: string;
}

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

// فعالیت‌های هفته نمونه
const SAMPLE_WEEK_ACTIVITIES = [
  { date: '2024-12-01', isActive: true, isFreezeUsed: false },
  { date: '2024-12-02', isActive: true, isFreezeUsed: false },
  { date: '2024-12-03', isActive: true, isFreezeUsed: false },
  { date: '2024-12-04', isActive: true, isFreezeUsed: false },
  { date: '2024-12-05', isActive: true, isFreezeUsed: false },
  { date: '2024-12-06', isActive: true, isFreezeUsed: true },
  { date: '2024-12-07', isActive: true, isFreezeUsed: false },
]

export function StreakWidget({ 
  streakInfo = SAMPLE_STREAK_INFO,
  weekActivities = SAMPLE_WEEK_ACTIVITIES,
  compact = false,
  className = '',
}: StreakWidgetProps) {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState(getTimeUntilMidnight())
  
  // بروزرسانی تایمر
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilMidnight(getTimeUntilMidnight())
    }, 60000) // هر دقیقه
    
    return () => clearInterval(interval)
  }, [])
  
  const streakColor = getStreakColor(streakInfo.current_streak)
  const milestoneProgress = calculateMilestoneProgress(
    streakInfo.current_streak,
    streakInfo.next_milestone_days
  )
  const message = getStreakMessage(streakInfo.current_streak, streakInfo.is_active_today)

  if (compact) {
    return (
      <Link href="/student/streak">
        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-full ${streakColor.bgColor}
                  ${streakInfo.current_streak >= 7 ? 'animate-pulse' : ''}
                `}>
                  <Flame className={`h-5 w-5 ${streakColor.color}`} />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {streakInfo.current_streak} روز
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {streakColor.label}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {streakInfo.streak_freeze_count > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {streakInfo.streak_freeze_count}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{streakInfo.streak_freeze_count} محافظ Streak</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streakColor.color}`} />
            Streak من
          </span>
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            بیشترین: {streakInfo.longest_streak} روز
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Streak فعلی */}
        <div className={`
          text-center py-4 rounded-xl ${streakColor.bgColor}
          ${streakInfo.current_streak >= 30 ? 'animate-pulse-slow' : ''}
        `}>
          <div className="flex items-center justify-center gap-2">
            <Flame className={`h-8 w-8 ${streakColor.color}`} />
            <span className={`text-4xl font-bold ${streakColor.color}`}>
              {streakInfo.current_streak}
            </span>
            <span className={`text-xl ${streakColor.color}`}>روز</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {streakColor.label}
          </p>
        </div>
        
        {/* پیام */}
        <p className="text-sm text-center">{message}</p>
        
        {/* هشدار اگر امروز فعالیت نداشته */}
        {!streakInfo.is_active_today && streakInfo.current_streak > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">زمان باقی‌مانده: {timeUntilMidnight.formatted}</p>
            </div>
          </div>
        )}
        
        {/* تقویم هفته */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">این هفته:</p>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_NAMES.map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground">
                {day}
              </div>
            ))}
            {weekActivities.slice(0, 7).map((activity, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`
                      aspect-square rounded-md flex items-center justify-center text-sm
                      ${activity.isActive 
                        ? activity.isFreezeUsed 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' 
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                      }
                      ${i === weekActivities.length - 1 ? 'ring-2 ring-orange-400' : ''}
                    `}>
                      {activity.isActive 
                        ? activity.isFreezeUsed ? '🛡️' : '✅'
                        : '○'
                      }
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {activity.isActive 
                        ? activity.isFreezeUsed 
                          ? 'محافظ استفاده شده' 
                          : 'فعال'
                        : 'غیرفعال'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        
        {/* Milestone بعدی */}
        {streakInfo.next_milestone_name && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {streakInfo.next_milestone_name}
              </span>
              <span className="text-muted-foreground">
                {streakInfo.days_to_next_milestone} روز مانده
              </span>
            </div>
            <Progress value={milestoneProgress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              پاداش: +{streakInfo.next_milestone_xp} XP
            </p>
          </div>
        )}
        
        {/* محافظ */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-500" />
            محافظ Streak:
          </span>
          <Badge variant="secondary">{streakInfo.streak_freeze_count}</Badge>
        </div>
        
        {/* دکمه */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/student/streak">
            <Calendar className="h-4 w-4 ml-2" />
            مشاهده جزئیات
          </Link>
        </Button>
      </CardContent>
      
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Card>
  )
}

// کامپوننت انیمیشن شعله
export function FlameAnimation({ 
  size = 'md',
  streak = 1,
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  streak?: number;
}) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  }
  
  const flameCount = streak >= 100 ? 5 : streak >= 30 ? 3 : streak >= 7 ? 2 : 1
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {Array.from({ length: flameCount }).map((_, i) => (
        <span 
          key={i}
          className={`
            ${sizeClasses[size]}
            ${i > 0 ? 'absolute' : ''}
            animate-bounce-flame
          `}
          style={{ 
            animationDelay: `${i * 0.1}s`,
            opacity: 1 - (i * 0.2),
            transform: `translateX(${i * 5}px)`,
          }}
        >
          🔥
        </span>
      ))}
      
      <style jsx>{`
        @keyframes bounce-flame {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }
        .animate-bounce-flame {
          animation: bounce-flame 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// کامپوننت نوتیفیکیشن Milestone
interface MilestoneNotificationProps {
  milestoneName: string;
  xpReward: number;
  coinsReward?: number;
  freezeReward?: number;
  onClose?: () => void;
}

export function MilestoneNotification({
  milestoneName,
  xpReward,
  coinsReward = 0,
  freezeReward = 0,
  onClose,
}: MilestoneNotificationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-sm mx-4 animate-scale-in">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2">دستاورد جدید!</h3>
          <p className="text-lg mb-4">
            شما به <span className="font-bold text-orange-500">{milestoneName}</span> رسیدید!
          </p>
          
          <div className="space-y-2 bg-muted rounded-lg p-4 mb-4">
            <p className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="font-bold">+{xpReward} XP</span>
            </p>
            {coinsReward > 0 && (
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">🪙</span>
                <span className="font-bold">+{coinsReward} سکه</span>
              </p>
            )}
            {freezeReward > 0 && (
              <p className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="font-bold">+{freezeReward} محافظ</span>
              </p>
            )}
          </div>
          
          <Button onClick={onClose} className="w-full">
            عالی! 🔥
          </Button>
        </CardContent>
      </Card>
      
      <style jsx global>{`
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// کامپوننت هشدار Streak
interface StreakWarningProps {
  currentStreak: number;
  freezeCount: number;
  onUseFreeze?: () => void;
  onDismiss?: () => void;
}

export function StreakWarning({
  currentStreak,
  freezeCount,
  onUseFreeze,
  onDismiss,
}: StreakWarningProps) {
  const timeRemaining = getTimeUntilMidnight()
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-sm mx-4">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2 text-amber-600">هشدار Streak</h3>
          <p className="mb-4">
            شما امروز هیچ فعالیتی انجام نداده‌اید!
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
            <p className="text-lg font-bold">
              Streak فعلی: {currentStreak} روز 🔥
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              زمان باقی‌مانده: {timeRemaining.formatted}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            اگر تا پایان امروز فعالیت نکنید، Streak شما به صفر می‌رسد.
          </p>
          
          <div className="space-y-2">
            {freezeCount > 0 && (
              <Button onClick={onUseFreeze} className="w-full" variant="secondary">
                <Shield className="h-4 w-4 ml-2" />
                استفاده از محافظ ({freezeCount} عدد)
              </Button>
            )}
            <Button onClick={onDismiss} className="w-full">
              <Flame className="h-4 w-4 ml-2" />
              الان فعالیت می‌کنم!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StreakWidget

