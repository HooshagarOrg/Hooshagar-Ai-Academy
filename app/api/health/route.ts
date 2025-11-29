import { NextResponse } from 'next/server'

/**
 * Health Check API
 * 
 * این endpoint برای بررسی وضعیت سرور استفاده می‌شود.
 * Service Worker و صفحه آفلاین از این endpoint استفاده می‌کنند.
 */

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

