/**
 * Rate Limiter — Upstash/Vercel KV (توزیع‌شده) + fallback in-memory
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { LRUCache } from 'lru-cache'
import { NextRequest, NextResponse } from 'next/server'

export const RATE_LIMIT_CONFIGS = {
  login:          { limit: 5,   window: 60_000 },
  otp_send:       { limit: 3,   window: 300_000 },
  otp_verify:     { limit: 5,   window: 300_000 },
  change_password:{ limit: 3,   window: 3_600_000 },
  ai_ocr:         { limit: 20,  window: 3_600_000 },
  ai_general:     { limit: 50,  window: 3_600_000 },
  ai_heavy:       { limit: 10,  window: 3_600_000 },
  ai_generate:    { limit: 10,  window: 3_600_000 },
  exam_submit:    { limit: 2,   window: 3_600_000 },
  exam_answer:    { limit: 200, window: 3_600_000 },
  api_default:    { limit: 100, window: 60_000 },
  admin_action:   { limit: 30,  window: 60_000 },
} as const

type RateLimitKey = keyof typeof RATE_LIMIT_CONFIGS

interface WindowEntry {
  count: number
  resetAt: number
}

const memoryStore = new LRUCache<string, WindowEntry>({
  max: 10_000,
  ttl: 3_600_000,
})

let redisClient: Redis | null | undefined
const distributedLimiters = new Map<string, Ratelimit>()

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    redisClient = null
    return null
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

function windowMsToUpstashDuration(windowMs: number): `${number} ms` | `${number} s` | `${number} m` | `${number} h` {
  if (windowMs >= 3_600_000 && windowMs % 3_600_000 === 0) {
    return `${windowMs / 3_600_000} h`
  }
  if (windowMs >= 60_000 && windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m`
  }
  if (windowMs >= 1_000 && windowMs % 1_000 === 0) {
    return `${windowMs / 1_000} s`
  }
  return `${windowMs} ms`
}

function getDistributedLimiter(
  scope: string,
  config: { limit: number; window: number }
): Ratelimit | null {
  const redis = getRedisClient()
  if (!redis) return null

  const cacheKey = `${scope}:${config.limit}:${config.window}`
  const cached = distributedLimiters.get(cacheKey)
  if (cached) return cached

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.limit,
      windowMsToUpstashDuration(config.window)
    ),
    prefix: `hooshagar:rl:${scope}`,
    analytics: false,
  })

  distributedLimiters.set(cacheKey, limiter)
  return limiter
}

function getClientKey(request: NextRequest, scope: string): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  return `${scope}:${ip}`
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

function checkMemoryRateLimit(
  key: string,
  config: { limit: number; window: number }
): RateLimitResult {
  const now = Date.now()
  const existing = memoryStore.get(key)

  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.window })
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

async function checkDistributedRateLimit(
  key: string,
  scope: string,
  config: { limit: number; window: number }
): Promise<RateLimitResult | null> {
  const limiter = getDistributedLimiter(scope, config)
  if (!limiter) return null

  try {
    const { success, remaining, reset } = await limiter.limit(key)
    return {
      allowed: success,
      remaining,
      resetAt: reset,
      limit: config.limit,
    }
  } catch {
    return null
  }
}

export async function checkRateLimitForRequest(
  request: NextRequest,
  scope: RateLimitKey | string,
  customConfig?: { limit: number; window: number }
): Promise<RateLimitResult> {
  const config =
    customConfig ||
    RATE_LIMIT_CONFIGS[scope as RateLimitKey] ||
    RATE_LIMIT_CONFIGS.api_default

  const key = getClientKey(request, scope)
  const distributed = await checkDistributedRateLimit(key, scope, config)
  if (distributed) return distributed

  return checkMemoryRateLimit(key, config)
}

/** @deprecated از applyRateLimitAsync استفاده کنید */
export function checkRateLimit(
  key: string,
  config: { limit: number; window: number }
): RateLimitResult {
  return checkMemoryRateLimit(key, config)
}

export async function applyRateLimitAsync(
  request: NextRequest,
  scope: RateLimitKey | string,
  customConfig?: { limit: number; window: number }
): Promise<NextResponse | null> {
  const result = await checkRateLimitForRequest(request, scope, customConfig)
  return rateLimitResponse(result)
}

/** سازگاری با کد قدیمی — فقط in-memory */
export function applyRateLimit(
  request: NextRequest,
  scope: RateLimitKey | string,
  customConfig?: { limit: number; window: number }
): NextResponse | null {
  const config =
    customConfig ||
    RATE_LIMIT_CONFIGS[scope as RateLimitKey] ||
    RATE_LIMIT_CONFIGS.api_default

  const key = getClientKey(request, scope)
  const result = checkMemoryRateLimit(key, config)
  return rateLimitResponse(result)
}

export function isDistributedRateLimitEnabled(): boolean {
  return getRedisClient() !== null
}
