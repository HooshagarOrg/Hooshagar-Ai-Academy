/**
 * Production / local env verification.
 * Prints missing required keys by name only — never prints values.
 */
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv()

const CANONICAL_ORIGIN = 'https://www.hooshagar.ir'

const required: string[] = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
]

const recommended: string[] = [
  'JWT_SECRET',
  'KAVENEGAR_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SENTRY_DSN',
]

const optional: string[] = [
  'OPENROUTER_API_KEY',
  'ARVAN_ACCESS_KEY',
  'ARVAN_SECRET_KEY',
  'KV_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'KAVENEGAR_SENDER',
  'KAVENEGAR_TEMPLATE_OTP',
  'KAVENEGAR_TEMPLATE_NAME',
  'ZARINPAL_MERCHANT_ID',
  'RESEND_API_KEY',
  'SUPPORT_OPERATOR_PHONE',
  'KAVENEGAR_TEMPLATE_SUPPORT_NEW',
  'KAVENEGAR_TEMPLATE_SUPPORT_RESOLVED',
  'SUPPORT_INBOX_EMAIL',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_DSN',
  'UPTIMEROBOT_API_KEY',
]

function envSet(key: string): boolean {
  const value = process.env[key]
  return typeof value === 'string' && value.trim().length > 0
}

function hasGoogleApiKey(): boolean {
  if (envSet('GOOGLE_API_KEY')) return true
  for (let i = 1; i <= 10; i += 1) {
    if (envSet(`GOOGLE_API_KEY_${i}`)) return true
  }
  return false
}

function hasDistributedRateLimit(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return Boolean(url && token)
}

function normalizeEnvUrl(raw: string | undefined): string {
  return String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/$/, '')
}

function validateAppUrl(raw: string | undefined): string[] {
  if (!raw || !String(raw).trim()) {
    return ['NEXT_PUBLIC_APP_URL خالی است']
  }
  const value = normalizeEnvUrl(raw)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return ['NEXT_PUBLIC_APP_URL باید یک URL معتبر باشد']
  }
  const host = parsed.hostname.toLowerCase()
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  const issues: string[] = []
  if (!isLocal && parsed.protocol !== 'https:') {
    issues.push('NEXT_PUBLIC_APP_URL در production باید با https شروع شود')
  }
  if (!isLocal && !host.endsWith('hooshagar.ir') && !host.endsWith('vercel.app')) {
    issues.push(`دامنهٔ پیشنهادی production: ${CANONICAL_ORIGIN} (فعلی: ${value})`)
  }
  return issues
}

function hasSentryDsn(): boolean {
  return envSet('NEXT_PUBLIC_SENTRY_DSN') || envSet('SENTRY_DSN')
}

console.log('Verifying environment variables...\n')

const missingRequired: string[] = []
const missingRecommended: string[] = []
const missingOptional: string[] = []
const warnings: string[] = []

for (const key of required) {
  if (envSet(key)) {
    console.log(`OK  ${key}`)
  } else {
    console.log(`MISSING  ${key}`)
    missingRequired.push(key)
  }
}

if (hasGoogleApiKey()) {
  console.log('OK  GOOGLE_API_KEY (or GOOGLE_API_KEY_1..10)')
} else {
  console.log('MISSING  GOOGLE_API_KEY (required for AI features)')
  missingRequired.push('GOOGLE_API_KEY')
}

const appUrlIssues = validateAppUrl(process.env.NEXT_PUBLIC_APP_URL)
if (envSet('NEXT_PUBLIC_APP_URL') && appUrlIssues.length > 0) {
  for (const msg of appUrlIssues) {
    console.log(`WARN  ${msg}`)
    warnings.push(msg)
  }
}

console.log('\nRecommended variables:\n')

for (const key of recommended) {
  if (envSet(key)) {
    console.log(`OK  ${key}`)
  } else if (key === 'NEXT_PUBLIC_SENTRY_DSN' && envSet('SENTRY_DSN')) {
    console.log('OK  SENTRY_DSN (server-only; set NEXT_PUBLIC_SENTRY_DSN for the browser SDK)')
    warnings.push(
      'SENTRY_DSN is set but NEXT_PUBLIC_SENTRY_DSN is not — client errors will not be sent'
    )
  } else {
    console.log(`WARN  ${key} - not set (recommended for production)`)
    missingRecommended.push(key)
  }
}

if (hasSentryDsn()) {
  console.log('OK  Sentry DSN present')
} else {
  console.log('WARN  Sentry DSN - not set (errors will not be reported)')
  warnings.push('NEXT_PUBLIC_SENTRY_DSN for production error tracking')
}

if (hasDistributedRateLimit()) {
  console.log('OK  Distributed rate limit (Upstash/KV)')
} else {
  console.log('WARN  Distributed rate limit - not set (in-memory fallback; weak on Vercel)')
  warnings.push(
    'UPSTASH_REDIS_REST_URL + TOKEN (or KV_REST_API_*) for stable rate limits in production'
  )
}

console.log('\nOptional variables:\n')

for (const key of optional) {
  if (envSet(key)) {
    console.log(`OK  ${key}`)
  } else {
    console.log(`WARN  ${key} - not set`)
    missingOptional.push(key)
  }
}

console.log(`\n${'='.repeat(50)}`)

if (missingRequired.length > 0) {
  console.log('\nMissing REQUIRED variables:')
  for (const key of missingRequired) {
    console.log(`   - ${key}`)
  }
  console.log('\nSet these in .env.local (local) or Vercel Production (deploy).')
  process.exit(1)
}

console.log('\nAll required environment variables are set.')

if (warnings.length > 0) {
  console.log('\nProduction warnings:')
  for (const warning of warnings) {
    console.log(`   - ${warning}`)
  }
}

if (missingRecommended.length > 0) {
  console.log('\nMissing recommended variables:')
  for (const key of missingRecommended) {
    console.log(`   - ${key}`)
  }
}

if (missingOptional.length > 0) {
  console.log('\nMissing optional variables:')
  for (const key of missingOptional) {
    console.log(`   - ${key}`)
  }
}

console.log(`\nCanonical production URL: ${CANONICAL_ORIGIN}`)
console.log('Start the development server with: pnpm dev')
