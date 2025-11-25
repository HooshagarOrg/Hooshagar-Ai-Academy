import { GoogleGenerativeAI } from '@google/generative-ai'

// =====================================
// استراتژی Gemini First
// =====================================
// 1. سعی در استفاده از Google Gemini (رایگان)
// 2. اگر fail شد → fallback به OpenRouter

type AIProvider = 'google' | 'openrouter'

interface AIResponse {
  content: string
  provider: AIProvider
  model: string
  is_fallback: boolean
  cost: number
  cached?: boolean
}

interface AICallOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  useFallback?: boolean // اجبار به استفاده از fallback
}

// =====================================
// Google Gemini Client
// =====================================
const geminiApiKey = process.env.GOOGLE_API_KEY

let geminiClient: GoogleGenerativeAI | null = null

function getGeminiClient() {
  if (!geminiApiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is missing')
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(geminiApiKey)
  }

  return geminiClient
}

/**
 * فراخوانی Google Gemini
 */
async function callGemini(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const client = getGeminiClient()
  
  const modelName = options.model || process.env.AI_MODEL_DEFAULT || 'gemini-1.5-pro'
  
  try {
    const model = client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return {
      content: text,
      provider: 'google',
      model: modelName,
      is_fallback: false,
      cost: 0, // رایگان تا 1500 درخواست/روز
    }
  } catch (error) {
    console.error('خطا در Gemini:', error)
    throw error
  }
}

/**
 * فراخوانی OpenRouter (Fallback)
 */
async function callOpenRouter(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is missing')
  }

  const modelName = options.model || process.env.AI_MODEL_FALLBACK || 'moonshotai/kimi-k2-thinking'

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Hooshagar',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'openrouter',
      model: modelName,
      is_fallback: true,
      cost: parseFloat(data.usage?.total_cost || '0.02'), // تخمین
    }
  } catch (error) {
    console.error('خطا در OpenRouter:', error)
    throw error
  }
}

// =====================================
// تابع اصلی با استراتژی Fallback
// =====================================

/**
 * فراخوانی هوش مصنوعی با استراتژی Gemini First
 * 
 * @param prompt - متن ورودی
 * @param options - تنظیمات اختیاری
 * @returns پاسخ AI با جزئیات provider
 */
export async function callAI(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  // اگر force fallback باشد، مستقیماً OpenRouter
  if (options.useFallback) {
    return callOpenRouter(prompt, options)
  }

  try {
    // ابتدا Gemini را امتحان کن
    const response = await callGemini(prompt, options)
    return response
  } catch (geminiError) {
    console.warn('Gemini failed, trying OpenRouter fallback...', geminiError)
    
    try {
      // Fallback به OpenRouter
      const response = await callOpenRouter(prompt, options)
      return response
    } catch (fallbackError) {
      console.error('All AI providers failed:', fallbackError)
      throw new Error('تمام سرویس‌های AI در دسترس نیستند. لطفاً بعداً تلاش کنید.')
    }
  }
}

/**
 * فراخوانی AI برای تحلیل (با JSON output)
 */
export async function callAIForAnalysis<T>(
  prompt: string,
  options: AICallOptions = {}
): Promise<T> {
  const response = await callAI(prompt, options)
  
  try {
    // تلاش برای parse کردن JSON
    const parsed = JSON.parse(response.content)
    return parsed as T
  } catch {
    throw new Error('پاسخ AI قابل پردازش نیست. لطفاً دوباره تلاش کنید.')
  }
}

/**
 * فراخوانی Gemini Vision برای OCR
 */
export async function callGeminiVision(
  imageBase64: string,
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const client = getGeminiClient()
  
  const modelName = process.env.AI_MODEL_VISION || 'gemini-1.5-pro'
  
  try {
    const model = client.getGenerativeModel({ 
      model: modelName,
    })

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    return {
      content: text,
      provider: 'google',
      model: modelName,
      is_fallback: false,
      cost: 0,
    }
  } catch (error) {
    console.error('خطا در Gemini Vision:', error)
    throw error
  }
}

