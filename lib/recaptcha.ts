// =====================================
// 🔒 Google reCAPTCHA Verification
// =====================================
// تأیید reCAPTCHA token در سمت سرور

interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
  challenge_ts: string
  hostname: string
  'error-codes'?: string[]
}

/**
 * تأیید reCAPTCHA token
 * @param token - توکن دریافتی از کلاینت
 * @param minimumScore - حداقل امتیاز قابل قبول (پیشفرض 0.5)
 * @returns true اگر انسان واقعی باشد
 */
export async function verifyRecaptcha(
  token: string,
  minimumScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not set')
    return { success: false, error: 'reCAPTCHA not configured' }
  }

  if (!token) {
    return { success: false, error: 'No reCAPTCHA token provided' }
  }

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    )

    if (!response.ok) {
      throw new Error(`reCAPTCHA API returned ${response.status}`)
    }

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes'])
      return {
        success: false,
        error: data['error-codes']?.join(', ') || 'Verification failed',
      }
    }

    // reCAPTCHA v3 می‌دهد score بین 0.0 تا 1.0
    // 0.0: احتمال بالای bot
    // 1.0: احتمال بالای انسان واقعی
    // 0.5+: معمولاً قابل اعتماد است
    if (data.score < minimumScore) {
      console.warn(`reCAPTCHA score too low: ${data.score} < ${minimumScore}`)
      return {
        success: false,
        score: data.score,
        error: 'Score too low',
      }
    }

    return {
      success: true,
      score: data.score,
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Middleware helper برای بررسی reCAPTCHA در API routes
 */
export async function requireRecaptcha(
  request: Request,
  minimumScore?: number
): Promise<{ valid: boolean; score?: number; error?: string }> {
  try {
    const body = await request.json()
    const token = body.recaptcha_token

    if (!token) {
      return { valid: false, error: 'reCAPTCHA token is required' }
    }

    const result = await verifyRecaptcha(token, minimumScore)
    return { valid: result.success, score: result.score, error: result.error }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to parse request body',
    }
  }
}



