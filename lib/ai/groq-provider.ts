/**
 * Groq Cloud Provider — API سازگار با OpenAI
 * @see https://console.groq.com/docs/quickstart
 *
 * استخر اصلی: GROQ_API_KEY
 * استخر آواتار: AVATAR_GROQ_API_KEY (جدا — بدون قرض از استخر اصلی)
 */

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'
const DEFAULT_AVATAR_GROQ_MODEL = 'llama-3.1-8b-instant'

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqCallOptions {
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
  messages?: GroqMessage[]
  /** اگر messages نباشد، از prompt به‌عنوان user استفاده می‌شود */
  prompt?: string
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}

export function isAvatarGroqConfigured(): boolean {
  return Boolean(process.env.AVATAR_GROQ_API_KEY?.trim())
}

function getGroqBaseUrl(): string {
  const proxy = process.env.NEXT_PUBLIC_GROQ_PROXY?.trim()
  if (proxy) {
    const base = proxy.replace(/\/$/, '')
    if (base.endsWith('/openai/v1')) return base
    if (base.endsWith('/v1')) return base
    return `${base}/openai/v1`
  }
  const base = process.env.GROQ_API_BASE_URL?.trim() || DEFAULT_GROQ_BASE_URL
  return base.replace(/\/$/, '')
}

function resolveMainGroqModel(capability?: string): string {
  if (capability) {
    const perCapability = process.env[`GROQ_MODEL_${capability.toUpperCase()}`]
    if (perCapability?.trim()) return perCapability.trim()
  }
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL
}

export function resolveAvatarGroqModel(): string {
  return process.env.AVATAR_GROQ_MODEL?.trim() || DEFAULT_AVATAR_GROQ_MODEL
}

export async function callGroq(
  options: GroqCallOptions & { capability?: string }
): Promise<{ content: string; model: string }> {
  const apiKey = (options.apiKey ?? process.env.GROQ_API_KEY)?.trim()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY تنظیم نشده')
  }

  const model = options.model ?? resolveMainGroqModel(options.capability)
  const messages: GroqMessage[] =
    options.messages ??
    (options.prompt
      ? [{ role: 'user', content: options.prompt }]
      : [])

  if (messages.length === 0) {
    throw new Error('پیام خالی برای Groq')
  }

  const response = await fetch(`${getGroqBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Groq error ${response.status}: ${errBody}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('پاسخ Groq خالی است')
  }

  return { content, model }
}

/** فراخوانی با کلید استخر آواتار — هرگز از GROQ_API_KEY اصلی استفاده نمی‌کند */
export async function callAvatarGroq(
  systemPrompt: string,
  userMessage: string,
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<{ content: string; model: string }> {
  const apiKey = process.env.AVATAR_GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('AVATAR_GROQ_API_KEY تنظیم نشده')
  }

  return callGroq({
    apiKey,
    model: options.model ?? resolveAvatarGroqModel(),
    temperature: options.temperature ?? 0.75,
    maxTokens: options.maxTokens ?? 600,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })
}
