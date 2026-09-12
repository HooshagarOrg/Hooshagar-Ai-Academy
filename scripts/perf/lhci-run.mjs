/**
 * Run Lighthouse CI against a running Next server on 127.0.0.1:3000.
 * Optional auth: E2E_STAFF_USERNAME/E2E_STAFF_PASSWORD and
 * E2E_STUDENT_NUMBER/E2E_STUDENT_PIN — otherwise dashboard URLs redirect to login.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ORIGIN = (
  process.env.LHCI_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1:3000'
).replace(/\/$/, '')
const OUT_DIR = path.join('.lighthouseci')

function parseCookies(setCookieHeaders) {
  const cookies = []
  for (const header of setCookieHeaders) {
    const pair = String(header).split(';')[0] ?? ''
    const eq = pair.indexOf('=')
    if (eq < 1) continue
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    if (name.startsWith('sb-') || name.includes('auth')) {
      cookies.push(`${name}=${value}`)
    }
  }
  return cookies
}

async function loginCookies(payload) {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const raw = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean)
  const cookies = parseCookies(raw)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Login failed (${res.status}): ${body.slice(0, 240)}`)
  }
  if (cookies.length === 0) {
    throw new Error('Login succeeded but no auth cookies were returned')
  }
  return cookies.join('; ')
}

async function runLhci(label, extraHeaders) {
  const args = [
    'lhci',
    'autorun',
    '--config=./lighthouserc.cjs',
    `--collect.url=${ORIGIN}/`,
    `--collect.url=${ORIGIN}/login`,
  ]
  if (label === 'student') {
    args.push(`--collect.url=${ORIGIN}/student`)
  } else if (label === 'teacher') {
    args.push(`--collect.url=${ORIGIN}/teacher`)
  }
  if (extraHeaders) {
    args.push(`--collect.settings.extraHeaders=${JSON.stringify({ Cookie: extraHeaders })}`)
  }

  await mkdir(OUT_DIR, { recursive: true })
  console.log(`\n=== Lighthouse (${label}) ===`)
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--yes', '@lhci/cli@0.15.1', ...args.slice(1)],
    { stdio: 'inherit', shell: true, env: process.env },
  )
  const code = await new Promise((resolve) => child.on('exit', resolve))
  await writeFile(
    path.join(OUT_DIR, `${label}-exit.txt`),
    String(code ?? 1),
    'utf8',
  )
  return code ?? 1
}

async function main() {
  console.log(`Lighthouse target: ${ORIGIN}`)
  const health = await fetch(`${ORIGIN}/login`, { signal: AbortSignal.timeout(60_000) }).catch(
    (error) => {
      console.warn('Preflight fetch failed (continuing; Chrome may still work):', error?.cause?.code || error?.message || error)
      return null
    },
  )
  if (health && !health.ok && health.status !== 307) {
    throw new Error(`Server is not reachable at ${ORIGIN} (HTTP ${health.status}). Start it with pnpm start.`)
  }
  if (!health && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(ORIGIN)) {
    console.warn('Skipping hard preflight failure for remote target')
  } else if (!health) {
    throw new Error(`Server is not reachable at ${ORIGIN}. Start it with pnpm start.`)
  }

  let worst = await runLhci('public')

  const studentNumber = process.env.E2E_STUDENT_NUMBER
  const studentPin = process.env.E2E_STUDENT_PIN
  if (studentNumber && studentPin) {
    try {
      const cookie = await loginCookies({
        method: 'student_pin',
        student_number: studentNumber,
        pin: studentPin,
      })
      worst = Math.max(worst, await runLhci('student', cookie))
    } catch (error) {
      console.warn('Student dashboard Lighthouse skipped:', error instanceof Error ? error.message : error)
    }
  } else {
    console.warn('Student dashboard Lighthouse skipped: set E2E_STUDENT_NUMBER and E2E_STUDENT_PIN')
  }

  const staffUser = process.env.E2E_STAFF_USERNAME
  const staffPass = process.env.E2E_STAFF_PASSWORD
  if (staffUser && staffPass) {
    try {
      const cookie = await loginCookies({
        method: 'staff',
        username: staffUser,
        password: staffPass,
      })
      worst = Math.max(worst, await runLhci('teacher', cookie))
    } catch (error) {
      console.warn('Teacher dashboard Lighthouse skipped:', error instanceof Error ? error.message : error)
    }
  } else {
    console.warn('Teacher dashboard Lighthouse skipped: set E2E_STAFF_USERNAME and E2E_STAFF_PASSWORD')
  }

  process.exit(worst)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
