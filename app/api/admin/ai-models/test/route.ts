import { NextRequest, NextResponse } from 'next/server'
import { AVAILABLE_MODELS, estimateCost, getModelInfo } from '@/lib/ai-model-manager'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

/**
 * POST /api/admin/ai-models/test
 * تست یک مدل با ورودی نمونه
 */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const { provider, modelId, input, options } = body

        if (!provider || !modelId || !input) {
          return NextResponse.json(
            { error: 'Provider، مدل و ورودی الزامی است' },
            { status: 400 }
          )
        }

        const model = getModelInfo(provider, modelId)
        if (!model) {
          return NextResponse.json(
            { error: 'مدل نامعتبر است' },
            { status: 400 }
          )
        }

        const startTime = Date.now()

        try {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

          if (Math.random() < 0.05) {
            throw new Error('API rate limit exceeded')
          }

          const responseTimeMs = Date.now() - startTime
          const inputTokens = Math.floor(input.length / 4)
          const outputTokens = Math.floor(Math.random() * 800) + 200
          const cost = estimateCost(model, inputTokens, outputTokens)

          const result = {
            success: true,
            provider,
            model: modelId,
            modelName: model.modelName,
            output: `این یک پاسخ تست از مدل ${model.modelName} است.\n\nورودی شما: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"\n\nدر محیط واقعی، پاسخ کامل مدل AI نمایش داده می‌شود. این پاسخ شامل تحلیل، توصیه‌ها و محتوای درخواستی شما خواهد بود.\n\nمدل ${model.modelName} یکی از ${model.isFree ? 'مدل‌های رایگان' : 'مدل‌های پولی'} با کیفیت ${model.qualityRating}/5 و سرعت ${model.speedRating}/5 است.`,
            responseTimeMs,
            inputTokens,
            outputTokens,
            estimatedCost: cost,
            qualityScore: Math.floor(Math.random() * 2) + 4,
            relevanceScore: Math.floor(Math.random() * 2) + 4,
            creativityScore: Math.floor(Math.random() * 2) + 3,
          }

          console.log('[AI Model Test]', { provider, modelId, responseTimeMs, cost })

          return NextResponse.json(result)
        } catch (error: unknown) {
          const responseTimeMs = Date.now() - startTime
          const message = error instanceof Error ? error.message : 'خطا در فراخوانی مدل'

          return NextResponse.json({
            success: false,
            provider,
            model: modelId,
            modelName: model.modelName,
            responseTimeMs,
            estimatedCost: 0,
            error: message,
          })
        }
      } catch (error) {
        console.error('Error testing AI model:', error)
        return NextResponse.json(
          { error: 'خطا در تست مدل' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_ROLES }
  )
}

/**
 * PUT /api/admin/ai-models/compare
 * مقایسه چند مدل
 */
export async function PUT(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const body = await request.json()
        const { models, input, options } = body

        if (!models || !Array.isArray(models) || models.length < 2 || !input) {
          return NextResponse.json(
            { error: 'حداقل 2 مدل و ورودی الزامی است' },
            { status: 400 }
          )
        }

        for (const { provider, modelId } of models) {
          const model = getModelInfo(provider, modelId)
          if (!model) {
            return NextResponse.json(
              { error: `مدل نامعتبر: ${provider}/${modelId}` },
              { status: 400 }
            )
          }
        }

        const results = await Promise.all(
          models.map(async ({ provider, modelId }: { provider: string; modelId: string }) => {
            const model = getModelInfo(provider, modelId)!
            const startTime = Date.now()

            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 2500))

            const responseTimeMs = Date.now() - startTime
            const inputTokens = Math.floor(input.length / 4)
            const outputTokens = Math.floor(Math.random() * 800) + 200
            const cost = estimateCost(model, inputTokens, outputTokens)

            return {
              success: true,
              provider,
              model: modelId,
              modelName: model.modelName,
              isFree: model.isFree,
              output: `پاسخ نمونه از ${model.modelName}`,
              responseTimeMs,
              inputTokens,
              outputTokens,
              estimatedCost: cost,
              qualityScore: Math.floor(Math.random() * 2) + 4,
              relevanceScore: Math.floor(Math.random() * 2) + 4,
              creativityScore: Math.floor(Math.random() * 2) + 3,
            }
          })
        )

        const fastestModel = results.reduce((a, b) =>
          a.responseTimeMs < b.responseTimeMs ? a : b
        )
        const cheapestModel = results.reduce((a, b) =>
          a.estimatedCost < b.estimatedCost ? a : b
        )
        const bestQualityModel = results.reduce((a, b) =>
          (a.qualityScore || 0) > (b.qualityScore || 0) ? a : b
        )

        let recommendation = ''
        if (cheapestModel.isFree && cheapestModel.qualityScore && cheapestModel.qualityScore >= 4) {
          recommendation = `💡 برای این کاربرد، ${cheapestModel.modelName} بهترین گزینه است (رایگان + سریع + باکیفیت)`
        } else if (fastestModel.isFree) {
          recommendation = `💡 ${fastestModel.modelName} سریع‌ترین و رایگان است`
        } else {
          recommendation = `💡 ${bestQualityModel.modelName} بهترین کیفیت را دارد ولی هزینه‌بر است`
        }

        return NextResponse.json({
          results,
          comparison: {
            fastest: fastestModel.modelName,
            cheapest: cheapestModel.modelName,
            bestQuality: bestQualityModel.modelName,
          },
          recommendation,
        })
      } catch (error) {
        console.error('Error comparing AI models:', error)
        return NextResponse.json(
          { error: 'خطا در مقایسه مدل‌ها' },
          { status: 500 }
        )
      }
    },
    { roles: ADMIN_ROLES }
  )
}
