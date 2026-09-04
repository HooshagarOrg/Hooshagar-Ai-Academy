// Deprecated entrypoint — canonical checker is scripts/verify-env.ts
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const result = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--no-warnings',
    path.join(__dirname, 'verify-env.ts'),
  ],
  { stdio: 'inherit', cwd: path.join(__dirname, '..') }
)

process.exit(result.status === null ? 1 : result.status)
