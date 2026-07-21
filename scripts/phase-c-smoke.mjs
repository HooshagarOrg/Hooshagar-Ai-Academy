/**
 * Phase C smoke checks against production (no secrets required).
 * Usage: node scripts/phase-c-smoke.mjs
 * Optional: SMOKE_BASE_URL=https://www.hooshagar.ir
 */

const BASE = (process.env.SMOKE_BASE_URL || 'https://www.hooshagar.ir').replace(
  /\/$/,
  ''
)

const checks = [
  { name: 'health', path: '/api/health', expectStatus: 200, expectJsonKey: 'status' },
  { name: 'login-page', path: '/login', expectStatus: 200 },
  { name: 'home', path: '/', expectStatus: 200 },
]

async function runCheck(check) {
  const url = `${BASE}${check.path}`
  const started = Date.now()
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { Accept: 'application/json, text/html,*/*' },
  })
  const ms = Date.now() - started
  const okStatus = res.status === check.expectStatus

  let okBody = true
  let detail = `status=${res.status} ${ms}ms`

  if (check.expectJsonKey) {
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      okBody = Boolean(json && json[check.expectJsonKey])
      detail += ` ${check.expectJsonKey}=${json[check.expectJsonKey]}`
    } catch {
      okBody = false
      detail += ' (invalid JSON)'
    }
  }

  const pass = okStatus && okBody
  console.log(`${pass ? '✅' : '❌'} ${check.name} — ${url} — ${detail}`)
  return pass
}

async function main() {
  console.log(`Phase C smoke — ${BASE}\n`)
  const results = []
  for (const check of checks) {
    try {
      results.push(await runCheck(check))
    } catch (err) {
      console.log(`❌ ${check.name} — ${err instanceof Error ? err.message : String(err)}`)
      results.push(false)
    }
  }

  const failed = results.filter((r) => !r).length
  console.log('\n' + '='.repeat(40))
  if (failed > 0) {
    console.log(`❌ ${failed} check(s) failed`)
    process.exit(1)
  }
  console.log('✅ All smoke checks passed')
}

main()
