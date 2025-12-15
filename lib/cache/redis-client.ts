/**
 * Redis Cache Client
 * استراتژی Cache برای بهبود عملکرد
 */

import { kv } from '@vercel/kv';
import logger from '@/lib/logger';

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Tags for cache invalidation */
  tags?: string[];
}

export class CacheClient {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await kv.get<T>(key);
      if (value) {
        logger.debug({ key }, 'Cache hit');
        return value;
      }
      logger.debug({ key }, 'Cache miss');
      return null;
    } catch (error) {
      logger.error({ error, key }, 'Cache get failed');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  static async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { ttl = 3600 } = options; // Default 1 hour
      await kv.set(key, value, { ex: ttl });
      logger.debug({ key, ttl }, 'Cache set');
    } catch (error) {
      logger.error({ error, key }, 'Cache set failed');
    }
  }

  /**
   * Delete key from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
      logger.debug({ key }, 'Cache deleted');
    } catch (error) {
      logger.error({ error, key }, 'Cache delete failed');
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      // Note: Vercel KV doesn't support SCAN, so we maintain a set of keys
      const keys = await kv.keys(pattern);
      if (keys.length > 0) {
        await kv.del(...keys);
        logger.info({ count: keys.length, pattern }, 'Cache pattern deleted');
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache pattern delete failed');
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Store in cache
    await this.set(key, fresh, options);

    return fresh;
  }

  /**
   * Invalidate cache by tag
   */
  static async invalidateByTag(tag: string): Promise<void> {
    await this.deletePattern(`*:${tag}:*`);
  }
}

/**
 * Cache key builders
 */
export const CacheKeys = {
  student: (id: string) => `student:${id}`,
  studentPerformance: (id: string) => `student:performance:${id}`,
  classStats: (classId: string, date: string) => `class:stats:${classId}:${date}`,
  schoolStats: (schoolId: string) => `school:stats:${schoolId}`,
  aiUsage: (userId: string, feature: string) => `ai:usage:${userId}:${feature}`,
  profile: (userId: string) => `profile:${userId}`,
  attendance: (studentId: string, month: string) => `attendance:${studentId}:${month}`,
  grades: (studentId: string, subject: string) => `grades:${studentId}:${subject}`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

/**
 * Hook for caching in API routes
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  return CacheClient.getOrSet(key, fetcher, { ttl });
}






















