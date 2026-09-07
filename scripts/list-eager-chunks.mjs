/**
 * List JS chunks mapped to / and /login from the Next.js build manifest.
 * Run after `ANALYZE=true pnpm build` (or any production build).
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const nextDir = join(root, '.next')
const appManifestPath = join(nextDir, 'app-build-manifest.json')
const buildManifestPath = join(nextDir, 'build-manifest.json')

function kb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10
}

function fileSize(rel) {
  const abs = join(nextDir, rel.replace(/^\//, ''))
  const staticAbs = join(nextDir, 'static', rel.replace(/^static\//, ''))
  const candidates = [abs, join(root, rel), staticAbs, join(nextDir, rel)]
  for (const p of candidates) {
    if (existsSync(p) && statSync(p).isFile()) return statSync(p).size
  }
  return 0
}

function resolveChunk(file) {
  const rel = file.startsWith('static/') ? file : `static/${file.replace(/^\//, '')}`
  const abs = join(nextDir, rel)
  if (existsSync(abs)) return { rel, bytes: statSync(abs).size }
  const alt = join(nextDir, file)
  if (existsSync(alt)) return { rel: file, bytes: statSync(alt).size }
  return { rel: file, bytes: 0 }
}

function printRoute(label, files) {
  const unique = [...new Set(files)]
  const rows = unique
    .filter((f) => f.endsWith('.js'))
    .map((f) => resolveChunk(f))
    .sort((a, b) => b.bytes - a.bytes)

  const eagerHeavy = rows.filter((r) => r.bytes > 100 * 1024)
  const total = rows.reduce((s, r) => s + r.bytes, 0)

  console.log(`\n=== ${label} (${rows.length} js files, ${kb(total)} KB) ===`)
  for (const r of rows.slice(0, 25)) {
    const flag = r.bytes > 100 * 1024 ? '  >100KB' : ''
    console.log(`  ${kb(r.bytes).toString().padStart(8)} KB  ${r.rel}${flag}`)
  }
  if (eagerHeavy.length) {
    console.log(`  heavy (>100KB): ${eagerHeavy.length}`)
  }
}

if (!existsSync(appManifestPath) && !existsSync(buildManifestPath)) {
  console.error('No .next manifests. Run a production build first.')
  process.exit(1)
}

if (existsSync(appManifestPath)) {
  const app = JSON.parse(readFileSync(appManifestPath, 'utf8'))
  const pages = app.pages ?? {}
  printRoute('/', pages['/page'] ?? pages['/'] ?? [])
  printRoute('/login', pages['/(auth)/login/page'] ?? pages['/login/page'] ?? [])
  const keys = Object.keys(pages)
  const homeKey = keys.find((k) => k === '/page' || k.endsWith('/page') && k.replace(/\\/g, '/') === '/page')
  const loginKey = keys.find((k) => k.includes('login/page'))
  if (homeKey && !(pages['/page'] || pages['/'])) printRoute(homeKey, pages[homeKey])
  if (loginKey) printRoute(loginKey, pages[loginKey])
}

if (existsSync(buildManifestPath)) {
  const build = JSON.parse(readFileSync(buildManifestPath, 'utf8'))
  printRoute('pages/_app (shared)', build.pages?.['/_app'] ?? [])
}
