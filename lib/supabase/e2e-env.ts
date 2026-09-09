import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

/**
 * Next.js always hydrates `.env.local` (production). When the E2E server is
 * started with HOOSHAGAR_E2E=1, re-apply `.env.test` at runtime on Node.
 * Do not import this from Edge middleware.
 *
 * Never write `process.env.NEXT_PUBLIC_*` (dot or bracket). Next replaces
 * those identifiers with string literals at build time, which turns
 * assignment into invalid JavaScript on Vercel.
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
  const supabaseUrl = parsed.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    process.env.SUPABASE_SERVER_URL = supabaseUrl
  }
  if (!Object.prototype.hasOwnProperty.call(parsed, 'NEXT_PUBLIC_SUPABASE_PROXY')) {
    Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_SUPABASE_PROXY')
  }
}
