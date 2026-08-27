/**
 * k6 smoke — سبک برای CI و تأیید سریع staging
 *
 * env:
 *   BASE_URL   پیش‌فرض http://localhost:3000
 *   AUTH_COOKIE  کوکی session اختیاری (اگر نباشد فقط health چک می‌شود)
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
}

const BASE = __ENV.BASE_URL || 'http://localhost:3000'
const cookie = __ENV.AUTH_COOKIE || ''

function headers() {
  const h = { Accept: 'application/json' }
  if (cookie) h.Cookie = cookie
  return h
}

export default function () {
  const health = http.get(`${BASE}/api/health`, { headers: headers() })
  check(health, {
    'health status 200': (r) => r.status === 200,
  })

  if (cookie) {
    const unread = http.get(`${BASE}/api/notifications/unread-count`, {
      headers: headers(),
    })
    check(unread, {
      'unread not 5xx': (r) => r.status < 500,
    })
  }

  sleep(1)
}
