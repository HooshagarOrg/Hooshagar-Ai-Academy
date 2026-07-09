/**
 * سقف روزانه پیام AI آواتار — ۱۵ پیام/روز (فقط پاسخ‌های AI)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { LRUCache } from 'lru-cache'

type AppSupabase = SupabaseClient<Database>

const DAILY_LIMIT = parseInt(process.env.AVATAR_DAILY_MESSAGE_LIMIT || '15', 10)

interface DayEntry {
  count: number
  dateKey: string
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

export function getTehranDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date())
}

function buildResult(count: number): AvatarRateLimitResult {
  const remaining = Math.max(0, DAILY_LIMIT - count)
  return {
    allowed: count < DAILY_LIMIT,
    remaining,
    limit: DAILY_LIMIT,
    resetLabel: 'نیمه‌شب',
  }
}

function checkMemoryLimit(userId: string): AvatarRateLimitResult {
  const dateKey = getTehranDateKey()
  const existing = memoryStore.get(`avatar:${userId}`)
  if (!existing || existing.dateKey !== dateKey) {
    return buildResult(0)
  }
  return buildResult(existing.count)
}

function recordMemoryMessage(userId: string): AvatarRateLimitResult {
  const dateKey = getTehranDateKey()
  const key = `avatar:${userId}`
  const existing = memoryStore.get(key)
  const count = !existing || existing.dateKey !== dateKey ? 1 : existing.count + 1
  memoryStore.set(key, { count, dateKey })
  return buildResult(count)
}

function failClosedLimit(): AvatarRateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    limit: DAILY_LIMIT,
    resetLabel: 'نیمه‌شب',
  }
}

export async function checkAvatarDailyLimit(
  userId: string,
  supabase?: AppSupabase
): Promise<AvatarRateLimitResult> {
  if (!supabase) {
    if (process.env.NODE_ENV === 'production') return failClosedLimit()
    return checkMemoryLimit(userId)
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
    if (process.env.NODE_ENV === 'production') return failClosedLimit()
    return checkMemoryLimit(userId)
  }

  return buildResult(data?.ai_message_count ?? 0)
}

/** رزرو اتمیک سهمیه قبل از فراخوانی AI */
export async function reserveAvatarAIMessage(
  userId: string,
  supabase: AppSupabase
): Promise<AvatarRateLimitResult> {
  const { data, error } = await supabase.rpc('increment_avatar_ai_usage', {
    p_user_id: userId,
    p_limit: DAILY_LIMIT,
  })

  if (error) {
    console.warn('Avatar atomic reserve failed:', error.message)
    if (process.env.NODE_ENV === 'production') return failClosedLimit()
    return recordMemoryMessage(userId)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    return failClosedLimit()
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
    limit: r.daily_limit ?? DAILY_LIMIT,
    resetLabel: 'نیمه‌شب',
  }
}

/** @deprecated از reserveAvatarAIMessage قبل از AI استفاده کنید */
export async function recordAvatarAIMessage(
  userId: string,
  supabase?: AppSupabase
): Promise<AvatarRateLimitResult> {
  if (!supabase) {
    if (process.env.NODE_ENV === 'production') return failClosedLimit()
    return recordMemoryMessage(userId)
  }
  return reserveAvatarAIMessage(userId, supabase)
}

export function getAvatarDailyLimit(): number {
  return DAILY_LIMIT
}

/** @deprecated */
export function checkAvatarDailyLimitSync(userId: string): AvatarRateLimitResult {
  return checkMemoryLimit(userId)
}

/** @deprecated */
export function recordAvatarMessage(userId: string): AvatarRateLimitResult {
  return recordMemoryMessage(userId)
}
