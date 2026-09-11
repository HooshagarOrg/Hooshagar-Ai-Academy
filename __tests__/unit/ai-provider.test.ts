import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const googleKeysUsed: string[] = []
const geminiState = { fail: false }
const redisStore = new Map<string, unknown>()

vi.mock('@google/generative-ai', () => ({
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_LOW_AND_ABOVE: 'BLOCK_LOW_AND_ABOVE',
  },
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    constructor(public apiKey: string) {
      googleKeysUsed.push(apiKey)
    }
    getGenerativeModel() {
      return {
        generateContent: async () => {
          if (geminiState.fail) {
            throw new Error('Gemini unavailable')
          }
          return { response: { text: () => 'پاسخ جمینای تست' } }
        },
      }
    }
  },
}))

vi.mock('@/lib/cache/upstash', () => ({
  getUpstashRedis: () => ({
    get: async (key: string) => redisStore.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      redisStore.set(key, value)
    },
  }),
  isUpstashRedisConfigured: () => true,
}))

vi.mock('@/lib/ai/zai-provider', () => ({
  isZaiConfigured: () => false,
  callZai: vi.fn(),
}))

vi.mock('@/lib/ai/groq-provider', () => ({
  isGroqConfigured: () => false,
  isAvatarGroqConfigured: () => false,
  callGroq: vi.fn(),
}))

function openRouterOk(): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: 'پاسخ OpenRouter تست' } }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function openRouterFail(): Response {
  return new Response('upstream error', { status: 500 })
}

describe('AI provider fallback, cache, keys, and rate limit', () => {
  beforeEach(() => {
    googleKeysUsed.length = 0
    geminiState.fail = false
    redisStore.clear()
    vi.unstubAllGlobals()
    for (let i = 1; i <= 10; i += 1) {
      process.env[`GOOGLE_API_KEY_${i}`] = `gemini-key-${i}`
    }
    process.env.OPENROUTER_API_KEY = 'or-key-a'
    process.env.OPENROUTER_API_KEY_B = 'or-key-b'
    process.env.OPENROUTER_API_KEY_C = 'or-key-c'
    delete process.env.ZAI_API_KEY
    delete process.env.GROQ_API_KEY
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns Gemini response and does not call OpenRouter', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    const { callAI } = await import('@/lib/ai-provider')
    const result = await callAI('سلام', { capability: 'study_buddy', skipCache: true })
    expect(result.provider).toBe('google')
    expect(result.content).toContain('جمینای')
    expect(result.tier).toBe(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to OpenRouter when Gemini fails', async () => {
    geminiState.fail = true
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('openrouter.ai')) return openRouterOk()
      return openRouterFail()
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    const { callAI } = await import('@/lib/ai-provider')
    const result = await callAI('سلام', { capability: 'study_buddy', skipCache: true })
    expect(result.provider).toBe('openrouter')
    expect(result.is_fallback).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
    const orCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('openrouter.ai'),
    )
    expect(orCalls.length).toBeGreaterThanOrEqual(1)
    const headers = (orCalls[0]?.[1] as RequestInit | undefined)?.headers as
      | Record<string, string>
      | undefined
    expect(String(headers?.Authorization ?? '')).toContain('or-key-a')
  })

  it('returns a graceful error when Gemini and all OpenRouter keys fail', async () => {
    geminiState.fail = true
    const fetchMock = vi.fn(async () => openRouterFail())
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    const { callAI } = await import('@/lib/ai-provider')
    await expect(
      callAI('سلام', { capability: 'study_buddy', skipCache: true }),
    ).rejects.toThrow(/تمام لایه‌های AI/)
  })

  it('does not call the AI API on cache hit', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    const { callAI } = await import('@/lib/ai-provider')
    const first = await callAI('تولید آزمون ریاضی', {
      capability: 'exam_generator',
      grade: 6,
      schoolId: 'school-cache',
    })
    expect(first.cached).toBeUndefined()
    const geminiCallsAfterMiss = googleKeysUsed.length
    expect(geminiCallsAfterMiss).toBeGreaterThan(0)

    const secondStarted = performance.now()
    const second = await callAI('تولید آزمون ریاضی', {
      capability: 'exam_generator',
      grade: 6,
      schoolId: 'school-cache',
    })
    expect(performance.now() - secondStarted).toBeLessThan(100)
    expect(second.cached).toBe(true)
    expect(second.content).toBe(first.content)
    expect(googleKeysUsed.length).toBe(geminiCallsAfterMiss)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls the AI API on cache miss and stores the result', async () => {
    vi.stubGlobal('fetch', vi.fn())
    vi.resetModules()
    const { callAI } = await import('@/lib/ai-provider')
    expect(redisStore.size).toBe(0)
    await callAI('تولید محتوای علوم', {
      capability: 'content_creator',
      grade: 5,
      schoolId: 'school-miss',
    })
    expect(googleKeysUsed.length).toBe(1)
    expect(redisStore.size).toBe(1)
  })

  it('rejects a request over the per-user rate limit', async () => {
    const { checkRateLimit, rateLimitResponse } = await import('@/lib/security/rate-limiter')
    const key = `ai_general:user:${crypto.randomUUID()}`
    const config = { limit: 2, window: 60_000 }
    expect(checkRateLimit(key, config).allowed).toBe(true)
    expect(checkRateLimit(key, config).allowed).toBe(true)
    const over = checkRateLimit(key, config)
    expect(over.allowed).toBe(false)
    expect(rateLimitResponse(over)?.status).toBe(429)
  })

  it('rotates 10 Gemini keys in order', async () => {
    vi.stubGlobal('fetch', vi.fn())
    vi.resetModules()
    const { callAI } = await import('@/lib/ai-provider')
    for (let i = 0; i < 10; i += 1) {
      await callAI(`prompt-${i}`, { capability: 'study_buddy', skipCache: true })
    }
    expect(googleKeysUsed).toEqual(
      Array.from({ length: 10 }, (_, i) => `gemini-key-${i + 1}`),
    )
  })
})
