import { Redis } from '@upstash/redis'

let redisClient: Redis | null | undefined

/**
 * Single Upstash/Vercel KV client for rate limits and AI cache.
 * Returns null when env is not configured (local without Redis).
 */
export function getUpstashRedis(): Redis | null {
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

export function isUpstashRedisConfigured(): boolean {
  return getUpstashRedis() !== null
}
