import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard'
import { applyRateLimitAsync } from '@/lib/security/rate-limiter'

const MAX_QR_LENGTH = 500

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimitAsync(request, 'api_default')
  if (rateLimitResponse) return rateLimitResponse

  return withAuth(
    request,
    async () => {
      try {
        const searchParams = request.nextUrl.searchParams
        const data = searchParams.get('data')

        if (!data) {
          return NextResponse.json({ error: 'پارامتر data الزامی است' }, { status: 400 })
        }

        if (data.length > MAX_QR_LENGTH) {
          return NextResponse.json({ error: 'داده بیش از حد مجاز است' }, { status: 400 })
        }

        const qrCodeBuffer = await QRCode.toBuffer(data, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })

        return new NextResponse(new Uint8Array(qrCodeBuffer), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'private, max-age=3600',
          },
        })
      } catch {
        return NextResponse.json({ error: 'تولید QR ناموفق بود' }, { status: 500 })
      }
    },
    { roles: STAFF_ROLES, skipRateLimit: true }
  )
}
