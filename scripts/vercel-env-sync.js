/**
 * Sync .env.local → Vercel (production + preview)
 * Usage: node scripts/vercel-env-sync.js
 */
const { execSync } = require('child_process')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'JWT_SECRET',
  'GOOGLE_API_KEY',
  'GOOGLE_API_KEY_1',
  'GOOGLE_API_KEY_2',
  'OPENROUTER_API_KEY',
  'OPENROUTER_API_KEY_B',
  'OPENROUTER_API_KEY_C',
  'KAVENEGAR_API_KEY',
  'KAVENEGAR_SENDER',
  'ZARINPAL_MERCHANT_ID',
  'ARVAN_ACCESS_KEY',
  'ARVAN_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXTAUTH_SECRET',
]

const ENVS = ['production', 'preview']
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

for (const targetEnv of ENVS) {
  console.log(`--- ${targetEnv} ---`)
  for (const key of KEYS) {
    const value = process.env[key]
    if (!value || !String(value).trim()) {
      console.log(`  skip: ${key}`)
      continue
    }
    addEnv(key, targetEnv, String(value).trim())
  }
}

console.log('\nDone. Run: vercel env ls production')
