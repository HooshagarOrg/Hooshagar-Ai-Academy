import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ready
 * آماده‌بودن پروسه Next برای E2E / load balancer — بدون وابستگی به Database
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ready: true,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
