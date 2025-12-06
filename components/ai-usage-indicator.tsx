'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  Info,
  RefreshCw,
  Home,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  type AIUsageLimit,
  AI_FEATURES,
  getUsagePercentage,
  getUsageColor,
  formatResetTime,
} from '@/lib/check-ai-limit'

// ============================================
// تایپ‌ها
// ============================================

interface AIUsageIndicatorProps {
  featureName: string
  userId: string
  variant?: 'compact' | 'full' | 'inline'
  showCredits?: boolean
  onLimitReached?: () => void
  className?: string
}

interface UsageData {
  allowed: boolean
  reason?: string
  dailyUsed: number
  dailyLimit: number | null
  weeklyUsed: number
  weeklyLimit: number | null
  monthlyUsed: number
  monthlyLimit: number | null
  creditsAvailable: number
  creditCost: number
  resetTime: string
}

// ============================================
// کامپوننت نمایشگر استفاده
// ============================================

export default function AIUsageIndicator({
  featureName,
  userId,
  variant = 'full',
  showCredits = true,
  onLimitReached,
  className,
}: AIUsageIndicatorProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const feature = AI_FEATURES[featureName]

  // ============================================
  // دریافت داده‌ها
  // ============================================

  useEffect(() => {
    const fetchUsage = async () => {
      setIsLoading(true)
      try {
        // در محیط واقعی از API استفاده می‌شود
        // const res = await fetch(`/api/ai/check-limit?feature=${featureName}`)
        // const data = await res.json()

        // داده نمونه
        const mockData: UsageData = {
          allowed: Math.random() > 0.2,
          dailyUsed: Math.floor(Math.random() * (feature?.dailyLimit || 5)),
          dailyLimit: feature?.dailyLimit || null,
          weeklyUsed: Math.floor(Math.random() * (feature?.weeklyLimit || 20)),
          weeklyLimit: feature?.weeklyLimit || null,
          monthlyUsed: Math.floor(Math.random() * (feature?.monthlyLimit || 50)),
          monthlyLimit: feature?.monthlyLimit || null,
          creditsAvailable: 100 - Math.floor(Math.random() * 50),
          creditCost: feature?.creditCost || 5,
          resetTime: formatResetTime('daily'),
        }

        // اگر محدودیت تمام شده باشد
        if (feature?.dailyLimit && mockData.dailyUsed >= feature.dailyLimit) {
          mockData.allowed = false
          mockData.reason = 'محدودیت روزانه تمام شده است'
        }

        setUsageData(mockData)

        if (!mockData.allowed && onLimitReached) {
          onLimitReached()
        }
      } catch (error) {
        console.error('Error fetching usage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()
  }, [featureName, userId, feature, onLimitReached])

  // ============================================
  // محاسبات
  // ============================================

  if (!feature) {
    return null
  }

  const dailyPercentage = usageData
    ? getUsagePercentage(usageData.dailyUsed, usageData.dailyLimit)
    : 0
  const creditPercentage = usageData
    ? getUsagePercentage(100 - usageData.creditsAvailable, 100)
    : 0

  const dailyColor = getUsageColor(dailyPercentage)
  const creditColor = getUsageColor(creditPercentage)

  // ============================================
  // حالت Inline (خیلی کوچک)
  // ============================================

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'cursor-help',
                dailyPercentage >= 100 && 'bg-red-100 text-red-700 border-red-300',
                dailyPercentage >= 80 && dailyPercentage < 100 && 'bg-yellow-100 text-yellow-700 border-yellow-300',
                dailyPercentage < 80 && 'bg-green-100 text-green-700 border-green-300',
                className
              )}
            >
              {usageData?.dailyUsed || 0}/{usageData?.dailyLimit || '∞'} امروز
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" dir="rtl">
            <div className="space-y-2">
              <p className="font-medium">{feature.label}</p>
              <div className="text-xs space-y-1">
                <p>✅ امروز: {usageData?.dailyUsed || 0} از {usageData?.dailyLimit || '∞'}</p>
                <p>📅 این هفته: {usageData?.weeklyUsed || 0} از {usageData?.weeklyLimit || '∞'}</p>
                <p>📆 این ماه: {usageData?.monthlyUsed || 0} از {usageData?.monthlyLimit || '∞'}</p>
                <p>💳 اعتبار: {usageData?.creditsAvailable || 0} (هر بار: {usageData?.creditCost || 0})</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // ============================================
  // حالت Compact
  // ============================================

  if (variant === 'compact') {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-3', className)} dir="rtl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <span>{feature.icon}</span>
            استفاده امروز
          </span>
          <Badge
            variant="outline"
            className={cn(
              dailyColor === 'red' && 'bg-red-100 text-red-700',
              dailyColor === 'yellow' && 'bg-yellow-100 text-yellow-700',
              dailyColor === 'green' && 'bg-green-100 text-green-700'
            )}
          >
            {usageData?.dailyUsed || 0} از {usageData?.dailyLimit || '∞'}
          </Badge>
        </div>
        <Progress
          value={dailyPercentage}
          className={cn(
            'h-2',
            dailyColor === 'red' && '[&>div]:bg-red-500',
            dailyColor === 'yellow' && '[&>div]:bg-yellow-500',
            dailyColor === 'green' && '[&>div]:bg-green-500'
          )}
        />
        {showCredits && (
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>💳 اعتبار: {usageData?.creditsAvailable || 0}</span>
            <span>هزینه: {usageData?.creditCost || 0} credit</span>
          </div>
        )}
      </div>
    )
  }

  // ============================================
  // حالت Full (پیش‌فرض)
  // ============================================

  // اگر محدودیت تمام شده
  if (usageData && !usageData.allowed) {
    return (
      <div className={cn('bg-red-50 border border-red-200 rounded-xl p-6', className)} dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-lg font-bold text-red-800 mb-2">
            محدودیت استفاده
          </h3>
          
          <p className="text-red-600 mb-4">
            {usageData.reason || 'محدودیت استفاده از این قابلیت تمام شده است'}
          </p>

          <div className="bg-white rounded-lg p-4 mb-4 text-right">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                تجدید در: <strong>{usageData.resetTime}</strong>
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">امروز:</span>
                <span className={cn(
                  usageData.dailyLimit && usageData.dailyUsed >= usageData.dailyLimit ? 'text-red-600 font-bold' : 'text-gray-700'
                )}>
                  {usageData.dailyUsed} از {usageData.dailyLimit || '∞'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">این هفته:</span>
                <span className={cn(
                  usageData.weeklyLimit && usageData.weeklyUsed >= usageData.weeklyLimit ? 'text-red-600 font-bold' : 'text-gray-700'
                )}>
                  {usageData.weeklyUsed} از {usageData.weeklyLimit || '∞'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">این ماه:</span>
                <span className={cn(
                  usageData.monthlyLimit && usageData.monthlyUsed >= usageData.monthlyLimit ? 'text-red-600 font-bold' : 'text-gray-700'
                )}>
                  {usageData.monthlyUsed} از {usageData.monthlyLimit || '∞'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-right text-sm text-gray-600">
            <p className="font-medium mb-2">💡 می‌توانید:</p>
            <ul className="space-y-1">
              <li>• فردا دوباره امتحان کنید</li>
              <li>• از معلم/مدیر بخواهید محدودیت را افزایش دهند</li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => window.location.href = '/dashboard'}
          >
            <Home className="w-4 h-4" />
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
    )
  }

  // اگر اعتبار کافی نیست
  if (usageData && usageData.creditCost > usageData.creditsAvailable) {
    return (
      <div className={cn('bg-yellow-50 border border-yellow-200 rounded-xl p-6', className)} dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            اعتبار ناکافی
          </h3>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-700">{usageData.creditsAvailable}</p>
                <p className="text-xs text-gray-500">اعتبار فعلی</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{usageData.creditCost}</p>
                <p className="text-xs text-gray-500">مورد نیاز</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {usageData.creditCost - usageData.creditsAvailable}
                </p>
                <p className="text-xs text-gray-500">کمبود</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-right text-sm text-gray-600">
            <p className="font-medium mb-2">💡 راه‌های افزایش اعتبار:</p>
            <ul className="space-y-1">
              <li>• منتظر اول ماه بمانید (تجدید خودکار)</li>
              <li>• از معلم/مدیر اعتبار اضافی درخواست کنید</li>
              <li>• در مسابقات مدرسه شرکت کنید</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            تجدید اعتبار: {formatResetTime('monthly')} دیگر
          </p>
        </div>
      </div>
    )
  }

  // حالت عادی - همه چیز OK
  return (
    <div className={cn('bg-gray-50 rounded-xl p-4', className)} dir="rtl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{feature.icon}</span>
            <div>
              <h4 className="font-medium text-gray-800">{feature.label}</h4>
              <p className="text-xs text-gray-500">
                استفاده امروز: {usageData?.dailyUsed || 0} از {usageData?.dailyLimit || '∞'}
              </p>
            </div>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <span className="text-xs">جزئیات</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {/* روزانه */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">امروز</span>
              <span className={cn(
                'font-medium',
                dailyColor === 'red' && 'text-red-600',
                dailyColor === 'yellow' && 'text-yellow-600',
                dailyColor === 'green' && 'text-green-600'
              )}>
                {dailyPercentage}%
              </span>
            </div>
            <Progress
              value={dailyPercentage}
              className={cn(
                'h-2',
                dailyColor === 'red' && '[&>div]:bg-red-500',
                dailyColor === 'yellow' && '[&>div]:bg-yellow-500',
                dailyColor === 'green' && '[&>div]:bg-green-500',
                dailyColor === 'blue' && '[&>div]:bg-blue-500'
              )}
            />
          </div>

          {/* اعتبار */}
          {showCredits && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  اعتبار
                </span>
                <span className="text-gray-600">
                  {usageData?.creditsAvailable || 0} (هزینه: {usageData?.creditCost || 0})
                </span>
              </div>
              <Progress
                value={100 - creditPercentage}
                className="h-2 [&>div]:bg-blue-500"
              />
            </div>
          )}
        </div>

        {/* Collapsible Details */}
        <CollapsibleContent className="mt-4">
          <div className="bg-white rounded-lg p-3 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                باقی‌مانده امروز
              </span>
              <span className="font-medium text-gray-700">
                {usageData?.dailyLimit ? usageData.dailyLimit - usageData.dailyUsed : '∞'} بار
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">باقی‌مانده هفته</span>
              <span className="font-medium text-gray-700">
                {usageData?.weeklyLimit ? usageData.weeklyLimit - usageData.weeklyUsed : '∞'} بار
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">باقی‌مانده ماه</span>
              <span className="font-medium text-gray-700">
                {usageData?.monthlyLimit ? usageData.monthlyLimit - usageData.monthlyUsed : '∞'} بار
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                تجدید روزانه
              </span>
              <span className="text-gray-600">{usageData?.resetTime || '—'}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// ============================================
// Export کامپوننت‌های کمکی
// ============================================

export function AIUsageBadge({
  featureName,
  className,
}: {
  featureName: string
  className?: string
}) {
  const feature = AI_FEATURES[featureName]
  if (!feature) return null

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <span>{feature.icon}</span>
      <span>{feature.creditCost} credit</span>
    </Badge>
  )
}

export function AIUsageAlert({
  message,
  type = 'warning',
}: {
  message: string
  type?: 'warning' | 'error' | 'success'
}) {
  const colors = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }

  const icons = {
    warning: '⚠️',
    error: '🚫',
    success: '✅',
  }

  return (
    <div className={cn('border rounded-lg p-3 text-sm', colors[type])} dir="rtl">
      <span className="ml-2">{icons[type]}</span>
      {message}
    </div>
  )
}













