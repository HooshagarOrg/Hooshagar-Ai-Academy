import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log monitoring event
    logger.warn({
      type: body.type,
      duration: body.duration,
      timestamp: body.timestamp,
    }, 'Performance monitoring event');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Monitoring logging failed');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}





