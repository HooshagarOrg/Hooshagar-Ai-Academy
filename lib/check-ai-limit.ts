/**
 * =====================================================
 * سیستم بررسی و مدیریت محدودیت‌های AI
 * =====================================================
 */

// import { createServerClient } from '@/lib/supabase-server'

// ============================================
// تایپ‌ها
// ============================================

export interface AIUsageLimit {
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
  featureLabel: string
  resetTime?: string
}

export interface AIUsageRemaining {
  daily: number | null
  weekly: number | null
  monthly: number | null
  credits: number
}

export interface FeatureInfo {
  name: string
  label: string
  icon: string
  description: string
  dailyLimit: number | null
  weeklyLimit: number | null
  monthlyLimit: number | null
  creditCost: number
  isEnabled: boolean
}

// ============================================
// لیست قابلیت‌های AI
// ============================================

export const AI_FEATURES: Record<string, FeatureInfo> = {
  story_wizard: {
    name: 'story_wizard',
    label: 'تولید داستان',
    icon: '📖',
    description: 'تولید داستان‌های خلاقانه با هوش مصنوعی',
    dailyLimit: 3,
    weeklyLimit: 15,
    monthlyLimit: 50,
    creditCost: 5,
    isEnabled: true,
  },
  student_analyzer: {
    name: 'student_analyzer',
    label: 'تحلیل دانش‌آموز',
    icon: '👤',
    description: 'تحلیل عملکرد و پیشرفت دانش‌آموز',
    dailyLimit: 5,
    weeklyLimit: 25,
    monthlyLimit: 100,
    creditCost: 10,
    isEnabled: true,
  },
  ocr_solver: {
    name: 'ocr_solver',
    label: 'حل مسئله با OCR',
    icon: '📸',
    description: 'تشخیص متن و حل مسئله از تصویر',
    dailyLimit: 10,
    weeklyLimit: 50,
    monthlyLimit: 200,
    creditCost: 3,
    isEnabled: true,
  },
  study_buddy: {
    name: 'study_buddy',
    label: 'دستیار مطالعه',
    icon: '💬',
    description: 'چت‌بات هوشمند برای کمک در مطالعه',
    dailyLimit: 20,
    weeklyLimit: 100,
    monthlyLimit: 400,
    creditCost: 2,
    isEnabled: true,
  },
  content_creator: {
    name: 'content_creator',
    label: 'تولید محتوا',
    icon: '✍️',
    description: 'تولید محتوای آموزشی',
    dailyLimit: 5,
    weeklyLimit: 20,
    monthlyLimit: 80,
    creditCost: 15,
    isEnabled: true,
  },
  exam_generator: {
    name: 'exam_generator',
    label: 'تولید آزمون',
    icon: '📝',
    description: 'تولید خودکار سوالات آزمون',
    dailyLimit: 3,
    weeklyLimit: 10,
    monthlyLimit: 30,
    creditCost: 20,
    isEnabled: true,
  },
  future_compass: {
    name: 'future_compass',
    label: 'راهنمای آینده',
    icon: '🧭',
    description: 'تحلیل استعدادها و مشاوره شغلی',
    dailyLimit: 2,
    weeklyLimit: 8,
    monthlyLimit: 20,
    creditCost: 25,
    isEnabled: true,
  },
  practice_playground: {
    name: 'practice_playground',
    label: 'تمرین هوشمند',
    icon: '🎮',
    description: 'تمرین‌های تعاملی',
    dailyLimit: 10,
    weeklyLimit: 50,
    monthlyLimit: 150,
    creditCost: 5,
    isEnabled: true,
  },
  konkur_roadmap: {
    name: 'konkur_roadmap',
    label: 'نقشه راه کنکور',
    icon: '🎯',
    description: 'برنامه‌ریزی هوشمند کنکور',
    dailyLimit: 2,
    weeklyLimit: 6,
    monthlyLimit: 15,
    creditCost: 30,
    isEnabled: true,
  },
  parent_message: {
    name: 'parent_message',
    label: 'پیام به والدین',
    icon: '✉️',
    description: 'تولید پیام حرفه‌ای برای والدین',
    dailyLimit: 3,
    weeklyLimit: 15,
    monthlyLimit: 50,
    creditCost: 10,
    isEnabled: true,
  },
  weekly_report: {
    name: 'weekly_report',
    label: 'گزارش هفتگی',
    icon: '📊',
    description: 'تولید گزارش هفتگی خودکار',
    dailyLimit: 1,
    weeklyLimit: 4,
    monthlyLimit: 12,
    creditCost: 15,
    isEnabled: true,
  },
  early_warning: {
    name: 'early_warning',
    label: 'هشدار زودهنگام',
    icon: '⚠️',
    description: 'شناسایی مشکلات پیش از وقوع',
    dailyLimit: 5,
    weeklyLimit: 20,
    monthlyLimit: 80,
    creditCost: 8,
    isEnabled: true,
  },
  oral_questions: {
    name: 'oral_questions',
    label: 'سوالات شفاهی',
    icon: '🎤',
    description: 'تولید سوالات شفاهی از متن درس',
    dailyLimit: 5,
    weeklyLimit: 20,
    monthlyLimit: 60,
    creditCost: 8,
    isEnabled: true,
  },
  family_insight: {
    name: 'family_insight',
    label: 'بینش خانواده',
    icon: '👨‍👩‍👧',
    description: 'تحلیل اطلاعات خانوادگی',
    dailyLimit: 3,
    weeklyLimit: 12,
    monthlyLimit: 40,
    creditCost: 12,
    isEnabled: true,
  },
}

// ============================================
// بررسی محدودیت AI (Mock)
// ============================================

/**
 * بررسی آیا کاربر مجاز به استفاده از قابلیت AI است
 */
export async function checkAILimit(
  userId: string,
  featureName: string
): Promise<AIUsageLimit> {
  // در محیط واقعی از Supabase استفاده می‌شود
  // const supabase = createServerClient()
  // const { data, error } = await supabase.rpc('check_ai_usage_allowed', {
  //   p_user_id: userId,
  //   p_feature_name: featureName
  // })

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

  // داده‌های نمونه
  const mockDailyUsed = Math.floor(Math.random() * (feature.dailyLimit || 5))
  const mockWeeklyUsed = Math.floor(Math.random() * (feature.weeklyLimit || 20))
  const mockMonthlyUsed = Math.floor(Math.random() * (feature.monthlyLimit || 50))
  const mockCredits = 100 - Math.floor(Math.random() * 50)

  return {
    allowed: true,
    dailyUsed: mockDailyUsed,
    dailyLimit: feature.dailyLimit,
    weeklyUsed: mockWeeklyUsed,
    weeklyLimit: feature.weeklyLimit,
    monthlyUsed: mockMonthlyUsed,
    monthlyLimit: feature.monthlyLimit,
    creditsAvailable: mockCredits,
    creditCost: feature.creditCost,
    featureLabel: feature.label,
    resetTime: '6 ساعت',
  }
}

/**
 * بررسی همه محدودیت‌ها برای یک کاربر
 */
export async function checkAllLimits(userId: string): Promise<{
  features: Record<string, AIUsageLimit>
  totalCredits: number
  usedCredits: number
  warnings: Array<{
    type: string
    feature: string
    percentage: number
    period: string
    resetTime?: string
  }>
}> {
  const features: Record<string, AIUsageLimit> = {}
  const warnings: Array<{
    type: string
    feature: string
    percentage: number
    period: string
    resetTime?: string
  }> = []

  for (const [name, feature] of Object.entries(AI_FEATURES)) {
    const limit = await checkAILimit(userId, name)
    features[name] = limit

    // بررسی هشدارها
    if (feature.dailyLimit) {
      const percentage = (limit.dailyUsed / feature.dailyLimit) * 100
      if (percentage >= 100) {
        warnings.push({
          type: '100_percent',
          feature: feature.label,
          percentage: 100,
          period: 'روزانه',
          resetTime: limit.resetTime,
        })
      } else if (percentage >= 80) {
        warnings.push({
          type: '80_percent',
          feature: feature.label,
          percentage: Math.round(percentage),
          period: 'روزانه',
        })
      }
    }
  }

  return {
    features,
    totalCredits: 100,
    usedCredits: 35,
    warnings,
  }
}

/**
 * ثبت استفاده از AI
 */
export async function recordAIUsage(
  userId: string,
  featureName: string,
  success: boolean,
  blocked: boolean = false,
  limitType?: string
): Promise<void> {
  // در محیط واقعی:
  // const supabase = createServerClient()
  // const limit = await checkAILimit(userId, featureName)
  // 
  // await supabase.from('ai_usage_logs').insert({
  //   user_id: userId,
  //   feature_name: featureName,
  //   success: success,
  //   blocked_by_limit: blocked,
  //   limit_type: limitType,
  //   credits_used: success ? limit.creditCost : 0
  // })
  // 
  // if (success && limit.creditCost > 0) {
  //   await supabase.rpc('record_ai_usage_and_deduct_credit', {
  //     p_user_id: userId,
  //     p_feature_name: featureName,
  //     p_credits_used: limit.creditCost
  //   })
  // }

  console.log('[AI Usage]', { userId, featureName, success, blocked, limitType })
}

/**
 * محاسبه باقی‌مانده استفاده
 */
export function calculateRemaining(limit: AIUsageLimit): AIUsageRemaining {
  return {
    daily: limit.dailyLimit !== null ? Math.max(0, limit.dailyLimit - limit.dailyUsed - 1) : null,
    weekly: limit.weeklyLimit !== null ? Math.max(0, limit.weeklyLimit - limit.weeklyUsed - 1) : null,
    monthly: limit.monthlyLimit !== null ? Math.max(0, limit.monthlyLimit - limit.monthlyUsed - 1) : null,
    credits: Math.max(0, limit.creditsAvailable - limit.creditCost),
  }
}

/**
 * فرمت کردن زمان باقی‌مانده
 */
export function formatResetTime(type: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date()
  
  if (type === 'daily') {
    const hoursLeft = 24 - now.getHours()
    return `${hoursLeft} ساعت`
  }
  
  if (type === 'weekly') {
    const daysLeft = 7 - now.getDay()
    return `${daysLeft} روز`
  }
  
  if (type === 'monthly') {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const daysLeft = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return `${daysLeft} روز`
  }
  
  return ''
}

/**
 * دریافت درصد استفاده
 */
export function getUsagePercentage(used: number, limit: number | null): number {
  if (!limit) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * دریافت رنگ بر اساس درصد
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 100) return 'red'
  if (percentage >= 80) return 'yellow'
  if (percentage >= 50) return 'blue'
  return 'green'
}

/**
 * بررسی سریع آیا محدودیتی وجود دارد
 */
export async function hasReachedLimit(userId: string, featureName: string): Promise<boolean> {
  const limit = await checkAILimit(userId, featureName)
  return !limit.allowed
}

// ============================================
// Hook برای استفاده در کامپوننت‌ها
// ============================================

export type { FeatureInfo }















