/**
 * استخر API جدا برای آواتار «هوشیار»
 * فقط AVATAR_* — بدون fallback به GOOGLE_API_KEY / OPENROUTER_API_KEY اصلی
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export type AvatarAISource = 'gemini' | 'openrouter' | 'openrouter_router'

export interface AvatarAIResponse {
  content: string
  source: AvatarAISource
  model: string
  responseTimeMs: number
}

export class AvatarAIExhaustedError extends Error {
  constructor() {
    super('ظرفیت API آواتار تمام شده است')
    this.name = 'AvatarAIExhaustedError'
  }
}

const AVATAR_GEMINI_MODELS = [
  process.env.AVATAR_GEMINI_MODEL,
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
].filter((m): m is string => Boolean(m))
const AVATAR_OR_MODELS = [
  process.env.AVATAR_OR_MODEL_1 || 'google/gemini-2.5-flash-lite:free',
  process.env.AVATAR_OR_MODEL_2 || 'deepseek/deepseek-chat-v3.1:free',
  process.env.AVATAR_OR_MODEL_3 || 'meta-llama/llama-3.3-70b-instruct:free',
].filter(Boolean)
const AVATAR_OR_FALLBACK = process.env.AVATAR_OR_FALLBACK || 'openrouter/free'

const avatarGoogleKeys: string[] = []
let avatarGoogleKeyIndex = 0

function loadAvatarGoogleKeys(): string[] {
  if (avatarGoogleKeys.length > 0) return avatarGoogleKeys
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`AVATAR_GOOGLE_API_KEY_${i}`]
    if (key) avatarGoogleKeys.push(key)
  }
  return avatarGoogleKeys
}

function getNextAvatarGoogleKey(): string {
  const keys = loadAvatarGoogleKeys()
  if (keys.length === 0) throw new AvatarAIExhaustedError()
  const key = keys[avatarGoogleKeyIndex % keys.length]
  avatarGoogleKeyIndex++
  return key
}

function getAvatarOpenRouterKey(): string {
  const key = process.env.AVATAR_OPENROUTER_API_KEY
  if (!key) throw new AvatarAIExhaustedError()
  return key
}

function getOpenRouterBaseUrl(): string {
  const proxy = process.env.NEXT_PUBLIC_OPENROUTER_PROXY
  if (!proxy) return 'https://openrouter.ai/api/v1'
  return proxy.endsWith('/v1') ? proxy : `${proxy.replace(/\/$/, '')}/v1`
}

async function callAvatarGemini(systemPrompt: string, userMessage: string): Promise<AvatarAIResponse> {
  const start = Date.now()
  const keys = loadAvatarGoogleKeys()
  let lastError: unknown
  const geminiBaseUrl =
    process.env.NEXT_PUBLIC_GEMINI_PROXY || 'https://generativelanguage.googleapis.com'

  for (let attempt = 0; attempt < keys.length; attempt++) {
    for (const modelName of AVATAR_GEMINI_MODELS) {
      try {
        const apiKey = getNextAvatarGoogleKey()
        const client = new GoogleGenerativeAI(apiKey)
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 600,
          },
        })

        if (process.env.NEXT_PUBLIC_GEMINI_PROXY) {
          // @ts-expect-error SDK از apiEndpoint پشتیبانی می‌کند
          model.apiEndpoint = geminiBaseUrl
        }

        const result = await model.generateContent(userMessage)
        const content = result.response.text()
        if (!content?.trim()) throw new Error('پاسخ خالی از Gemini')
        return {
          content: content.trim(),
          source: 'gemini',
          model: modelName,
          responseTimeMs: Date.now() - start,
        }
      } catch (err) {
        lastError = err
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new AvatarAIExhaustedError()
}

async function callAvatarOpenRouter(
  systemPrompt: string,
  userMessage: string,
  model: string
): Promise<AvatarAIResponse> {
  const start = Date.now()
  const apiKey = getAvatarOpenRouterKey()
  const response = await fetch(`${getOpenRouterBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hooshagar Hooshiar Avatar',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.75,
      max_tokens: 600,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('پاسخ خالی از OpenRouter')

  return {
    content,
    source: model === AVATAR_OR_FALLBACK ? 'openrouter_router' : 'openrouter',
    model,
    responseTimeMs: Date.now() - start,
  }
}

/**
 * فراخوانی AI آواتار — Gemini → OpenRouter models → openrouter/free
 * هیچ‌وقت به استخر اصلی برنامه وصل نمی‌شود
 */
export async function callAvatarAI(
  systemPrompt: string,
  userMessage: string
): Promise<AvatarAIResponse> {
  if (loadAvatarGoogleKeys().length === 0 && !process.env.AVATAR_OPENROUTER_API_KEY) {
    throw new AvatarAIExhaustedError()
  }

  if (loadAvatarGoogleKeys().length > 0) {
    try {
      return await callAvatarGemini(systemPrompt, userMessage)
    } catch {
      // ادامه به OpenRouter استخر آواتار
    }
  }

  for (const model of AVATAR_OR_MODELS) {
    try {
      return await callAvatarOpenRouter(systemPrompt, userMessage, model)
    } catch {
      continue
    }
  }

  if (AVATAR_OR_FALLBACK) {
    try {
      return await callAvatarOpenRouter(systemPrompt, userMessage, AVATAR_OR_FALLBACK)
    } catch {
      // همه ناموفق
    }
  }

  throw new AvatarAIExhaustedError()
}

export function hasAvatarAIConfigured(): boolean {
  return loadAvatarGoogleKeys().length > 0 || Boolean(process.env.AVATAR_OPENROUTER_API_KEY)
}
