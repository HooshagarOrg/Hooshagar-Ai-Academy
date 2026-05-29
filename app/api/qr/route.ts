import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const data = searchParams.get('data')
    
    if (!data) {
      return NextResponse.json({ error: 'Missing data parameter' }, { status: 400 })
    }
    
    // تولید QR Code
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
        'Cache-Control': 'public, max-age=31536000',
      },
    })
    
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}

