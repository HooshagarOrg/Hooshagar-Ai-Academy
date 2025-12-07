'use client'

import { Ban, Home, Phone, Calendar, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AI_FEATURES } from '@/lib/check-ai-limit'
import { translateScope, formatAccessDate } from '@/lib/check-ai-access'

// ============================================
// تایپ‌ها
// ============================================

interface AIAccessDeniedProps {
  featureName: string
  blockedBy?: 'school' | 'class' | 'user' | null
  blockedByName?: string
  blockedReason?: string | null
  blockedUntil?: string | null
  variant?: 'full' | 'compact' | 'inline'
  onGoHome?: () => void
  className?: string
}

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * کامپوننت نمایش پیام عدم دسترسی به قابلیت AI
 * 
 * @example
 * <AIAccessDenied
 *   featureName="story_wizard"
 *   blockedBy="school"
 *   blockedByName="دبستان تلاش"
 *   blockedReason="تست محدودیت"
 *   blockedUntil="1403/10/15"
 * />
 */
export default function AIAccessDenied({
  featureName,
  blockedBy = 'school',
  blockedByName,
  blockedReason,
  blockedUntil,
  variant = 'full',
  onGoHome,
  className,
}: AIAccessDeniedProps) {
  const feature = AI_FEATURES[featureName]
  const featureLabel = feature?.label || featureName
  const featureIcon = feature?.icon || '🤖'

  // ============================================
  // حالت Inline (خیلی کوچک)
  // ============================================

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm',
          className
        )}
        dir="rtl"
      >
        <Ban className="w-4 h-4" />
        <span>دسترسی محدود شده</span>
      </div>
    )
  }

  // ============================================
  // حالت Compact
  // ============================================

  if (variant === 'compact') {
    return (
      <Card className={cn('bg-red-50 border-red-200', className)} dir="rtl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Ban className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-red-800 mb-1">
                دسترسی محدود شده
              </h4>
              <p className="text-sm text-red-600 mb-2">
                قابلیت «{featureLabel}» توسط {translateScope(blockedBy || 'school')} غیرفعال شده است.
              </p>
              {blockedUntil && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  فعال می‌شود: {formatAccessDate(blockedUntil)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================
  // حالت Full (پیش‌فرض)
  // ============================================

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-xl p-8', className)} dir="rtl">
      <div className="text-center max-w-md mx-auto">
        {/* آیکون */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Ban className="w-10 h-10 text-red-500" />
        </div>
        
        {/* عنوان */}
        <h2 className="text-2xl font-bold text-red-800 mb-2">
          🚫 دسترسی محدود شده
        </h2>
        
        {/* پیام اصلی */}
        <p className="text-red-600 mb-6">
          قابلیت «{featureIcon} {featureLabel}» برای شما غیرفعال شده است.
        </p>

        {/* جزئیات */}
        <div className="bg-white rounded-lg p-4 mb-6 text-right">
          <div className="space-y-3">
            {/* غیرفعال شده توسط */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                {blockedBy === 'school' && '🏫'}
                {blockedBy === 'class' && '👨‍👩‍👧‍👦'}
                {blockedBy === 'user' && '👤'}
              </div>
              <div>
                <p className="text-sm text-gray-500">غیرفعال توسط:</p>
                <p className="font-medium text-gray-800">
                  {translateScope(blockedBy || 'school')}
                  {blockedByName && ` (${blockedByName})`}
                </p>
              </div>
            </div>

            {/* دلیل */}
            {blockedReason && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">دلیل:</p>
                  <p className="font-medium text-gray-800">{blockedReason}</p>
                </div>
              </div>
            )}

            {/* تاریخ فعال شدن */}
            {blockedUntil && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">فعال می‌شود:</p>
                  <p className="font-medium text-green-600">
                    {formatAccessDate(blockedUntil)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* راهنما */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-right mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">برای اطلاعات بیشتر:</p>
              <p>
                با مدیر مدرسه یا معلم خود تماس بگیرید تا دلیل این محدودیت را بررسی کنند.
              </p>
            </div>
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onGoHome || (() => window.location.href = '/dashboard')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            بازگشت به داشبورد
          </Button>
          
          <Button
            variant="ghost"
            className="gap-2 text-gray-600"
          >
            <Phone className="w-4 h-4" />
            تماس با پشتیبانی
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت بررسی دسترسی + نمایش
// ============================================

interface AIAccessGateProps {
  featureName: string
  userId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * کامپوننت Gate برای بررسی دسترسی قبل از نمایش محتوا
 * 
 * @example
 * <AIAccessGate featureName="story_wizard" userId={user.id}>
 *   <StoryWizardForm />
 * </AIAccessGate>
 */
export function AIAccessGate({
  featureName,
  userId,
  children,
  fallback,
}: AIAccessGateProps) {
  // در محیط واقعی از hook استفاده می‌شود:
  // const { hasAccess, blockedBy, blockedReason, blockedUntil, isLoading } = useAIAccess(featureName, userId)
  
  // شبیه‌سازی
  const hasAccess = true // Math.random() > 0.1

  if (!hasAccess) {
    return fallback || (
      <AIAccessDenied
        featureName={featureName}
        blockedBy="school"
        blockedReason="این قابلیت توسط مدیر غیرفعال شده است"
      />
    )
  }

  return <>{children}</>
}

// ============================================
// Export کامپوننت‌ها
// ============================================

export { AIAccessDenied }















