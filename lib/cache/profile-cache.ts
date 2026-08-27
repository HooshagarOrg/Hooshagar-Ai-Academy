/**
 * کش کوتاه پروفایل برای کاهش کوئری‌های تکراری در middleware / withAuth / layout
 * TTL ۶۰ ثانیه — fail-open اگر Redis نباشد
 */

import { getUpstashRedis } from '@/lib/cache/upstash'

export interface CachedProfile {
  id: string
  role: string
  school_id: string | null
  email: string | null
  full_name: string | null
  ui_theme: string | null
}

const TTL_SECONDS = 60

function cacheKey(userId: string): string {
  return `hooshagar:profile:${userId}`
}

export async function getCachedProfile(
  userId: string
): Promise<CachedProfile | null> {
  const redis = getUpstashRedis()
  if (!redis) return null
  try {
    const value = await redis.get<CachedProfile>(cacheKey(userId))
    return value ?? null
  } catch {
    return null
  }
}

export async function setCachedProfile(profile: CachedProfile): Promise<void> {
  const redis = getUpstashRedis()
  if (!redis) return
  try {
    await redis.set(cacheKey(profile.id), profile, { ex: TTL_SECONDS })
  } catch {
    // fail-open
  }
}

export async function invalidateProfileCache(userId: string): Promise<void> {
  const redis = getUpstashRedis()
  if (!redis) return
  try {
    await redis.del(cacheKey(userId))
  } catch {
    // fail-open
  }
}

/**
 * خواندن پروفایل با کش — فقط ستون‌های سبک برای auth/RBAC
 */
export async function getProfileCached(
  userId: string,
  fetchFresh: () => Promise<CachedProfile | null>
): Promise<CachedProfile | null> {
  const cached = await getCachedProfile(userId)
  if (cached) return cached
  const fresh = await fetchFresh()
  if (fresh) await setCachedProfile(fresh)
  return fresh
}
