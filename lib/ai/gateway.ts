import 'server-only'

import {
  callAI,
  callAIForAnalysis,
  callGeminiVision,
  type AICallOptions,
  type AICapability,
  type AIResponse,
} from '@/lib/ai-provider'
import { AI_FEATURES, type AIUsageLimit } from '@/lib/check-ai-limit'
import { checkAILimit, recordAIUsage } from '@/lib/ai/quota'

// ============================================
// نگاشت feature → capability
// ============================================

const FEATURE_CAPABILITY_MAP: Record<string, AICapability> = {
  story_wizard: 'story_wizard',
  student_analyzer: 'student_analyzer',
  ocr_solver: 'problem_solver_ocr',
  study_buddy: 'study_buddy',
  content_creator: 'content_creator',
  exam_generator: 'exam_generator',
  konkur_roadmap: 'konkur_roadmap',
  future_compass: 'field_selector',
  practice_playground: 'study_buddy',
  parent_message: 'content_creator',
  weekly_report: 'summarizer',
  early_warning: 'student_analyzer',
  oral_questions: 'exam_generator',
  family_insight: 'student_analyzer',
}

const OPENROUTER_VISION_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash-image',
] as const

export class AIQuotaExceededError extends Error {
  readonly limit: AIUsageLimit

  constructor(limit: AIUsageLimit) {
    super(limit.reason ?? 'محدودیت استفاده از AI')
    this.name = 'AIQuotaExceededError'
    this.limit = limit
  }
}

function resolveCapability(featureName: string): AICapability {
  return FEATURE_CAPABILITY_MAP[featureName] ?? 'study_buddy'
}

function stripDataUrlPrefix(imageBase64: string): string {
  const match = imageBase64.match(/^data:image\/[^;]+;base64,(.+)$/)
  return match ? match[1] : imageBase64
}

async function callOpenRouterVision(
  imageBase64: string,
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (!openrouterKey) {
    throw new Error('OPENROUTER_API_KEY تنظیم نشده')
  }

  let lastError: unknown

  for (const model of OPENROUTER_VISION_MODELS) {
    try {
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://hooshagar.ir',
          'X-Title': 'Hooshagar OCR',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageBase64 } },
                { type: 'text', text: prompt },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2000,
        }),
      })

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json().catch(() => ({}))
        lastError = errorData
        continue
      }

      const aiData = await aiResponse.json()
      const content = aiData.choices?.[0]?.message?.content
      if (!content || typeof content !== 'string') {
        throw new Error('پاسخ Vision خالی است')
      }

      return {
        content,
        provider: 'openrouter',
        model,
        tier: 2,
        is_fallback: true,
        cost: 0,
      }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('همه مدل‌های Vision موقتاً در دسترس نیستند')
}

async function enforceQuota(userId: string, featureName: string): Promise<AIUsageLimit> {
  if (!AI_FEATURES[featureName]) {
    throw new Error('قابلیت نامعتبر')
  }

  const limit = await checkAILimit(userId, featureName)
  if (!limit.allowed) {
    await recordAIUsage(userId, featureName, false, true, limit.reason)
    throw new AIQuotaExceededError(limit)
  }

  return limit
}

async function trackSuccess(
  userId: string,
  featureName: string,
  response: AIResponse,
  startedAt: number
): Promise<void> {
  await recordAIUsage(userId, featureName, true, false, undefined, {
    model: response.model,
    responseTimeMs: Date.now() - startedAt,
  })
}

/**
 * فراخوانی متنی AI با بررسی quota و ثبت usage
 */
export async function gatewayCallAI(
  userId: string,
  featureName: string,
  prompt: string,
  options: Omit<AICallOptions, 'userId' | 'capability'> = {}
): Promise<AIResponse> {
  await enforceQuota(userId, featureName)
  const capability = resolveCapability(featureName)
  const startedAt = Date.now()

  try {
    const response = await callAI(prompt, { ...options, userId, capability })
    await trackSuccess(userId, featureName, response, startedAt)
    return response
  } catch (err) {
    await recordAIUsage(userId, featureName, false, false)
    throw err
  }
}

/**
 * فراخوانی AI با خروجی JSON
 */
export async function gatewayCallAIJson<T>(
  userId: string,
  featureName: string,
  prompt: string,
  options: Omit<AICallOptions, 'userId' | 'capability'> = {}
): Promise<{ data: T; response: AIResponse }> {
  await enforceQuota(userId, featureName)
  const capability = resolveCapability(featureName)
  const startedAt = Date.now()

  try {
    const data = await callAIForAnalysis<T>(prompt, { ...options, userId, capability })
    const response: AIResponse = {
      content: JSON.stringify(data),
      provider: 'google',
      model: 'parsed',
      tier: 1,
      is_fallback: false,
      cost: 0,
    }
    await trackSuccess(userId, featureName, response, startedAt)
    return { data, response }
  } catch (err) {
    await recordAIUsage(userId, featureName, false, false)
    throw err
  }
}

/**
 * فراخوانی Vision (OCR) با quota
 */
export async function gatewayCallVision(
  userId: string,
  featureName: string,
  imageBase64: string,
  prompt: string,
  options: Omit<AICallOptions, 'userId' | 'capability'> = {}
): Promise<AIResponse> {
  await enforceQuota(userId, featureName)
  const capability = resolveCapability(featureName)
  const startedAt = Date.now()

  try {
    let response: AIResponse
    try {
      const rawBase64 = stripDataUrlPrefix(imageBase64)
      response = await callGeminiVision(rawBase64, prompt, { ...options, userId, capability })
    } catch {
      response = await callOpenRouterVision(imageBase64, prompt, options)
    }

    await trackSuccess(userId, featureName, response, startedAt)
    return response
  } catch (err) {
    await recordAIUsage(userId, featureName, false, false)
    throw err
  }
}

export { checkAILimit, recordAIUsage, hasReachedLimit } from '@/lib/ai/quota'
