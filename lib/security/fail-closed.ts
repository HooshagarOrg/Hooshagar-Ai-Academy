export const FAIL_CLOSED_SCOPES = new Set<string>([
  'login',
  'otp_send',
  'otp_verify',
  'change_password',
  'ai_ocr',
  'ai_general',
  'ai_heavy',
  'ai_generate',
  'tts',
])

export function shouldFailClosedWithoutRedis(
  scope: string,
  nodeEnv: string | undefined,
  hasRedis: boolean
): boolean {
  if (hasRedis) return false
  if (nodeEnv !== 'production') return false
  return FAIL_CLOSED_SCOPES.has(scope)
}
