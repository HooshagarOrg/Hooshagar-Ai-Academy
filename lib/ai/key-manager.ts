/**
 * AI Key Manager
 * مدیریت Round-Robin برای ۱۰ کلید Google و ۳ کلید OpenRouter
 */

// ── Google Keys (10 کلید Round-Robin) ──────────────────────
const GOOGLE_KEYS = [
  process.env.GOOGLE_API_KEY_1,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
  process.env.GOOGLE_API_KEY_6,
  process.env.GOOGLE_API_KEY_7,
  process.env.GOOGLE_API_KEY_8,
  process.env.GOOGLE_API_KEY_9,
  process.env.GOOGLE_API_KEY_10,
].filter(Boolean) as string[]

// ── OpenRouter Keys (3 کلید بر اساس Tier) ──────────────────
const OPENROUTER_KEYS = {
  A: process.env.OPENROUTER_API_KEY    || '',  // Tier 2 - مدل‌های 200B+
  B: process.env.OPENROUTER_API_KEY_B  || '',  // Tier 3 - مدل‌های 32-70B
  C: process.env.OPENROUTER_API_KEY_C  || '',  // Tier 4 - مدل‌های سریع
}

// شمارنده Round-Robin (در حافظه - در production از Redis استفاده کنید)
let googleKeyIndex = 0

/**
 * دریافت کلید Google بر اساس Round-Robin
 * هر بار یک کلید متفاوت برمی‌گرداند تا سقف رایگان بالاتر برود
 */
export function getNextGoogleKey(): string {
  if (GOOGLE_KEYS.length === 0) {
    throw new Error('هیچ کلید Google تنظیم نشده')
  }
  const key = GOOGLE_KEYS[googleKeyIndex % GOOGLE_KEYS.length]
  googleKeyIndex++
  return key
}

/**
 * دریافت کلید OpenRouter بر اساس Tier
 * Tier 2 → Key A | Tier 3 → Key B | Tier 4 → Key C
 */
export function getOpenRouterKey(tier: 2 | 3 | 4): string {
  const keyMap = { 2: OPENROUTER_KEYS.A, 3: OPENROUTER_KEYS.B, 4: OPENROUTER_KEYS.C }
  const key = keyMap[tier]
  if (!key) {
    // fallback به کلید اول
    return OPENROUTER_KEYS.A || OPENROUTER_KEYS.B || OPENROUTER_KEYS.C
  }
  return key
}

export type AITier = 1 | 2 | 3 | 4

/**
 * دریافت اطلاعات API برای tier مشخص
 */
export function getAPIConfig(tier: AITier): {
  apiKey: string
  baseURL: string
  isGoogle: boolean
} {
  if (tier === 1) {
    return {
      apiKey: getNextGoogleKey(),
      baseURL: process.env.NEXT_PUBLIC_GEMINI_PROXY || 'https://generativelanguage.googleapis.com',
      isGoogle: true,
    }
  }

  const openRouterBase =
    process.env.NEXT_PUBLIC_OPENROUTER_PROXY ||
    'https://openrouter.ai/api/v1'

  return {
    apiKey: getOpenRouterKey(tier as 2 | 3 | 4),
    baseURL: openRouterBase,
    isGoogle: false,
  }
}

/**
 * وضعیت کلیدها
 */
export function getKeyStatus() {
  return {
    google: {
      total: GOOGLE_KEYS.length,
      configured: GOOGLE_KEYS.filter(k => k && k !== 'undefined').length,
    },
    openrouter: {
      keyA: !!OPENROUTER_KEYS.A,
      keyB: !!OPENROUTER_KEYS.B,
      keyC: !!OPENROUTER_KEYS.C,
      total: [OPENROUTER_KEYS.A, OPENROUTER_KEYS.B, OPENROUTER_KEYS.C].filter(Boolean).length,
    },
  }
}
