'use client'

import { useState, ReactNode } from 'react'
import { AlertTriangle, Clock, CreditCard, Home, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAILimit } from '@/hooks/use-ai-limit'
import { AI_FEATURES } from '@/lib/check-ai-limit'

// ============================================
// تایپ‌ها
// ============================================

interface AIUsageWrapperProps {
  featureName: string
  userId: string
  children: ReactNode
  onAction?: () => Promise<void>
  showUsageBar?: boolean
  className?: string
}

// ============================================
// کامپوننت Wrapper
// ============================================

/**
 * کامپوننت Wrapper برای قابلیت‌های AI
 * 
 * این کامپوننت به صورت خودکار:
 * - محدودیت استفاده را بررسی می‌کند
 * - در صورت تمام شدن محدودیت، پیام مناسب نمایش می‌دهد
 * - میزان استفاده را نمایش می‌دهد
 * - بعد از استفاده موفق، محدودیت را بروزرسانی می‌کند
 * 
 * @example
 * <AIUsageWrapper
 *   featureName="story_wizard"
 *   userId={user.id}
 *   onAction={generateStory}
 * >
 *   <StoryWizardForm />
 * </AIUsageWrapper>
 */
export default function AIUsageWrapper({
  featureName,
  userId,
  children,
  onAction,
  showUsageBar = true,
  className,
}: AIUsageWrapperProps) {
  const {
    isLoading,
    limit,
    canUse,
    dailyPercentage,
    dailyColor,
    remaining,
    recordUsage,
    feature,
  } = useAILimit({ featureName, userId })

  const [isExecuting, setIsExecuting] = useState(false)

  // ============================================
  // اجرای اکشن با بررسی محدودیت
  // ============================================

  const handleAction = async () => {
    if (!canUse || !onAction) return

    setIsExecuting(true)
    try {
      await onAction()
      await recordUsage(true)
    } catch (error) {
      await recordUsage(false)
      throw error
    } finally {
      setIsExecuting(false)
    }
  }

  // ============================================
  // حالت لودینگ
  // ============================================

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // ============================================
  // محدودیت تمام شده
  // ============================================

  if (!canUse && limit) {
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
            {limit.reason || 'محدودیت استفاده از این قابلیت تمام شده است'}
          </p>

          <div className="bg-white rounded-lg p-4 mb-4 text-right max-w-sm mx-auto">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                تجدید در: <strong>{limit.resetTime}</strong>
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {limit.dailyLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-500">امروز:</span>
                  <span className={cn(
                    limit.dailyUsed >= limit.dailyLimit ? 'text-red-600 font-bold' : 'text-gray-700'
                  )}>
                    {limit.dailyUsed} از {limit.dailyLimit}
                  </span>
                </div>
              )}
              {limit.weeklyLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-500">این هفته:</span>
                  <span className={cn(
                    limit.weeklyUsed >= limit.weeklyLimit ? 'text-red-600 font-bold' : 'text-gray-700'
                  )}>
                    {limit.weeklyUsed} از {limit.weeklyLimit}
                  </span>
                </div>
              )}
              {limit.monthlyLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-500">این ماه:</span>
                  <span className={cn(
                    limit.monthlyUsed >= limit.monthlyLimit ? 'text-red-600 font-bold' : 'text-gray-700'
                  )}>
                    {limit.monthlyUsed} از {limit.monthlyLimit}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-right text-sm text-gray-600 max-w-sm mx-auto">
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

  // ============================================
  // حالت عادی
  // ============================================

  return (
    <div className={cn('space-y-4', className)} dir="rtl">
      {/* نمایش میزان استفاده */}
      {showUsageBar && feature && limit && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{feature.icon}</span>
              <span className="text-sm font-medium text-gray-700">
                {feature.label}
              </span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      'cursor-help',
                      dailyColor === 'red' && 'bg-red-100 text-red-700 border-red-300',
                      dailyColor === 'yellow' && 'bg-yellow-100 text-yellow-700 border-yellow-300',
                      dailyColor === 'green' && 'bg-green-100 text-green-700 border-green-300'
                    )}
                  >
                    {limit.dailyUsed}/{limit.dailyLimit || '∞'} امروز
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" dir="rtl">
                  <div className="space-y-2 text-sm">
                    <p>✅ باقی‌مانده امروز: {remaining.daily ?? '∞'}</p>
                    <p>📅 باقی‌مانده هفته: {remaining.weekly ?? '∞'}</p>
                    <p>📆 باقی‌مانده ماه: {remaining.monthly ?? '∞'}</p>
                    <p>💳 اعتبار: {limit.creditsAvailable} (هزینه: {limit.creditCost})</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Progress
            value={dailyPercentage}
            className={cn(
              'h-1.5',
              dailyColor === 'red' && '[&>div]:bg-red-500',
              dailyColor === 'yellow' && '[&>div]:bg-yellow-500',
              dailyColor === 'green' && '[&>div]:bg-green-500',
              dailyColor === 'blue' && '[&>div]:bg-blue-500'
            )}
          />
        </div>
      )}

      {/* محتوای اصلی */}
      {children}

      {/* دکمه اکشن (اگر وجود داشته باشد) */}
      {onAction && (
        <div className="flex justify-end">
          <Button
            onClick={handleAction}
            disabled={!canUse || isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{feature?.icon}</span>
            )}
            {isExecuting ? 'در حال پردازش...' : `اجرای ${feature?.label}`}
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================
// کامپوننت نمایش سریع محدودیت
// ============================================

export function AILimitBadge({
  featureName,
  userId,
  className,
}: {
  featureName: string
  userId: string
  className?: string
}) {
  const { limit, dailyColor, feature } = useAILimit({ featureName, userId })

  if (!limit || !feature) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'cursor-help',
              dailyColor === 'red' && 'bg-red-100 text-red-700 border-red-300',
              dailyColor === 'yellow' && 'bg-yellow-100 text-yellow-700 border-yellow-300',
              dailyColor === 'green' && 'bg-green-100 text-green-700 border-green-300',
              className
            )}
          >
            {feature.icon} {limit.dailyUsed}/{limit.dailyLimit || '∞'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <p>{feature.label}: {limit.dailyUsed} از {limit.dailyLimit || '∞'} امروز</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// کامپوننت نمایش اعتبار
// ============================================

export function CreditsBadge({
  userId,
  className,
}: {
  userId: string
  className?: string
}) {
  // در محیط واقعی از hook استفاده می‌شود
  const credits = 75 // نمونه

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('cursor-help gap-1', className)}>
            <CreditCard className="w-3 h-3" />
            {credits} credit
          </Badge>
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <p>اعتبار باقی‌مانده این ماه</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}




