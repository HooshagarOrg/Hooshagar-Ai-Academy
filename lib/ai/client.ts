/**
 * هوشاگر - AI Client with 3-Tier Fallback
 * 
 * استراتژی: Tier 1 → Tier 2 → Tier 3
 * همه مدل‌ها از OpenRouter Free استفاده می‌کنند
 */

import { createClient } from '@/lib/supabase-server'

// Types
export interface AIRequest {
  capability: string
  prompt: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface AIResponse {
  success: boolean
  content?: string
  model_used?: string
  tier_used?: number
  tokens?: number
  response_time_ms?: number
  error?: string
}

interface ModelConfig {
  model_name: string
  tier_used: number
  temperature: number
  max_tokens: number
}

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

/**
 * فراخوانی مدل AI از طریق OpenRouter
 */
async function callOpenRouter(
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; tokens: number; responseTime: number }> {
  const startTime = Date.now()

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.hooshagar.ir',
      'X-Title': 'هوشاگر - سیستم هوشمند مدیریت مدارس',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'شما دستیار هوشمند هوشاگر هستید. پاسخ‌های شما باید به فارسی، دقیق، مفید و مناسب برای محیط آموزشی باشد.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenRouter API Error: ${response.status}`)
  }

  const data = await response.json()
  const responseTime = Date.now() - startTime

  return {
    content: data.choices[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
    responseTime,
  }
}

/**
 * دریافت تنظیمات مدل از دیتابیس
 */
async function getModelConfig(capability: string, preferredTier: number = 1): Promise<ModelConfig> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_ai_model_for_capability', {
    p_capability_key: capability,
    p_preferred_tier: preferredTier,
  })

  if (error || !data || data.length === 0) {
    throw new Error(`Failed to get model config for ${capability}: ${error?.message}`)
  }

  return {
    model_name: data[0].model_name,
    tier_used: data[0].tier_used,
    temperature: parseFloat(data[0].temperature),
    max_tokens: data[0].max_tokens,
  }
}

/**
 * ثبت لاگ درخواست AI
 */
async function logAIRequest(
  capability: string,
  userId: string | undefined,
  modelUsed: string,
  tierUsed: number,
  status: 'success' | 'error' | 'timeout',
  responseTimeMs?: number,
  totalTokens?: number,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc('log_ai_request', {
    p_capability_key: capability,
    p_user_id: userId || null,
    p_model_used: modelUsed,
    p_tier_used: tierUsed,
    p_status: status,
    p_response_time_ms: responseTimeMs || null,
    p_total_tokens: totalTokens || null,
    p_error_message: errorMessage || null,
  })
}

/**
 * بروزرسانی rate limit
 */
async function updateRateLimit(modelName: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('update_rate_limit', { p_model_name: modelName })
}

/**
 * Main AI Call با 3-Tier Fallback Strategy
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const { capability, prompt, userId, metadata } = request

  // Tier 1 → Tier 2 → Tier 3
  for (let tier = 1; tier <= 3; tier++) {
    try {
      // دریافت تنظیمات مدل
      const config = await getModelConfig(capability, tier)
      
      console.log(`[AI] Attempting ${capability} with ${config.model_name} (Tier ${config.tier_used})`)

      // فراخوانی OpenRouter
      const result = await callOpenRouter(
        config.model_name,
        prompt,
        config.temperature,
        config.max_tokens
      )

      // بروزرسانی rate limit
      await updateRateLimit(config.model_name)

      // ثبت لاگ موفق
      await logAIRequest(
        capability,
        userId,
        config.model_name,
        config.tier_used,
        'success',
        result.responseTime,
        result.tokens
      )

      console.log(`[AI] ✅ Success with ${config.model_name} (Tier ${config.tier_used})`)

      return {
        success: true,
        content: result.content,
        model_used: config.model_name,
        tier_used: config.tier_used,
        tokens: result.tokens,
        response_time_ms: result.responseTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[AI] ❌ Tier ${tier} failed:`, errorMessage)

      // ثبت لاگ خطا
      const config = await getModelConfig(capability, tier).catch(() => null)
      if (config) {
        await logAIRequest(
          capability,
          userId,
          config.model_name,
          config.tier_used,
          'error',
          undefined,
          undefined,
          errorMessage
        )
      }

      // اگر Tier 3 هم خطا داد، استثنا پرتاب کن
      if (tier === 3) {
        return {
          success: false,
          error: `همه مدل‌های AI در دسترس نیستند. لطفاً بعداً تلاش کنید. (${errorMessage})`,
        }
      }

      // در غیر این صورت، به Tier بعدی برو
      console.log(`[AI] Falling back to Tier ${tier + 1}...`)
    }
  }

  // اگر به اینجا رسید، همه Tier‌ها فیل شده‌اند
  return {
    success: false,
    error: 'خطای غیرمنتظره در سیستم AI',
  }
}

/**
 * دریافت آمار استفاده از AI برای یک قابلیت
 */
export async function getAIStats(capability: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_model_configs')
    .select('*')
    .eq('capability_key', capability)
    .single()

  if (error) {
    console.error('Error fetching AI stats:', error)
    return null
  }

  return {
    capability: data.capability_name,
    totalRequests: data.total_requests,
    tier1Usage: data.tier1_usage,
    tier2Usage: data.tier2_usage,
    tier3Usage: data.tier3_usage,
    totalErrors: data.total_errors,
    tier1Percentage: data.total_requests > 0 ? (data.tier1_usage / data.total_requests * 100).toFixed(1) : '0',
    tier2Percentage: data.total_requests > 0 ? (data.tier2_usage / data.total_requests * 100).toFixed(1) : '0',
    tier3Percentage: data.total_requests > 0 ? (data.tier3_usage / data.total_requests * 100).toFixed(1) : '0',
    errorRate: data.total_requests > 0 ? (data.total_errors / data.total_requests * 100).toFixed(1) : '0',
  }
}

/**
 * لیست تمام قابلیت‌های AI
 */
export async function listAICapabilities() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_model_configs')
    .select('capability_key, capability_name, capability_description, total_requests')
    .eq('is_active', true)
    .order('priority')

  if (error) {
    console.error('Error listing AI capabilities:', error)
    return []
  }

  return data
}


