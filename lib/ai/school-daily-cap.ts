import type { AIUsageLimit } from '@/lib/check-ai-limit'

const DEFAULT_SCHOOL_AI_DAILY_CAP = 2000

export function getSchoolAiDailyCap(
  envValue: string | undefined = process.env.SCHOOL_AI_DAILY_CAP
): number {
  const parsed = envValue ? Number.parseInt(envValue, 10) : DEFAULT_SCHOOL_AI_DAILY_CAP
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SCHOOL_AI_DAILY_CAP
}

/**
 * اگر شمارش مدرسه null باشد (خطای DB) سقف مدرسه اعمال نمی‌شود — fail-open شمارش.
 * اگر used >= cap باشد، درخواست رد می‌شود.
 */
export function applySchoolDailyCap(
  userLimit: AIUsageLimit,
  schoolUsed: number | null,
  cap: number = getSchoolAiDailyCap()
): AIUsageLimit {
  if (!userLimit.allowed || schoolUsed === null) return userLimit
  if (schoolUsed >= cap) {
    return {
      ...userLimit,
      allowed: false,
      reason:
        'سقف مصرف روزانه هوش مصنوعی این مدرسه به پایان رسیده است. فردا دوباره تلاش کنید.',
    }
  }
  return userLimit
}
