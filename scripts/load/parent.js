/**
 * k6 — سناریوی والد: داشبورد + گزارش‌ها + اعلان
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
}

const BASE = __ENV.BASE_URL || 'http://localhost:3000'
const cookie = __ENV.PARENT_COOKIE || __ENV.AUTH_COOKIE || ''

function headers() {
  return {
    Accept: 'application/json',
    Cookie: cookie,
  }
}

export default function () {
  if (!cookie) {
    console.error('PARENT_COOKIE یا AUTH_COOKIE لازم است')
    return
  }

  const dash = http.get(`${BASE}/api/parent/dashboard`, { headers: headers() })
  check(dash, { 'parent dashboard ok': (r) => r.status < 500 })

  const reports = http.get(`${BASE}/api/reports/list?limit=10`, {
    headers: headers(),
  })
  check(reports, { 'reports list ok': (r) => r.status < 500 })

  const unread = http.get(`${BASE}/api/notifications/unread-count`, {
    headers: headers(),
  })
  check(unread, { 'unread ok': (r) => r.status < 500 })

  sleep(2)
}
