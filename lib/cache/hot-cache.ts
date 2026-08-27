/**
 * کش سبک fail-open روی Upstash برای پاسخ‌های پرخوانش
 */

import { getUpstashRedis } from '@/lib/cache/upstash'

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const redis = getUpstashRedis()
  if (!redis) return null
  try {
    const value = await redis.get<T>(key)
    return value ?? null
  } catch {
    return null
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = getUpstashRedis()
  if (!redis) return
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // fail-open
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getUpstashRedis()
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // fail-open
  }
}

export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const cached = await cacheGetJson<T>(key)
  if (cached !== null) {
    return { data: cached, fromCache: true }
  }
  const fresh = await fetcher()
  await cacheSetJson(key, fresh, ttlSeconds)
  return { data: fresh, fromCache: false }
}

export const HotCacheKeys = {
  badges: () => 'hooshagar:cache:badges:active',
  shopItems: () => 'hooshagar:cache:shop:items',
  classes: (schoolId: string) => `hooshagar:cache:classes:${schoolId}`,
  leaderboard: (schoolId: string) => `hooshagar:cache:leaderboard:${schoolId}`,
  unreadCount: (userId: string) => `hooshagar:cache:unread:${userId}`,
} as const

export const HotCacheTTL = {
  badges: 300,
  shopItems: 300,
  classes: 300,
  leaderboard: 60,
  unreadCount: 10,
} as const
