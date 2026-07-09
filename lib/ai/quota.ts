import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  AI_FEATURES,
  type AIUsageLimit,
  formatResetTime,
  getUsagePercentage,
} from '@/lib/check-ai-limit'

// ============================================
// تایپ RPC
// ============================================

interface QuotaRpcRow {
  allowed: boolean
  reason: string | null
  daily_used: number
  daily_limit: number | null
  weekly_used: number
  weekly_limit: number | null
  monthly_used: number
  monthly_limit: number | null
  credits_available: number
  credit_cost: number
  feature_label: string
  reset_time: string | null
}

function mapRpcRow(row: QuotaRpcRow, featureName: string): AIUsageLimit {
  return {
    allowed: row.allowed,
    reason: row.reason ?? undefined,
    dailyUsed: row.daily_used ?? 0,
    dailyLimit: row.daily_limit,
    weeklyUsed: row.weekly_used ?? 0,
    weeklyLimit: row.weekly_limit,
    monthlyUsed: row.monthly_used ?? 0,
    monthlyLimit: row.monthly_limit,
    creditsAvailable: row.credits_available ?? 0,
    creditCost: row.credit_cost ?? 0,
    featureLabel: row.feature_label ?? AI_FEATURES[featureName]?.label ?? featureName,
    resetTime: row.reset_time ?? formatResetTime('daily'),
  }
}

/** fallback امن وقتی RPC در دسترس نیست */
function fallbackLimit(featureName: string): AIUsageLimit {
  const feature = AI_FEATURES[featureName]
  if (!feature) {
    return {
      allowed: false,
      reason: 'قابلیت نامعتبر',
      dailyUsed: 0,
      dailyLimit: null,
      weeklyUsed: 0,
      weeklyLimit: null,
      monthlyUsed: 0,
      monthlyLimit: null,
      creditsAvailable: 0,
      creditCost: 0,
      featureLabel: featureName,
    }
  }

  return {
    allowed: feature.isEnabled,
    reason: feature.isEnabled ? undefined : 'این قابلیت غیرفعال شده است',
    dailyUsed: 0,
    dailyLimit: feature.dailyLimit,
    weeklyUsed: 0,
    weeklyLimit: feature.weeklyLimit,
    monthlyUsed: 0,
    monthlyLimit: feature.monthlyLimit,
    creditsAvailable: 1000,
    creditCost: feature.creditCost,
    featureLabel: feature.label,
    resetTime: formatResetTime('daily'),
  }
}

/**
 * بررسی آیا کاربر مجاز به استفاده از قابلیت AI است (Supabase RPC)
 */
export async function checkAILimit(
  userId: string,
  featureName: string
): Promise<AIUsageLimit> {
  const feature = AI_FEATURES[featureName]
  if (!feature) {
    return fallbackLimit(featureName)
  }

  if (!feature.isEnabled) {
    return {
      ...fallbackLimit(featureName),
      allowed: false,
      reason: 'این قابلیت غیرفعال شده است',
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('check_ai_usage_allowed', {
      p_user_id: userId,
      p_feature_name: featureName,
    })

    if (error) {
      console.error('[quota] check_ai_usage_allowed failed:', error.message)
      return fallbackLimit(featureName)
    }

    const row = (data as QuotaRpcRow[] | null)?.[0]
    if (!row) {
      return fallbackLimit(featureName)
    }

    return mapRpcRow(row, featureName)
  } catch (err) {
    console.error('[quota] checkAILimit error:', err)
    return fallbackLimit(featureName)
  }
}

export interface AllLimitsResult {
  features: Record<string, AIUsageLimit>
  totalCredits: number
  usedCredits: number
  warnings: Array<{
    id: string
    type: '80_percent' | '100_percent' | 'credit_low'
    feature: string
    featureLabel: string
    percentage?: number
    period?: string
    resetTime?: string
    message?: string
  }>
}

/**
 * بررسی همه محدودیت‌ها برای یک کاربر
 */
export async function checkAllLimits(userId: string): Promise<AllLimitsResult> {
  const features: Record<string, AIUsageLimit> = {}
  const warnings: AllLimitsResult['warnings'] = []
  let minCredits = Number.POSITIVE_INFINITY
  let maxCredits = 0
  let totalUsedEstimate = 0

  for (const [name, feature] of Object.entries(AI_FEATURES)) {
    const limit = await checkAILimit(userId, name)
    features[name] = limit

    if (limit.creditsAvailable < minCredits) {
      minCredits = limit.creditsAvailable
    }
    if (limit.creditCost > 0) {
      totalUsedEstimate += limit.creditCost * limit.monthlyUsed
    }

    if (feature.dailyLimit) {
      const percentage = getUsagePercentage(limit.dailyUsed, feature.dailyLimit)
      if (percentage >= 100) {
        warnings.push({
          id: `${name}-daily-100`,
          type: '100_percent',
          feature: name,
          featureLabel: feature.label,
          percentage: 100,
          period: 'روزانه',
          resetTime: limit.resetTime,
        })
      } else if (percentage >= 80) {
        warnings.push({
          id: `${name}-daily-80`,
          type: '80_percent',
          feature: name,
          featureLabel: feature.label,
          percentage,
          period: 'روزانه',
        })
      }
    }

    if (feature.weeklyLimit) {
      const percentage = getUsagePercentage(limit.weeklyUsed, feature.weeklyLimit)
      if (percentage >= 100 && !warnings.some((w) => w.id === `${name}-daily-100`)) {
        warnings.push({
          id: `${name}-weekly-100`,
          type: '100_percent',
          feature: name,
          featureLabel: feature.label,
          percentage: 100,
          period: 'هفتگی',
          resetTime: formatResetTime('weekly'),
        })
      }
    }

    if (!limit.allowed && limit.reason?.includes('اعتبار')) {
      warnings.push({
        id: `${name}-credit`,
        type: 'credit_low',
        feature: name,
        featureLabel: feature.label,
        percentage: limit.creditsAvailable,
        message: `اعتبار کافی برای ${feature.label} ندارید`,
      })
    }
  }

  try {
    const supabase = await createClient()
    const { data: creditRow } = await supabase
      .from('user_monthly_credits')
      .select('total_credits, bonus_credits, used_credits')
      .eq('user_id', userId)
      .eq('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
      .maybeSingle()

    if (creditRow) {
      maxCredits = creditRow.total_credits + creditRow.bonus_credits
      totalUsedEstimate = creditRow.used_credits
      minCredits = Math.max(0, maxCredits - creditRow.used_credits)
    }
  } catch {
    maxCredits = minCredits === Number.POSITIVE_INFINITY ? 100 : maxCredits
    minCredits = minCredits === Number.POSITIVE_INFINITY ? 100 : minCredits
  }

  const totalCredits = maxCredits || 100
  const usedCredits = totalUsedEstimate || 0
  const availableCredits = Math.max(0, totalCredits - usedCredits)

  if (availableCredits < 20) {
    warnings.push({
      id: 'general-credit-low',
      type: 'credit_low',
      feature: 'general',
      featureLabel: 'اعتبار',
      percentage: availableCredits,
      message: `اعتبار شما ${availableCredits} واحد باقی‌مانده است`,
    })
  }

  return {
    features,
    totalCredits,
    usedCredits,
    warnings,
  }
}

export interface RecordUsageOptions {
  model?: string
  responseTimeMs?: number
  inputData?: Record<string, unknown>
}

/**
 * ثبت استفاده از AI و کسر اعتبار
 */
export async function recordAIUsage(
  userId: string,
  featureName: string,
  success: boolean,
  blocked: boolean = false,
  limitType?: string,
  options: RecordUsageOptions = {}
): Promise<void> {
  const feature = AI_FEATURES[featureName]
  const creditsUsed = success && !blocked && feature ? feature.creditCost : 0

  try {
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', userId)
      .single()

    const schoolId = profile?.school_id
    if (schoolId) {
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        school_id: schoolId,
        feature_name: featureName,
        ai_model: options.model ?? null,
        credits_used: creditsUsed,
        input_data: options.inputData ?? {},
        response_time_ms: options.responseTimeMs ?? null,
        success,
        blocked_by_limit: blocked,
        limit_type: limitType ?? null,
      })
    }

    if (success && !blocked && creditsUsed > 0) {
      const { error: rpcError } = await supabase.rpc('record_ai_usage_and_deduct_credit', {
        p_user_id: userId,
        p_feature_name: featureName,
        p_credits_used: creditsUsed,
      })
      if (rpcError) {
        console.error('[quota] record_ai_usage_and_deduct_credit failed:', rpcError.message)
      }
    }
  } catch (err) {
    console.error('[quota] recordAIUsage error:', err)
  }
}

export async function hasReachedLimit(userId: string, featureName: string): Promise<boolean> {
  const limit = await checkAILimit(userId, featureName)
  return !limit.allowed
}
