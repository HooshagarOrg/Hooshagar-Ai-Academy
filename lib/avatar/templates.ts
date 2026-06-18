/**
 * پاسخ‌های بدون AI برای سوالات الگویی آواتار
 */

import type { AvatarUserContext } from './context'
import { buildHooshiarGreeting, buildHooshiarWelcome } from './greeting'

export interface TemplateMatch {
  reply: string
  source: 'template'
}

const ATTENDANCE_LABELS: Record<string, string> = {
  present: 'امروز حاضری! آفرین 👏',
  absent: 'امروز غیبت داری. اگه دلیل داری به معلم یا والدین بگو.',
  late: 'امروز با تأخیر اومدی. سعی کن فردا زودتر باشی.',
  unknown: 'هنوز حضورت برای امروز ثبت نشده.',
}

function formatDueDate(due: string | null): string {
  if (!due) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      month: 'short',
      day: 'numeric',
    }).format(new Date(due))
  } catch {
    return due
  }
}

function normalizeMessage(message: string): string {
  return message
    .trim()
    .replace(/\u200c/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function tryTemplateReply(
  message: string,
  ctx: AvatarUserContext
): TemplateMatch | null {
  const normalized = normalizeMessage(message)

  if (/^(سلام|درود|هی|hello|hi)(?:\s|!|\.|$)/.test(normalized) || normalized === 'سلام') {
    return {
      reply: buildHooshiarWelcome(ctx.fullName, ctx.role),
      source: 'template',
    }
  }

  if (ctx.role === 'student' && ctx.studentId) {
    if (/(تکلیف|تکالیف|homework|موعد)/.test(normalized)) {
      const homework = ctx.pendingHomework ?? []
      if (homework.length === 0) {
        return {
          reply: `${ctx.firstName} جان، الان تکلیف معوقی نداری! 🎉`,
          source: 'template',
        }
      }
      const lines = homework.map((h, i) => {
        const due = h.dueDate ? ` — موعد: ${formatDueDate(h.dueDate)}` : ''
        return `${i + 1}. ${h.subject}: ${h.title}${due}`
      })
      return {
        reply: `این تکلیف‌هات مونده:\n${lines.join('\n')}\n\nبرای تحویل برو بخش تکالیف.`,
        source: 'template',
      }
    }

    if (/(غیبت|حضور|حاضر|امروز اومدم)/.test(normalized)) {
      const status = ctx.todayAttendance ?? 'unknown'
      return {
        reply: ATTENDANCE_LABELS[status] ?? ATTENDANCE_LABELS.unknown,
        source: 'template',
      }
    }

    if (/(xp|امتیاز|سکه|سطح|level|استریک|streak)/.test(normalized)) {
      const streakMsg =
        (ctx.currentStreak ?? 0) > 0
          ? ` استریکت ${ctx.currentStreak} روزه‌ست، ادامه بده! 🔥`
          : ' امروز فعالیتت رو شروع کن تا استریک بگیری!'
      return {
        reply: `وضعیتت:\n• XP: ${ctx.totalXp ?? 0}\n• سطح: ${ctx.level ?? 1}\n• سکه: ${ctx.coins ?? 0}${streakMsg}`,
        source: 'template',
      }
    }
  }

  if (/(کی هستی|تو کی|هوشیار|معرفی)/.test(normalized)) {
    return {
      reply: buildHooshiarGreeting(ctx.fullName),
      source: 'template',
    }
  }

  if (/(کمک|راهنما|چیکار|چه کار|امکانات)/.test(normalized)) {
    if (ctx.role === 'student') {
      return {
        reply:
          'می‌تونی از اینا استفاده کنی:\n• حل مسئله — عکس سوال بگیر\n• دستیار مطالعه — سوال درسی\n• باغ استعداد — XP و نشان\n• آزمون آنلاین',
        source: 'template',
      }
    }
    return {
      reply: 'از منوی کناری می‌تونی به بخش‌های مختلف هوشاگر بری. هر سوالی داری بپرس!',
      source: 'template',
    }
  }

  return null
}
