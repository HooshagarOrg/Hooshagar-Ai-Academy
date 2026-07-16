import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'
import {
  gatewayCallAI,
  isKnownAIFeature,
  listGatewayFeatures,
  AIQuotaExceededError,
} from '@/lib/ai/gateway'

export const maxDuration = 60

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * POST /api/ai/test — فقط ادمین (غیرفعال در production)
 * از AI Gateway استفاده می‌کند تا زنجیره Gemini → Z.ai → OpenRouter تست شود
 */
export async function POST(req: NextRequest) {
  if (isProduction()) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }

  return withAuth(
    req,
    async (ctx) => {
      try {
        const body = await req.json()
        const { capability, prompt, feature } = body as {
          capability?: string
          prompt?: string
          feature?: string
        }

        const featureName = feature || capability
        if (!featureName || !prompt) {
          return NextResponse.json(
            {
              error: 'فیلدهای feature (یا capability) و prompt الزامی هستند',
              allowed_features: listGatewayFeatures(),
            },
            { status: 400 }
          )
        }

        if (!isKnownAIFeature(featureName)) {
          return NextResponse.json(
            {
              error: 'قابلیت نامعتبر',
              allowed_features: listGatewayFeatures(),
            },
            { status: 400 }
          )
        }

        const result = await gatewayCallAI(ctx.userId, featureName, prompt)

        return NextResponse.json({
          success: true,
          data: {
            content: result.content,
            model_used: result.model,
            provider: result.provider,
            tier_used: result.tier,
            is_fallback: result.is_fallback,
            cached: result.cached ?? false,
            cost: result.cost,
          },
        })
      } catch (error: unknown) {
        if (error instanceof AIQuotaExceededError) {
          return NextResponse.json(
            { error: error.message, error_code: 'AI_QUOTA_EXCEEDED', limit: error.limit },
            { status: 429 }
          )
        }
        const message = error instanceof Error ? error.message : 'خطای سرور'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES, rateLimit: 'ai_general' }
  )
}

export async function GET() {
  if (isProduction()) {
    return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    message: 'AI Gateway test endpoint (dev only)',
    chain: ['Gemini 2.5', 'Z.ai GLM-4.7-Flash', 'OpenRouter A/B/C'],
    features: listGatewayFeatures(),
  })
}
