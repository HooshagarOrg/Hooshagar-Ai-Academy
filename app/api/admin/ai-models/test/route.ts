import { NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase-server'
import { AVAILABLE_MODELS, estimateCost, getModelInfo } from '@/lib/ai-model-manager'

/**
 * POST /api/admin/ai-models/test
 * تست یک مدل با ورودی نمونه
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider, modelId, input, options } = body

    // اعتبارسنجی
    if (!provider || !modelId || !input) {
      return NextResponse.json(
        { error: 'Provider، مدل و ورودی الزامی است' },
        { status: 400 }
      )
    }

    // بررسی معتبر بودن مدل
    const model = getModelInfo(provider, modelId)
    if (!model) {
      return NextResponse.json(
        { error: 'مدل نامعتبر است' },
        { status: 400 }
      )
    }

    // در محیط واقعی:
    // const supabase = createServerClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // 
    // // بررسی دسترسی ادمین
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user?.id)
    //   .single()
    // 
    // if (!profile || !['admin', 'principal'].includes(profile.role)) {
    //   return NextResponse.json(
    //     { error: 'دسترسی غیرمجاز' },
    //     { status: 403 }
    //   )
    // }

    const startTime = Date.now()

    try {
      // در محیط واقعی فراخوانی واقعی AI
      // let result
      // if (provider === 'gemini') {
      //   result = await callGemini(modelId, input, options)
      // } else if (provider === 'openrouter') {
      //   result = await callOpenRouter(modelId, input, options)
      // }

      // شبیه‌سازی تأخیر و پاسخ
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      // شبیه‌سازی خطا (5%)
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
        qualityScore: Math.floor(Math.random() * 2) + 4, // 4-5
        relevanceScore: Math.floor(Math.random() * 2) + 4,
        creativityScore: Math.floor(Math.random() * 2) + 3,
      }

      // ذخیره نتیجه تست
      // await supabase.from('ai_model_test_results').insert({
      //   provider,
      //   model_id: modelId,
      //   test_input: input,
      //   test_output: result.output,
      //   response_time_ms: responseTimeMs,
      //   input_tokens: inputTokens,
      //   output_tokens: outputTokens,
      //   estimated_cost: cost,
      //   quality_score: result.qualityScore,
      //   relevance_score: result.relevanceScore,
      //   creativity_score: result.creativityScore,
      //   success: true,
      //   tested_by: user.id,
      // })

      console.log('[AI Model Test]', { provider, modelId, responseTimeMs, cost })

      return NextResponse.json(result)
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime

      // ذخیره نتیجه ناموفق
      // await supabase.from('ai_model_test_results').insert({
      //   provider,
      //   model_id: modelId,
      //   test_input: input,
      //   response_time_ms: responseTimeMs,
      //   success: false,
      //   error_message: error.message,
      //   tested_by: user.id,
      // })

      return NextResponse.json({
        success: false,
        provider,
        model: modelId,
        modelName: model.modelName,
        responseTimeMs,
        estimatedCost: 0,
        error: error.message || 'خطا در فراخوانی مدل',
      })
    }
  } catch (error) {
    console.error('Error testing AI model:', error)
    return NextResponse.json(
      { error: 'خطا در تست مدل' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-models/compare
 * مقایسه چند مدل
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { models, input, options } = body

    // اعتبارسنجی
    if (!models || !Array.isArray(models) || models.length < 2 || !input) {
      return NextResponse.json(
        { error: 'حداقل 2 مدل و ورودی الزامی است' },
        { status: 400 }
      )
    }

    // بررسی معتبر بودن مدل‌ها
    for (const { provider, modelId } of models) {
      const model = getModelInfo(provider, modelId)
      if (!model) {
        return NextResponse.json(
          { error: `مدل نامعتبر: ${provider}/${modelId}` },
          { status: 400 }
        )
      }
    }

    // اجرای موازی تست‌ها
    const results = await Promise.all(
      models.map(async ({ provider, modelId }: { provider: string; modelId: string }) => {
        const model = getModelInfo(provider, modelId)!
        const startTime = Date.now()

        // شبیه‌سازی
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

    // تحلیل نتایج و توصیه
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
}



















