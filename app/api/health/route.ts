import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Health Check Endpoint
 * 
 * بررسی وضعیت سلامت سیستم و اتصال به Database
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // چک کردن Supabase Connection
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (dbError) throw new Error(`Database error: ${dbError.message}`);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up'
      },
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'down',
        api: 'up'
      },
      responseTime: `${responseTime}ms`
    }, { status: 503 });
  }
}
