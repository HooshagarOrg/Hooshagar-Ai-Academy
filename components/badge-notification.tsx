'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Medal, 
  Sparkles, 
  X,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { BADGE_RARITY_CONFIG, BadgeRarity } from '@/lib/types/badge.types'

interface NewBadge {
  id: string
  name: string
  icon_emoji: string
  rarity: BadgeRarity
  xp_reward: number
}

interface BadgeNotificationProps {
  badges?: NewBadge[]
  onClose?: () => void
  autoCheck?: boolean
  checkInterval?: number // میلی‌ثانیه
}

export function BadgeNotification({ 
  badges: externalBadges,
  onClose,
  autoCheck = false,
  checkInterval = 60000, // هر دقیقه
}: BadgeNotificationProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)
  const [badges, setBadges] = useState<NewBadge[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // دریافت نشان‌های جدید از API
  const checkForNewBadges = useCallback(async () => {
    try {
      const response = await fetch('/api/badges/award', {
        method: 'PUT',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.new_badges && data.new_badges.length > 0) {
          setBadges(data.new_badges)
          setIsOpen(true)
          setIsAnimating(true)
        }
      }
    } catch (error) {
      console.error('Error checking for new badges:', error)
    }
  }, [])

  // بررسی خودکار
  useEffect(() => {
    if (autoCheck) {
      // چک اولیه با تأخیر
      const initialTimeout = setTimeout(checkForNewBadges, 5000)
      
      // چک دوره‌ای
      const interval = setInterval(checkForNewBadges, checkInterval)
      
      return () => {
        clearTimeout(initialTimeout)
        clearInterval(interval)
      }
    }
  }, [autoCheck, checkInterval, checkForNewBadges])

  // استفاده از نشان‌های خارجی
  useEffect(() => {
    if (externalBadges && externalBadges.length > 0) {
      setBadges(externalBadges)
      setIsOpen(true)
      setIsAnimating(true)
    }
  }, [externalBadges])

  // رفتن به نشان بعدی
  const handleNext = () => {
    if (currentBadgeIndex < badges.length - 1) {
      setIsAnimating(false)
      setTimeout(() => {
        setCurrentBadgeIndex(prev => prev + 1)
        setIsAnimating(true)
      }, 300)
    } else {
      handleClose()
    }
  }

  // بستن
  const handleClose = async () => {
    setIsOpen(false)
    setCurrentBadgeIndex(0)
    setBadges([])
    setIsAnimating(false)
    
    // علامت‌گذاری به عنوان دیده شده
    try {
      await fetch('/api/badges/user', { method: 'PATCH' })
    } catch (error) {
      console.error('Error marking badges as seen:', error)
    }
    
    onClose?.()
  }

  // رفتن به صفحه نشان‌ها
  const handleViewBadges = () => {
    handleClose()
    router.push('/student/badges')
  }

  if (!isOpen || badges.length === 0) return null

  const currentBadge = badges[currentBadgeIndex]
  const rarityConfig = BADGE_RARITY_CONFIG[currentBadge.rarity]
  const isLegendary = currentBadge.rarity === 'legendary'
  const isEpic = currentBadge.rarity === 'epic'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className={`
          sm:max-w-md overflow-hidden
          ${isLegendary ? 'border-amber-400 border-2' : ''}
          ${isEpic ? 'border-purple-400 border-2' : ''}
        `}
        dir="rtl"
      >
        {/* دکمه بستن */}
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 z-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">بستن</span>
        </button>

        {/* محتوا */}
        <div className="text-center space-y-4 py-4">
          {/* عنوان */}
          <div className="flex items-center justify-center gap-2 text-2xl font-bold">
            <Sparkles className={`h-6 w-6 ${isLegendary ? 'text-amber-500' : isEpic ? 'text-purple-500' : 'text-green-500'}`} />
            <span>تبریک! نشان جدید</span>
            <Sparkles className={`h-6 w-6 ${isLegendary ? 'text-amber-500' : isEpic ? 'text-purple-500' : 'text-green-500'}`} />
          </div>

          {/* آیکون نشان */}
          <div 
            className={`
              mx-auto py-8 rounded-2xl transition-all duration-500
              ${rarityConfig.bgColor}
              ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
              ${isLegendary ? 'animate-pulse-glow' : ''}
            `}
          >
            <div 
              className={`
                text-8xl
                ${isAnimating ? 'animate-badge-pop' : ''}
              `}
            >
              {currentBadge.icon_emoji}
            </div>
          </div>

          {/* نام نشان */}
          <div className={`transition-all duration-300 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h3 className="text-2xl font-bold">{currentBadge.name}</h3>
            <Badge className={`mt-2 ${rarityConfig.color} ${rarityConfig.bgColor}`}>
              {rarityConfig.icon} {rarityConfig.label}
            </Badge>
          </div>

          {/* پاداش XP */}
          {currentBadge.xp_reward > 0 && (
            <div 
              className={`
                flex items-center justify-center gap-2 text-xl text-amber-500 font-bold
                transition-all duration-500 delay-300
                ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
              `}
            >
              <Sparkles className="h-5 w-5" />
              <span>+{currentBadge.xp_reward} XP</span>
            </div>
          )}

          {/* شمارنده */}
          {badges.length > 1 && (
            <p className="text-sm text-muted-foreground">
              نشان {currentBadgeIndex + 1} از {badges.length}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentBadgeIndex < badges.length - 1 ? (
            <Button onClick={handleNext} className="w-full sm:w-auto">
              نشان بعدی
              <ChevronRight className="h-4 w-4 mr-1" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                بستن
              </Button>
              <Button onClick={handleViewBadges} className="w-full sm:w-auto">
                <Medal className="h-4 w-4 ml-2" />
                مشاهده نشان‌ها
              </Button>
            </>
          )}
        </DialogFooter>

        {/* استایل‌های انیمیشن */}
        <style jsx global>{`
          @keyframes badge-pop {
            0% { 
              transform: scale(0.5);
              opacity: 0;
            }
            50% { 
              transform: scale(1.2);
            }
            75% {
              transform: scale(0.9);
            }
            100% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-badge-pop {
            animation: badge-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
            }
            50% {
              box-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
            }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

// کامپوننت نمایش نشان کوچک (برای پروفایل)
interface BadgeDisplayProps {
  badges: {
    id: string
    name: string
    icon_emoji: string
    rarity: BadgeRarity
  }[]
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function BadgeDisplay({ badges, size = 'md', showTooltip = true }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  if (badges.length === 0) return null

  return (
    <div className="flex gap-1">
      {badges.map(badge => {
        const content = (
          <span 
            key={badge.id}
            className={`
              ${sizeClasses[size]}
              ${BADGE_RARITY_CONFIG[badge.rarity].glowClass}
              cursor-default
            `}
            title={showTooltip ? badge.name : undefined}
          >
            {badge.icon_emoji}
          </span>
        )

        return content
      })}
    </div>
  )
}

// کامپوننت شمارنده نشان‌های جدید
interface BadgeCounterProps {
  count: number
  onClick?: () => void
}

export function BadgeCounter({ count, onClick }: BadgeCounterProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center"
    >
      <Medal className="h-6 w-6 text-amber-500" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {count > 9 ? '9+' : count}
      </span>
    </button>
  )
}

export default BadgeNotification

















