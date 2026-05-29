import fs from 'fs'
import path from 'path'

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p, acc)
    else if (f === 'route.ts') acc.push(p)
  }
  return acc
}

function categorize(p) {
  if (p.startsWith('/api/auth')) return 'auth'
  if (p.startsWith('/api/admin')) return 'admin'
  if (p.startsWith('/api/platform-admin')) return 'admin'
  if (p.startsWith('/api/ai')) return 'ai'
  if (p.startsWith('/api/student')) return 'student'
  if (p.startsWith('/api/parent')) return 'parent'
  if (p.startsWith('/api/teacher')) return 'teacher'
  if (p.startsWith('/api/exams')) return 'exams'
  if (p.startsWith('/api/surveys')) return 'surveys'
  if (p.startsWith('/api/counseling')) return 'counseling'
  if (p.startsWith('/api/notifications')) return 'notifications'
  if (p.startsWith('/api/reports')) return 'reports'
  if (p.startsWith('/api/lottery')) return 'lottery'
  if (p.startsWith('/api/health')) return 'health'
  if (
    p.startsWith('/api/xp') ||
    p.startsWith('/api/badges') ||
    p.startsWith('/api/streak') ||
    p.startsWith('/api/shop') ||
    p.startsWith('/api/leaderboard') ||
    p.startsWith('/api/gamification')
  )
    return 'gamification'
  return 'other'
}

const rows = []
for (const file of walk('app/api').sort()) {
  const c = fs.readFileSync(file, 'utf8')
  const rel = '/api' + file.replace(/\\/g, '/').replace('app/api', '').replace('/route.ts', '')
  const methods = [...c.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1])
  if (methods.length) rows.push({ rel, methods: methods.join(', ') })
}

const by = {}
for (const r of rows) {
  const k = categorize(r.rel)
  ;(by[k] ||= []).push(r)
}

for (const k of Object.keys(by).sort()) {
  console.log(`##${k}##${by[k].length}`)
  for (const r of by[k]) console.log(`${r.methods}\t${r.rel}`)
}
