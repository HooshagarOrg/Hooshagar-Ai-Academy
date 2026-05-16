import { GoogleGenerativeAI } from '@google/generative-ai'

// ═══════════════════════════════════════════════════════════════
// هوشاگر - سرویس AI با معماری 4 لایه رایگان
//
//  Tier 1 → Google Direct  (10 کلید Round-Robin)
//  Tier 2 → OpenRouter A   (مدل‌های 200B+)
//  Tier 3 → OpenRouter B   (مدل‌های 32-70B)
//  Tier 4 → OpenRouter C   (مدل‌های سریع 7-24B)
//  Tier 5/6 → غیرفعال
// ═══════════════════════════════════════════════════════════════

// ── تعریف تایپ‌ها ──────────────────────────────────────────────

export type AICapability =
  | 'student_analyzer'
  | 'problem_solver_ocr'
  | 'study_buddy'
  | 'story_wizard'
  | 'field_selector'
  | 'konkur_predictor'
  | 'konkur_roadmap'
  | 'content_creator'
  | 'exam_generator'
  | 'homework_evaluator'
  | 'talent_analyzer'
  | 'summarizer'

export interface AIResponse {
  content: string
  provider: 'google' | 'openrouter'
  model: string
  tier: 1 | 2 | 3 | 4
  is_fallback: boolean
  cost: number
  cached?: boolean
}

export interface AICallOptions {
  capability?: AICapability
  googleModel?: string
  temperature?: number
  maxTokens?: number
  forceOpenRouter?: boolean
}

// ── نگاشت هر قابلیت به مدل اختصاصی Google ────────────────────
// هر capability از مدل متفاوتی استفاده می‌کند تا سقف رایگان تقسیم شود
const GOOGLE_MODEL_MAP: Record<AICapability, string> = {
  student_analyzer:    'gemini-2.5-pro',
  problem_solver_ocr:  'gemini-2.0-flash-exp',
  study_buddy:         'gemini-2.0-flash',
  story_wizard:        'gemini-2.0-flash-lite',
  field_selector:      'gemini-2.5-flash',
  konkur_predictor:    'gemini-2.5-flash-preview-05-20',
  konkur_roadmap:      'learnlm-2.0-flash-experimental',
  content_creator:     'gemini-1.5-flash',
  exam_generator:      'gemini-1.5-flash-8b',
  homework_evaluator:  'gemini-2.0-flash-exp',
  talent_analyzer:     'gemini-1.5-pro',
  summarizer:          'gemini-2.5-flash',
}

// ── نگاشت هر قابلیت به مدل‌های OpenRouter بر اساس تیر ─────────
const OPENROUTER_MODEL_MAP: Record<AICapability, { tier2: string; tier3: string; tier4: string }> = {
  student_analyzer:    { tier2: 'deepseek/deepseek-r1:free',                    tier3: 'qwen/qwen3-235b-a22b:free',                   tier4: 'qwen/qwen3-32b:free' },
  problem_solver_ocr:  { tier2: 'qwen/qwen2.5-vl-72b-instruct:free',            tier3: 'meta-llama/llama-4-maverick:free',             tier4: 'nvidia/nemotron-nano-12b-v2-vl:free' },
  study_buddy:         { tier2: 'deepseek/deepseek-chat-v3.1:free',              tier3: 'meta-llama/llama-3.3-70b-instruct:free',       tier4: 'mistralai/mistral-small-3.1-24b-instruct:free' },
  story_wizard:        { tier2: 'meta-llama/llama-4-maverick:free',              tier3: 'meta-llama/llama-3.3-70b-instruct:free',       tier4: 'google/gemma-3-27b-it:free' },
  field_selector:      { tier2: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',  tier3: 'qwen/qwen3-32b:free',                         tier4: 'deepseek/deepseek-chat-v3.1:free' },
  konkur_predictor:    { tier2: 'deepseek/deepseek-r1-0528:free',                tier3: 'qwen/qwq-32b:free',                           tier4: 'deepseek/deepseek-r1-distill-qwen-32b:free' },
  konkur_roadmap:      { tier2: 'nousresearch/hermes-3-llama-3.1-405b:free',     tier3: 'tngtech/deepseek-r1t2-chimera:free',           tier4: 'deepseek/deepseek-r1-distill-llama-70b:free' },
  content_creator:     { tier2: 'qwen/qwen3-coder:free',                         tier3: 'deepseek/deepseek-r1-distill-llama-70b:free', tier4: 'qwen/qwen3-32b:free' },
  exam_generator:      { tier2: 'qwen/qwen3-235b-a22b:free',                     tier3: 'deepseek/deepseek-r1:free',                   tier4: 'mistralai/mistral-small-3.1-24b-instruct:free' },
  homework_evaluator:  { tier2: 'qwen/qwen2.5-vl-72b-instruct:free',             tier3: 'meta-llama/llama-4-maverick:free',             tier4: 'google/gemma-3-27b-it:free' },
  talent_analyzer:     { tier2: 'meta-llama/llama-4-scout:free',                 tier3: 'deepseek/deepseek-chat-v3.1:free',             tier4: 'qwen/qwen3-32b:free' },
  summarizer:          { tier2: 'deepseek/deepseek-chat-v3.1:free',              tier3: 'mistralai/mistral-small-3.1-24b-instruct:free', tier4: 'qwen/qwen3-14b:free' },
}

// ── مدیریت Round-Robin کلیدهای Google ──────────────────────────
const GOOGLE_KEYS: string[] = []

function loadGoogleKeys(): string[] {
  if (GOOGLE_KEYS.length > 0) return GOOGLE_KEYS
  // پشتیبانی از هر دو نام‌گذاری
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GOOGLE_API_KEY_${i}`] ?? process.env[`GEMINI_API_KEY_${i}`]
    if (key) GOOGLE_KEYS.push(key)
  }
  // سازگاری با کلید تکی قدیمی
  if (GOOGLE_KEYS.length === 0 && process.env.GOOGLE_API_KEY) {
    GOOGLE_KEYS.push(process.env.GOOGLE_API_KEY)
  }
  return GOOGLE_KEYS
}

let googleKeyIndex = 0

function getNextGoogleKey(): string {
  const keys = loadGoogleKeys()
  if (keys.length === 0) throw new Error('هیچ GEMINI_API_KEY_N تعریف نشده')
  const key = keys[googleKeyIndex % keys.length]
  googleKeyIndex++
  return key
}

// ── فراخوانی Google Gemini (Tier 1) ────────────────────────────
async function callGoogleTier1(
  prompt: string,
  capability: AICapability,
  opts: AICallOptions
): Promise<AIResponse> {
  const apiKey = getNextGoogleKey()
  const client = new GoogleGenerativeAI(apiKey)
  const modelName = opts.googleModel ?? GOOGLE_MODEL_MAP[capability]

  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature:     opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 2000,
    },
  })

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  return { content: text, provider: 'google', model: modelName, tier: 1, is_fallback: false, cost: 0 }
}

// ── فراخوانی OpenRouter با کلید مشخص ────────────────────────────
async function callOpenRouterWithKey(
  prompt: string,
  model: string,
  tier: 2 | 3 | 4,
  apiKey: string,
  opts: AICallOptions
): Promise<AIResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hooshagar',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.7,
      max_tokens:  opts.maxTokens  ?? 2000,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenRouter Tier${tier} error ${response.status}: ${body}`)
  }

  const data = await response.json()
  return {
    content:     data.choices[0]?.message?.content || '',
    provider:    'openrouter',
    model,
    tier,
    is_fallback: true,
    cost:        0,
  }
}

// ── تابع اصلی با Fallback خودکار 4 لایه ─────────────────────────

/**
 * فراخوانی AI با قابلیت مشخص
 *
 * ترتیب تلاش:
 *   1. Google Gemini (کلید Round-Robin)
 *   2. OpenRouter Key A  (مدل بزرگ)
 *   3. OpenRouter Key B  (مدل متوسط)
 *   4. OpenRouter Key C  (مدل سریع)
 */
export async function callAI(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const capability: AICapability = options.capability ?? 'study_buddy'
  const orModels = OPENROUTER_MODEL_MAP[capability]

  const keyA = process.env.OPENROUTER_API_KEY
  const keyB = process.env.OPENROUTER_API_KEY_B
  const keyC = process.env.OPENROUTER_API_KEY_C

  const tiers: Array<() => Promise<AIResponse>> = []

  // Tier 1: Google
  if (!options.forceOpenRouter) {
    tiers.push(() => callGoogleTier1(prompt, capability, options))
  }

  // Tier 2: OpenRouter A
  if (keyA) tiers.push(() => callOpenRouterWithKey(prompt, orModels.tier2, 2, keyA, options))

  // Tier 3: OpenRouter B
  if (keyB) tiers.push(() => callOpenRouterWithKey(prompt, orModels.tier3, 3, keyB, options))

  // Tier 4: OpenRouter C
  if (keyC) tiers.push(() => callOpenRouterWithKey(prompt, orModels.tier4, 4, keyC, options))

  let lastError: unknown
  for (const attempt of tiers) {
    try {
      return await attempt()
    } catch (err) {
      lastError = err
      const tierLabel = tiers.indexOf(attempt) + 1
      console.warn(`AI Tier ${tierLabel} failed for [${capability}], trying next...`, err)
    }
  }

  console.error('All AI tiers failed:', lastError)
  throw new Error('تمام لایه‌های AI در دسترس نیستند. لطفاً بعداً تلاش کنید.')
}

// ── تابع کمکی برای JSON output ───────────────────────────────────
export async function callAIForAnalysis<T>(
  prompt: string,
  options: AICallOptions = {}
): Promise<T> {
  const response = await callAI(prompt, options)
  try {
    const clean = response.content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    return JSON.parse(clean) as T
  } catch {
    throw new Error('پاسخ AI قابل پردازش نیست. لطفاً دوباره تلاش کنید.')
  }
}

// ── Vision: اول Gemini، سپس OpenRouter vision-capable ────────────
export async function callGeminiVision(
  imageBase64: string,
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const capability: AICapability = options.capability ?? 'problem_solver_ocr'
  const modelName = GOOGLE_MODEL_MAP[capability]

  try {
    const apiKey = getNextGoogleKey()
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: modelName })
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
    ])
    return {
      content:     result.response.text(),
      provider:    'google',
      model:       modelName,
      tier:        1,
      is_fallback: false,
      cost:        0,
    }
  } catch (err) {
    console.warn('Gemini Vision failed, falling back to OpenRouter Vision...', err)

    const keyA = process.env.OPENROUTER_API_KEY
    if (!keyA) throw new Error('هیچ کلید API برای Vision در دسترس نیست')

    const visionModel = OPENROUTER_MODEL_MAP[capability].tier2
    return callOpenRouterWithKey(prompt, visionModel, 2, keyA, options)
  }
}
