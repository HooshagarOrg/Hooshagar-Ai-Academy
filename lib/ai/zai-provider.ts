/**
 * Z.ai Direct Provider — GLM-4.7-Flash (رایگان)
 * @see https://docs.z.ai/api-reference/introduction
 */

const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4'
const DEFAULT_ZAI_MODEL = 'glm-4.7-flash'

/** قابلیت‌هایی که reasoning/thinking فعال می‌شود */
const ZAI_THINKING_CAPABILITIES = new Set([
  'student_analyzer',
  'field_selector',
  'konkur_predictor',
  'konkur_roadmap',
  'talent_analyzer',
])

export interface ZaiCallOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  /** فعال‌سازی thinking mode (تحلیل عمیق) */
  thinking?: boolean
  capability?: string
}

export function isZaiConfigured(): boolean {
  return Boolean(process.env.ZAI_API_KEY?.trim())
}

function getZaiBaseUrl(): string {
  const base = process.env.ZAI_API_BASE_URL?.trim() || DEFAULT_ZAI_BASE_URL
  return base.replace(/\/$/, '')
}

function resolveZaiModel(capability?: string): string {
  if (capability) {
    const perCapability = process.env[`ZAI_MODEL_${capability.toUpperCase()}`]
    if (perCapability?.trim()) return perCapability.trim()
  }
  return process.env.ZAI_MODEL?.trim() || DEFAULT_ZAI_MODEL
}

export async function callZai(
  prompt: string,
  options: ZaiCallOptions = {}
): Promise<{ content: string; model: string }> {
  const apiKey = process.env.ZAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('ZAI_API_KEY تنظیم نشده')
  }

  const model = options.model ?? resolveZaiModel(options.capability)
  const useThinking =
    options.thinking ??
    (options.capability ? ZAI_THINKING_CAPABILITIES.has(options.capability) : false)

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
  }

  if (useThinking) {
    body.thinking = { type: 'enabled' }
  }

  const response = await fetch(`${getZaiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Z.ai error ${response.status}: ${errBody}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('پاسخ Z.ai خالی است')
  }

  return { content, model }
}
