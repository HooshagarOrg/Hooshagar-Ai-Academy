// بررسی تمام environment variables مورد نیاز
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_API_KEY',
]

const optional = [
  'OPENROUTER_API_KEY',
  'ARVAN_ACCESS_KEY',
  'ARVAN_SECRET_KEY',
  'KV_URL',
  'KAVENEGAR_API_KEY',
]

console.log('🔍 Verifying environment variables...\n')

let missingRequired = []
let missingOptional = []

// بررسی متغیرهای ضروری
required.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key}`)
  } else {
    console.log(`❌ ${key} - MISSING`)
    missingRequired.push(key)
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

