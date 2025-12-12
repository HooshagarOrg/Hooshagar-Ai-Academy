/**
 * Rate Limiting per User
 * محدودیت استفاده بر اساس userId (نه IP)
 * 
 * استفاده:
 * const rateLimit = await checkUserRateLimit({
 *   userId: user.id,
 *   feature: 'ocr',
 *   maxRequests: 10,
 *   windowMs: 60 * 60 * 1000 // 1 hour
 * });
 */

import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

interface RateLimitConfig {
  userId: string;
  feature: string;
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  current: number;
}

export async function checkUserRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = await createClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  
  try {
    // شمارش درخواست‌های اخیر کاربر برای این feature
    const { count, error } = await supabase
      .from('ai_request_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', config.userId)
      .eq('feature_name', config.feature)
      .gte('created_at', windowStart.toISOString());
    
    if (error) {
      log.error('Rate limit check failed', error, {
        userId: config.userId,
        feature: config.feature
      });
      
      // در صورت خطا، اجازه می‌دهیم (fail-open)
      return { 
        allowed: true, 
        remaining: config.maxRequests, 
        resetAt: new Date(now.getTime() + config.windowMs),
        current: 0
      };
    }
    
    const requestCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const resetAt = new Date(now.getTime() + config.windowMs);
    
    if (requestCount >= config.maxRequests) {
      log.warn('Rate limit exceeded', {
        userId: config.userId,
        feature: config.feature,
        current: requestCount,
        max: config.maxRequests
      });
    }
    
    return {
      allowed: requestCount < config.maxRequests,
      remaining,
      resetAt,
      current: requestCount
    };
    
  } catch (error) {
    log.error('Unexpected error in rate limit check', error);
    
    // در صورت خطای غیرمنتظره، اجازه می‌دهیم
    return { 
      allowed: true, 
      remaining: config.maxRequests, 
      resetAt: new Date(now.getTime() + config.windowMs),
      current: 0
    };
  }
}

/**
 * Rate Limit Configs برای features مختلف
 */
export const RATE_LIMITS = {
  // AI Features
  ocr: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
  story: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
  analyzer: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  study: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
  content: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
  exam: { maxRequests: 15, windowMs: 60 * 60 * 1000 }, // 15/hour
  compass: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  roadmap: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5/hour
  
  // Generic AI
  ai_universal: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
} as const;












