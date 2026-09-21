/**
 * Ensure stable LHCI/E2E login accounts on hooshagar-test.
 * Idempotent: creates or resets password/PIN for fixed usernames.
 *
 * Env:
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_TEST_SERVICE_ROLE_KEY)
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_TEST_URL / SUPABASE_SERVER_URL)
 * Optional overrides (also used as the GitHub Actions secret values):
 *   E2E_STAFF_USERNAME, E2E_STAFF_PASSWORD
 *   E2E_STUDENT_NUMBER, E2E_STUDENT_PIN
 */
import { createClient } from '@supabase/supabase-js'
import { randomBytes, scryptSync } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const STAFF_USERNAME = (process.env.E2E_STAFF_USERNAME || 'lhci_teacher').toLowerCase()
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD || 'TestPass123!hooshagar'
const STUDENT_NUMBER = process.env.E2E_STUDENT_NUMBER || '9912345678'
const STUDENT_PIN = process.env.E2E_STUDENT_PIN || '1234'

const STAFF_EMAIL = 'lhci-teacher@hooshagar-test.local'
const STUDENT_EMAIL = 'lhci-student@hooshagar-test.local'
const SCHOOL_MARKER = 'LHCI Stable School'

function requireEnv(name, ...alts) {
  for (const key of [name, ...alts]) {
    const v = process.env[key]
    if (v && v.trim()) return v.trim()
  }
  throw new Error(`Missing env: ${name}`)
}

function hashPin(pin) {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1 })
  return [
    'scrypt',
    '16384',
    '8',
    '1',
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$')
}

function buildAuthPassword(userId, secret, prefix) {
  const uid = userId.replace(/-/g, '').slice(0, 12)
  return `Hg_${prefix}_${uid}_${secret}!9`
}

async function ensureSchool(admin) {
  const { data: existing } = await admin
    .from('schools')
    .select('id, name')
    .eq('name', SCHOOL_MARKER)
    .maybeSingle()
  if (existing?.id) return existing.id

  const payload = {
    name: SCHOOL_MARKER,
    is_active: true,
    status: 'active',
  }
  let { data, error } = await admin.from('schools').insert(payload).select('id').single()
  if (error && /column/i.test(error.message)) {
    delete payload.status
    ;({ data, error } = await admin.from('schools').insert(payload).select('id').single())
  }
  if (error && /column/i.test(error.message)) {
    delete payload.is_active
    ;({ data, error } = await admin.from('schools').insert({ name: SCHOOL_MARKER }).select('id').single())
  }
  if (error || !data?.id) {
    throw new Error(`ensureSchool failed: ${error?.message ?? 'unknown'}`)
  }
  return data.id
}

async function findAuthUserByEmail(admin, email) {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (profile?.id) {
    const { data, error } = await admin.auth.admin.getUserById(profile.id)
    if (!error && data?.user) return data.user
  }

  // Fallback: scan first pages (rare — profile missing)
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 200) break
  }
  return null
}

async function ensureAuthUser(admin, { email, password, role, schoolId, fullName }) {
  const existing = await findAuthUserByEmail(admin, email)
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { role, school_id: schoolId },
      user_metadata: { full_name: fullName, role },
    })
    if (error) throw new Error(`updateUser ${email}: ${error.message}`)
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, school_id: schoolId },
    user_metadata: { full_name: fullName, role },
  })
  if (error || !data.user) {
    throw new Error(`createUser ${email}: ${error?.message ?? 'unknown'}`)
  }
  return data.user.id
}

async function upsertProfile(admin, payload) {
  const attempt = { ...payload }
  for (let i = 0; i < 8; i += 1) {
    const { error } = await admin.from('profiles').upsert(attempt, { onConflict: 'id' })
    if (!error) return
    const missing =
      error.message.match(/column "([^"]+)"/i)?.[1] ??
      error.message.match(/Could not find the '([^']+)' column/i)?.[1]
    if (missing && missing in attempt) {
      delete attempt[missing]
      continue
    }
    throw new Error(`upsert profile failed: ${error.message}`)
  }
}

async function ensureTeacher(admin, schoolId) {
  const userId = await ensureAuthUser(admin, {
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    role: 'teacher',
    schoolId,
    fullName: 'معلم LHCI',
  })

  await upsertProfile(admin, {
    id: userId,
    email: STAFF_EMAIL,
    full_name: 'معلم LHCI',
    role: 'teacher',
    school_id: schoolId,
    username: STAFF_USERNAME,
    is_staff: true,
    must_change_password: false,
  })

  return { username: STAFF_USERNAME, password: STAFF_PASSWORD, userId }
}

async function ensureStudent(admin, schoolId) {
  const pinHash = hashPin(STUDENT_PIN)
  // Auth password for students is derived from PIN after login; initial password can be anything strong
  const provisionalPassword = STAFF_PASSWORD

  const userId = await ensureAuthUser(admin, {
    email: STUDENT_EMAIL,
    password: provisionalPassword,
    role: 'student',
    schoolId,
    fullName: 'دانش‌آموز LHCI',
  })

  // Align auth password with student_pin login derivation
  const authPassword = buildAuthPassword(userId, STUDENT_PIN, 'student')
  const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
    password: authPassword,
  })
  if (pwError) throw new Error(`student password sync: ${pwError.message}`)

  await upsertProfile(admin, {
    id: userId,
    email: STUDENT_EMAIL,
    full_name: 'دانش‌آموز LHCI',
    role: 'student',
    school_id: schoolId,
    must_change_password: false,
    is_staff: false,
  })

  const { data: existingStudent } = await admin
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingStudent?.id) {
    const { error } = await admin
      .from('students')
      .update({
        student_number: STUDENT_NUMBER,
        pin_hash: pinHash,
        can_login: true,
        school_id: schoolId,
        full_name: 'دانش‌آموز LHCI',
        status: 'active',
        is_active: true,
        grade: 6,
      })
      .eq('id', existingStudent.id)
    if (error) throw new Error(`update student: ${error.message}`)
  } else {
    const insertPayload = {
      user_id: userId,
      school_id: schoolId,
      student_number: STUDENT_NUMBER,
      pin_hash: pinHash,
      can_login: true,
      full_name: 'دانش‌آموز LHCI',
      status: 'active',
      is_active: true,
      grade: 6,
      student_code: 'LHCI0001',
    }
    let { error } = await admin.from('students').insert(insertPayload)
    if (error && /column/i.test(error.message)) {
      delete insertPayload.student_code
      ;({ error } = await admin.from('students').insert(insertPayload))
    }
    if (error) throw new Error(`insert student: ${error.message}`)
  }

  return { studentNumber: STUDENT_NUMBER, pin: STUDENT_PIN, userId }
}

async function main() {
  const url = requireEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_TEST_URL',
    'SUPABASE_SERVER_URL',
  )
  const key = requireEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_TEST_SERVICE_ROLE_KEY',
  )
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const schoolId = await ensureSchool(admin)
  const teacher = await ensureTeacher(admin, schoolId)
  const student = await ensureStudent(admin, schoolId)

  const summary = {
    schoolId,
    E2E_STAFF_USERNAME: teacher.username,
    E2E_STAFF_PASSWORD: '(set)',
    E2E_STUDENT_NUMBER: student.studentNumber,
    E2E_STUDENT_PIN: '(set)',
  }
  console.log('LHCI accounts ready:', JSON.stringify(summary))

  if (process.env.GITHUB_ENV) {
    const lines = [
      `E2E_STAFF_USERNAME=${teacher.username}`,
      `E2E_STAFF_PASSWORD=${STAFF_PASSWORD}`,
      `E2E_STUDENT_NUMBER=${student.studentNumber}`,
      `E2E_STUDENT_PIN=${STUDENT_PIN}`,
    ].join('\n')
    writeFileSync(process.env.GITHUB_ENV, `${lines}\n`, { flag: 'a' })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
