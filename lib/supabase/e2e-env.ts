import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

/**
 * Next.js always hydrates `.env.local` (production). When the E2E server is
 * started with HOOSHAGAR_E2E=1, re-apply `.env.test` at runtime on Node.
 * Do not import this from Edge middleware.
 */
export function applyE2eTestEnv(): void {
  if (process.env.HOOSHAGAR_E2E !== '1') return
  const file = path.join(process.cwd(), '.env.test')
  if (!fs.existsSync(file)) return
  const parsed = dotenv.parse(fs.readFileSync(file))
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value
  }
  process.env.APP_ENV = 'test'
  process.env.HOOSHAGAR_E2E = '1'
  process.env.SUPABASE_SERVER_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  process.env.NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3000'
  delete process.env.NEXT_PUBLIC_SUPABASE_PROXY
}
