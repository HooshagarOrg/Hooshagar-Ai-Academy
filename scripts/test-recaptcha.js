// =====================================
// 🧪 تست reCAPTCHA Configuration
// =====================================

require('dotenv').config({ path: '.env.local' })

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY

console.log('🔍 بررسی تنظیمات reCAPTCHA...\n')

// Check Site Key
if (!SITE_KEY) {
  console.error('❌ NEXT_PUBLIC_RECAPTCHA_SITE_KEY تنظیم نشده است')
  console.log('   → این کلید باید در .env.local تعریف شود')
  console.log('   → مثال: NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...\n')
} else {
  console.log('✅ Site Key یافت شد')
  console.log(`   ${SITE_KEY.substring(0, 10)}...${SITE_KEY.substring(SITE_KEY.length - 5)}\n`)
}

// Check Secret Key
if (!SECRET_KEY) {
  console.error('❌ RECAPTCHA_SECRET_KEY تنظیم نشده است')
  console.log('   → این کلید باید در .env.local تعریف شود')
  console.log('   → مثال: RECAPTCHA_SECRET_KEY=6Lc...\n')
} else {
  console.log('✅ Secret Key یافت شد')
  console.log(`   ${SECRET_KEY.substring(0, 10)}...${SECRET_KEY.substring(SECRET_KEY.length - 5)}\n`)
}

// Validate format
if (SITE_KEY && !SITE_KEY.startsWith('6L')) {
  console.warn('⚠️  فرمت Site Key معمولاً با 6L شروع می‌شود')
}

if (SECRET_KEY && !SECRET_KEY.startsWith('6L')) {
  console.warn('⚠️  فرمت Secret Key معمولاً با 6L شروع می‌شود')
}

// Summary
console.log('=====================================')
if (SITE_KEY && SECRET_KEY) {
  console.log('✅ تنظیمات reCAPTCHA کامل است!')
  console.log('\n📝 مراحل بعدی:')
  console.log('   1. npm run dev')
  console.log('   2. http://localhost:3000/login')
  console.log('   3. تست ورود و بررسی Console')
} else {
  console.log('❌ تنظیمات ناقص است')
  console.log('\n📝 مراحل لازم:')
  console.log('   1. دریافت Keys از: https://www.google.com/recaptcha/admin')
  console.log('   2. افزودن به .env.local')
  console.log('   3. اجرای مجدد این اسکریپت: npm run test:recaptcha')
}
console.log('=====================================\n')







