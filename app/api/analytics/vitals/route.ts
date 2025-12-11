import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log Web Vitals
    logger.info({
      metric: body.name,
      value: body.value,
      rating: body.rating,
      navigationType: body.navigationType,
    }, 'Web Vitals metric');

    // در Production می‌توانید به Vercel Analytics یا Sentry بفرستید
    // await sendToVercelAnalytics(body);
    // await sendToSentry(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Web Vitals logging failed');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}






