/**
 * Next.js Cache Utilities
 * استفاده از Cache داخلی Next.js برای SSR/SSG
 */

import { unstable_cache } from 'next/cache';

/**
 * Create a cached function with Next.js cache
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  options: {
    revalidate?: number | false;
    tags?: string[];
  } = {}
): T {
  return unstable_cache(fn, keyParts, options) as T;
}

/**
 * Cache tags for revalidation
 */
export const CacheTags = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  EXAMS: 'exams',
  CLASSES: 'classes',
  PROFILES: 'profiles',
  AI_USAGE: 'ai-usage',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Revalidate times (in seconds)
 */
export const RevalidateTime = {
  STATIC: false as const, // Never revalidate
  REALTIME: 0, // Always fresh
  FAST: 10, // 10 seconds
  NORMAL: 60, // 1 minute
  SLOW: 300, // 5 minutes
  HOURLY: 3600, // 1 hour
  DAILY: 86400, // 24 hours
} as const;

/**
 * Example: Cached student fetcher
 */
export const getCachedStudent = createCachedFunction(
  async (studentId: string) => {
    // Your fetch logic here
    return { id: studentId, name: 'Example' };
  },
  ['student'],
  {
    revalidate: RevalidateTime.NORMAL,
    tags: [CacheTags.STUDENTS],
  }
);






