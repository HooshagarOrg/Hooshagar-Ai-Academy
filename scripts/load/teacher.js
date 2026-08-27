/**
 * k6 — سناریوی معلم: داشبورد + حضور + نمرات
 * نیاز: TEACHER_COOKIE یا AUTH_COOKIE
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
const cookie = __ENV.TEACHER_COOKIE || __ENV.AUTH_COOKIE || ''

function headers() {
  return {
    Accept: 'application/json',
    Cookie: cookie,
  }
}

export default function () {
  if (!cookie) {
    console.error('TEACHER_COOKIE یا AUTH_COOKIE لازم است')
    return
  }

  const dash = http.get(`${BASE}/api/teacher/dashboard`, { headers: headers() })
  check(dash, { 'teacher dashboard ok': (r) => r.status === 200 || r.status === 401 })

  const attendance = http.get(`${BASE}/api/attendance?limit=50`, {
    headers: headers(),
  })
  check(attendance, { 'attendance get ok': (r) => r.status < 500 })

  const grades = http.get(`${BASE}/api/grades?limit=50`, { headers: headers() })
  check(grades, { 'grades get ok': (r) => r.status < 500 })

  sleep(2)
}
