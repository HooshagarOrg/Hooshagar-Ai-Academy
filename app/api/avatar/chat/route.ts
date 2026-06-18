/**
 * POST /api/avatar/chat — گفتگوی آواتار هوشیار (همه نقش‌ها)
 * GET  /api/avatar/chat — وضعیت سقف روزانه + پیام خوش‌آمد
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callAvatarAI, AvatarAIExhaustedError } from '@/lib/ai/avatar-provider'
import { loadAvatarUserContext, buildAvatarSystemPrompt } from '@/lib/avatar/context'
import { tryTemplateReply } from '@/lib/avatar/templates'
import { buildHooshiarWelcome } from '@/lib/avatar/greeting'
import {
  checkAvatarDailyLimit,
  recordAvatarMessage,
  getAvatarDailyLimit,
} from '@/lib/avatar/rate-limit'
import { getRouteHandlerUser } from '@/lib/supabase/route-handler'
import { log } from '@/lib/logger'

const chatSchema = z.object({
  message: z
    .string()
    .min(1, 'پیام خالی است')
    .max(1000, 'پیام خیلی طولانی است'),
})

const AVATAR_CAPACITY_MESSAGE =
  'الان ظرفیت دستیار هوشیار پر است. لطفاً چند دقیقه دیگر دوباره امتحان کن.'

const DAILY_LIMIT_MESSAGE = (remaining: number) =>
  `سقف روزانه ${getAvatarDailyLimit()} پیام تمام شده. فردا دوباره می‌تونی با من حرف بزنی. (باقی‌مانده: ${remaining})`

type AuthResult =
  | { ok: false; response: NextResponse }
  | {
      ok: true
      user: { id: string }
      ctx: NonNullable<Awaited<ReturnType<typeof loadAvatarUserContext>>>
      cookieResponse: NextResponse
    }

async function requireUser(request: NextRequest): Promise<AuthResult> {
  const { user, error, supabase, response: cookieResponse } = await getRouteHandlerUser(request)

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 }),
    }
  }

  const ctx = await loadAvatarUserContext(user.id, supabase)
  if (!ctx) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'پروفایل کاربر یافت نشد' },
        { status: 403 }
      ),
    }
  }

  return { ok: true, user, ctx, cookieResponse }
}

function jsonWithCookies(
  data: Record<string, unknown>,
  cookieResponse: NextResponse,
  init?: ResponseInit
): NextResponse {
  const res = NextResponse.json(data, init)
  cookieResponse.cookies.getAll().forEach((cookie) => {
    res.cookies.set(cookie)
  })
  return res
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const result = await requireUser(request)
  if (result.ok === false) return result.response

  const { user, ctx, cookieResponse } = result
  const limit = checkAvatarDailyLimit(user.id)

  return jsonWithCookies(
    {
      name: 'هوشیار',
      firstName: ctx.firstName,
      welcomeMessage: buildHooshiarWelcome(ctx.fullName, ctx.role),
      remainingMessages: limit.remaining,
      dailyLimit: limit.limit,
      canChat: limit.allowed,
    },
    cookieResponse
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const result = await requireUser(request)
    if (result.ok === false) return result.response

    const { user, ctx, cookieResponse } = result

    const body = await request.json()
    const parsed = chatSchema.safeParse(body)
    if (!parsed.success) {
      return jsonWithCookies(
        { error: 'پیام نامعتبر است', details: parsed.error.issues },
        cookieResponse,
        { status: 400 }
      )
    }

    const beforeLimit = checkAvatarDailyLimit(user.id)
    if (!beforeLimit.allowed) {
      return jsonWithCookies(
        {
          error: DAILY_LIMIT_MESSAGE(beforeLimit.remaining),
          remainingMessages: beforeLimit.remaining,
        },
        cookieResponse,
        { status: 429 }
      )
    }

    const { message } = parsed.data

    const template = tryTemplateReply(message, ctx)
    if (template) {
      const afterRecord = recordAvatarMessage(user.id)
      return jsonWithCookies(
        {
          reply: template.reply,
          source: 'template' as const,
          remainingMessages: afterRecord.remaining,
        },
        cookieResponse
      )
    }

    const systemPrompt = buildAvatarSystemPrompt(ctx)

    try {
      const ai = await callAvatarAI(systemPrompt, message)
      const afterRecord = recordAvatarMessage(user.id)
      return jsonWithCookies(
        {
          reply: ai.content,
          source: ai.source,
          model: ai.model,
          remainingMessages: afterRecord.remaining,
        },
        cookieResponse
      )
    } catch (err) {
      if (err instanceof AvatarAIExhaustedError) {
        log.warn('Avatar AI pool exhausted', { userId: user.id })
        return jsonWithCookies(
          {
            error: AVATAR_CAPACITY_MESSAGE,
            remainingMessages: beforeLimit.remaining,
          },
          cookieResponse,
          { status: 503 }
        )
      }
      throw err
    }
  } catch (error) {
    log.error('Avatar chat error', error)
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
