/**
 * API Endpoint: Universal AI Provider
 * POST /api/ai/universal
 *
 * استفاده از سیستم 6 لایه AI با fallback خودکار
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/universal-provider-v2';
import { createClient } from '@/lib/supabase/server';
import { checkUserRateLimit, RATE_LIMITS } from '@/lib/rate-limit-user';
import { withAuth } from '@/lib/security/api-guard';
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles';
import { log } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: { feature?: string; prompt?: string; image?: string } | undefined
  return withAuth(
    request,
    async (ctx) => {
      try {
        body = await request.json();
        if (!body?.feature || typeof body.feature !== 'string') {
          return NextResponse.json(
            { error: 'پارامتر feature الزامی است' },
            { status: 400 }
          );
        }

        const { feature, prompt, image } = body;

        const rateLimitConfig = RATE_LIMITS[feature as keyof typeof RATE_LIMITS] || RATE_LIMITS.ai_universal;
        const rateLimit = await checkUserRateLimit({
          userId: ctx.userId,
          feature,
          maxRequests: rateLimitConfig.maxRequests,
          windowMs: rateLimitConfig.windowMs
        });

        if (!rateLimit.allowed) {
          log.warn('User rate limit exceeded', {
            userId: ctx.userId,
            feature,
            current: rateLimit.current,
            max: rateLimitConfig.maxRequests
          });

          return NextResponse.json({
            error: 'محدودیت استفاده رسیده است. لطفاً بعداً تلاش کنید.',
            remaining: rateLimit.remaining,
            resetAt: rateLimit.resetAt,
            limit: rateLimitConfig.maxRequests
          }, {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetAt.getTime().toString()
            }
          });
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
          return NextResponse.json(
            { error: 'پارامتر prompt الزامی است' },
            { status: 400 }
          );
        }

        if (prompt.length > 10000) {
          return NextResponse.json(
            { error: 'prompt بیش از حد طولانی است (حداکثر 10000 کاراکتر)' },
            { status: 400 }
          );
        }

        const result = await callAI({
          feature,
          prompt,
          image,
          userId: ctx.userId,
          schoolId: ctx.schoolId ?? undefined
        });

        return NextResponse.json({
          success: true,
          content: result.content,
          metadata: {
            tier: result.tier,
            model: result.model,
            cost: result.cost,
            responseTime: result.responseTime,
            tokensUsed: result.tokensUsed,
            isFree: ['A', 'B', 'C', 'D'].includes(result.tier)
          }
        });
      } catch (error: unknown) {
        const err = error as { message?: string }
        log.error('AI API error', error, {
          endpoint: '/api/ai/universal',
          feature: body?.feature
        });

        Sentry.captureException(error, {
          tags: {
            endpoint: '/api/ai/universal',
            feature: body?.feature || 'unknown'
          }
        });

        if (err.message?.includes('همه Tier ها ناموفق')) {
          return NextResponse.json(
            {
              error: 'سرویس AI موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.',
              details: err.message
            },
            { status: 503 }
          );
        }

        if (err.message?.includes('بودجه')) {
          return NextResponse.json(
            {
              error: 'محدودیت بودجه. لطفاً با مدیر سیستم تماس بگیرید.',
              details: err.message
            },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            error: 'خطا در پردازش درخواست',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          },
          { status: 500 }
        );
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_heavy' }
  );
}

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient();

        const { data: features, error } = await supabase
          .from('ai_model_settings')
          .select('feature_name, feature_title, feature_description')
          .order('feature_name');

        if (error) {
          throw error;
        }

        return NextResponse.json({
          success: true,
          features: features || []
        });
      } catch (error: unknown) {
        const err = error as { message?: string }
        log.error('AI features list error', error);

        return NextResponse.json(
          {
            error: 'خطا در دریافت لیست قابلیت‌ها',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
          },
          { status: 500 }
        );
      }
    },
    { roles: AI_USER_ROLES }
  );
}
