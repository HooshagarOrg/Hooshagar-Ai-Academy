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

  if (ctx.role === 'parent') {
    if (/(فرزند|بچه|پسر|دختر|child)/.test(normalized)) {
      const children = ctx.children ?? []
      if (children.length === 0) {
        return {
          reply: 'هنوز فرزندی به حسابت وصل نشده. از مدرسه بخواه ثبت کنن.',
          source: 'template',
        }
      }
      const lines = children.map(
        (c, i) =>
          `${i + 1}. ${c.name} — پایه ${c.grade ?? '؟'}، کلاس ${c.className}${c.averageGrade != null ? `، میانگین: ${c.averageGrade}` : ''}`
      )
      return {
        reply: `فرزندان ثبت‌شده:\n${lines.join('\n')}`,
        source: 'template',
      }
    }

    if (/(گزارش|report|پیشرفت)/.test(normalized)) {
      if (ctx.latestReportTitle) {
        return {
          reply: `آخرین گزارش منتشرشده:\n${ctx.latestReportTitle}\n\nبرای جزئیات برو بخش گزارش‌های والدین.`,
          source: 'template',
        }
      }
      return {
        reply: 'فعلاً گزارش جدیدی منتشر نشده. از منوی گزارش‌ها می‌تونی گزارش‌های قبلی رو ببینی.',
        source: 'template',
      }
    }

    if (/(اعلان|notification|پیام جدید)/.test(normalized)) {
      const count = ctx.unreadNotifications ?? 0
      return {
        reply:
          count > 0
            ? `${count} اعلان خوانده‌نشده داری. از زنگوله بالا می‌تونی ببینی.`
            : 'اعلان خوانده‌نشده‌ای نداری. همه چیز به‌روزه! ✅',
        source: 'template',
      }
    }
  }

  if (ctx.role === 'teacher') {
    if (/(کلاس|دانش.?آموز|students)/.test(normalized)) {
      return {
        reply: `کلاس ${ctx.teacherClassName ?? 'نامشخص'} — ${ctx.studentCount ?? 0} دانش‌آموز.\nامروز: ${ctx.todayPresentCount ?? 0} حاضر، ${ctx.todayAbsentCount ?? 0} غایب، ${ctx.todayLateCount ?? 0} تأخیر.`,
        source: 'template',
      }
    }

    if (/(حضور|غیبت|attendance)/.test(normalized)) {
      return {
        reply: `وضعیت حضور امروز:\n• حاضر: ${ctx.todayPresentCount ?? 0}\n• غایب: ${ctx.todayAbsentCount ?? 0}\n• تأخیر: ${ctx.todayLateCount ?? 0}\n\nبرای ثبت حضور برو بخش حضور و غیاب.`,
        source: 'template',
      }
    }

    if (/(تکلیف|تصحیح|homework)/.test(normalized)) {
      const pending = ctx.pendingHomeworkToGrade ?? 0
      return {
        reply:
          pending > 0
            ? `${pending} تکلیف منتظر تصحیحه. برو بخش تکالیف کلاس.`
            : 'الان تکلیف منتظر تصحیحی نداری. 👍',
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
    if (ctx.role === 'parent') {
      return {
        reply:
          'برای والدین:\n• گزارش‌های فرزند\n• اعلان‌ها و پیام‌ها\n• پیشرفت تحصیلی\nهر سوالی داری بپرس!',
        source: 'template',
      }
    }
    if (ctx.role === 'teacher') {
      return {
        reply:
          'برای معلم:\n• حضور و غیاب کلاس\n• ثبت نمره و تکلیف\n• تحلیل AI دانش‌آموزان\nاز منوی کناری به هر بخش دسترسی داری.',
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
