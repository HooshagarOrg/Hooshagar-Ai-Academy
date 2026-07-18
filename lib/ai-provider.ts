import { GoogleGenerativeAI } from '@google/generative-ai'
import { callZai, isZaiConfigured } from '@/lib/ai/zai-provider'
import { callGroq, isGroqConfigured } from '@/lib/ai/groq-provider'
import { createHash } from 'crypto'

// ═══════════════════════════════════════════════════════════════
// هوشاگر - سرویس AI با معماری چندلایه رایگان
//
//  Cache      → بررسی کش قبل از هر درخواست
//  Rate Limit → محدودیت درخواست per user
//  Tier 1     → Google Direct  (10 کلید Round-Robin)
//  Tier 2     → Z.ai GLM (رایگان — ZAI_API_KEY)
//  Tier 3     → Groq Cloud (رایگان — GROQ_API_KEY)
//  Tier 4     → OpenRouter A   (مدل‌های 200B+)
//  Tier 5     → OpenRouter B   (مدل‌های 32-70B)
//  Tier 6     → OpenRouter C   (مدل‌های سریع 7-24B)
//  Paid       → غیرفعال
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
  provider: 'google' | 'zai' | 'groq' | 'openrouter'
  model: string
  tier: 1 | 2 | 3 | 4 | 5 | 6
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
  userId?: string      // برای Rate Limit
  skipCache?: boolean  // اجبار به عدم استفاده از Cache
}

// ═══════════════════════════════════════════════════════════════
// ── Cache — In-Memory با TTL ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════

interface CacheEntry {
  response: AIResponse
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry>()

// مدت نگهداری Cache بر اساس نوع قابلیت (ثانیه)
const CACHE_TTL_SECONDS: Record<AICapability, number> = {
  student_analyzer:   300,   //  5 دقیقه — داده‌های پویا
  problem_solver_ocr: 3600,  //  1 ساعت — جواب یک مسئله ثابت است
  study_buddy:        0,     //  بدون cache — چت interactive
  story_wizard:       1800,  // 30 دقیقه
  field_selector:     3600,  //  1 ساعت
  konkur_predictor:   600,   // 10 دقیقه
  konkur_roadmap:     3600,  //  1 ساعت
  content_creator:    7200,  //  2 ساعت — محتوا ثابت می‌ماند
  exam_generator:     1800,  // 30 دقیقه
  homework_evaluator: 0,     //  بدون cache — هر تکلیف منحصربه‌فرد
  talent_analyzer:    600,   // 10 دقیقه
  summarizer:         3600,  //  1 ساعت — خلاصه یک متن ثابت است
}

function getCacheKey(capability: AICapability, prompt: string): string {
  const hash = createHash('sha256')
    .update(`${capability}::${prompt}`)
    .digest('hex')
    .slice(0, 16)
  return `ai:${capability}:${hash}`
}

function getFromCache(key: string): AIResponse | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key)
    return null
  }
  return { ...entry.response, cached: true }
}

function setCache(key: string, response: AIResponse, ttlSeconds: number): void {
  if (ttlSeconds <= 0) return
  responseCache.set(key, {
    response,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
  // پاکسازی خودکار cache‌های منقضی (هر 100 درخواست یک‌بار)
  if (responseCache.size % 100 === 0) {
    const now = Date.now()
    for (const [k, v] of responseCache) {
      if (now > v.expiresAt) responseCache.delete(k)
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// ── Rate Limiter — Sliding Window per User ───────────────────
// ═══════════════════════════════════════════════════════════════

interface RateLimitEntry {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// محدودیت بر اساس نقش کاربر (درخواست در ساعت)
const RATE_LIMIT_PER_HOUR = {
  default:        20,   // کاربر عادی
  student:        30,
  teacher:        60,
  admin:         200,
  platform_admin: 999,
} as const

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`سقف درخواست AI تجاوز شد. ${retryAfterSeconds} ثانیه دیگر تلاش کنید.`)
    this.name = 'RateLimitError'
  }
}

function checkRateLimit(userId: string, role: keyof typeof RATE_LIMIT_PER_HOUR = 'default'): void {
  const limit = RATE_LIMIT_PER_HOUR[role] ?? RATE_LIMIT_PER_HOUR.default
  const windowMs = 60 * 60 * 1000 // 1 ساعت
  const now = Date.now()

  let entry = rateLimitStore.get(userId)
  if (!entry) {
    entry = { timestamps: [] }
    rateLimitStore.set(userId, entry)
  }

  // حذف timestamp‌های خارج از پنجره زمانی
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    throw new RateLimitError(retryAfter)
  }

  entry.timestamps.push(now)
}

// پاکسازی دوره‌ای rate limit store (حافظه)
setInterval(() => {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  for (const [userId, entry] of rateLimitStore) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)
    if (entry.timestamps.length === 0) rateLimitStore.delete(userId)
  }
}, 10 * 60 * 1000) // هر 10 دقیقه

// ═══════════════════════════════════════════════════════════════
// ── نگاشت مدل‌ها ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

const GOOGLE_MODEL_MAP: Record<AICapability, string> = {
  student_analyzer:    'gemini-2.5-flash',
  problem_solver_ocr:  'gemini-2.5-flash',
  study_buddy:         'gemini-2.5-flash',
  story_wizard:        'gemini-2.5-flash-lite',
  field_selector:      'gemini-2.5-flash',
  konkur_predictor:    'gemini-2.5-flash',
  konkur_roadmap:      'gemini-2.5-flash',
  content_creator:     'gemini-2.5-flash-lite',
  exam_generator:      'gemini-2.5-flash-lite',
  homework_evaluator:  'gemini-2.5-flash',
  talent_analyzer:     'gemini-2.5-flash-lite',
  summarizer:          'gemini-2.5-flash',
}

const OPENROUTER_MODEL_MAP: Record<AICapability, { tier2: string; tier3: string; tier4: string }> = {
  student_analyzer:    { tier2: 'deepseek/deepseek-r1:free',                    tier3: 'qwen/qwen3-235b-a22b:free',                    tier4: 'qwen/qwen3-32b:free' },
  problem_solver_ocr:  { tier2: 'qwen/qwen2.5-vl-72b-instruct:free',            tier3: 'meta-llama/llama-4-maverick:free',              tier4: 'nvidia/nemotron-nano-12b-v2-vl:free' },
  study_buddy:         { tier2: 'deepseek/deepseek-chat-v3.1:free',              tier3: 'meta-llama/llama-3.3-70b-instruct:free',        tier4: 'mistralai/mistral-small-3.1-24b-instruct:free' },
  story_wizard:        { tier2: 'meta-llama/llama-4-maverick:free',              tier3: 'meta-llama/llama-3.3-70b-instruct:free',        tier4: 'google/gemma-3-27b-it:free' },
  field_selector:      { tier2: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',  tier3: 'x-ai/grok-4.1-fast:free',                      tier4: 'deepseek/deepseek-chat-v3.1:free' },
  konkur_predictor:    { tier2: 'deepseek/deepseek-r1-0528:free',                tier3: 'qwen/qwq-32b:free',                            tier4: 'deepseek/deepseek-r1-distill-qwen-32b:free' },
  konkur_roadmap:      { tier2: 'nousresearch/hermes-3-llama-3.1-405b:free',     tier3: 'x-ai/grok-4.1-fast:free',                      tier4: 'deepseek/deepseek-r1-distill-llama-70b:free' },
  content_creator:     { tier2: 'qwen/qwen3-coder:free',                         tier3: 'deepseek/deepseek-r1-distill-llama-70b:free',  tier4: 'qwen/qwen3-32b:free' },
  exam_generator:      { tier2: 'qwen/qwen3-235b-a22b:free',                     tier3: 'deepseek/deepseek-r1:free',                    tier4: 'mistralai/mistral-small-3.1-24b-instruct:free' },
  homework_evaluator:  { tier2: 'qwen/qwen2.5-vl-72b-instruct:free',             tier3: 'meta-llama/llama-4-maverick:free',              tier4: 'google/gemma-3-27b-it:free' },
  talent_analyzer:     { tier2: 'meta-llama/llama-4-scout:free',                 tier3: 'deepseek/deepseek-chat-v3.1:free',             tier4: 'qwen/qwen3-32b:free' },
  summarizer:          { tier2: 'deepseek/deepseek-chat-v3.1:free',              tier3: 'mistralai/mistral-small-3.1-24b-instruct:free', tier4: 'qwen/qwen3-14b:free' },
}

// ═══════════════════════════════════════════════════════════════
// ── مدیریت Round-Robin کلیدهای Google ──────────────────────────
// ═══════════════════════════════════════════════════════════════

const GOOGLE_KEYS: string[] = []
let googleKeyIndex = 0

function loadGoogleKeys(): string[] {
  if (GOOGLE_KEYS.length > 0) return GOOGLE_KEYS
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GOOGLE_API_KEY_${i}`] ?? process.env[`GEMINI_API_KEY_${i}`]
    if (key) GOOGLE_KEYS.push(key)
  }
  if (GOOGLE_KEYS.length === 0 && process.env.GOOGLE_API_KEY) {
    GOOGLE_KEYS.push(process.env.GOOGLE_API_KEY)
  }
  return GOOGLE_KEYS
}

function getNextGoogleKey(): string {
  const keys = loadGoogleKeys()
  if (keys.length === 0) throw new Error('هیچ GOOGLE_API_KEY_N تعریف نشده')
  const key = keys[googleKeyIndex % keys.length]
  googleKeyIndex++
  return key
}

// ═══════════════════════════════════════════════════════════════
// ── فراخوانی Tier 1: Google ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════

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
  return { content: result.response.text(), provider: 'google', model: modelName, tier: 1, is_fallback: false, cost: 0 }
}

// ═══════════════════════════════════════════════════════════════
// ── فراخوانی OpenRouter (Tier 2/3/4) ────────────────────────
// ═══════════════════════════════════════════════════════════════

async function callOpenRouterWithKey(
  prompt: string,
  model: string,
  tier: 4 | 5 | 6,
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
  return { content: data.choices[0]?.message?.content || '', provider: 'openrouter', model, tier, is_fallback: true, cost: 0 }
}

// ═══════════════════════════════════════════════════════════════
// ── فراخوانی Tier 2: Z.ai (GLM-4.7-Flash) ───────────────────
// ═══════════════════════════════════════════════════════════════

async function callZaiTier2(
  prompt: string,
  capability: AICapability,
  opts: AICallOptions
): Promise<AIResponse> {
  const { content, model } = await callZai(prompt, {
    capability,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  })
  return { content, provider: 'zai', model, tier: 2, is_fallback: true, cost: 0 }
}

async function callGroqTier3(
  prompt: string,
  capability: AICapability,
  opts: AICallOptions
): Promise<AIResponse> {
  const { content, model } = await callGroq({
    prompt,
    capability,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  })
  return { content, provider: 'groq', model, tier: 3, is_fallback: true, cost: 0 }
}

// ═══════════════════════════════════════════════════════════════
// ── تابع اصلی: Cache → Rate Limit → Fallback چندلایه ────────
// ═══════════════════════════════════════════════════════════════

/**
 * فراخوانی AI با قابلیت مشخص
 *
 * ترتیب اجرا:
 *   1. Cache Check    — اگر جواب کش شده موجود بود، فوری برگردان
 *   2. Rate Limit     — بررسی محدودیت کاربر (پرتاب RateLimitError در صورت تجاوز)
 *   3. Tier 1 Google  — Round-Robin روی 10 کلید
 *   4. Tier 2 Z.ai    — GLM (رایگان)
 *   5. Tier 3 Groq    — Llama سریع (رایگان — GROQ_API_KEY)
 *   6. Tier 4 OR-A    — مدل‌های 200B+
 *   7. Tier 5 OR-B    — مدل‌های 32-70B
 *   8. Tier 6 OR-C    — مدل‌های سریع 7-24B
 */
export async function callAI(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const capability: AICapability = options.capability ?? 'study_buddy'

  // ── مرحله 1: Cache Check ──────────────────────────────────────
  const ttl = CACHE_TTL_SECONDS[capability]
  const cacheKey = getCacheKey(capability, prompt)

  if (!options.skipCache && ttl > 0) {
    const cached = getFromCache(cacheKey)
    if (cached) return cached
  }

  // ── مرحله 2: Rate Limit Check ────────────────────────────────
  if (options.userId) {
    checkRateLimit(options.userId)
  }

  // ── مرحله 3+: Fallback Chain ─────────────────────────────────
  const orModels = OPENROUTER_MODEL_MAP[capability]
  const keyA = process.env.OPENROUTER_API_KEY
  const keyB = process.env.OPENROUTER_API_KEY_B
  const keyC = process.env.OPENROUTER_API_KEY_C

  const tiers: Array<() => Promise<AIResponse>> = []

  if (!options.forceOpenRouter) {
    tiers.push(() => callGoogleTier1(prompt, capability, options))
  }
  if (isZaiConfigured()) {
    tiers.push(() => callZaiTier2(prompt, capability, options))
  }
  if (isGroqConfigured()) {
    tiers.push(() => callGroqTier3(prompt, capability, options))
  }
  if (keyA) tiers.push(() => callOpenRouterWithKey(prompt, orModels.tier2, 4, keyA, options))
  if (keyB) tiers.push(() => callOpenRouterWithKey(prompt, orModels.tier3, 5, keyB, options))
  if (keyC) tiers.push(() => callOpenRouterWithKey(prompt, orModels.tier4, 6, keyC, options))

  let lastError: unknown
  for (let i = 0; i < tiers.length; i++) {
    try {
      const result = await tiers[i]()
      // ذخیره در Cache فقط در صورت موفقیت
      if (!options.skipCache && ttl > 0) {
        setCache(cacheKey, result, ttl)
      }
      return result
    } catch (err) {
      lastError = err
      console.warn(`AI Tier ${i + 1} failed for [${capability}], trying next...`, err)
    }
  }

  console.error('All AI tiers failed:', lastError)
  throw new Error('تمام لایه‌های AI در دسترس نیستند. لطفاً بعداً تلاش کنید.')
}

// ═══════════════════════════════════════════════════════════════
// ── توابع کمکی ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

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
    return { content: result.response.text(), provider: 'google', model: modelName, tier: 1, is_fallback: false, cost: 0 }
  } catch (err) {
    console.warn('Gemini Vision failed, falling back to OpenRouter Vision...', err)
    const keyA = process.env.OPENROUTER_API_KEY
    if (!keyA) throw new Error('هیچ کلید API برای Vision در دسترس نیست')
    const visionModel = OPENROUTER_MODEL_MAP[capability].tier2
    return callOpenRouterWithKey(prompt, visionModel, 4, keyA, options)
  }
}

/** اطلاعات وضعیت Cache و Rate Limit برای Admin Dashboard */
export function getAIStats() {
    return {
    cacheSize:       responseCache.size,
    rateLimitUsers:  rateLimitStore.size,
    googleKeysLoaded: loadGoogleKeys().length,
    zaiConfigured: isZaiConfigured(),
    groqConfigured: isGroqConfigured(),
  }
}
