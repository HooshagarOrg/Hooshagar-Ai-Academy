/**
 * Rate Limiter یکپارچه برای API Routes
 * از LRU Cache استفاده می‌کند (in-memory، بدون نیاز به Redis)
 */

import { LRUCache } from 'lru-cache'
import { NextRequest, NextResponse } from 'next/server'

// ============================================
// پیکربندی‌های از پیش تعریف‌شده
// ============================================
export const RATE_LIMIT_CONFIGS = {
  // احراز هویت — سختگیرانه
  login:          { limit: 5,   window: 60_000 },       // 5 بار در دقیقه
  otp_send:       { limit: 3,   window: 300_000 },      // 3 بار در 5 دقیقه
  otp_verify:     { limit: 5,   window: 300_000 },      // 5 بار در 5 دقیقه
  change_password:{ limit: 3,   window: 3_600_000 },    // 3 بار در ساعت

  // AI — متعادل
  ai_ocr:         { limit: 20,  window: 3_600_000 },    // 20 بار در ساعت
  ai_general:     { limit: 50,  window: 3_600_000 },    // 50 بار در ساعت
  ai_heavy:       { limit: 10,  window: 3_600_000 },    // 10 بار در ساعت

  // آزمون
  exam_submit:    { limit: 2,   window: 3_600_000 },    // 2 بار در ساعت
  exam_answer:    { limit: 200, window: 3_600_000 },    // 200 پاسخ در ساعت

  // عمومی
  api_default:    { limit: 100, window: 60_000 },       // 100 بار در دقیقه
  admin_action:   { limit: 30,  window: 60_000 },       // 30 عملیات ادمین در دقیقه
} as const

type RateLimitKey = keyof typeof RATE_LIMIT_CONFIGS

// ============================================
// ذخیره‌سازی in-memory
// ============================================
interface WindowEntry {
  count: number
  resetAt: number
}

const store = new LRUCache<string, WindowEntry>({
  max: 10_000,
  ttl: 3_600_000, // 1 ساعت
})

// ============================================
// کلید یکتا بر اساس IP + مسیر
// ============================================
function getClientKey(request: NextRequest, scope: string): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  return `${scope}:${ip}`
}

// ============================================
// بررسی Rate Limit
// ============================================
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function checkRateLimit(
  key: string,
  config: { limit: number; window: number }
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    // پنجره جدید
    store.set(key, { count: 1, resetAt: now + config.window })
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.window, limit: config.limit }
  }

  existing.count++

  if (existing.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, limit: config.limit }
  }

  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
    limit: config.limit,
  }
}

// ============================================
// هلپر: بررسی و return Response اگر محدود شد
// ============================================
export function rateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.allowed) return null

  return NextResponse.json(
    {
      error: 'تعداد درخواست‌ها از حد مجاز تجاوز کرده است',
      error_code: 'RATE_LIMITED',
      retry_after: Math.ceil((result.resetAt - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  )
}

// ============================================
// تابع ترکیبی برای استفاده سریع در API routes
// ============================================
export function applyRateLimit(
  request: NextRequest,
  scope: RateLimitKey | string,
  customConfig?: { limit: number; window: number }
): NextResponse | null {
  const config = customConfig ||
    RATE_LIMIT_CONFIGS[scope as RateLimitKey] ||
    RATE_LIMIT_CONFIGS.api_default

  const key = getClientKey(request, scope)
  const result = checkRateLimit(key, config)
  return rateLimitResponse(result)
}
