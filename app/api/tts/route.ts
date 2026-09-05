import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimitAsync } from '@/lib/security/rate-limiter'

export const runtime = 'nodejs'

const querySchema = z.object({
  text: z.string().trim().min(1).max(120),
  lang: z.string().trim().min(2).max(12).default('fa'),
})

/**
 * پروکسی TTS برای بازی املا — فقط کاربر واردشده، با محدودیت نرخ.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'احراز هویت الزامی است' }, { status: 401 })
    }

    const rateLimited = await applyRateLimitAsync(request, 'tts', undefined, user.id)
    if (rateLimited) return rateLimited

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      text: searchParams.get('text') ?? '',
      lang: searchParams.get('lang') ?? 'fa',
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'متن نامعتبر است' }, { status: 400 })
    }

    const { text, lang } = parsed.data
    const url =
      `https://translate.google.com/translate_tts` +
      `?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}` +
      `&q=${encodeURIComponent(text)}`

    const upstream = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
        Referer: 'https://translate.google.com/',
      },
      cache: 'force-cache',
      next: { revalidate: 86400 },
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'سرویس صدا در دسترس نیست' }, { status: 502 })
    }

    const buffer = await upstream.arrayBuffer()
    if (buffer.byteLength < 200) {
      return NextResponse.json({ error: 'فایل صدا نامعتبر است' }, { status: 502 })
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('TTS proxy error:', error)
    return NextResponse.json({ error: 'خطا در تولید صدا' }, { status: 500 })
  }
}
