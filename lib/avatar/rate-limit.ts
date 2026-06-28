/**
 * سقف روزانه پیام AI آواتار — ۱۵ پیام/روز (فقط پاسخ‌های AI)
 * پاسخ template از سقف کم نمی‌شود
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

export async function checkAvatarDailyLimit(
  userId: string,
  supabase?: AppSupabase
): Promise<AvatarRateLimitResult> {
  if (!supabase) return checkMemoryLimit(userId)

  const dateKey = getTehranDateKey()
  const { data, error } = await supabase
    .from('avatar_daily_usage')
    .select('ai_message_count')
    .eq('user_id', userId)
    .eq('usage_date', dateKey)
    .maybeSingle()

  if (error) {
    console.warn('Avatar rate limit read failed, using memory:', error.message)
    return checkMemoryLimit(userId)
  }

  return buildResult(data?.ai_message_count ?? 0)
}

export async function recordAvatarAIMessage(
  userId: string,
  supabase?: AppSupabase
): Promise<AvatarRateLimitResult> {
  if (!supabase) return recordMemoryMessage(userId)

  const dateKey = getTehranDateKey()
  const current = await checkAvatarDailyLimit(userId, supabase)
  const nextCount = current.limit - current.remaining + 1

  const { error } = await supabase.from('avatar_daily_usage').upsert(
    {
      user_id: userId,
      usage_date: dateKey,
      ai_message_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,usage_date' }
  )

  if (error) {
    console.warn('Avatar rate limit write failed, using memory:', error.message)
    return recordMemoryMessage(userId)
  }

  return buildResult(nextCount)
}

export function getAvatarDailyLimit(): number {
  return DAILY_LIMIT
}

/** @deprecated از checkAvatarDailyLimit async استفاده کنید */
export function checkAvatarDailyLimitSync(userId: string): AvatarRateLimitResult {
  return checkMemoryLimit(userId)
}

/** @deprecated از recordAvatarAIMessage async استفاده کنید */
export function recordAvatarMessage(userId: string): AvatarRateLimitResult {
  return recordMemoryMessage(userId)
}
