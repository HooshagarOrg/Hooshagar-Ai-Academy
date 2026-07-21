/**
 * Upsert school_sms_settings.daily_sms_limit for all schools.
 * Usage: node scripts/set-school-sms-limits.mjs
 *
 * Default limit 1500 — enough for ~1200 weekly parent SMS in one day.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const DAILY_LIMIT = Number(process.env.SMS_DAILY_LIMIT_DEFAULT || 1500)

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: schools, error: schoolsError } = await supabase
  .from('schools')
  .select('id, name')

if (schoolsError) {
  console.error('Failed to list schools:', schoolsError.message)
  process.exit(1)
}

if (!schools?.length) {
  console.log('No schools found.')
  process.exit(0)
}

console.log(`Schools: ${schools.length}; target daily_sms_limit=${DAILY_LIMIT}`)

let ok = 0
let fail = 0

for (const school of schools) {
  const row = {
    school_id: school.id,
    daily_sms_limit: DAILY_LIMIT,
    auto_absence_enabled: false,
    auto_payment_reminder_enabled: false,
    auto_grade_alert_enabled: false,
    auto_payment_confirmation: false,
    auto_check_reminder: false,
  }

  const { error } = await supabase.from('school_sms_settings').upsert(row, {
    onConflict: 'school_id',
  })

  if (error) {
    // اگر بعضی ستون‌ها نبود، حداقل limit را آپدیت کن
    const { error: updateError } = await supabase
      .from('school_sms_settings')
      .update({ daily_sms_limit: DAILY_LIMIT })
      .eq('school_id', school.id)

    if (updateError) {
      const { error: insertError } = await supabase
        .from('school_sms_settings')
        .insert({ school_id: school.id, daily_sms_limit: DAILY_LIMIT })

      if (insertError) {
        console.error(`FAIL ${school.name}:`, error.message, updateError.message, insertError.message)
        fail++
        continue
      }
    }
  }

  console.log(`OK  ${school.name} → ${DAILY_LIMIT}`)
  ok++
}

console.log(`Done. ok=${ok} fail=${fail}`)
process.exit(fail > 0 ? 1 : 0)
