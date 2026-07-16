/**
 * API Endpoint: Universal AI Provider
 * POST /api/ai/universal
 *
 * همه درخواست‌ها از AI Gateway عبور می‌کنند (Gemini → Z.ai → OpenRouter)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'
import {
  gatewayCallAI,
  gatewayCallVision,
  isKnownAIFeature,
  listGatewayFeatures,
  AIQuotaExceededError,
} from '@/lib/ai/gateway'
import { log } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let body: { feature?: string; prompt?: string; image?: string } | undefined
  return withAuth(
    request,
    async (ctx) => {
      try {
        body = await request.json()
        if (!body?.feature || typeof body.feature !== 'string') {
          return NextResponse.json(
            { error: 'پارامتر feature الزامی است' },
            { status: 400 }
          )
        }

        const { feature, prompt, image } = body

        if (!isKnownAIFeature(feature)) {
          return NextResponse.json(
            {
              error: 'قابلیت نامعتبر',
              allowed_features: listGatewayFeatures(),
            },
            { status: 400 }
          )
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
          return NextResponse.json(
            { error: 'پارامتر prompt الزامی است' },
            { status: 400 }
          )
        }

        if (prompt.length > 10000) {
          return NextResponse.json(
            { error: 'prompt بیش از حد طولانی است (حداکثر 10000 کاراکتر)' },
            { status: 400 }
          )
        }

        const result =
          image && typeof image === 'string' && image.length > 0
            ? await gatewayCallVision(ctx.userId, feature, image, prompt)
            : await gatewayCallAI(ctx.userId, feature, prompt)

        return NextResponse.json({
          success: true,
          content: result.content,
          metadata: {
            tier: result.tier,
            model: result.model,
            provider: result.provider,
            cost: result.cost,
            is_fallback: result.is_fallback,
            cached: result.cached ?? false,
            isFree: result.cost === 0,
          },
        })
      } catch (error: unknown) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            {
              error: error.message,
              error_code: 'AI_QUOTA_EXCEEDED',
              limit: error.limit,
            },
            { status: 429 }
          )
        }

        const err = error as { message?: string }
        log.error('AI API error', error, {
          endpoint: '/api/ai/universal',
          feature: body?.feature,
        })

        Sentry.captureException(error, {
          tags: {
            endpoint: '/api/ai/universal',
            feature: body?.feature || 'unknown',
          },
        })

        if (err.message?.includes('در دسترس نیستند') || err.message?.includes('تمام سرویس')) {
          return NextResponse.json(
            {
              error: 'سرویس AI موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.',
              details: err.message,
            },
            { status: 503 }
          )
        }

        return NextResponse.json(
          {
            error: 'خطا در پردازش درخواست',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
          },
          { status: 500 }
        )
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_heavy' }
  )
}

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()

        const { data: features, error } = await supabase
          .from('ai_model_settings')
          .select('feature_name, feature_title, feature_description')
          .order('feature_name')

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          features: features || [],
          gateway_features: listGatewayFeatures(),
        })
      } catch (error: unknown) {
        const err = error as { message?: string }
        log.error('AI features list error', error)

        return NextResponse.json(
          {
            error: 'خطا در دریافت لیست قابلیت‌ها',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            gateway_features: listGatewayFeatures(),
          },
          { status: 500 }
        )
      }
    },
    { roles: AI_USER_ROLES }
  )
}
