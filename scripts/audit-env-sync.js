/**
 * مقایسه نام envهای محلی با Vercel (بدون نمایش مقدار)
 * Usage: node scripts/audit-env-sync.js
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

function keysFromEnvFile() {
  const content = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  const keys = []
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    if (m) keys.push(m[1])
  }
  return [...new Set(keys)].sort()
}

function getVercelKeys(env) {
  const out = execSync(`vercel env ls ${env}`, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  })
  const keys = new Set()
  for (const line of out.split('\n')) {
    const m = line.match(/^\s+([A-Z0-9_]+)\s+/)
    if (m) keys.add(m[1])
  }
  return keys
}

const localKeys = keysFromEnvFile()
const vercelProd = getVercelKeys('production')
const vercelPreview = getVercelKeys('preview')

const missingProd = localKeys.filter((k) => process.env[k]?.trim() && !vercelProd.has(k))
const missingPreview = localKeys.filter((k) => process.env[k]?.trim() && !vercelPreview.has(k))

console.log(`=== Env audit ===`)
console.log(`Lines in .env.local file: ~${fs.readFileSync(path.join(__dirname,'..','.env.local'),'utf8').split('\n').length}`)
console.log(`Unique keys in .env.local: ${localKeys.length}`)
console.log(`Keys on Vercel production: ${vercelProd.size}`)
console.log(`Keys on Vercel preview: ${vercelPreview.size}\n`)

if (missingProd.length) {
  console.log('Missing on production (have local value):')
  missingProd.forEach((k) => console.log(`  - ${k}`))
} else {
  console.log('All local keys with values exist on Vercel production.')
}

if (missingPreview.length) {
  console.log('\nMissing on preview (have local value):')
  missingPreview.forEach((k) => console.log(`  - ${k}`))
}
