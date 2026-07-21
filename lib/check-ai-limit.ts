/**
 * =====================================================
 * سیستم بررسی و مدیریت محدودیت‌های AI
 * پیش‌فرض‌های UI = سقف دانش‌آموز (نقش‌محور واقعی در DB / migration 137)
 * =====================================================
 */

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

/** پیش‌فرض نمایشی — سقف واقعی از ai_usage_limits (نقش‌محور) خوانده می‌شود */
export const AI_FEATURES: Record<string, FeatureInfo> = {
  ocr_solver: {
    name: 'ocr_solver',
    label: 'حل مسئله با عکس',
    icon: '📸',
    description: 'عکس از مسئله می‌گیرد و راه‌حل می‌دهد',
    dailyLimit: 2,
    weeklyLimit: 10,
    monthlyLimit: 30,
    creditCost: 3,
    isEnabled: true,
  },
  study_buddy: {
    name: 'study_buddy',
    label: 'دستیار مطالعه',
    icon: '💬',
    description: 'چت درسی برای سوال و توضیح مطالب',
    dailyLimit: 5,
    weeklyLimit: 25,
    monthlyLimit: 80,
    creditCost: 2,
    isEnabled: true,
  },
  story_wizard: {
    name: 'story_wizard',
    label: 'جادوگر داستان',
    icon: '📖',
    description: 'ساخت داستان آموزشی/خلاقانه',
    dailyLimit: 1,
    weeklyLimit: 5,
    monthlyLimit: 15,
    creditCost: 5,
    isEnabled: true,
  },
  practice_playground: {
    name: 'practice_playground',
    label: 'تمرین هوشمند',
    icon: '🎮',
    description: 'تمرین تعاملی درسی با کمک AI',
    dailyLimit: 3,
    weeklyLimit: 15,
    monthlyLimit: 40,
    creditCost: 5,
    isEnabled: true,
  },
  student_analyzer: {
    name: 'student_analyzer',
    label: 'تحلیل دانش‌آموز',
    icon: '👤',
    description: 'تحلیل عملکرد، نقاط قوت/ضعف و پیشنهاد',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 10,
    isEnabled: true,
  },
  content_creator: {
    name: 'content_creator',
    label: 'تولید محتوا',
    icon: '✍️',
    description: 'ساخت متن/محتوای آموزشی برای کلاس',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 15,
    isEnabled: true,
  },
  exam_generator: {
    name: 'exam_generator',
    label: 'تولید آزمون',
    icon: '📝',
    description: 'ساخت سوال و آزمون خودکار',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 20,
    isEnabled: true,
  },
  oral_questions: {
    name: 'oral_questions',
    label: 'سوالات شفاهی',
    icon: '🎤',
    description: 'تولید سوال شفاهی از متن درس',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 8,
    isEnabled: true,
  },
  homework_evaluator: {
    name: 'homework_evaluator',
    label: 'تصحیح تشریحی',
    icon: '📝',
    description: 'نمره‌دهی و بازخورد پاسخ‌های تشریحی',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 5,
    isEnabled: true,
  },
  parent_message: {
    name: 'parent_message',
    label: 'پیام به والدین',
    icon: '✉️',
    description: 'نوشتن پیام حرفه‌ای برای والدین',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 10,
    isEnabled: true,
  },
  weekly_report: {
    name: 'weekly_report',
    label: 'گزارش هفتگی',
    icon: '📊',
    description: 'خلاصه وضعیت هفتگی دانش‌آموز',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 15,
    isEnabled: true,
  },
  ai_insights: {
    name: 'ai_insights',
    label: 'تحلیل هوشمند گزارش',
    icon: '💡',
    description: 'بینش AI روی گزارش والدین',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 1,
    creditCost: 15,
    isEnabled: true,
  },
  annual_report: {
    name: 'annual_report',
    label: 'گزارش سالانه',
    icon: '📅',
    description: 'روایت/تحلیل روند تحصیلی یک سال',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 20,
    isEnabled: true,
  },
  early_warning: {
    name: 'early_warning',
    label: 'هشدار زودهنگام',
    icon: '⚠️',
    description: 'هشدار افت تحصیلی قبل از جدی شدن',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 8,
    isEnabled: true,
  },
  future_compass: {
    name: 'future_compass',
    label: 'قطب‌نمای آینده',
    icon: '🧭',
    description: 'مشاوره شغلی و مسیر تحصیلی',
    dailyLimit: 1,
    weeklyLimit: 2,
    monthlyLimit: 4,
    creditCost: 25,
    isEnabled: true,
  },
  konkur_roadmap: {
    name: 'konkur_roadmap',
    label: 'نقشه راه کنکور',
    icon: '🎯',
    description: 'برنامه‌ریزی آمادگی کنکور',
    dailyLimit: 1,
    weeklyLimit: 2,
    monthlyLimit: 4,
    creditCost: 30,
    isEnabled: true,
  },
  family_insight: {
    name: 'family_insight',
    label: 'بینش خانواده',
    icon: '👨‍👩‍👧',
    description: 'تحلیل وضعیت خانوادگی مرتبط با تحصیل',
    dailyLimit: 0,
    weeklyLimit: 0,
    monthlyLimit: 0,
    creditCost: 12,
    isEnabled: true,
  },
  talent_analyzer: {
    name: 'talent_analyzer',
    label: 'تحلیل استعداد',
    icon: '🌟',
    description: 'تحلیل استعداد دانش‌آموز',
    dailyLimit: 1,
    weeklyLimit: 3,
    monthlyLimit: 8,
    creditCost: 10,
    isEnabled: true,
  },
  konkur_predictor: {
    name: 'konkur_predictor',
    label: 'پیش‌بین کنکور',
    icon: '📈',
    description: 'پیش‌بینی رتبه کنکور',
    dailyLimit: 1,
    weeklyLimit: 2,
    monthlyLimit: 4,
    creditCost: 20,
    isEnabled: true,
  },
}

export function calculateRemaining(limit: AIUsageLimit): AIUsageRemaining {
  return {
    daily: limit.dailyLimit !== null ? Math.max(0, limit.dailyLimit - limit.dailyUsed - 1) : null,
    weekly: limit.weeklyLimit !== null ? Math.max(0, limit.weeklyLimit - limit.weeklyUsed - 1) : null,
    monthly: limit.monthlyLimit !== null ? Math.max(0, limit.monthlyLimit - limit.monthlyUsed - 1) : null,
    credits: Math.max(0, limit.creditsAvailable - limit.creditCost),
  }
}

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

export function getUsagePercentage(used: number, limit: number | null): number {
  if (!limit) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 100) return 'red'
  if (percentage >= 80) return 'yellow'
  if (percentage >= 50) return 'blue'
  return 'green'
}
