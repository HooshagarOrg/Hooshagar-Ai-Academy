// بررسی تمام environment variables مورد نیاز
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
]

// JWT اختیاری — Supabase Auth کوکی httpOnly استفاده می‌شود
const recommended = [
  'JWT_SECRET',
]

const optional = [
  'OPENROUTER_API_KEY',
  'ARVAN_ACCESS_KEY',
  'ARVAN_SECRET_KEY',
  'KV_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KAVENEGAR_API_KEY',
  'KAVENEGAR_SENDER',
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

let missingRequired = []
let missingOptional = []

// بررسی متغیرهای ضروری
required.forEach(key => {
  if (key === 'GOOGLE_API_KEY') {
    if (hasGoogleApiKey()) {
      console.log(`✅ ${key} (or GOOGLE_API_KEY_1..10)`)
    } else {
      console.log(`❌ ${key} - MISSING`)
      missingRequired.push(key)
    }
    return
  }
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

console.log('\n📋 Recommended variables:\n')

recommended.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key}`)
  } else {
    console.log(`⚠️  ${key} - Not set (recommended for production)`)
    missingOptional.push(key)
  }
})

console.log('\n📋 Optional variables:\n')

// بررسی متغیرهای اختیاری
optional.forEach(key => {
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
  missingRequired.forEach(key => console.log(`   - ${key}`))
  console.log('\nPlease set these variables in .env.local')
  process.exit(1)
} else {
  console.log('\n✅ All required environment variables are set!')
  
  if (missingOptional.length > 0) {
    console.log('\n⚠️  Some optional variables are not set:')
    missingOptional.forEach(key => console.log(`   - ${key}`))
    console.log('\nThese are optional but some features may not work.')
  }
  
  console.log('\n🎉 You can start the development server with: npm run dev')
}

