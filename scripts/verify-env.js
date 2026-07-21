// بررسی تمام environment variables مورد نیاز
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const CANONICAL_ORIGIN = 'https://www.hooshagar.ir'

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
]

// JWT اختیاری — Supabase Auth کوکی httpOnly استفاده می‌شود
const recommended = [
  'JWT_SECRET',
  'KAVENEGAR_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

const optional = [
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
]

console.log('🔍 Verifying environment variables...\n')

function hasGoogleApiKey() {
  if (process.env.GOOGLE_API_KEY) return true
  for (let i = 1; i <= 10; i += 1) {
    if (process.env[`GOOGLE_API_KEY_${i}`]) return true
  }
  return false
}

function hasDistributedRateLimit() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return Boolean(url && token)
}

function normalizeEnvUrl(raw) {
  return String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/$/, '')
}

function validateAppUrl(raw) {
  const issues = []
  if (!raw || !String(raw).trim()) {
    return ['NEXT_PUBLIC_APP_URL خالی است']
  }
  const value = normalizeEnvUrl(raw)
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return ['NEXT_PUBLIC_APP_URL باید یک URL معتبر باشد']
  }
  const host = parsed.hostname.toLowerCase()
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  if (!isLocal && parsed.protocol !== 'https:') {
    issues.push('NEXT_PUBLIC_APP_URL در production باید با https شروع شود')
  }
  if (!isLocal) {
    if (!host.endsWith('hooshagar.ir') && !host.endsWith('vercel.app')) {
      issues.push(
        `دامنهٔ پیشنهادی production: ${CANONICAL_ORIGIN} (فعلی: ${value})`
      )
    }
  }
  return issues
}

let missingRequired = []
let missingOptional = []
let warnings = []

required.forEach((key) => {
  if (process.env[key]) {
    console.log(`✅ ${key}`)
  } else {
    console.log(`❌ ${key} - MISSING`)
    missingRequired.push(key)
  }
})

if (hasGoogleApiKey()) {
  console.log('✅ GOOGLE_API_KEY (or GOOGLE_API_KEY_1..10)')
} else {
  console.log('❌ GOOGLE_API_KEY - MISSING (required for AI features)')
  missingRequired.push('GOOGLE_API_KEY')
}

const appUrlIssues = validateAppUrl(process.env.NEXT_PUBLIC_APP_URL)
if (process.env.NEXT_PUBLIC_APP_URL && appUrlIssues.length > 0) {
  appUrlIssues.forEach((msg) => {
    console.log(`⚠️  ${msg}`)
    warnings.push(msg)
  })
}

console.log('\n📋 Recommended variables:\n')

recommended.forEach((key) => {
  if (process.env[key]) {
    console.log(`✅ ${key}`)
  } else {
    console.log(`⚠️  ${key} - Not set (recommended for production)`)
    missingOptional.push(key)
  }
})

if (hasDistributedRateLimit()) {
  console.log('✅ Distributed rate limit (Upstash/KV)')
} else {
  console.log(
    '⚠️  Distributed rate limit - Not set (in-memory fallback; weak on Vercel)'
  )
  warnings.push(
    'UPSTASH_REDIS_REST_URL + TOKEN (یا KV_REST_API_*) برای rate limit پایدار در production'
  )
}

console.log('\n📋 Optional variables:\n')

optional.forEach((key) => {
  if (process.env[key]) {
    console.log(`✅ ${key}`)
  } else {
    console.log(`⚠️  ${key} - Not set`)
    missingOptional.push(key)
  }
})

console.log('\n' + '='.repeat(50))

if (missingRequired.length > 0) {
  console.log('\n❌ Missing REQUIRED variables:')
  missingRequired.forEach((key) => console.log(`   - ${key}`))
  console.log('\nPlease set these variables in .env.local')
  process.exit(1)
}

console.log('\n✅ All required environment variables are set!')

if (warnings.length > 0) {
  console.log('\n⚠️  Production warnings:')
  warnings.forEach((w) => console.log(`   - ${w}`))
}

if (missingOptional.length > 0) {
  console.log('\n⚠️  Some optional/recommended variables are not set:')
  missingOptional.forEach((key) => console.log(`   - ${key}`))
  console.log('\nThese are optional but some features may not work.')
}

console.log(`\n🎯 Canonical production URL: ${CANONICAL_ORIGIN}`)
console.log('\n🎉 You can start the development server with: pnpm dev')
