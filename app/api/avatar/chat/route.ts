/**
 * POST /api/avatar/chat — گفتگوی آواتار هوشیار (همه نقش‌ها)
 * GET  /api/avatar/chat — وضعیت + تاریخچه + پیشنهادهای سریع
 * DELETE /api/avatar/chat — پاک کردن تاریخچه
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { callAvatarAI, AvatarAIExhaustedError } from '@/lib/ai/avatar-provider'
import { loadAvatarUserContext, buildAvatarSystemPrompt } from '@/lib/avatar/context'
import { tryTemplateReply } from '@/lib/avatar/templates'
import { buildProactiveWelcome } from '@/lib/avatar/greeting'
import { getAvatarQuickActions } from '@/lib/avatar/quick-actions'
import {
  checkAvatarDailyLimit,
  reserveAvatarAIMessage,
  getAvatarDailyLimit,
} from '@/lib/avatar/rate-limit'
import { loadAvatarChatHistory, saveAvatarChatExchange, clearAvatarChatHistory } from '@/lib/avatar/history'
import { withAuth } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'
import { log } from '@/lib/logger'

export const maxDuration = 60

const chatSchema = z.object({
  message: z
    .string()
    .min(1, 'پیام خالی است')
    .max(1000, 'پیام خیلی طولانی است'),
})

const AVATAR_CAPACITY_MESSAGE =
  'الان نتونستم به هوش مصنوعی وصل بشم. چند دقیقه دیگر دوباره امتحان کن یا سوالات ساده مثل «تکلیف» یا «XP» بپرس.'

const DAILY_LIMIT_MESSAGE = (remaining: number) =>
  `سقف روزانه ${getAvatarDailyLimit()} پیام AI تمام شده. پاسخ‌های ساده مثل «تکلیف» و «XP» هنوز رایگانه. فردا دوباره می‌تونی با AI حرف بزنی. (باقی‌مانده: ${remaining})`

async function loadAvatarContext(userId: string) {
  const supabase = await createClient()
  const ctx = await loadAvatarUserContext(userId, supabase)
  if (!ctx) {
    return { supabase, ctx: null }
  }
  return { supabase, ctx }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withAuth(
    request,
    async (authCtx) => {
      const { supabase, ctx } = await loadAvatarContext(authCtx.userId)
      if (!ctx) {
        return NextResponse.json(
          { error: 'پروفایل کاربر یافت نشد' },
          { status: 403 }
        )
      }

      const limit = await checkAvatarDailyLimit(authCtx.userId, supabase)
      const history = await loadAvatarChatHistory(authCtx.userId, supabase)

      return NextResponse.json({
        name: 'هوشیار',
        firstName: ctx.firstName,
        role: ctx.role,
        welcomeMessage: buildProactiveWelcome(ctx),
        quickActions: getAvatarQuickActions(ctx.role),
        remainingMessages: limit.remaining,
        dailyLimit: limit.limit,
        canChat: limit.allowed,
        history: history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      })
    },
    { roles: AI_USER_ROLES }
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withAuth(
    request,
    async (authCtx) => {
      try {
        const { supabase, ctx } = await loadAvatarContext(authCtx.userId)
        if (!ctx) {
          return NextResponse.json(
            { error: 'پروفایل کاربر یافت نشد' },
            { status: 403 }
          )
        }

        const beforeLimit = await checkAvatarDailyLimit(authCtx.userId, supabase)

        const body = await request.json()
        const parsed = chatSchema.safeParse(body)
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'پیام نامعتبر است', details: parsed.error.issues },
            { status: 400 }
          )
        }

        const { message } = parsed.data

        const template = tryTemplateReply(message, ctx)
        if (template) {
          await saveAvatarChatExchange(authCtx.userId, supabase, message, template.reply, 'template')
          return NextResponse.json({
            reply: template.reply,
            source: 'template' as const,
            remainingMessages: beforeLimit.remaining,
            countsTowardLimit: false,
          })
        }

        if (!beforeLimit.allowed) {
          return NextResponse.json(
            {
              error: DAILY_LIMIT_MESSAGE(beforeLimit.remaining),
              remainingMessages: beforeLimit.remaining,
            },
            { status: 429 }
          )
        }

        const reserved = await reserveAvatarAIMessage(authCtx.userId, supabase)
        if (!reserved.allowed) {
          return NextResponse.json(
            {
              error: DAILY_LIMIT_MESSAGE(reserved.remaining),
              remainingMessages: reserved.remaining,
            },
            { status: 429 }
          )
        }

        const systemPrompt = buildAvatarSystemPrompt(ctx)

        try {
          const ai = await callAvatarAI(systemPrompt, message)
          await saveAvatarChatExchange(authCtx.userId, supabase, message, ai.content, ai.source)
          return NextResponse.json({
            reply: ai.content,
            source: ai.source,
            model: ai.model,
            remainingMessages: reserved.remaining,
            countsTowardLimit: true,
          })
        } catch (err) {
          if (err instanceof AvatarAIExhaustedError) {
            log.warn('Avatar AI pool exhausted', { userId: authCtx.userId })
            return NextResponse.json(
              {
                error: AVATAR_CAPACITY_MESSAGE,
                remainingMessages: beforeLimit.remaining,
              },
              { status: 503 }
            )
          }
          throw err
        }
      } catch (error) {
        log.error('Avatar chat error', error)
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 })
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_heavy' }
  )
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return withAuth(
    request,
    async (authCtx) => {
      const { supabase, ctx } = await loadAvatarContext(authCtx.userId)
      if (!ctx) {
        return NextResponse.json(
          { error: 'پروفایل کاربر یافت نشد' },
          { status: 403 }
        )
      }

      const cleared = await clearAvatarChatHistory(authCtx.userId, supabase)

      if (!cleared) {
        return NextResponse.json(
          { error: 'پاک کردن تاریخچه ناموفق بود' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        welcomeMessage: buildProactiveWelcome(ctx),
      })
    },
    { roles: AI_USER_ROLES }
  )
}
