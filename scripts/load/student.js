/**
 * k6 — سناریوی دانش‌آموز: داشبورد + XP + آزمون‌ها
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
const cookie = __ENV.STUDENT_COOKIE || __ENV.AUTH_COOKIE || ''

function headers() {
  return {
    Accept: 'application/json',
    Cookie: cookie,
  }
}

export default function () {
  if (!cookie) {
    console.error('STUDENT_COOKIE یا AUTH_COOKIE لازم است')
    return
  }

  const dash = http.get(`${BASE}/api/student/dashboard`, { headers: headers() })
  check(dash, { 'student dashboard ok': (r) => r.status < 500 })

  const xp = http.get(`${BASE}/api/xp/balance`, { headers: headers() })
  check(xp, { 'xp balance ok': (r) => r.status < 500 })

  const exams = http.get(`${BASE}/api/exams?limit=20`, { headers: headers() })
  check(exams, { 'exams list ok': (r) => r.status < 500 })

  sleep(2)
}
