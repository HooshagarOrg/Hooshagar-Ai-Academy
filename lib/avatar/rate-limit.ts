/**
 * سقف روزانه پیام آواتار — ۱۵ پیام/روز به ازای هر کاربر
 */

import { LRUCache } from 'lru-cache'

const DAILY_LIMIT = parseInt(process.env.AVATAR_DAILY_MESSAGE_LIMIT || '15', 10)

interface DayEntry {
  count: number
  dateKey: string
}

const store = new LRUCache<string, DayEntry>({
  max: 20_000,
  ttl: 86_400_000,
})

function getTehranDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date())
}

export interface AvatarRateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetLabel: string
}

export function checkAvatarDailyLimit(userId: string): AvatarRateLimitResult {
  const dateKey = getTehranDateKey()
  const key = `avatar:${userId}`
  const existing = store.get(key)

  if (!existing || existing.dateKey !== dateKey) {
    return {
      allowed: true,
      remaining: DAILY_LIMIT,
      limit: DAILY_LIMIT,
      resetLabel: 'نیمه‌شب',
    }
  }

  const remaining = Math.max(0, DAILY_LIMIT - existing.count)
  return {
    allowed: existing.count < DAILY_LIMIT,
    remaining,
    limit: DAILY_LIMIT,
    resetLabel: 'نیمه‌شب',
  }
}

export function recordAvatarMessage(userId: string): AvatarRateLimitResult {
  const dateKey = getTehranDateKey()
  const key = `avatar:${userId}`
  const existing = store.get(key)

  const count = !existing || existing.dateKey !== dateKey ? 1 : existing.count + 1
  store.set(key, { count, dateKey })

  const remaining = Math.max(0, DAILY_LIMIT - count)
  return {
    allowed: count <= DAILY_LIMIT,
    remaining,
    limit: DAILY_LIMIT,
    resetLabel: 'نیمه‌شب',
  }
}

export function getAvatarDailyLimit(): number {
  return DAILY_LIMIT
}
