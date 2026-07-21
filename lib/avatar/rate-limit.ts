/**
 * سقف روزانه پیام AI آواتار — نقش‌محور
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { LRUCache } from 'lru-cache'

type AppSupabase = SupabaseClient<Database>

/** سقف پیش‌فرض اگر نقش ناشناخته باشد */
const DEFAULT_AVATAR_DAILY = parseInt(process.env.AVATAR_DAILY_MESSAGE_LIMIT || '15', 10)

export const AVATAR_DAILY_LIMIT_BY_ROLE: Record<string, number> = {
  student: 10,
  parent: 5,
  teacher: 15,
  counselor: 15,
  principal: 15,
  educational_vp: 15,
  discipline_vp: 15,
  health_vp: 15,
  financial_vp: 15,
  evaluation_vp: 15,
  admin: 30,
  platform_admin: 50,
}

interface DayEntry {
  count: number
  dateKey: string
  limit: number
}

const memoryStore = new LRUCache<string, DayEntry>({
  max: 20_000,
  ttl: 86_400_000,
})

export interface AvatarRateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetLabel: string
}

export function getAvatarDailyLimitForRole(role?: string | null): number {
  if (role && AVATAR_DAILY_LIMIT_BY_ROLE[role] != null) {
    return AVATAR_DAILY_LIMIT_BY_ROLE[role]
  }
  return DEFAULT_AVATAR_DAILY
}

export function getTehranDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date())
}

function buildResult(count: number, limit: number): AvatarRateLimitResult {
  const remaining = Math.max(0, limit - count)
  return {
    allowed: count < limit,
    remaining,
    limit,
    resetLabel: 'نیمه‌شب',
  }
}

function checkMemoryLimit(userId: string, limit: number): AvatarRateLimitResult {
  const dateKey = getTehranDateKey()
  const existing = memoryStore.get(`avatar:${userId}`)
  if (!existing || existing.dateKey !== dateKey) {
    return buildResult(0, limit)
  }
  return buildResult(existing.count, existing.limit || limit)
}

function recordMemoryMessage(userId: string, limit: number): AvatarRateLimitResult {
  const dateKey = getTehranDateKey()
  const key = `avatar:${userId}`
  const existing = memoryStore.get(key)
  const count = !existing || existing.dateKey !== dateKey ? 1 : existing.count + 1
  memoryStore.set(key, { count, dateKey, limit })
  return buildResult(count, limit)
}

function failClosedLimit(limit: number): AvatarRateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    limit,
    resetLabel: 'نیمه‌شب',
  }
}

export async function checkAvatarDailyLimit(
  userId: string,
  supabase?: AppSupabase,
  role?: string | null
): Promise<AvatarRateLimitResult> {
  const limit = getAvatarDailyLimitForRole(role)

  if (!supabase) {
    if (process.env.NODE_ENV === 'production') return failClosedLimit(limit)
    return checkMemoryLimit(userId, limit)
  }

  const dateKey = getTehranDateKey()
  const { data, error } = await supabase
    .from('avatar_daily_usage')
    .select('ai_message_count')
    .eq('user_id', userId)
    .eq('usage_date', dateKey)
    .maybeSingle()

  if (error) {
    console.warn('Avatar rate limit read failed:', error.message)
    if (process.env.NODE_ENV === 'production') return failClosedLimit(limit)
    return checkMemoryLimit(userId, limit)
  }

  return buildResult(data?.ai_message_count ?? 0, limit)
}

/** رزرو اتمیک سهمیه قبل از فراخوانی AI */
export async function reserveAvatarAIMessage(
  userId: string,
  supabase: AppSupabase,
  role?: string | null
): Promise<AvatarRateLimitResult> {
  const limit = getAvatarDailyLimitForRole(role)

  const { data, error } = await supabase.rpc('increment_avatar_ai_usage', {
    p_user_id: userId,
    p_limit: limit,
  })

  if (error) {
    console.warn('Avatar atomic reserve failed:', error.message)
    if (process.env.NODE_ENV === 'production') return failClosedLimit(limit)
    return recordMemoryMessage(userId, limit)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    return failClosedLimit(limit)
  }

  const r = row as {
    allowed: boolean
    new_count: number
    remaining: number
    daily_limit: number
  }

  return {
    allowed: r.allowed,
    remaining: r.remaining,
    limit: r.daily_limit ?? limit,
    resetLabel: 'نیمه‌شب',
  }
}

/** @deprecated از reserveAvatarAIMessage قبل از AI استفاده کنید */
export async function recordAvatarAIMessage(
  userId: string,
  supabase?: AppSupabase,
  role?: string | null
): Promise<AvatarRateLimitResult> {
  if (!supabase) {
    const limit = getAvatarDailyLimitForRole(role)
    if (process.env.NODE_ENV === 'production') return failClosedLimit(limit)
    return recordMemoryMessage(userId, limit)
  }
  return reserveAvatarAIMessage(userId, supabase, role)
}

export function getAvatarDailyLimit(role?: string | null): number {
  return getAvatarDailyLimitForRole(role)
}

/** @deprecated */
export function checkAvatarDailyLimitSync(userId: string): AvatarRateLimitResult {
  return checkMemoryLimit(userId, DEFAULT_AVATAR_DAILY)
}

/** @deprecated */
export function recordAvatarMessage(userId: string): AvatarRateLimitResult {
  return recordMemoryMessage(userId, DEFAULT_AVATAR_DAILY)
}
