/**
 * هم‌تراز کردن رمز Auth دانش‌آموز تستی با الگوی hg_student_{uid12}_{pin}
 * استفاده: node scripts/fix-test-student-auth.js
 */
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const STUDENT_NUMBER = 'TEST1403001'
const PIN = '1234'

function buildAuthPassword(userId, secret) {
  const uid = userId.replace(/-/g, '').slice(0, 12)
  return `hg_student_${uid}_${secret}`
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_PROXY || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('❌ SUPABASE URL یا SERVICE_ROLE_KEY در .env.local نیست')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: student, error } = await admin
    .from('students')
    .select('id, user_id, full_name, student_number, pin_hash, can_login, profiles!user_id(email, role)')
    .eq('student_number', STUDENT_NUMBER)
    .maybeSingle()

  if (error) {
    console.error('❌ خطای جستجو:', error.message)
    process.exit(1)
  }

  if (!student) {
    console.error(`❌ دانش‌آموز ${STUDENT_NUMBER} یافت نشد. ابتدا node scripts/create-test-student.js را اجرا کنید.`)
    process.exit(1)
  }

  if (!student.user_id) {
    console.error('❌ user_id برای این دانش‌آموز تنظیم نشده')
    process.exit(1)
  }

  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
  if (!profile?.email) {
    console.error('❌ پروفایل یا ایمیل یافت نشد')
    process.exit(1)
  }

  const pinHash = Buffer.from(PIN).toString('base64')
  const authPassword = buildAuthPassword(student.user_id, PIN)

  await admin
    .from('students')
    .update({ pin_hash: pinHash, can_login: true, status: 'active' })
    .eq('id', student.id)

  const { error: authError } = await admin.auth.admin.updateUserById(student.user_id, {
    password: authPassword,
    email_confirm: true,
  })

  if (authError) {
    console.error('❌ خطا در به‌روزرسانی Auth:', authError.message)
    process.exit(1)
  }

  console.log('✅ رمز Auth هم‌تراز شد')
  console.log('کد دانش‌آموزی:', STUDENT_NUMBER)
  console.log('PIN:', PIN)
  console.log('ایمیل:', profile.email)
  console.log('Auth password pattern: hg_student_{uid12}_{pin}')
  console.log('ورود: http://localhost:3001/login → تب دانش‌آموز')
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
