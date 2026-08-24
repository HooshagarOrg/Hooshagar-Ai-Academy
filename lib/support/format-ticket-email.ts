import { REPORT_CATEGORY_LABELS, type ReportCategory } from '@/lib/support/report-problem'

export type SupportEmailPayload = {
  category: ReportCategory
  message: string
  path: string
  role: string
  reporterName: string | null
  reporterEmail: string | null
  schoolName: string | null
  createdAt: string
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatSupportEmail(payload: SupportEmailPayload): {
  subject: string
  text: string
  html: string
} {
  const categoryLabel = REPORT_CATEGORY_LABELS[payload.category]
  const subject = `[هوشاگر] ${categoryLabel} — ${payload.schoolName || 'مدرسه نامشخص'}`
  const lines = [
    `نوع: ${categoryLabel}`,
    `مدرسه: ${payload.schoolName || '—'}`,
    `نقش: ${payload.role}`,
    `نام: ${payload.reporterName || '—'}`,
    `ایمیل حساب: ${payload.reporterEmail || '—'}`,
    `صفحه: ${payload.path}`,
    `زمان: ${payload.createdAt}`,
    '',
    'متن کاربر:',
    payload.message,
    '',
    'رمز عبور در این ایمیل نیست. اگر کاربر رمز نوشته، آن را در جای امن نگه ندارید.',
  ]
  const text = lines.join('\n')
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8">
<p><strong>نوع:</strong> ${escapeHtml(categoryLabel)}</p>
<p><strong>مدرسه:</strong> ${escapeHtml(payload.schoolName || '—')}</p>
<p><strong>نقش:</strong> ${escapeHtml(payload.role)}</p>
<p><strong>نام:</strong> ${escapeHtml(payload.reporterName || '—')}</p>
<p><strong>ایمیل حساب:</strong> ${escapeHtml(payload.reporterEmail || '—')}</p>
<p><strong>صفحه:</strong> ${escapeHtml(payload.path)}</p>
<p><strong>زمان:</strong> ${escapeHtml(payload.createdAt)}</p>
<p><strong>متن کاربر:</strong></p>
<pre style="white-space:pre-wrap">${escapeHtml(payload.message)}</pre>
</div>`
  return { subject, text, html }
}
