import { NextResponse } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import LandingBelowFold from '@/components/landing/landing-rest'

export const dynamic = 'force-static'
export const revalidate = 86400

/** HTML زیرِ هیرو — جدا از RSC لندینگ تا payload صفحهٔ / کوچک بماند. */
export function GET(): NextResponse {
  const html = renderToStaticMarkup(<LandingBelowFold />)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
