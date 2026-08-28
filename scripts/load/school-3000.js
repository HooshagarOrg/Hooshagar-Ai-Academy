/**
 * مدل مدرسه ~۳۰۰۰ دانش‌آموز روی Production
 *
 * ۳۰۰۰ VU همزمان نمی‌زنیم (Hobby را می‌خواباند). به‌جای آن ۳۰۰۰ بازدید
 * معادل (هر کدام health + صفحه ورود) با سقف ۲۵ کاربر همزمان اجرا می‌شود.
 * پیک ۵۰۰ همزمان فقط روی staging با K6_PROFILE=peak.
 *
 * env:
 *   BASE_URL     پیش‌فرض https://www.hooshagar.ir
 *   K6_RESOLVE_IP  اختیاری؛ IP اگر DNS محلی دامنه را نمی‌بیند
 *   K6_PROFILE   production (پیش‌فرض) | peak
 *
 * روی Production، فایروال Vercel کلاینت Goِ k6 را با ۴۰۳ چالش می‌بندد.
 * برای عدد واقعی از scripts/load/run-school-3000-curl.ps1 استفاده کنید.
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

const profile = __ENV.K6_PROFILE || 'production'
const resolveIp = __ENV.K6_RESOLVE_IP || ''
const hosts = resolveIp
  ? { 'www.hooshagar.ir': resolveIp, 'hooshagar.ir': resolveIp }
  : {}

const thresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<2000'],
}

export const options =
  profile === 'peak'
    ? {
        hosts,
        stages: [
          { duration: '2m', target: 100 },
          { duration: '3m', target: 500 },
          { duration: '2m', target: 0 },
        ],
        thresholds,
      }
    : {
        hosts,
        scenarios: {
          school_3000_visits: {
            executor: 'shared-iterations',
            vus: 25,
            iterations: 3000,
            maxDuration: '50m',
          },
        },
        thresholds,
      }

const BASE = __ENV.BASE_URL || 'https://www.hooshagar.ir'

export default function () {
  const health = http.get(`${BASE}/api/health`, {
    headers: { Accept: 'application/json' },
    tags: { name: 'health' },
  })
  check(health, {
    'health 200': (r) => r.status === 200,
  })

  const login = http.get(`${BASE}/login`, {
    headers: { Accept: 'text/html' },
    tags: { name: 'login' },
  })
  check(login, {
    'login 2xx': (r) => r.status >= 200 && r.status < 300,
  })

  sleep(0.4)
}
