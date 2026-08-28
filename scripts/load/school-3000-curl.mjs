/**
 * ۳۰۰۰ بازدید معادل روی Production با curl.exe (Schannel).
 * k6/Go را فایروال Vercel با ۴۰۳ می‌بندد؛ هر درخواست یک فرآیند curl است.
 *
 *   node scripts/load/school-3000-curl.mjs
 *
 * env: BASE_URL, K6_RESOLVE_IP, ITERATIONS, PARALLEL_MAX
 */
import { spawn } from 'node:child_process'
import { hostname as osHostname } from 'node:os'

const BASE = process.env.BASE_URL || 'https://www.hooshagar.ir'
const RESOLVE_IP = process.env.K6_RESOLVE_IP || '64.29.17.1'
const ITERATIONS = Number(process.env.ITERATIONS || 3000)
const PARALLEL_MAX = Number(process.env.PARALLEL_MAX || 15)
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const host = new URL(BASE).hostname

function percentile(sorted, p) {
  if (sorted.length === 0) return null
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p))
  return sorted[idx]
}

function curlGet(url) {
  return new Promise((resolve) => {
    const args = [
      '--resolve',
      `${host}:443:${RESOLVE_IP}`,
      '-A',
      UA,
      '-sS',
      '-o',
      'NUL',
      '--max-time',
      '25',
      '--retry',
      '1',
      '--retry-delay',
      '1',
      '-w',
      '%{http_code} %{time_total}',
      url,
    ]
    const child = spawn('curl.exe', args, { windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })
    child.on('error', (err) => {
      resolve({ status: 0, seconds: 0, url, error: err.message })
    })
    child.on('close', () => {
      const match = stdout.trim().match(/^(\d{3}|000) (\d+(?:\.\d+)?)$/)
      if (!match) {
        resolve({ status: 0, seconds: 0, url, error: stderr.trim() || stdout.trim() })
        return
      }
      resolve({
        status: Number(match[1]),
        seconds: Number(match[2]),
        url,
        error: stderr.trim(),
      })
    })
  })
}

async function pool(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (true) {
      const i = next
      next += 1
      if (i >= items.length) return
      results[i] = await worker(items[i], i)
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run())
  await Promise.all(runners)
  return results
}

const urls = []
for (let i = 0; i < ITERATIONS; i += 1) {
  urls.push(`${BASE}/api/health`)
  urls.push(`${BASE}/login`)
}

console.error(
  `school-3000-curl host=${osHostname()} iters=${ITERATIONS} parallel=${PARALLEL_MAX} resolve=${RESOLVE_IP}`
)
const started = Date.now()
const parsed = await pool(urls, PARALLEL_MAX, (url) => curlGet(url))
const wallSeconds = (Date.now() - started) / 1000

const is2xx = (row) => row.status >= 200 && row.status < 300
const health = parsed.filter((row) => row.url.includes('/api/health'))
const login = parsed.filter((row) => row.url.endsWith('/login'))
const ok = parsed.filter(is2xx)
const allTimes = parsed.map((row) => row.seconds).sort((a, b) => a - b)
const okTimes = ok.map((row) => row.seconds).sort((a, b) => a - b)
const statusCounts = {}
for (const row of parsed) {
  const key = String(row.status)
  statusCounts[key] = (statusCounts[key] || 0) + 1
}

const summary = {
  tool: 'curl.exe',
  runner: 'school-3000-curl.mjs',
  iterations_requested: ITERATIONS,
  requests: parsed.length,
  wall_seconds: Math.round(wallSeconds * 10) / 10,
  parallel_max: PARALLEL_MAX,
  health_2xx: health.filter(is2xx).length,
  health_total: health.length,
  login_2xx: login.filter(is2xx).length,
  login_total: login.length,
  http_req_failed_rate: parsed.length ? Math.round((1 - ok.length / parsed.length) * 1e6) / 1e6 : 1,
  p95_seconds_all: percentile(allTimes, 0.95),
  p95_seconds_2xx: percentile(okTimes, 0.95),
  avg_seconds:
    allTimes.length === 0 ? null : Math.round((allTimes.reduce((a, b) => a + b, 0) / allTimes.length) * 1e4) / 1e4,
  status_counts: statusCounts,
}

console.log(JSON.stringify(summary, null, 2))
