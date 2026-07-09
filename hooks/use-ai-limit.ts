'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type AIUsageLimit,
  calculateRemaining,
  getUsagePercentage,
  getUsageColor,
  AI_FEATURES,
} from '@/lib/check-ai-limit'

// ============================================
// تایپ‌ها
// ============================================

interface UseAILimitOptions {
  featureName: string
  userId: string
  autoCheck?: boolean
  checkInterval?: number // milliseconds
}

interface UseAILimitReturn {
  // وضعیت
  isLoading: boolean
  error: string | null
  limit: AIUsageLimit | null
  
  // محاسبات
  canUse: boolean
  dailyPercentage: number
  weeklyPercentage: number
  monthlyPercentage: number
  creditPercentage: number
  dailyColor: string
  creditColor: string
  remaining: {
    daily: number | null
    weekly: number | null
    monthly: number | null
    credits: number
  }
  
  // اکشن‌ها
  checkLimit: () => Promise<void>
  recordUsage: (success: boolean) => Promise<void>
  
  // اطلاعات قابلیت
  feature: typeof AI_FEATURES[string] | null
}

// ============================================
// Hook
// ============================================

export function useAILimit({
  featureName,
  userId,
  autoCheck = true,
  checkInterval,
}: UseAILimitOptions): UseAILimitReturn {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<AIUsageLimit | null>(null)

  const feature = AI_FEATURES[featureName] || null

  // ============================================
  // بررسی محدودیت
  // ============================================

  const checkLimitFn = useCallback(async () => {
    if (!userId || !featureName) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/ai/check-limit?feature=${encodeURIComponent(featureName)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'خطا در بررسی محدودیت')
      }
      const result = await res.json() as AIUsageLimit
      setLimit(result)
    } catch (err) {
      console.error('Error checking AI limit:', err)
      setError('خطا در بررسی محدودیت')
    } finally {
      setIsLoading(false)
    }
  }, [userId, featureName])

  // ============================================
  // ثبت استفاده
  // ============================================

  const recordUsageFn = useCallback(async (success: boolean) => {
    if (!userId || !featureName) return

    try {
      await fetch('/api/ai/check-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName, success }),
      })
      // بروزرسانی محدودیت بعد از ثبت
      await checkLimitFn()
    } catch (err) {
      console.error('Error recording AI usage:', err)
    }
  }, [userId, featureName, checkLimitFn])

  // ============================================
  // Effects
  // ============================================

  // بررسی اولیه
  useEffect(() => {
    if (autoCheck) {
      checkLimitFn()
    }
  }, [autoCheck, checkLimitFn])

  // بررسی دوره‌ای
  useEffect(() => {
    if (!checkInterval) return

    const interval = setInterval(checkLimitFn, checkInterval)
    return () => clearInterval(interval)
  }, [checkInterval, checkLimitFn])

  // ============================================
  // محاسبات
  // ============================================

  const canUse = limit?.allowed ?? false

  const dailyPercentage = limit
    ? getUsagePercentage(limit.dailyUsed, limit.dailyLimit)
    : 0

  const weeklyPercentage = limit
    ? getUsagePercentage(limit.weeklyUsed, limit.weeklyLimit)
    : 0

  const monthlyPercentage = limit
    ? getUsagePercentage(limit.monthlyUsed, limit.monthlyLimit)
    : 0

  const creditPercentage = limit
    ? getUsagePercentage(limit.creditCost, limit.creditsAvailable)
    : 0

  const dailyColor = getUsageColor(dailyPercentage)
  const creditColor = getUsageColor(100 - (limit?.creditsAvailable || 0))

  const remaining = limit
    ? calculateRemaining(limit)
    : { daily: null, weekly: null, monthly: null, credits: 0 }

  // ============================================
  // Return
  // ============================================

  return {
    isLoading,
    error,
    limit,
    canUse,
    dailyPercentage,
    weeklyPercentage,
    monthlyPercentage,
    creditPercentage,
    dailyColor,
    creditColor,
    remaining,
    checkLimit: checkLimitFn,
    recordUsage: recordUsageFn,
    feature,
  }
}

// ============================================
// Hook برای بررسی همه محدودیت‌ها
// ============================================

interface UseAllAILimitsReturn {
  isLoading: boolean
  error: string | null
  limits: Record<string, AIUsageLimit>
  warnings: Array<{
    type: string
    feature: string
    percentage: number
    period: string
    resetTime?: string
  }>
  totalCredits: number
  usedCredits: number
  availableCredits: number
  refresh: () => Promise<void>
}

export function useAllAILimits(userId: string): UseAllAILimitsReturn {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    limits: Record<string, AIUsageLimit>
    warnings: Array<{
      type: string
      feature: string
      percentage: number
      period: string
      resetTime?: string
    }>
    totalCredits: number
    usedCredits: number
  } | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/check-all-limits')
      if (!res.ok) {
        throw new Error('خطا در بررسی محدودیت‌ها')
      }
      const result = await res.json()

      const limits: Record<string, AIUsageLimit> = {}
      for (const [name, row] of Object.entries(result.features as Record<string, AIUsageLimit>)) {
        limits[name] = row
      }

      setData({
        limits,
        warnings: result.warnings ?? [],
        totalCredits: result.totalCredits ?? 0,
        usedCredits: result.usedCredits ?? 0,
      })
    } catch (err) {
      console.error('Error checking all AI limits:', err)
      setError('خطا در بررسی محدودیت‌ها')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    isLoading,
    error,
    limits: data?.limits || {},
    warnings: data?.warnings || [],
    totalCredits: data?.totalCredits || 0,
    usedCredits: data?.usedCredits || 0,
    availableCredits: (data?.totalCredits || 0) - (data?.usedCredits || 0),
    refresh,
  }
}

// ============================================
// Hook برای نوتیفیکیشن‌های هشدار
// ============================================

interface UseAIWarningsReturn {
  warnings: Array<{
    id: string
    type: string
    feature: string
    message: string
    percentage?: number
    period?: string
  }>
  dismissWarning: (id: string) => void
  clearAll: () => void
}

export function useAIWarnings(userId: string): UseAIWarningsReturn {
  const [warnings, setWarnings] = useState<Array<{
    id: string
    type: string
    feature: string
    message: string
    percentage?: number
    period?: string
  }>>([])

  useEffect(() => {
    const checkWarnings = async () => {
      // در محیط واقعی از API استفاده می‌شود
      // ...
    }

    checkWarnings()
    const interval = setInterval(checkWarnings, 60000) // هر دقیقه

    return () => clearInterval(interval)
  }, [userId])

  const dismissWarning = useCallback((id: string) => {
    setWarnings(prev => prev.filter(w => w.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setWarnings([])
  }, [])

  return {
    warnings,
    dismissWarning,
    clearAll,
  }
}














































