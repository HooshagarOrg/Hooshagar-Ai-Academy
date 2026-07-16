/**
 * قفل موقت ورود — IP + پروفایل
 * ۵ شکست → ۱۵ دقیقه قفل | بعد از ۳ شکست → نیاز به Turnstile (اگر تنظیم شده)
 */

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import { LRUCache } from 'lru-cache'
import type { NextRequest } from 'next/server'
import { getSupabaseServerUrl } from '@/lib/supabase/resolve-url'
import { supabaseGlobalOptions } from '@/lib/supabase/fetch'

export const LOGIN_LOCK_MAX_FAILURES = 5
export const LOGIN_LOCK_DURATION_MS = 15 * 60_000
export const LOGIN_CAPTCHA_AFTER_FAILURES = 3

export type LoginLockReason = 'ip' | 'profile' | 'blocked_ip'

export interface LoginLockStatus {
  locked: boolean
  reason?: LoginLockReason
  failures: number
  remainingMs: number
  retryAfterSeconds: number
  requireCaptcha: boolean
}

interface FailState {
  count: number
  lockedUntil: number
}

const memoryFails = new LRUCache<string, FailState>({
  max: 20_000,
  ttl: LOGIN_LOCK_DURATION_MS * 2,
})

let redisClient: Redis | null | undefined

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    redisClient = null
    return null
  }
  redisClient = new Redis({ url, token })
  return redisClient
}

export function getRequestIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

function adminDb() {
  return createAdminClient(
    getSupabaseServerUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, ...supabaseGlobalOptions }
  )
}

function emptyStatus(failures = 0): LoginLockStatus {
  return {
    locked: false,
    failures,
    remainingMs: 0,
    retryAfterSeconds: 0,
    requireCaptcha: failures >= LOGIN_CAPTCHA_AFTER_FAILURES,
  }
}

function toStatus(
  locked: boolean,
  reason: LoginLockReason | undefined,
  failures: number,
  lockedUntil: number
): LoginLockStatus {
  const remainingMs = Math.max(0, lockedUntil - Date.now())
  return {
    locked,
    reason,
    failures,
    remainingMs,
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
    requireCaptcha: failures >= LOGIN_CAPTCHA_AFTER_FAILURES || locked,
  }
}

async function getIpState(ip: string): Promise<FailState> {
  const key = `hooshagar:login:fail:${ip}`
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get<FailState | string>(key)
      if (!raw) return { count: 0, lockedUntil: 0 }
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as FailState) : raw
      return {
        count: Number(parsed.count) || 0,
        lockedUntil: Number(parsed.lockedUntil) || 0,
      }
    } catch {
      // fallback memory
    }
  }
  return memoryFails.get(key) ?? { count: 0, lockedUntil: 0 }
}

async function setIpState(ip: string, state: FailState): Promise<void> {
  const key = `hooshagar:login:fail:${ip}`
  const ttlSec = Math.max(
    60,
    Math.ceil((Math.max(state.lockedUntil, Date.now() + LOGIN_LOCK_DURATION_MS) - Date.now()) / 1000)
  )
  memoryFails.set(key, state)
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(key, state, { ex: ttlSec })
    } catch {
      // memory already set
    }
  }
}

export async function getIpLockStatus(ip: string): Promise<LoginLockStatus> {
  const state = await getIpState(ip)
  const now = Date.now()
  if (state.lockedUntil > now) {
    return toStatus(true, 'ip', state.count, state.lockedUntil)
  }
  if (state.lockedUntil > 0 && state.lockedUntil <= now) {
    return emptyStatus(0)
  }
  return emptyStatus(state.count)
}

export async function recordIpFailure(ip: string): Promise<LoginLockStatus> {
  const now = Date.now()
  let state = await getIpState(ip)
  if (state.lockedUntil > 0 && state.lockedUntil <= now) {
    state = { count: 0, lockedUntil: 0 }
  }
  if (state.lockedUntil > now) {
    return toStatus(true, 'ip', state.count, state.lockedUntil)
  }

  const count = state.count + 1
  const lockedUntil = count >= LOGIN_LOCK_MAX_FAILURES ? now + LOGIN_LOCK_DURATION_MS : 0
  await setIpState(ip, { count, lockedUntil })
  return toStatus(lockedUntil > now, lockedUntil > now ? 'ip' : undefined, count, lockedUntil)
}

export async function clearIpFailures(ip: string): Promise<void> {
  const key = `hooshagar:login:fail:${ip}`
  memoryFails.delete(key)
  const redis = getRedis()
  if (redis) {
    try {
      await redis.del(key)
    } catch {
      // ignore
    }
  }
}

export async function isBlockedIp(ip: string): Promise<boolean> {
  try {
    const admin = adminDb()
    const { data, error } = await admin.rpc('is_ip_blocked', { p_ip: ip })
    if (error) return false
    return Boolean(data)
  } catch {
    return false
  }
}

export async function getProfileLockStatus(userId: string): Promise<LoginLockStatus> {
  const admin = adminDb()
  const { data } = await admin
    .from('profiles')
    .select('login_attempts, locked_until')
    .eq('id', userId)
    .maybeSingle()

  if (!data) return emptyStatus()

  const lockedUntilMs = data.locked_until ? new Date(data.locked_until).getTime() : 0
  const now = Date.now()
  const attempts = Number(data.login_attempts) || 0

  if (lockedUntilMs > now) {
    return toStatus(true, 'profile', attempts, lockedUntilMs)
  }

  if (lockedUntilMs > 0 && lockedUntilMs <= now) {
    await admin
      .from('profiles')
      .update({ login_attempts: 0, locked_until: null })
      .eq('id', userId)
    return emptyStatus(0)
  }

  return emptyStatus(attempts)
}

export async function recordProfileFailure(userId: string): Promise<LoginLockStatus> {
  const admin = adminDb()
  const current = await getProfileLockStatus(userId)
  if (current.locked) return current

  const nextAttempts = current.failures + 1
  const shouldLock = nextAttempts >= LOGIN_LOCK_MAX_FAILURES
  const lockedUntilIso = shouldLock
    ? new Date(Date.now() + LOGIN_LOCK_DURATION_MS).toISOString()
    : null

  await admin
    .from('profiles')
    .update({
      login_attempts: nextAttempts,
      locked_until: lockedUntilIso,
    })
    .eq('id', userId)

  return toStatus(
    shouldLock,
    shouldLock ? 'profile' : undefined,
    nextAttempts,
    shouldLock ? Date.now() + LOGIN_LOCK_DURATION_MS : 0
  )
}

export async function clearProfileFailures(userId: string): Promise<void> {
  const admin = adminDb()
  await admin
    .from('profiles')
    .update({ login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq('id', userId)
}

export async function logLoginSecurityEvent(params: {
  eventType: 'login_success' | 'login_failed' | 'login_blocked' | 'suspicious_activity'
  userId?: string | null
  ip: string
  userAgent?: string | null
  success: boolean
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    const admin = adminDb()
    await admin.from('security_audit_log').insert({
      event_type: params.eventType,
      user_id: params.userId ?? null,
      ip_address: params.ip,
      user_agent: params.userAgent ?? null,
      success: params.success,
      risk_level: params.riskLevel ?? (params.success ? 'low' : 'medium'),
      details: params.details ?? {},
    })
  } catch (err) {
    console.warn('[login-lockout] audit log failed:', err)
  }
}

export function lockoutJsonBody(status: LoginLockStatus): Record<string, unknown> {
  const minutes = Math.max(1, Math.ceil(status.retryAfterSeconds / 60))
  return {
    success: false,
    error: `به‌خاطر تلاش‌های ناموفق زیاد، ورود تا ${minutes} دقیقه مسدود است. لطفاً کمی بعد دوباره تلاش کنید.`,
    error_code: 'LOGIN_LOCKED',
    retry_after: status.retryAfterSeconds,
    locked_until_ms: Date.now() + status.remainingMs,
    require_captcha: status.requireCaptcha,
  }
}

export function persianRetryMessage(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `به‌خاطر تلاش‌های ناموفق زیاد، ورود تا ${minutes} دقیقه مسدود است.`
}
