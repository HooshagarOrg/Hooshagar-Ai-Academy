import { spawn } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

process.env.ANALYZE = 'true'
process.env.SKIP_SENTRY_BUILD = '1'

const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: process.env,
  shell: false,
})

child.on('exit', async (code) => {
  const chunksDir = path.join('.next', 'static', 'chunks')
  try {
    const files = await collectJs(chunksDir)
    const large = files
      .filter((file) => file.bytes > 100 * 1024)
      .sort((a, b) => b.bytes - a.bytes)
    console.log('\nChunks over 100KB:')
    for (const file of large) {
      console.log(`  ${(file.bytes / 1024).toFixed(1)} KB  ${file.rel}`)
    }
  } catch (error) {
    console.warn('Could not list chunks:', error instanceof Error ? error.message : error)
  }
  process.exit(code ?? 1)
})

async function collectJs(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectJs(full, acc)
      continue
    }
    if (!entry.name.endsWith('.js')) continue
    const info = await stat(full)
    acc.push({ rel: path.relative('.next', full), bytes: info.size })
  }
  return acc
}
