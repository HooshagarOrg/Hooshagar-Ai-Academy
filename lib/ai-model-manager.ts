/**
 * =====================================================
 * سیستم مدیریت مدل‌های هوش مصنوعی
 * =====================================================
 */

// ============================================
// تایپ‌ها
// ============================================

export interface AIModelConfig {
  featureName: string
  featureLabel: string
  featureDescription?: string
  featureIcon?: string
  
  primaryProvider: string
  primaryModel: string
  
  fallbackProvider?: string
  fallbackModel?: string
  
  temperature: number
  maxTokens: number
  topP: number
  
  enableFallback: boolean
  customSystemPrompt?: string
  retryCount: number
  timeoutSeconds: number
}

export interface AvailableModel {
  id: string
  provider: string
  modelId: string
  modelName: string
  modelDescription?: string
  
  supportsText: boolean
  supportsVision: boolean
  supportsJson: boolean
  supportsFunctionCalling: boolean
  
  maxInputTokens?: number
  maxOutputTokens?: number
  contextWindow?: number
  
  costPerMInputTokens: number
  costPerMOutputTokens: number
  
  speedRating: number
  qualityRating: number
  
  isFree: boolean
  isAvailable: boolean
  
  category: string
  recommendedFor: string[]
  priority: number
}

export interface ModelUsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  fallbackUsedCount: number
  avgResponseTimeMs: number
  totalCostThisMonth: number
  successRate: number
}

export interface AICallResult {
  success: boolean
  content?: string
  provider: string
  model: string
  usedFallback: boolean
  responseTimeMs: number
  inputTokens?: number
  outputTokens?: number
  estimatedCost: number
  error?: string
}

// ============================================
// مدل‌های پیش‌فرض
// ============================================

export const AVAILABLE_MODELS: AvailableModel[] = [
  // Gemini Models (FREE!)
  {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    modelId: 'gemini-2.0-flash-exp',
    modelName: 'Gemini 2.0 Flash',
    modelDescription: 'جدیدترین و سریع‌ترین مدل رایگان گوگل',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 1000000,
    maxOutputTokens: 8192,
    contextWindow: 1000000,
    costPerMInputTokens: 0,
    costPerMOutputTokens: 0,
    speedRating: 5,
    qualityRating: 4,
    isFree: true,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['story_wizard', 'ocr_solver', 'study_buddy'],
    priority: 100,
  },
  {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    modelId: 'gemini-1.5-flash',
    modelName: 'Gemini 1.5 Flash',
    modelDescription: 'مدل سریع و کارآمد رایگان',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 1000000,
    maxOutputTokens: 8192,
    contextWindow: 1000000,
    costPerMInputTokens: 0,
    costPerMOutputTokens: 0,
    speedRating: 5,
    qualityRating: 4,
    isFree: true,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['student_analyzer', 'parent_message', 'weekly_report'],
    priority: 90,
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    modelId: 'gemini-1.5-pro',
    modelName: 'Gemini 1.5 Pro',
    modelDescription: 'مدل قدرتمند با context بالا',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 2000000,
    maxOutputTokens: 8192,
    contextWindow: 2000000,
    costPerMInputTokens: 0,
    costPerMOutputTokens: 0,
    speedRating: 4,
    qualityRating: 5,
    isFree: true,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['content_creator', 'future_compass', 'konkur_roadmap'],
    priority: 80,
  },
  // Claude Models
  {
    id: 'claude-3.5-sonnet',
    provider: 'openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    modelDescription: 'باهوش‌ترین مدل کلود',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 200000,
    maxOutputTokens: 8192,
    contextWindow: 200000,
    costPerMInputTokens: 3.00,
    costPerMOutputTokens: 15.00,
    speedRating: 4,
    qualityRating: 5,
    isFree: false,
    isAvailable: true,
    category: 'creative',
    recommendedFor: ['story_wizard', 'content_creator', 'future_compass'],
    priority: 70,
  },
  {
    id: 'claude-3-haiku',
    provider: 'openrouter',
    modelId: 'anthropic/claude-3-haiku',
    modelName: 'Claude 3 Haiku',
    modelDescription: 'سریع و ارزان',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: false,
    maxInputTokens: 200000,
    maxOutputTokens: 4096,
    contextWindow: 200000,
    costPerMInputTokens: 0.25,
    costPerMOutputTokens: 1.25,
    speedRating: 5,
    qualityRating: 4,
    isFree: false,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['parent_message', 'study_buddy'],
    priority: 60,
  },
  // GPT Models
  {
    id: 'gpt-4-turbo',
    provider: 'openrouter',
    modelId: 'openai/gpt-4-turbo',
    modelName: 'GPT-4 Turbo',
    modelDescription: 'مدل قدرتمند OpenAI',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    contextWindow: 128000,
    costPerMInputTokens: 10.00,
    costPerMOutputTokens: 30.00,
    speedRating: 3,
    qualityRating: 5,
    isFree: false,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['ocr_solver', 'exam_generator'],
    priority: 50,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openrouter',
    modelId: 'openai/gpt-4o-mini',
    modelName: 'GPT-4o Mini',
    modelDescription: 'نسخه کوچک و ارزان GPT-4o',
    supportsText: true,
    supportsVision: true,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    contextWindow: 128000,
    costPerMInputTokens: 0.15,
    costPerMOutputTokens: 0.60,
    speedRating: 5,
    qualityRating: 4,
    isFree: false,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['study_buddy', 'parent_message'],
    priority: 62,
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'openrouter',
    modelId: 'openai/gpt-3.5-turbo',
    modelName: 'GPT-3.5 Turbo',
    modelDescription: 'سریع و ارزان',
    supportsText: true,
    supportsVision: false,
    supportsJson: true,
    supportsFunctionCalling: true,
    maxInputTokens: 16000,
    maxOutputTokens: 4096,
    contextWindow: 16000,
    costPerMInputTokens: 0.50,
    costPerMOutputTokens: 1.50,
    speedRating: 5,
    qualityRating: 3,
    isFree: false,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['weekly_report'],
    priority: 40,
  },
  // Other Models
  {
    id: 'llama-3.1-70b',
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.1-70b-instruct',
    modelName: 'Llama 3.1 70B',
    modelDescription: 'مدل متن‌باز قدرتمند',
    supportsText: true,
    supportsVision: false,
    supportsJson: true,
    supportsFunctionCalling: false,
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    contextWindow: 128000,
    costPerMInputTokens: 0.35,
    costPerMOutputTokens: 0.40,
    speedRating: 4,
    qualityRating: 4,
    isFree: false,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['practice_playground'],
    priority: 30,
  },
  {
    id: 'qwen-2.5-72b',
    provider: 'openrouter',
    modelId: 'qwen/qwen-2.5-72b-instruct',
    modelName: 'Qwen 2.5 72B',
    modelDescription: 'عالی برای فارسی',
    supportsText: true,
    supportsVision: false,
    supportsJson: true,
    supportsFunctionCalling: false,
    maxInputTokens: 32000,
    maxOutputTokens: 8192,
    contextWindow: 32000,
    costPerMInputTokens: 0.35,
    costPerMOutputTokens: 0.40,
    speedRating: 4,
    qualityRating: 4,
    isFree: false,
    isAvailable: true,
    category: 'general',
    recommendedFor: ['story_wizard', 'content_creator'],
    priority: 35,
  },
]

// ============================================
// تنظیمات پیش‌فرض قابلیت‌ها
// ============================================

export const DEFAULT_FEATURE_CONFIGS: Record<string, Partial<AIModelConfig>> = {
  story_wizard: {
    featureLabel: 'تولید داستان',
    featureIcon: '📖',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-2.0-flash-exp',
    fallbackProvider: 'openrouter',
    fallbackModel: 'anthropic/claude-3-haiku',
    temperature: 0.85,
    maxTokens: 2500,
  },
  student_analyzer: {
    featureLabel: 'تحلیل دانش‌آموز',
    featureIcon: '👤',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-1.5-flash',
    fallbackProvider: 'openrouter',
    fallbackModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.4,
    maxTokens: 2000,
  },
  ocr_solver: {
    featureLabel: 'حل مسئله با OCR',
    featureIcon: '📸',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-2.0-flash-exp',
    fallbackProvider: 'openrouter',
    fallbackModel: 'openai/gpt-4-turbo',
    temperature: 0.2,
    maxTokens: 1500,
  },
  study_buddy: {
    featureLabel: 'دستیار مطالعه',
    featureIcon: '💬',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-1.5-flash',
    fallbackProvider: 'openrouter',
    fallbackModel: 'openai/gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
  },
  content_creator: {
    featureLabel: 'تولید محتوا',
    featureIcon: '✍️',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-1.5-pro',
    fallbackProvider: 'openrouter',
    fallbackModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.75,
    maxTokens: 3000,
  },
  exam_generator: {
    featureLabel: 'تولید آزمون',
    featureIcon: '📝',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-1.5-flash',
    fallbackProvider: 'openrouter',
    fallbackModel: 'openai/gpt-4-turbo',
    temperature: 0.4,
    maxTokens: 2000,
  },
  future_compass: {
    featureLabel: 'راهنمای آینده',
    featureIcon: '🧭',
    primaryProvider: 'gemini',
    primaryModel: 'gemini-1.5-pro',
    fallbackProvider: 'openrouter',
    fallbackModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.6,
    maxTokens: 2500,
  },
}

// ============================================
// توابع کمکی
// ============================================

/**
 * دریافت اطلاعات مدل
 */
export function getModelInfo(provider: string, modelId: string): AvailableModel | null {
  return AVAILABLE_MODELS.find(
    m => m.provider === provider && m.modelId === modelId
  ) || null
}

/**
 * محاسبه هزینه تخمینی
 */
export function estimateCost(
  model: AvailableModel,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1000000) * model.costPerMInputTokens
  const outputCost = (outputTokens / 1000000) * model.costPerMOutputTokens
  return inputCost + outputCost
}

/**
 * فرمت کردن هزینه
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'رایگان'
  if (cost < 0.001) return '<$0.001'
  if (cost < 0.01) return `~$${cost.toFixed(4)}`
  return `$${cost.toFixed(3)}`
}

/**
 * دریافت مدل‌های مناسب برای یک قابلیت
 */
export function getRecommendedModels(featureName: string): AvailableModel[] {
  return AVAILABLE_MODELS
    .filter(m => m.recommendedFor.includes(featureName) || m.category === 'general')
    .sort((a, b) => b.priority - a.priority)
}

/**
 * دریافت مدل‌های رایگان
 */
export function getFreeModels(): AvailableModel[] {
  return AVAILABLE_MODELS.filter(m => m.isFree).sort((a, b) => b.priority - a.priority)
}

/**
 * رندر کردن ستاره برای رتبه‌بندی
 */
export function renderRating(rating: number): string {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
}

/**
 * رندر کردن سرعت
 */
export function renderSpeed(rating: number): string {
  return '⚡'.repeat(rating)
}

// ============================================
// مدیریت کانفیگ (Mock)
// ============================================

let mockConfigs: Map<string, AIModelConfig> = new Map()

/**
 * دریافت تنظیمات مدل برای یک قابلیت
 */
export async function getAIModelConfig(featureName: string): Promise<AIModelConfig | null> {
  // در محیط واقعی از Supabase استفاده می‌شود
  // const supabase = createServerClient()
  // const { data } = await supabase.rpc('get_ai_model_for_feature', {
  //   p_feature_name: featureName
  // })
  
  // برگرداندن کانفیگ کش شده یا پیش‌فرض
  if (mockConfigs.has(featureName)) {
    return mockConfigs.get(featureName)!
  }
  
  const defaultConfig = DEFAULT_FEATURE_CONFIGS[featureName]
  if (defaultConfig) {
    return {
      featureName,
      featureLabel: defaultConfig.featureLabel || featureName,
      featureIcon: defaultConfig.featureIcon,
      primaryProvider: defaultConfig.primaryProvider || 'gemini',
      primaryModel: defaultConfig.primaryModel || 'gemini-1.5-flash',
      fallbackProvider: defaultConfig.fallbackProvider,
      fallbackModel: defaultConfig.fallbackModel,
      temperature: defaultConfig.temperature || 0.7,
      maxTokens: defaultConfig.maxTokens || 1000,
      topP: 0.9,
      enableFallback: true,
      retryCount: 3,
      timeoutSeconds: 30,
    }
  }
  
  return null
}

/**
 * ذخیره تنظیمات مدل
 */
export async function saveAIModelConfig(config: AIModelConfig): Promise<boolean> {
  // در محیط واقعی از Supabase استفاده می‌شود
  mockConfigs.set(config.featureName, config)
  console.log('[AI Model Config Saved]', config)
  return true
}

// ============================================
// فراخوانی AI با Fallback
// ============================================

/**
 * فراخوانی AI با پشتیبانی از Fallback
 */
export async function callAIWithFallback(
  featureName: string,
  prompt: string,
  options?: {
    systemPrompt?: string
    imageUrl?: string
    jsonMode?: boolean
  }
): Promise<AICallResult> {
  const config = await getAIModelConfig(featureName)
  
  if (!config) {
    return {
      success: false,
      provider: '',
      model: '',
      usedFallback: false,
      responseTimeMs: 0,
      estimatedCost: 0,
      error: 'تنظیمات مدل یافت نشد',
    }
  }
  
  const startTime = Date.now()
  
  try {
    // تلاش با مدل اصلی
    const result = await callAI(
      config.primaryProvider,
      config.primaryModel,
      prompt,
      {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        systemPrompt: options?.systemPrompt || config.customSystemPrompt,
        imageUrl: options?.imageUrl,
        jsonMode: options?.jsonMode,
      }
    )
    
    const responseTimeMs = Date.now() - startTime
    const modelInfo = getModelInfo(config.primaryProvider, config.primaryModel)
    const estimatedCost = modelInfo 
      ? estimateCost(modelInfo, result.inputTokens || 500, result.outputTokens || 500)
      : 0
    
    // ثبت موفقیت
    await recordModelUsage(featureName, true, false, estimatedCost, responseTimeMs)
    
    return {
      success: true,
      content: result.content,
      provider: config.primaryProvider,
      model: config.primaryModel,
      usedFallback: false,
      responseTimeMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost,
    }
    
  } catch (primaryError: any) {
    console.error(`Primary model failed for ${featureName}:`, primaryError)
    
    // اگر fallback فعال باشد
    if (config.enableFallback && config.fallbackProvider && config.fallbackModel) {
      try {
        const result = await callAI(
          config.fallbackProvider,
          config.fallbackModel,
          prompt,
          {
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            topP: config.topP,
            systemPrompt: options?.systemPrompt || config.customSystemPrompt,
            imageUrl: options?.imageUrl,
            jsonMode: options?.jsonMode,
          }
        )
        
        const responseTimeMs = Date.now() - startTime
        const modelInfo = getModelInfo(config.fallbackProvider, config.fallbackModel)
        const estimatedCost = modelInfo 
          ? estimateCost(modelInfo, result.inputTokens || 500, result.outputTokens || 500)
          : 0.001
        
        // ثبت استفاده از fallback
        await recordModelUsage(featureName, true, true, estimatedCost, responseTimeMs)
        
        return {
          success: true,
          content: result.content,
          provider: config.fallbackProvider,
          model: config.fallbackModel,
          usedFallback: true,
          responseTimeMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost,
        }
        
      } catch (fallbackError: any) {
        await recordModelUsage(featureName, false, false, 0, Date.now() - startTime)
        
        return {
          success: false,
          provider: config.fallbackProvider,
          model: config.fallbackModel,
          usedFallback: true,
          responseTimeMs: Date.now() - startTime,
          estimatedCost: 0,
          error: fallbackError.message || 'خطا در مدل پشتیبان',
        }
      }
    }
    
    await recordModelUsage(featureName, false, false, 0, Date.now() - startTime)
    
    return {
      success: false,
      provider: config.primaryProvider,
      model: config.primaryModel,
      usedFallback: false,
      responseTimeMs: Date.now() - startTime,
      estimatedCost: 0,
      error: primaryError.message || 'خطا در فراخوانی AI',
    }
  }
}

/**
 * فراخوانی مستقیم AI (بدون fallback)
 */
async function callAI(
  provider: string,
  model: string,
  prompt: string,
  options: {
    temperature?: number
    maxTokens?: number
    topP?: number
    systemPrompt?: string
    imageUrl?: string
    jsonMode?: boolean
  }
): Promise<{
  content: string
  inputTokens?: number
  outputTokens?: number
}> {
  // در محیط واقعی:
  // if (provider === 'gemini') {
  //   return callGemini(model, prompt, options)
  // } else if (provider === 'openrouter') {
  //   return callOpenRouter(model, prompt, options)
  // }
  
  // شبیه‌سازی پاسخ
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  // شبیه‌سازی خطای تصادفی (5%)
  if (Math.random() < 0.05) {
    throw new Error('API call failed')
  }
  
  return {
    content: `پاسخ نمونه از ${provider}/${model} برای prompt: ${prompt.slice(0, 50)}...`,
    inputTokens: Math.floor(prompt.length / 4),
    outputTokens: Math.floor(Math.random() * 500) + 100,
  }
}

/**
 * ثبت آمار استفاده
 */
async function recordModelUsage(
  featureName: string,
  success: boolean,
  usedFallback: boolean,
  estimatedCost: number,
  responseTimeMs: number
): Promise<void> {
  // در محیط واقعی:
  // const supabase = createServerClient()
  // await supabase.rpc('record_model_usage', {
  //   p_feature_name: featureName,
  //   p_success: success,
  //   p_used_fallback: usedFallback,
  //   p_estimated_cost: estimatedCost,
  //   p_response_time_ms: responseTimeMs
  // })
  
  console.log('[Model Usage]', { featureName, success, usedFallback, estimatedCost, responseTimeMs })
}

// ============================================
// تست مدل
// ============================================

export interface ModelTestResult {
  provider: string
  model: string
  success: boolean
  output?: string
  responseTimeMs: number
  inputTokens?: number
  outputTokens?: number
  estimatedCost: number
  qualityScore?: number
  relevanceScore?: number
  creativityScore?: number
  error?: string
}

/**
 * تست یک مدل
 */
export async function testModel(
  provider: string,
  modelId: string,
  testInput: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<ModelTestResult> {
  const startTime = Date.now()
  const modelInfo = getModelInfo(provider, modelId)
  
  try {
    const result = await callAI(provider, modelId, testInput, {
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 1000,
    })
    
    const responseTimeMs = Date.now() - startTime
    const estimatedCost = modelInfo 
      ? estimateCost(modelInfo, result.inputTokens || 500, result.outputTokens || 500)
      : 0
    
    return {
      provider,
      model: modelId,
      success: true,
      output: result.content,
      responseTimeMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost,
      qualityScore: Math.floor(Math.random() * 2) + 4, // 4-5
      relevanceScore: Math.floor(Math.random() * 2) + 4,
      creativityScore: Math.floor(Math.random() * 2) + 3,
    }
  } catch (error: any) {
    return {
      provider,
      model: modelId,
      success: false,
      responseTimeMs: Date.now() - startTime,
      estimatedCost: 0,
      error: error.message || 'خطا در تست مدل',
    }
  }
}

/**
 * مقایسه چند مدل
 */
export async function compareModels(
  models: Array<{ provider: string; modelId: string }>,
  testInput: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<ModelTestResult[]> {
  const results = await Promise.all(
    models.map(({ provider, modelId }) =>
      testModel(provider, modelId, testInput, options)
    )
  )
  
  return results
}














