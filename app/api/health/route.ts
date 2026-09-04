import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type DbStatus = 'ok' | 'error'
type HealthStatus = 'ok' | 'error'

function appVersion(): string {
  return process.env.npm_package_version || '1.0.0'
}

function healthBody(
  db: DbStatus,
  responseTime: string
): {
  status: HealthStatus
  timestamp: string
  db: DbStatus
  version: string
  services: { database: 'up' | 'down'; api: 'up' }
  responseTime: string
  environment: string
} {
  const ok = db === 'ok'
  return {
    status: ok ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    db,
    version: appVersion(),
    services: {
      database: ok ? 'up' : 'down',
      api: 'up',
    },
    responseTime,
    environment: process.env.NODE_ENV || 'development',
  }
}

async function checkDatabase(): Promise<DbStatus> {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return error ? 'error' : 'ok'
  } catch {
    return 'error'
  }
}

function noStoreHeaders(): HeadersInit {
  return { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
}

/**
 * GET /api/health
 * Liveness + database probe. Does not leak database error details.
 */
export async function GET(): Promise<NextResponse> {
  const started = Date.now()
  const db = await checkDatabase()
  const responseTime = `${Date.now() - started}ms`
  const ok = db === 'ok'

  return NextResponse.json(healthBody(db, responseTime), {
    status: ok ? 200 : 503,
    headers: noStoreHeaders(),
  })
}

export async function HEAD(): Promise<NextResponse> {
  const db = await checkDatabase()
  return new NextResponse(null, {
    status: db === 'ok' ? 200 : 503,
    headers: noStoreHeaders(),
  })
}
