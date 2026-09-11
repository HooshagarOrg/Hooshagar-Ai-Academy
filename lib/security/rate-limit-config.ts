export const RATE_LIMIT_CONFIGS = {
  login: { limit: 5, window: 60_000 },
  otp_send: { limit: 3, window: 300_000 },
  otp_verify: { limit: 5, window: 300_000 },
  change_password: { limit: 3, window: 3_600_000 },
  ai_ocr: { limit: 20, window: 3_600_000 },
  ai_general: { limit: 50, window: 3_600_000 },
  ai_heavy: { limit: 10, window: 3_600_000 },
  ai_generate: { limit: 10, window: 3_600_000 },
  exam_submit: { limit: 2, window: 3_600_000 },
  exam_answer: { limit: 200, window: 3_600_000 },
  api_default: { limit: 100, window: 60_000 },
  admin_action: { limit: 30, window: 60_000 },
} as const

export type RateLimitKey = keyof typeof RATE_LIMIT_CONFIGS

/** AI / OTP / login: if Redis is configured but the check fails, deny (fail-closed). */
export const FAIL_CLOSED_SCOPES = new Set<string>([
  'login',
  'otp_send',
  'otp_verify',
  'change_password',
  'ai_ocr',
  'ai_general',
  'ai_heavy',
  'ai_generate',
])
