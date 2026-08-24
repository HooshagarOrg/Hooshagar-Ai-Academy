import {
  reportProblemSchema,
  shouldEmailSupportInbox,
  supportSavedNotice,
  SUPPORT_CONTACT_EMAIL,
} from '@/lib/support/report-problem'
import { escapeHtml, formatSupportEmail } from '@/lib/support/format-ticket-email'

describe('support report helpers', () => {
  it('uses contact@ as the support inbox', () => {
    expect(SUPPORT_CONTACT_EMAIL).toBe('contact@hooshagar.ir')
  })

  it('accepts a valid report', () => {
    const result = reportProblemSchema.safeParse({
      category: 'account',
      message: 'رمز را فراموش کرده‌ام و وارد نمی‌شوم',
      path: '/login',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short messages and unknown categories', () => {
    expect(
      reportProblemSchema.safeParse({ category: 'account', message: 'کوتاه' }).success
    ).toBe(false)
    expect(
      reportProblemSchema.safeParse({
        category: 'other',
        message: 'این توضیح به اندازه کافی بلند است',
      }).success
    ).toBe(false)
  })

  it('emails only account and help, not bugs', () => {
    expect(shouldEmailSupportInbox('account')).toBe(true)
    expect(shouldEmailSupportInbox('help')).toBe(true)
    expect(shouldEmailSupportInbox('bug')).toBe(false)
  })

  it('formats a Persian email without raw HTML from the user message', () => {
    const email = formatSupportEmail({
      category: 'account',
      message: '<script>alert(1)</script> رمز را نمی‌دانم',
      path: '/teacher',
      role: 'teacher',
      reporterName: 'علی',
      reporterEmail: 'teacher@example.com',
      schoolName: 'مدرسه آزمایشی',
      createdAt: '2026-08-24T12:00:00.000Z',
    })
    expect(email.subject).toContain('ورود، رمز یا حساب کاربری')
    expect(email.subject).toContain('مدرسه آزمایشی')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).not.toContain('<script>alert')
    expect(email.text).toContain('علی')
  })

  it('escapes HTML entities', () => {
    expect(escapeHtml('a < b & "c"')).toBe('a &lt; b &amp; &quot;c&quot;')
  })

  it('does not claim email was sent when it was skipped', () => {
    const notice = supportSavedNotice('help', false)
    expect(notice).toContain('صندوق پشتیبانی')
    expect(notice).not.toContain(SUPPORT_CONTACT_EMAIL)
  })
})
