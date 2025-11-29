'use client'

import { useEffect, useState } from 'react'
import { X, Bell, Gift, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

interface UsageWarning {
  id: string
  type: '80_percent' | '100_percent' | 'special_granted' | 'credit_low'
  feature: string
  featureLabel: string
  percentage?: number
  period?: string
  resetTime?: string
  newLimit?: number
  message?: string
}

interface AIUsageNotificationsProps {
  userId: string
  checkInterval?: number // milliseconds
}

// ============================================
// کامپوننت نوتیفیکیشن
// ============================================

export default function AIUsageNotifications({
  userId,
  checkInterval = 60000, // هر دقیقه
}: AIUsageNotificationsProps) {
  const [warnings, setWarnings] = useState<UsageWarning[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // ============================================
  // بررسی هشدارها
  // ============================================

  useEffect(() => {
    const checkUsageWarnings = async () => {
      try {
        // در محیط واقعی از API استفاده می‌شود
        // const res = await fetch('/api/ai/check-all-limits')
        // const data = await res.json()

        // داده نمونه
        const mockWarnings: UsageWarning[] = []

        // شانس ایجاد هشدار نمونه
        if (Math.random() > 0.8) {
          mockWarnings.push({
            id: `warning-${Date.now()}-1`,
            type: '80_percent',
            feature: 'story_wizard',
            featureLabel: 'تولید داستان',
            percentage: 85,
            period: 'روزانه',
          })
        }

        if (Math.random() > 0.9) {
          mockWarnings.push({
            id: `warning-${Date.now()}-2`,
            type: 'credit_low',
            feature: 'general',
            featureLabel: 'اعتبار',
            percentage: 15,
            message: 'اعتبار شما رو به اتمام است',
          })
        }

        // فیلتر کردن هشدارهای dismiss شده
        const newWarnings = mockWarnings.filter(w => !dismissedIds.has(w.id))
        setWarnings(newWarnings)
      } catch (error) {
        console.error('Error checking usage warnings:', error)
      }
    }

    // اولین بررسی بعد از 5 ثانیه
    const initialTimeout = setTimeout(checkUsageWarnings, 5000)

    // بررسی‌های دوره‌ای
    const interval = setInterval(checkUsageWarnings, checkInterval)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [userId, checkInterval, dismissedIds])

  // ============================================
  // Dismiss هشدار
  // ============================================

  const dismissWarning = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    setWarnings(prev => prev.filter(w => w.id !== id))
  }

  // ============================================
  // رندر
  // ============================================

  if (warnings.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2 max-w-sm" dir="rtl">
      {warnings.map(warning => (
        <NotificationCard
          key={warning.id}
          warning={warning}
          onDismiss={() => dismissWarning(warning.id)}
        />
      ))}
    </div>
  )
}

// ============================================
// کارت نوتیفیکیشن
// ============================================

function NotificationCard({
  warning,
  onDismiss,
}: {
  warning: UsageWarning
  onDismiss: () => void
}) {
  const getIcon = () => {
    switch (warning.type) {
      case '80_percent':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case '100_percent':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'special_granted':
        return <Gift className="w-5 h-5 text-green-500" />
      case 'credit_low':
        return <Bell className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getStyles = () => {
    switch (warning.type) {
      case '80_percent':
        return 'bg-yellow-50 border-yellow-200'
      case '100_percent':
        return 'bg-red-50 border-red-200'
      case 'special_granted':
        return 'bg-green-50 border-green-200'
      case 'credit_low':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getMessage = () => {
    switch (warning.type) {
      case '80_percent':
        return `⚠️ شما ${warning.percentage}% از محدودیت ${warning.period} ${warning.featureLabel} را مصرف کرده‌اید`
      case '100_percent':
        return `🚫 محدودیت ${warning.period} ${warning.featureLabel} تمام شد. تجدید در ${warning.resetTime}`
      case 'special_granted':
        return `🎁 محدودیت ${warning.featureLabel} شما به ${warning.newLimit} افزایش یافت!`
      case 'credit_low':
        return warning.message || `💳 اعتبار شما ${warning.percentage}% باقی‌مانده است`
      default:
        return warning.message || 'اعلان جدید'
    }
  }

  return (
    <div
      className={cn(
        'border rounded-lg shadow-lg p-4 animate-slide-up',
        getStyles()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">{getMessage()}</p>
          
          {warning.percentage && warning.type !== 'special_granted' && (
            <Progress
              value={warning.percentage}
              className={cn(
                'h-1.5 mt-2',
                warning.type === '100_percent' && '[&>div]:bg-red-500',
                warning.type === '80_percent' && '[&>div]:bg-yellow-500',
                warning.type === 'credit_low' && '[&>div]:bg-orange-500'
              )}
            />
          )}
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت Toast ساده
// ============================================

export function useAIUsageToast() {
  const showWarning = (message: string) => {
    // در محیط واقعی از toast library استفاده می‌شود
    console.log('[AI Warning]', message)
  }

  const showError = (message: string) => {
    console.log('[AI Error]', message)
  }

  const showSuccess = (message: string) => {
    console.log('[AI Success]', message)
  }

  return { showWarning, showError, showSuccess }
}

