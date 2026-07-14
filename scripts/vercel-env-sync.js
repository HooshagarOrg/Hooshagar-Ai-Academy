/**
 * Sync .env.local → Vercel (production + preview)
 * Usage: node scripts/vercel-env-sync.js
 */
const { execSync } = require('child_process')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

/** کلیدهایی که نباید به production بروند */
const PRODUCTION_SKIP = new Set([
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
])

const KEYS = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVER_URL',
  'SUPABASE_PROJECT_ID',
  'SUPABASE_FETCH_TIMEOUT_MS',
  'NEXT_PUBLIC_SUPABASE_PROXY',

  // App
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'APP_ENV',

  // Google AI (round-robin)
  'GOOGLE_API_KEY',
  ...Array.from({ length: 10 }, (_, i) => `GOOGLE_API_KEY_${i + 1}`),

  // Avatar AI
  'AVATAR_DAILY_MESSAGE_LIMIT',
  'AVATAR_OPENROUTER_API_KEY',
  'AVATAR_OR_FALLBACK',
  'AVATAR_OR_MODEL_1',
  'AVATAR_OR_MODEL_2',
  'AVATAR_OR_MODEL_3',
  ...Array.from({ length: 20 }, (_, i) => `AVATAR_GOOGLE_API_KEY_${i + 1}`),

  // OpenRouter
  'OPENROUTER_API_KEY',
  'OPENROUTER_API_KEY_B',
  'OPENROUTER_API_KEY_C',
  'NEXT_PUBLIC_OPENROUTER_PROXY',
  'NEXT_PUBLIC_GEMINI_PROXY',

  // Z.ai (Tier 2)
  'ZAI_API_KEY',
  'ZAI_API_BASE_URL',
  'ZAI_MODEL',

  // AI model config
  'AI_MODEL_DEFAULT',
  'AI_MODEL_FAST',
  'AI_MODEL_PRO',
  'AI_MODEL_VISION',
  'AI_MODEL_FALLBACK',

  // SMS / OTP
  'KAVENEGAR_API_KEY',
  'KAVENEGAR_SENDER',
  'KAVENEGAR_TEMPLATE_OTP',
  'KAVENEGAR_TEMPLATE_ATTENDANCE',
  'KAVENEGAR_TEMPLATE_LOTTERY',
  'KAVENEGAR_TEMPLATE_NAME',
  'OTP_EXPIRY_MINUTES',
  'OTP_MAX_ATTEMPTS',
  'OTP_RATE_LIMIT_WINDOW',

  // Storage
  'ARVAN_ACCESS_KEY',
  'ARVAN_SECRET_KEY',
  'ARVAN_BUCKET',
  'ARVAN_CDN',
  'ARVAN_ENDPOINT',
  'ARVAN_REGION',

  // Payment / captcha / skyroom
  'ZARINPAL_MERCHANT_ID',
  'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
  'RECAPTCHA_SECRET_KEY',
  'SKYROOM_API_BASE_URL',
  'SKYROOM_API_KEY',

  // Rate limit (also add via Upstash dashboard if missing)
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',

  // Dev/test — preview only
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
]

const root = path.join(__dirname, '..')

function addEnv(key, targetEnv, value) {
  try {
    execSync(`vercel env add ${key} ${targetEnv} --force`, {
      cwd: root,
      input: value,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    console.log(`  ok: ${key} (${targetEnv})`)
  } catch (err) {
    const msg = err.stderr?.toString() || err.message
    console.warn(`  warn: ${key} (${targetEnv}) — ${msg.split('\n')[0]}`)
  }
}

console.log('Syncing env to Vercel...\n')

for (const targetEnv of ['production', 'preview']) {
  console.log(`--- ${targetEnv} ---`)
  for (const key of KEYS) {
    if (targetEnv === 'production' && PRODUCTION_SKIP.has(key)) {
      console.log(`  skip (dev-only): ${key}`)
      continue
    }

    const value = process.env[key]
    if (!value || !String(value).trim()) {
      console.log(`  skip (empty): ${key}`)
      continue
    }
    addEnv(key, targetEnv, String(value).trim())
  }
}

console.log('\nDone. Run: node scripts/audit-env-sync.js')
